# @research-os/agents

ADK-TS agent implementations for autonomous research workflows.

## Agents

### Phase 1 (MVP)
- **Orchestrator Agent** - Coordinates multi-agent workflows
- **Retrieval Agent** - Searches and fetches papers
- **Synthesis Agent** - Analyzes and synthesizes findings
- **Writer Agent** - Generates reports and deliverables

### Phase 2 (V1)
- **Monitoring Agent** - Scheduled searches and alerts

### Phase 3 (Advanced)
- **Verification Agent** - Cross-source fact checking
- **Code Analyzer Agent** - Repository analysis
- **Conductor Agent** - Advanced multi-agent orchestration

## Usage

```typescript
import { OrchestratorAgent } from '@research-os/agents'

const agent = new OrchestratorAgent({
  model: 'gpt-4-turbo',
  tools: [...],
})

const result = await agent.execute('Review recent papers on transformers')
```

## Architecture

Agents are built on ADK-TS and follow these patterns:
- Tool-based architecture
- Memory management
- Error recovery
- Evaluation and verification
