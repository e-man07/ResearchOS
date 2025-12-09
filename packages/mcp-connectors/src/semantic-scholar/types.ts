/**
 * Semantic Scholar API types and schemas
 */

import { z } from 'zod'

/**
 * Semantic Scholar search options
 */
export const SemanticScholarSearchOptionsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
  fields: z.array(z.string()).optional(),
  year: z.string().optional(), // e.g., "2019-2021"
  venue: z.array(z.string()).optional(),
  fieldsOfStudy: z.array(z.string()).optional(),
  publicationTypes: z.array(z.string()).optional(),
  minCitationCount: z.number().int().min(0).optional(),
})

export type SemanticScholarSearchOptions = z.infer<typeof SemanticScholarSearchOptionsSchema>

/**
 * Semantic Scholar author
 */
export const SemanticScholarAuthorSchema = z.object({
  authorId: z.string().optional(),
  name: z.string(),
})

export type SemanticScholarAuthor = z.infer<typeof SemanticScholarAuthorSchema>

/**
 * Semantic Scholar paper from API
 */
export const SemanticScholarPaperSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  abstract: z.string().nullable(),
  year: z.number().nullable(),
  venue: z.string().nullable(),
  authors: z.array(SemanticScholarAuthorSchema),
  citationCount: z.number().nullable(),
  referenceCount: z.number().nullable(),
  influentialCitationCount: z.number().nullable(),
  isOpenAccess: z.boolean().nullable(),
  fieldsOfStudy: z.array(z.string()).nullable(),
  publicationTypes: z.array(z.string()).nullable(),
  publicationDate: z.string().nullable(),
  journal: z.object({
    name: z.string().optional(),
    volume: z.string().optional(),
    pages: z.string().optional(),
  }).nullable().optional(),
  externalIds: z.object({
    DOI: z.string().optional(),
    ArXiv: z.string().optional(),
    PubMed: z.string().optional(),
    CorpusId: z.number().optional(),
  }).nullable().optional(),
  url: z.string().optional(),
  openAccessPdf: z.object({
    url: z.string(),
    status: z.string().nullable(),
  }).nullable().optional(),
})

export type SemanticScholarPaper = z.infer<typeof SemanticScholarPaperSchema>

/**
 * Semantic Scholar search response
 */
export const SemanticScholarSearchResponseSchema = z.object({
  total: z.number(),
  offset: z.number(),
  next: z.number().optional(),
  data: z.array(SemanticScholarPaperSchema),
})

export type SemanticScholarSearchResponse = z.infer<typeof SemanticScholarSearchResponseSchema>

/**
 * Semantic Scholar paper details response
 */
export const SemanticScholarPaperDetailsSchema = SemanticScholarPaperSchema.extend({
  citations: z.array(z.object({
    paperId: z.string(),
    title: z.string(),
  })).optional(),
  references: z.array(z.object({
    paperId: z.string(),
    title: z.string(),
  })).optional(),
  embedding: z.object({
    model: z.string(),
    vector: z.array(z.number()),
  }).nullable().optional(),
})

export type SemanticScholarPaperDetails = z.infer<typeof SemanticScholarPaperDetailsSchema>
