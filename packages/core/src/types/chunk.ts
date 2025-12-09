import { z } from 'zod'

/**
 * Text chunk schema for RAG
 * Represents a semantic segment of a paper for vector search
 */
export const ChunkSchema = z.object({
  id: z.string().uuid(),
  paper_id: z.string().uuid(),
  
  // Content
  content: z.string().min(1, 'Content is required'),
  chunk_index: z.number().int().min(0),
  
  // Context
  section: z.string().optional(),
  section_index: z.number().int().min(0).optional(),
  page: z.number().int().min(1).optional(),
  
  // Vector embedding (stored separately in vector DB)
  embedding: z.array(z.number()).optional(),
  embedding_model: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.unknown()).default({}),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
})

export type Chunk = z.infer<typeof ChunkSchema>

/**
 * Chunk creation schema
 */
export const CreateChunkSchema = ChunkSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CreateChunk = z.infer<typeof CreateChunkSchema>

/**
 * Chunk with similarity score (for search results)
 */
export const ChunkWithScoreSchema = ChunkSchema.extend({
  similarity_score: z.number().min(0).max(1),
  distance: z.number().optional(),
})

export type ChunkWithScore = z.infer<typeof ChunkWithScoreSchema>
