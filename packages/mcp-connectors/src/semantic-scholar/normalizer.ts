/**
 * Normalize Semantic Scholar data to canonical Paper schema
 */

import type { CreatePaper } from '@research-os/core'
import type { SemanticScholarPaper } from './types.js'

/**
 * Extract month from publication date string
 */
function extractMonth(dateString: string | null): number | undefined {
  if (!dateString) return undefined
  const date = new Date(dateString)
  return date.getMonth() + 1 // JavaScript months are 0-indexed
}

/**
 * Normalize Semantic Scholar paper to canonical Paper schema
 */
export function normalizeSemanticScholarPaper(paper: SemanticScholarPaper): CreatePaper {
  const publishedAt = paper.publicationDate ? new Date(paper.publicationDate) : undefined

  return {
    title: paper.title.trim(),
    authors: paper.authors.map((author) => ({
      name: author.name.trim(),
      author_id: author.authorId,
    })),
    abstract: paper.abstract?.trim() || '',
    
    // Identifiers
    doi: paper.externalIds?.DOI,
    arxiv_id: paper.externalIds?.ArXiv,
    pubmed_id: paper.externalIds?.PubMed,
    semantic_scholar_id: paper.paperId,
    
    // Metadata
    year: paper.year || (publishedAt ? publishedAt.getFullYear() : new Date().getFullYear()),
    month: paper.publicationDate ? extractMonth(paper.publicationDate) : undefined,
    venue: paper.venue || paper.journal?.name,
    publisher: paper.journal?.name,
    
    // URLs
    pdf_url: paper.openAccessPdf?.url,
    html_url: paper.url,
    
    // Classification
    topics: paper.fieldsOfStudy || [],
    categories: paper.publicationTypes || [],
    keywords: [],
    
    // Metrics
    citations: paper.citationCount || 0,
    references: [],
    
    // Source tracking
    source: 'semantic_scholar',
    source_id: paper.paperId,
    raw_json: paper as unknown as Record<string, unknown>,
    
    // Timestamps
    published_at: publishedAt,
  }
}
