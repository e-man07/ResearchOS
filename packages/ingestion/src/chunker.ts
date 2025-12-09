/**
 * Text chunker for RAG
 */

import type { CreateChunk } from '@research-os/core'

export interface ChunkerOptions {
  chunkSize: number
  chunkOverlap: number
  minChunkSize?: number
}

export class TextChunker {
  private options: Required<ChunkerOptions>

  constructor(options: ChunkerOptions) {
    this.options = {
      ...options,
      minChunkSize: options.minChunkSize || 100,
    }
  }

  chunk(text: string, paperId: string): CreateChunk[] {
    const chunks: CreateChunk[] = []
    const sentences = this.splitIntoSentences(text)
    
    let currentChunk = ''
    let chunkIndex = 0
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.options.chunkSize) {
        if (currentChunk.length >= this.options.minChunkSize) {
          chunks.push({
            paper_id: paperId,
            content: currentChunk.trim(),
            chunk_index: chunkIndex++,
            metadata: {},
          })
        }
        currentChunk = sentence
      } else {
        currentChunk += ' ' + sentence
      }
    }
    
    if (currentChunk.length >= this.options.minChunkSize) {
      chunks.push({
        paper_id: paperId,
        content: currentChunk.trim(),
        chunk_index: chunkIndex,
        metadata: {},
      })
    }
    
    return chunks
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  }
}
