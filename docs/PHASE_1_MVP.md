# Phase 1: MVP - Basic Literature Review (Week 3-8)

## Objective
Create a working prototype that can search arXiv and Semantic Scholar, retrieve papers, and generate basic reports.

## Duration
6 weeks (240 hours)

## Goals
- ✅ 2 working MCP connectors (arXiv, Semantic Scholar)
- ✅ Basic ADK-TS agent orchestration
- ✅ Weaviate integration with embeddings
- ✅ CLI tool for running literature reviews
- ✅ Text/Markdown report generation

---

## Milestones

### M1.1: MCP Connectors (Week 3-4)
**Effort:** 80 hours

**Components:**
- arXiv MCP Server
- Semantic Scholar MCP Server
- MCP Gateway/Router
- Rate limiting middleware
- Error handling and retry logic

**Key Features:**
- Search papers by query
- Fetch paper metadata
- Download PDFs
- Handle API rate limits
- Normalize data to canonical schema

---

### M1.2: Ingestion Pipeline (Week 4-5)
**Effort:** 60 hours

**Components:**
- Fetcher service (parallel downloads)
- Normalizer service (schema mapping)
- Chunker service (semantic splitting)
- Embedder service (OpenAI integration)
- Deduplicator service (DOI/hash based)

**Key Features:**
- Process 100+ papers in <5 minutes
- Respect rate limits
- Handle errors gracefully
- Track progress
- Cost monitoring

---

### M1.3: Vector Database Integration (Week 5-6)
**Effort:** 50 hours

**Components:**
- Weaviate Cloud setup
- Weaviate client wrapper
- PostgreSQL repository layer
- Data synchronization logic

**Key Features:**
- Store and retrieve embeddings
- Hybrid search (BM25 + vector)
- Metadata filtering
- Sub-100ms search latency (p95)

---

### M1.4: ADK-TS Agent Implementation (Week 6-7)
**Effort:** 100 hours

**Agents:**
- Orchestrator Agent (task planning)
- Retrieval Agent (search & fetch)
- Synthesis Agent (analysis)
- Writer Agent (report generation)

**Key Features:**
- Multi-step workflows
- Tool integration
- Memory management
- Error recovery

---

### M1.5: CLI & Report Generation (Week 7-8)
**Effort:** 60 hours

**Components:**
- CLI tool with commands
- Report generator (Markdown/PDF)
- Citation formatter
- End-to-end tests

**Key Features:**
- Interactive CLI
- Progress indicators
- Multiple output formats
- Citation styles (APA, MLA, Chicago)

---

## Technical Specifications

### MCP Connector Interface
```typescript
interface MCPConnector {
  search(query: string, options: SearchOptions): Promise<Paper[]>
  fetchPaper(id: string): Promise<Paper>
  downloadPDF(url: string): Promise<Buffer>
  healthCheck(): Promise<boolean>
}
```

### Paper Schema
```typescript
interface Paper {
  id: string
  title: string
  authors: Author[]
  abstract: string
  doi?: string
  arxiv_id?: string
  year: number
  venue?: string
  pdf_url?: string
  topics: string[]
  citations?: number
  source: 'arxiv' | 'semantic_scholar'
  source_id: string
  raw_json: Record<string, unknown>
}
```

### Agent Workflow
```
User Query → Orchestrator → Plan Tasks →
  → Retrieval Agent → Search MCP Connectors →
  → Ingestion Pipeline → Embed & Store →
  → Synthesis Agent → Analyze Papers →
  → Writer Agent → Generate Report →
  → Output (Markdown/PDF)
```

---

## Success Criteria

### Functional
- [ ] Can search arXiv and Semantic Scholar
- [ ] Can fetch and process 100+ papers
- [ ] Can generate embeddings and store in Weaviate
- [ ] Can perform hybrid search
- [ ] Can generate structured reports
- [ ] CLI commands work end-to-end

### Performance
- [ ] Search completes in <30 seconds
- [ ] Ingestion processes 100 papers in <5 minutes
- [ ] Vector search latency <100ms (p95)
- [ ] Report generation <60 seconds

### Quality
- [ ] Test coverage >80%
- [ ] All linting rules pass
- [ ] Documentation complete
- [ ] Error handling comprehensive

---

## API Rate Limits

| Source | Limit | Strategy |
|--------|-------|----------|
| arXiv | ~3 req/sec | Polite delay |
| Semantic Scholar | 100 req/5min | Queue + backoff |
| OpenAI Embeddings | 3000 req/min | Batch processing |

---

## Dependencies

**External Services:**
- Weaviate Cloud account
- OpenAI API key
- (Optional) Semantic Scholar API key

**Internal:**
- Phase 0 complete
- All infrastructure running

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | High | Implement robust queuing |
| Embedding costs | Medium | Batch processing, caching |
| Weaviate performance | Medium | Optimize schema and queries |
| Agent complexity | High | Start simple, iterate |

---

## Deliverables

1. Working arXiv MCP server
2. Working Semantic Scholar MCP server
3. Complete ingestion pipeline
4. Weaviate integration
5. 4 functional agents
6. CLI tool
7. Report generator
8. Test suite
9. Documentation
10. Demo video
