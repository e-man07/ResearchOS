/**
 * Embedding service using OpenAI
 */

import { OpenAI } from 'openai'
import { Logger } from '@research-os/core'

export interface EmbeddingConfig {
  apiKey: string
  model?: string
  batchSize?: number
}

export class EmbeddingService {
  private client: OpenAI
  private logger: Logger
  private model: string
  private batchSize: number

  constructor(config: EmbeddingConfig) {
    this.logger = new Logger('EmbeddingService')
    this.client = new OpenAI({ apiKey: config.apiKey })
    this.model = config.model || 'text-embedding-3-small'
    this.batchSize = config.batchSize || 100

    this.logger.info('Embedding service initialized', { model: this.model })
  }

  /**
   * Generate embeddings for texts
   */
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return []
    }

    this.logger.info('Generating embeddings', { count: texts.length })

    try {
      const embeddings: number[][] = []

      // Process in batches
      for (let i = 0; i < texts.length; i += this.batchSize) {
        const batch = texts.slice(i, i + this.batchSize)

        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch,
        })

        const batchEmbeddings = response.data.map((item) => item.embedding)
        embeddings.push(...batchEmbeddings)

        this.logger.info('Batch processed', {
          batch: Math.floor(i / this.batchSize) + 1,
          total: Math.ceil(texts.length / this.batchSize),
        })
      }

      this.logger.info('Embeddings generated successfully', {
        count: embeddings.length,
      })

      return embeddings
    } catch (error) {
      this.logger.error('Failed to generate embeddings', { error })
      throw error
    }
  }

  /**
   * Generate embedding for a single text
   */
  async embedOne(text: string): Promise<number[]> {
    const embeddings = await this.embed([text])
    if (!embeddings[0]) {
      throw new Error('Failed to generate embedding')
    }
    return embeddings[0]
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    // text-embedding-3-small: 1536 dimensions
    // text-embedding-3-large: 3072 dimensions
    return this.model.includes('large') ? 3072 : 1536
  }
}
