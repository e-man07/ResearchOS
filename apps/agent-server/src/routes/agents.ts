/**
 * Individual Agent Routes
 * Supports session-based persistent conversations
 */

import { Router } from 'express'
import {
  createPlannerAgent,
  createSearchAgent,
  createSynthesisAgent,
  createReportAgent,
  createQAAgent,
  getDefaultSessionService,
  createSessionOptionsFromRequest,
} from '@research-os/agents'

export const agentRouter = Router()

// Get session service (shared across requests)
const sessionService = getDefaultSessionService()

/**
 * POST /api/agents/planner
 * Use the Planner agent
 * Supports session management via userId and sessionId in body/query/headers
 */
agentRouter.post('/planner', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Get session options if provided
    const sessionOpts = createSessionOptionsFromRequest(req)

    console.log('🧠 Planner agent:', prompt)
    if (sessionOpts) {
      console.log('📝 Session:', sessionOpts.userId, sessionOpts.sessionId || 'new')
    }

    const { runner } = await createPlannerAgent({
      sessionService: sessionOpts ? sessionService : undefined,
      sessionOptions: sessionOpts || undefined,
    })

    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'planner',
      sessionId: sessionOpts?.sessionId,
      userId: sessionOpts?.userId,
    })
  } catch (error) {
    console.error('Planner error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/search
 * Use the Search agent with tool-enhanced search
 * Supports session management for persistent conversations
 */
agentRouter.post('/search', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Get session options if provided
    const sessionOpts = createSessionOptionsFromRequest(req)

    console.log('🔍 Search agent:', prompt)
    if (sessionOpts) {
      console.log('📝 Session:', sessionOpts.userId, sessionOpts.sessionId || 'new')
    }

    const { runner } = await createSearchAgent({
      sessionService: sessionOpts ? sessionService : undefined,
      sessionOptions: sessionOpts || undefined,
    })

    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'search',
      sessionId: sessionOpts?.sessionId,
      userId: sessionOpts?.userId,
    })
  } catch (error) {
    console.error('Search agent error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/synthesis
 * Use the Synthesis agent
 * Supports session management for context retention
 */
agentRouter.post('/synthesis', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Get session options if provided
    const sessionOpts = createSessionOptionsFromRequest(req)

    console.log('🧠 Synthesis agent:', prompt)
    if (sessionOpts) {
      console.log('📝 Session:', sessionOpts.userId, sessionOpts.sessionId || 'new')
    }

    const { runner } = await createSynthesisAgent({
      sessionService: sessionOpts ? sessionService : undefined,
      sessionOptions: sessionOpts || undefined,
    })

    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'synthesis',
      sessionId: sessionOpts?.sessionId,
      userId: sessionOpts?.userId,
    })
  } catch (error) {
    console.error('Synthesizer error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/report
 * Use the Report agent
 * Supports session management for maintaining report context
 */
agentRouter.post('/report', async (req, res, next) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Get session options if provided
    const sessionOpts = createSessionOptionsFromRequest(req)

    console.log('📄 Report agent:', prompt)
    if (sessionOpts) {
      console.log('📝 Session:', sessionOpts.userId, sessionOpts.sessionId || 'new')
    }

    const { runner } = await createReportAgent({
      sessionService: sessionOpts ? sessionService : undefined,
      sessionOptions: sessionOpts || undefined,
    })

    const response = await runner.ask(prompt)

    res.json({
      success: true,
      response,
      agent: 'report',
      sessionId: sessionOpts?.sessionId,
      userId: sessionOpts?.userId,
    })
  } catch (error) {
    console.error('Report agent error:', error)
    return next(error)
  }
})

/**
 * POST /api/agents/qa
 * Use the Q&A agent with RAG support
 * Supports session management for conversation history
 */
agentRouter.post('/qa', async (req, res, next) => {
  try {
    const { question } = req.body

    if (!question) {
      return res.status(400).json({ error: 'Question is required' })
    }

    // Get session options if provided
    const sessionOpts = createSessionOptionsFromRequest(req)

    console.log('💬 Q&A agent:', question)
    if (sessionOpts) {
      console.log('📝 Session:', sessionOpts.userId, sessionOpts.sessionId || 'new')
    }

    const { runner } = await createQAAgent({
      sessionService: sessionOpts ? sessionService : undefined,
      sessionOptions: sessionOpts || undefined,
    })

    const response = await runner.ask(question)

    res.json({
      success: true,
      response,
      agent: 'qa',
      sessionId: sessionOpts?.sessionId,
      userId: sessionOpts?.userId,
    })
  } catch (error) {
    console.error('Q&A error:', error)
    return next(error)
  }
})
