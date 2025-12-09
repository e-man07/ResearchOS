/**
 * ADK-TS Agent Server
 * Standalone Node.js server for running ADK-TS agents
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { researchWorkflowRouter } from './routes/research-workflow.js'
import { agentRouter } from './routes/agents.js'

dotenv.config()

const app = express()
const PORT = process.env.AGENT_SERVER_PORT || 3002

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agent-server', version: '0.1.0' })
})

// Routes
app.use('/api/workflows', researchWorkflowRouter)
app.use('/api/agents', agentRouter)

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🤖 ADK-TS Agent Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
