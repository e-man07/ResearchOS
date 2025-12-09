/**
 * RAG Pipeline - Combines retrieval and generation
 */

import { Logger } from '@research-os/core'
import type { CreateChunk } from '@research-os/core'
import { WeaviateVectorStore, type SearchOptions } from './vector-store'
import { EmbeddingService } from './embeddings'

export interface RAGPipelineConfig {
  vectorStore: WeaviateVectorStore
  embeddingService: EmbeddingService
}

export interface RAGContext {
  query: string
  chunks: Array<{
    content: string
    paperId: string
    score: number
    metadata?: Record<string, unknown>
  }>
  totalChunks: number
}

export class RAGPipeline {
  private logger: Logger
  private vectorStore: WeaviateVectorStore
  private embeddingService: EmbeddingService

  constructor(config: RAGPipelineConfig) {
    this.logger = new Logger('RAGPipeline')
    this.vectorStore = config.vectorStore
    this.embeddingService = config.embeddingService
  }

  /**
   * Index chunks into vector store
   */
  async indexChunks(chunks: CreateChunk[]): Promise<void> {
    this.logger.info('Indexing chunks', { count: chunks.length })

    // Generate embeddings
    const texts = chunks.map((c) => c.content)
    const embeddings = await this.embeddingService.embed(texts)

    // Add to vector store
    await this.vectorStore.addChunks(chunks, embeddings)

    this.logger.info('Chunks indexed successfully')
  }

  /**
   * Retrieve relevant chunks for a query
   */
  async retrieve(
    query: string,
    options?: Partial<SearchOptions>
  ): Promise<RAGContext> {
    this.logger.info('Retrieving context', { query })

    // Generate query embedding
    const [queryEmbedding] = await this.embeddingService.embed([query])

    // Search vector store with query embedding
    const results = await this.vectorStore.search({
      query,
      queryVector: queryEmbedding,
      limit: options?.limit || 10,
      minScore: options?.minScore || 0.7,
      ...options,
    })

    const context: RAGContext = {
      query,
      chunks: results.map((r) => ({
        content: r.content,
        paperId: r.paperId,
        score: r.score,
        metadata: r.metadata,
      })),
      totalChunks: results.length,
    }

    this.logger.info('Context retrieved', { chunks: context.totalChunks })

    return context
  }

  /**
   * Format context for LLM prompt
   */
  formatContext(context: RAGContext): string {
    const chunks = context.chunks
      .map((chunk, idx) => {
        return `[${idx + 1}] (Score: ${chunk.score.toFixed(2)}, Paper: ${chunk.paperId})\n${chunk.content}`
      })
      .join('\n\n---\n\n')

    return `Query: ${context.query}\n\nRelevant Context:\n\n${chunks}`
  }

  /**
   * Delete chunks by paper ID
   */
  async deleteChunks(paperId: string): Promise<void> {
    await this.vectorStore.deleteByPaperId(paperId)
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalChunks: number
    healthy: boolean
  }> {
    const totalChunks = await this.vectorStore.getCount()
    const healthy = await this.vectorStore.healthCheck()

    return { totalChunks, healthy }
  }
}
