/**
 * Research Workflow Routes
 * Supports session management for persistent conversations
 */

import { Router } from 'express'
import { executeResearchWorkflow, getDefaultSessionService, createSessionOptionsFromRequest } from '@research-os/agents'

export const researchWorkflowRouter = Router()

// Get session service (shared across requests)
const sessionService = getDefaultSessionService()

/**
 * POST /api/workflows/research
 * Execute a research workflow with ADK-TS agents
 * Supports session management via userId and sessionId in body/query/headers
 */
researchWorkflowRouter.post('/research', async (req, res, next) => {
  try {
    const { query, workflowType, options, sessionOptions } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    // Get session options if provided
    const sessionOpts = sessionOptions || createSessionOptionsFromRequest(req)

    console.log('🚀 Starting research workflow:', query)
    console.log('Type:', workflowType || 'full')
    if (sessionOpts) {
      console.log('📝 Session:', sessionOpts.userId, sessionOpts.sessionId || 'new')
    }

    const result = await executeResearchWorkflow({
      query,
      workflowType: workflowType || 'full',
      options: options || {},
      sessionService: sessionOpts ? sessionService : undefined,
      sessionOptions: sessionOpts || undefined,
    })

    console.log('✅ Workflow completed')

    res.json({
      success: true,
      result: {
        ...result,
        sessionId: sessionOpts?.sessionId,
        userId: sessionOpts?.userId,
      },
    })
  } catch (error) {
    console.error('Workflow error:', error)
    return next(error)
  }
})

/**
 * POST /api/workflows/literature-review
 * Execute a literature review workflow
 */
researchWorkflowRouter.post('/literature-review', async (req, res, next) => {
  try {
    const { topic, yearRange, maxPapers, reportFormat } = req.body

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' })
    }

    console.log('📚 Starting literature review:', topic)

    // Use research workflow with specific settings
    const result = await executeResearchWorkflow({
      query: topic,
      workflowType: 'full',
      options: {
        yearRange,
        maxPapers,
        outputFormat: reportFormat,
      },
    })

    console.log('✅ Literature review completed')

    res.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Literature review error:', error)
    return next(error)
  }
})
