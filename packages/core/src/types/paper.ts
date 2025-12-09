import { z } from 'zod'

/**
 * Author schema for research papers
 */
export const AuthorSchema = z.object({
  name: z.string().min(1, 'Author name is required'),
  affiliation: z.string().optional(),
  orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/).optional(),
  email: z.string().email().optional(),
})

export type Author = z.infer<typeof AuthorSchema>

/**
 * Source types for papers
 */
export const PaperSourceSchema = z.enum([
  'arxiv',
  'semantic_scholar',
  'pubmed',
  'crossref',
  'github',
  'custom',
])

export type PaperSource = z.infer<typeof PaperSourceSchema>

/**
 * Main Paper schema - canonical representation of research papers
 */
export const PaperSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  authors: z.array(AuthorSchema).min(1, 'At least one author is required'),
  abstract: z.string().min(1, 'Abstract is required'),
  
  // Identifiers
  doi: z.string().optional(),
  arxiv_id: z.string().optional(),
  pubmed_id: z.string().optional(),
  semantic_scholar_id: z.string().optional(),
  
  // Metadata
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  month: z.number().int().min(1).max(12).optional(),
  venue: z.string().optional(),
  publisher: z.string().optional(),
  
  // URLs
  pdf_url: z.string().url().optional(),
  html_url: z.string().url().optional(),
  
  // Classification
  topics: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  
  // Metrics
  citations: z.number().int().min(0).optional(),
  references: z.array(z.string()).default([]),
  
  // Source tracking
  source: PaperSourceSchema,
  source_id: z.string().min(1, 'Source ID is required'),
  raw_json: z.record(z.unknown()).optional(),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  published_at: z.date().optional(),
})

export type Paper = z.infer<typeof PaperSchema>

/**
 * Partial paper schema for updates
 */
export const PartialPaperSchema = PaperSchema.partial().required({ id: true })

export type PartialPaper = z.infer<typeof PartialPaperSchema>

/**
 * Paper creation schema (without generated fields)
 */
export const CreatePaperSchema = PaperSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CreatePaper = z.infer<typeof CreatePaperSchema>
