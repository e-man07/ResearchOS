/**
 * Weaviate vector store implementation
 */

import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client'
import { Logger } from '@research-os/core'
import type { CreateChunk } from '@research-os/core'

export interface VectorStoreConfig {
  url: string
  apiKey?: string
  indexName?: string
}

export interface SearchResult {
  id: string
  content: string
  paperId: string
  score: number
  metadata?: Record<string, unknown>
}

export interface SearchOptions {
  query: string
  limit?: number
  minScore?: number
  filters?: Record<string, unknown>
  hybrid?: boolean // Use hybrid search (BM25 + vector)
  alpha?: number // Hybrid search weight (0 = BM25 only, 1 = vector only)
}

export class WeaviateVectorStore {
  private client: WeaviateClient
  private logger: Logger
  private indexName: string

  constructor(config: VectorStoreConfig) {
    this.logger = new Logger('WeaviateVectorStore')
    this.indexName = config.indexName || 'PaperChunk'

    // Normalize URL - ensure it has protocol
    let normalizedUrl = config.url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Cloud Weaviate instances require HTTPS
      // Detect cloud instance by domain pattern
      if (normalizedUrl.includes('.weaviate.cloud') || normalizedUrl.includes('.weaviate.network')) {
        normalizedUrl = `https://${normalizedUrl}`
      } else {
        // Local instances default to HTTP
        normalizedUrl = `http://${normalizedUrl}`
      }
    }

    // Initialize Weaviate client
    const clientConfig: any = {
      scheme: normalizedUrl.startsWith('https') ? 'https' : 'http',
      host: normalizedUrl.replace(/^https?:\/\//, ''),
      // Add timeout settings for cloud instances
      timeout: 30000, // 30 seconds
    }

    if (config.apiKey) {
      clientConfig.apiKey = new ApiKey(config.apiKey)
    }

    this.client = weaviate.client(clientConfig)
    this.logger.info('Weaviate client initialized', { url: normalizedUrl, scheme: clientConfig.scheme })
  }

  /**
   * Initialize schema in Weaviate
   * Includes retry logic for transient network errors
   */
  async initializeSchema(): Promise<void> {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000

    const tryInitialize = async (retryCount = 0): Promise<void> => {
      try {
        // Check if class already exists
        try {
          await this.client.schema
            .classGetter()
            .withClassName(this.indexName)
            .do()
          // Class exists, no need to create
          this.logger.info('Schema already exists', { className: this.indexName })
          return
        } catch (checkError: any) {
          // If error is 404, class doesn't exist (expected) - continue to create
          // If error is something else, check if it's retryable
          if (checkError?.response?.status === 404 || checkError.message?.includes('404')) {
            // Expected - class doesn't exist, continue to create
          } else {
            // Check if it's a retryable network error
            const isRetryable = 
              checkError?.message?.includes('fetch failed') ||
              checkError?.message?.includes('ECONNRESET') ||
              checkError?.message?.includes('EPIPE') ||
              checkError?.message?.includes('timeout') ||
              checkError?.code === 'UND_ERR_SOCKET' ||
              checkError?.cause?.code === 'ECONNRESET' ||
              checkError?.cause?.code === 'EPIPE'

            if (isRetryable && retryCount < MAX_RETRIES) {
              const delay = RETRY_DELAY * Math.pow(2, retryCount)
              this.logger.warn(`Retrying schema check after error (attempt ${retryCount + 1}/${MAX_RETRIES})`, {
                error: checkError.message,
                delay,
              })
              await new Promise((resolve) => setTimeout(resolve, delay))
              return tryInitialize(retryCount + 1)
            }

            this.logger.warn('Error checking schema existence', { error: checkError })
            // Continue to try creating - might be a transient error
          }
        }

        // Create schema
        const classObj = {
          class: this.indexName,
          description: 'Paper chunks for RAG',
          vectorizer: 'none', // We'll provide our own vectors
          properties: [
            {
              name: 'content',
              dataType: ['text'],
              description: 'Chunk content',
            },
            {
              name: 'paperId',
              dataType: ['string'],
              description: 'Paper ID',
            },
            {
              name: 'chunkIndex',
              dataType: ['int'],
              description: 'Chunk index in paper',
            },
            {
              name: 'section',
              dataType: ['string'],
              description: 'Section name',
            },
            {
              name: 'metadata',
              dataType: ['text'],
              description: 'Additional metadata (JSON string)',
            },
          ],
        }

        await this.client.schema.classCreator().withClass(classObj).do()
        this.logger.info('Schema created successfully', { className: this.indexName })
      } catch (error: any) {
        // Check if it's a retryable error
        const isRetryable = 
          error?.message?.includes('fetch failed') ||
          error?.message?.includes('ECONNRESET') ||
          error?.message?.includes('EPIPE') ||
          error?.message?.includes('timeout') ||
          error?.code === 'UND_ERR_SOCKET' ||
          error?.cause?.code === 'ECONNRESET' ||
          error?.cause?.code === 'EPIPE'

        if (isRetryable && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount)
          this.logger.warn(`Retrying schema creation after error (attempt ${retryCount + 1}/${MAX_RETRIES})`, {
            error: error.message,
            delay,
          })
          await new Promise((resolve) => setTimeout(resolve, delay))
          return tryInitialize(retryCount + 1)
        }

        // If error is that class already exists, that's okay
        if (error?.message?.includes('already exists') || error?.response?.status === 422) {
          this.logger.info('Schema already exists (from creation attempt)', { className: this.indexName })
          return
        }

        this.logger.error('Failed to initialize schema', { error })
        throw error
      }
    }

    await tryInitialize()
  }

  /**
   * Add chunks with embeddings to vector store
   * Uses smaller batch sizes and retry logic for reliability
   */
  async addChunks(
    chunks: CreateChunk[],
    embeddings: number[][]
  ): Promise<void> {
    if (chunks.length !== embeddings.length) {
      throw new Error('Chunks and embeddings length mismatch')
    }

    this.logger.info('Adding chunks to vector store', { count: chunks.length })

    // Use smaller batch sizes to avoid connection timeouts
    // Weaviate cloud has limits on batch size and payload size
    const BATCH_SIZE = 10
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 second base delay

    const addBatchWithRetry = async (
      batchChunks: CreateChunk[],
      batchEmbeddings: number[][],
      retryCount = 0
    ): Promise<void> => {
      try {
        let batcher = this.client.batch.objectsBatcher()

        for (let i = 0; i < batchChunks.length; i++) {
          const chunk = batchChunks[i]!
          const embedding = batchEmbeddings[i]!

          batcher = batcher.withObject({
            class: this.indexName,
            properties: {
              content: chunk.content,
              paperId: chunk.paper_id,
              chunkIndex: chunk.chunk_index,
              section: chunk.section,
              metadata: JSON.stringify(chunk.metadata || {}),
            },
            vector: embedding,
          })
        }

        await batcher.do()
        this.logger.debug('Batch added successfully', { count: batchChunks.length })
      } catch (error: any) {
        // Check if it's a retryable error
        const isRetryable = 
          error?.message?.includes('fetch failed') ||
          error?.message?.includes('ECONNRESET') ||
          error?.message?.includes('EPIPE') ||
          error?.message?.includes('timeout') ||
          error?.code === 'UND_ERR_SOCKET' ||
          error?.cause?.code === 'ECONNRESET' ||
          error?.cause?.code === 'EPIPE'

        if (isRetryable && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount) // Exponential backoff
          this.logger.warn(`Retrying batch after error (attempt ${retryCount + 1}/${MAX_RETRIES})`, {
            error: error.message,
            delay,
          })
          await new Promise((resolve) => setTimeout(resolve, delay))
          return addBatchWithRetry(batchChunks, batchEmbeddings, retryCount + 1)
        }

        throw error
      }
    }

    try {
      // Process in smaller batches
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE)
        const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE)

        await addBatchWithRetry(batchChunks, batchEmbeddings)
      }

      this.logger.info('Chunks added successfully', { count: chunks.length })
    } catch (error) {
      this.logger.error('Failed to add chunks', { error })
      throw error
    }
  }

  /**
   * Vector search with provided query embedding
   */
  async search(options: SearchOptions & { queryVector?: number[] }): Promise<SearchResult[]> {
    const {
      query,
      queryVector,
      limit = 10,
      minScore = 0.7,
      filters,
    } = options

    this.logger.info('Searching vector store', { query, limit, hasVector: !!queryVector })

    try {
      let queryBuilder = this.client.graphql
        .get()
        .withClassName(this.indexName)
        .withFields('content paperId chunkIndex section metadata _additional { id distance }')
        .withLimit(limit)

      // Use vector search with provided embedding
      if (queryVector) {
        queryBuilder = queryBuilder.withNearVector({
          vector: queryVector,
        })
      } else {
        // Fallback to BM25 keyword search if no vector provided
        this.logger.warn('No query vector provided, using BM25 keyword search')
        queryBuilder = queryBuilder.withBm25({
          query,
        })
      }

      // Apply filters if provided
      if (filters) {
        // TODO: Implement filter logic
      }

      const result = await queryBuilder.do()

      const results: SearchResult[] = (result.data.Get[this.indexName] || []).map(
        (item: any) => {
          // Convert distance to similarity score
          // Weaviate cosine distance: 0 = identical, 2 = opposite
          // We convert to similarity: 1 = identical, 0 = opposite
          const distance = item._additional.distance || 0
          const score = Math.max(0, 1 - (distance / 2)) // Normalize to 0-1 range
          
          this.logger.debug('Score conversion', { distance, score })
          
          return {
            id: item._additional.id,
            content: item.content,
            paperId: item.paperId,
            score,
            metadata: {
              chunkIndex: item.chunkIndex,
              section: item.section,
              ...JSON.parse(item.metadata || '{}'),
            },
          }
        }
      )

      // Filter by minimum score
      const filtered = results.filter((r) => r.score >= minScore)

      this.logger.info('Search completed', {
        totalResults: results.length,
        filteredResults: filtered.length,
      })

      return filtered
    } catch (error) {
      this.logger.error('Search failed', { error })
      
      // Add more context to connection errors
      if (error instanceof Error) {
        if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
          throw new Error(`Weaviate connection failed: ${error.message}. Check if Weaviate instance is running and accessible.`)
        }
      }
      
      throw error
    }
  }

  /**
   * Delete chunks by paper ID
   */
  async deleteByPaperId(paperId: string): Promise<void> {
    this.logger.info('Deleting chunks', { paperId })

    try {
      await this.client.batch
        .objectsBatchDeleter()
        .withClassName(this.indexName)
        .withWhere({
          path: ['paperId'],
          operator: 'Equal',
          valueString: paperId,
        })
        .do()

      this.logger.info('Chunks deleted successfully', { paperId })
    } catch (error) {
      this.logger.error('Failed to delete chunks', { error })
      throw error
    }
  }

  /**
   * Get total count of chunks
   */
  async getCount(): Promise<number> {
    try {
      const result = await this.client.graphql
        .aggregate()
        .withClassName(this.indexName)
        .withFields('meta { count }')
        .do()

      return result.data.Aggregate[this.indexName]?.[0]?.meta?.count || 0
    } catch (error) {
      this.logger.error('Failed to get count', { error })
      return 0
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.misc.metaGetter().do()
      return true
    } catch (error) {
      this.logger.error('Health check failed', { error })
      return false
    }
  }
}
