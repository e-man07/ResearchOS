# @research-os/mcp-connectors

MCP (Model Context Protocol) server implementations for various research data sources.

## Connectors

### Phase 1 (MVP)
- **arXiv** - Academic paper repository
- **Semantic Scholar** - AI-powered research tool

### Phase 2 (V1)
- **PubMed** - Biomedical literature
- **Crossref** - DOI resolution and citations
- **GitHub** - Code repositories
- **Twitter/X** - Social signals and trends

### Phase 3 (Advanced)
- **S3** - Private paper storage
- **SQL** - Institutional databases
- **Elasticsearch** - Internal knowledge bases

## Usage

```typescript
import { ArxivMCPServer } from '@research-os/mcp-connectors'

const server = new ArxivMCPServer()
await server.start()
```

## Architecture

Each connector implements:
- Search functionality
- Paper fetching
- Rate limiting
- Error handling
- Data normalization
