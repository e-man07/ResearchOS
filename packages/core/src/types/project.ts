import { z } from 'zod'

/**
 * Project status
 */
export const ProjectStatusSchema = z.enum(['active', 'archived', 'deleted'])

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

/**
 * Project schema - workspace for organizing research
 */
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Basic info
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(2000).optional(),
  
  // Research query
  query: z.string().optional(),
  filters: z.record(z.unknown()).default({}),
  
  // Scheduling
  schedule: z.string().optional(), // Cron expression
  last_run_at: z.date().optional(),
  next_run_at: z.date().optional(),
  
  // Status
  status: ProjectStatusSchema.default('active'),
  
  // Configuration
  config: z.object({
    sources: z.array(z.string()).default(['arxiv', 'semantic_scholar']),
    max_papers: z.number().int().min(1).max(1000).default(100),
    date_range: z.object({
      start: z.date().optional(),
      end: z.date().optional(),
    }).optional(),
    auto_alerts: z.boolean().default(false),
    alert_threshold: z.number().int().min(1).default(5),
  }).default({}),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
})

export type Project = z.infer<typeof ProjectSchema>

/**
 * Project creation schema
 */
export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_run_at: true,
  next_run_at: true,
})

export type CreateProject = z.infer<typeof CreateProjectSchema>

/**
 * Project update schema
 */
export const UpdateProjectSchema = ProjectSchema.partial().required({ id: true })

export type UpdateProject = z.infer<typeof UpdateProjectSchema>
