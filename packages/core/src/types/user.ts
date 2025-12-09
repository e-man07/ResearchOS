import { z } from 'zod'

/**
 * User role
 */
export const UserRoleSchema = z.enum(['user', 'admin', 'researcher'])

export type UserRole = z.infer<typeof UserRoleSchema>

/**
 * User preferences
 */
export const UserPreferencesSchema = z.object({
  default_sources: z.array(z.string()).default(['arxiv', 'semantic_scholar']),
  default_max_papers: z.number().int().min(1).max(1000).default(100),
  citation_style: z.enum(['apa', 'mla', 'chicago', 'ieee']).default('apa'),
  email_notifications: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>

/**
 * User quota
 */
export const UserQuotaSchema = z.object({
  searches_per_month: z.number().int().min(0).default(100),
  searches_used: z.number().int().min(0).default(0),
  papers_per_search: z.number().int().min(1).max(1000).default(100),
  api_calls_per_day: z.number().int().min(0).default(1000),
  api_calls_used: z.number().int().min(0).default(0),
  storage_mb: z.number().int().min(0).default(1000),
  storage_used_mb: z.number().int().min(0).default(0),
})

export type UserQuota = z.infer<typeof UserQuotaSchema>

/**
 * User schema
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  
  // Authentication
  email: z.string().email(),
  password_hash: z.string().optional(), // Optional for OAuth users
  
  // Profile
  name: z.string().min(1).max(255).optional(),
  avatar_url: z.string().url().optional(),
  
  // Role and status
  role: UserRoleSchema.default('user'),
  is_active: z.boolean().default(true),
  is_verified: z.boolean().default(false),
  
  // Preferences and quota
  preferences: UserPreferencesSchema.default({}),
  quota: UserQuotaSchema.default({}),
  
  // OAuth
  oauth_provider: z.string().optional(),
  oauth_id: z.string().optional(),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  last_login_at: z.date().optional(),
})

export type User = z.infer<typeof UserSchema>

/**
 * User creation schema
 */
export const CreateUserSchema = UserSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_login_at: true,
})

export type CreateUser = z.infer<typeof CreateUserSchema>

/**
 * Public user schema (safe to expose)
 */
export const PublicUserSchema = UserSchema.omit({
  password_hash: true,
  oauth_provider: true,
  oauth_id: true,
})

export type PublicUser = z.infer<typeof PublicUserSchema>
