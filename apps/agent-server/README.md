# ADK-TS Agent Server

Standalone Node.js/Express server for running ADK-TS agents.

## Why Separate Server?

ADK-TS v0.5.0 has ESM package dependencies (chalk, uuid) that conflict with Next.js's webpack bundler. By running agents in a separate Node.js server, we avoid these compatibility issues while maintaining full ADK-TS functionality.

## Architecture

```
Next.js App (Port 3000)
    ↓ HTTP Request
Agent Server (Port 3001)
    ↓ ADK-TS Agents
    ↓ MCP Connectors
    ↓ LLM APIs
```

## Setup

1. **Install dependencies:**
```bash
cd apps/agent-server
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start server:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Workflows

**POST /api/workflows/research**
```json
{
  "query": "transformer models in NLP",
  "workflowType": "full",
  "options": {
    "yearRange": { "from": 2020, "to": 2024 },
    "maxPapers": 50,
    "outputFormat": "detailed"
  }
}
```

**POST /api/workflows/literature-review**
```json
{
  "topic": "few-shot learning",
  "yearRange": { "from": 2020, "to": 2024 },
  "maxPapers": 100,
  "reportFormat": "comprehensive"
}
```

### Individual Agents

**POST /api/agents/planner**
```json
{
  "prompt": "Create a research plan for studying quantum computing"
}
```

**POST /api/agents/search**
```json
{
  "prompt": "Find papers on attention mechanisms published in 2023"
}
```

**POST /api/agents/synthesis**
```json
{
  "prompt": "Analyze trends in transformer architectures"
}
```

**POST /api/agents/report**
```json
{
  "prompt": "Generate a comprehensive report on BERT and its variants"
}
```

**POST /api/agents/qa**
```json
{
  "question": "What are the main differences between GPT and BERT?"
}
```

## Integration with Next.js

The Next.js app proxies requests to this server:

```typescript
// apps/web/src/app/api/v1/workflows/research/route.ts
const response = await fetch('http://localhost:3001/api/workflows/research', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

## Development

```bash
# Watch mode with auto-reload
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build
```

## Environment Variables

```bash
AGENT_SERVER_PORT=3001          # Server port
NODE_ENV=development            # Environment
NEXT_PUBLIC_URL=http://localhost:3000  # Next.js URL for CORS
OPENAI_API_KEY=sk-...          # OpenAI API key
LLM_MODEL=gpt-4o               # Default LLM model
```

## Deployment

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### PM2
```bash
pm2 start dist/index.js --name agent-server
```

### Systemd
```ini
[Unit]
Description=ADK-TS Agent Server
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/agent-server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Monitoring

Health check endpoint:
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "service": "agent-server",
  "version": "0.1.0"
}
```

## Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>
```

### ESM import errors
Make sure `"type": "module"` is in package.json

### Agent timeout
Increase timeout in Next.js API route:
```typescript
export const maxDuration = 60 // seconds
```

## Performance

- **Startup time:** ~2 seconds
- **Agent response:** 5-30 seconds (depends on LLM)
- **Memory usage:** ~200MB base + ~50MB per concurrent request
- **Concurrent requests:** Handles 10+ simultaneous workflows

## Security

- CORS configured for Next.js origin only
- No authentication (handled by Next.js)
- Rate limiting recommended for production
- API keys stored in environment variables

## License

MIT
