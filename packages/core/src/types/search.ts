import { z } from 'zod'

/**
 * Search status
 */
export const SearchStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

export type SearchStatus = z.infer<typeof SearchStatusSchema>

/**
 * Search filters
 */
export const SearchFiltersSchema = z.object({
  sources: z.array(z.string()).optional(),
  year_min: z.number().int().optional(),
  year_max: z.number().int().optional(),
  venues: z.array(z.string()).optional(),
  authors: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  has_pdf: z.boolean().optional(),
  min_citations: z.number().int().min(0).optional(),
})

export type SearchFilters = z.infer<typeof SearchFiltersSchema>

/**
 * Search result item
 */
export const SearchResultSchema = z.object({
  paper_id: z.string().uuid(),
  relevance_score: z.number().min(0).max(1),
  source: z.string(),
  matched_fields: z.array(z.string()).default([]),
})

export type SearchResult = z.infer<typeof SearchResultSchema>

/**
 * Search schema - represents a search query and its results
 */
export const SearchSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  
  // Query
  query: z.string().min(1, 'Query is required'),
  filters: SearchFiltersSchema.default({}),
  
  // Results
  results: z.array(SearchResultSchema).default([]),
  total_results: z.number().int().min(0).default(0),
  
  // Execution
  status: SearchStatusSchema.default('pending'),
  error_message: z.string().optional(),
  execution_time_ms: z.number().int().min(0).optional(),
  
  // Cost tracking
  cost_usd: z.number().min(0).optional(),
  tokens_used: z.number().int().min(0).optional(),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
})

export type Search = z.infer<typeof SearchSchema>

/**
 * Search creation schema
 */
export const CreateSearchSchema = SearchSchema.omit({
  id: true,
  results: true,
  total_results: true,
  status: true,
  execution_time_ms: true,
  cost_usd: true,
  tokens_used: true,
  created_at: true,
  updated_at: true,
  started_at: true,
  completed_at: true,
})

export type CreateSearch = z.infer<typeof CreateSearchSchema>
