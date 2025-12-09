/**
 * Core type definitions and schemas for ResearchOS
 * All types are validated with Zod for runtime safety
 */

// Paper types
export * from './paper.js'
export * from './chunk.js'
export * from './project.js'
export * from './search.js'
export * from './user.js'

// Re-export commonly used types
export type { z } from 'zod'
