/**
 * arXiv-specific types and schemas
 */

import { z } from 'zod'

/**
 * arXiv search options
 */
export const ArxivSearchOptionsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  max_results: z.number().int().min(1).max(1000).default(100),
  start: z.number().int().min(0).default(0),
  sort_by: z.enum(['relevance', 'lastUpdatedDate', 'submittedDate']).default('relevance'),
  sort_order: z.enum(['ascending', 'descending']).default('descending'),
})

export type ArxivSearchOptions = z.infer<typeof ArxivSearchOptionsSchema>

/**
 * arXiv entry from API
 */
export const ArxivEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  authors: z.array(z.object({
    name: z.string(),
  })),
  published: z.string(),
  updated: z.string(),
  links: z.array(z.object({
    href: z.string(),
    rel: z.string().optional(),
    type: z.string().optional(),
    title: z.string().optional(),
  })),
  categories: z.array(z.object({
    term: z.string(),
  })),
  doi: z.string().optional(),
  comment: z.string().optional(),
  journal_ref: z.string().optional(),
  primary_category: z.object({
    term: z.string(),
  }).optional(),
})

export type ArxivEntry = z.infer<typeof ArxivEntrySchema>

/**
 * arXiv API response
 */
export const ArxivResponseSchema = z.object({
  feed: z.object({
    title: z.string(),
    id: z.string(),
    updated: z.string(),
    totalResults: z.number().optional(),
    startIndex: z.number().optional(),
    itemsPerPage: z.number().optional(),
    entry: z.array(z.unknown()).optional(),
  }),
})

export type ArxivResponse = z.infer<typeof ArxivResponseSchema>
