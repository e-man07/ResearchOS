/**
 * Normalize arXiv data to canonical Paper schema
 */

import type { CreatePaper } from '@research-os/core'
import type { ArxivEntry } from './types.js'

/**
 * Extract arXiv ID from full ID URL
 */
function extractArxivId(id: string): string {
  const match = id.match(/arxiv\.org\/abs\/(.+)/)
  return match ? match[1]! : id
}

/**
 * Extract year from date string
 */
function extractYear(dateString: string): number {
  const date = new Date(dateString)
  return date.getFullYear()
}

/**
 * Extract month from date string
 */
function extractMonth(dateString: string): number {
  const date = new Date(dateString)
  return date.getMonth() + 1 // JavaScript months are 0-indexed
}

/**
 * Get PDF URL from links
 */
function getPdfUrl(links: ArxivEntry['links']): string | undefined {
  if (!links || !Array.isArray(links)) return undefined
  const pdfLink = links.find((link) => link.title === 'pdf' || link.type === 'application/pdf')
  return pdfLink?.href
}

/**
 * Get HTML URL from links
 */
function getHtmlUrl(links: ArxivEntry['links']): string | undefined {
  if (!links || !Array.isArray(links)) return undefined
  const htmlLink = links.find((link) => link.rel === 'alternate' && link.type === 'text/html')
  return htmlLink?.href
}

/**
 * Normalize arXiv entry to canonical Paper schema
 */
export function normalizeArxivEntry(entry: ArxivEntry): CreatePaper {
  const arxivId = extractArxivId(entry.id)
  const publishedDate = new Date(entry.published)

  return {
    title: entry.title.trim().replace(/\s+/g, ' '),
    authors: entry.authors?.map((author) => ({
      name: author.name.trim(),
    })) || [],
    abstract: entry.summary.trim().replace(/\s+/g, ' '),
    
    // Identifiers
    arxiv_id: arxivId,
    doi: entry.doi,
    
    // Metadata
    year: extractYear(entry.published),
    month: extractMonth(entry.published),
    venue: entry.journal_ref,
    
    // URLs
    pdf_url: getPdfUrl(entry.links),
    html_url: getHtmlUrl(entry.links),
    
    // Classification
    topics: entry.categories?.map((cat) => cat.term) || [],
    categories: entry.categories?.map((cat) => cat.term) || [],
    keywords: [],
    
    // Metrics
    references: [],
    
    // Source tracking
    source: 'arxiv',
    source_id: arxivId,
    raw_json: entry as Record<string, unknown>,
    
    // Timestamps
    published_at: publishedDate,
  }
}
