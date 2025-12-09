# ResearchOS - Quick Start Guide

## ✅ Build Complete!

All packages have been successfully built and are ready to use.

---

## 🚀 Getting Started

### 1. Set Up Database (PostgreSQL Required)

```bash
cd apps/web

# Copy environment file
cp .env.example .env

# Edit .env with your PostgreSQL connection:
# DATABASE_URL="postgresql://user:password@localhost:5432/research_os"
```

### 2. Run Database Migrations

```bash
# Generate Prisma client (already done)
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate
```

### 3. Start Development Server

```bash
# From root directory
cd /Users/e-man/CascadeProjects/research-os

# Start Next.js dev server
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Create Search
```bash
curl -X POST http://localhost:3000/api/v1/searches \
  -H "Content-Type: application/json" \
  -d '{
    "query": "transformer models",
    "filters": {
      "sources": ["arxiv", "semantic_scholar"]
    }
  }'
```

### List Searches
```bash
curl http://localhost:3000/api/v1/searches
```

### Get Search by ID
```bash
curl http://localhost:3000/api/v1/searches/{search-id}
```

---

## 🧪 Testing MCP Connectors

### Test arXiv Connector

```typescript
import { ArxivMCPServer } from '@research-os/mcp-connectors'

const server = new ArxivMCPServer()

// Search papers
const papers = await server.searchPapers({
  query: 'machine learning',
  max_results: 10,
  sort_by: 'relevance'
})

console.log(`Found ${papers.length} papers`)
```

### Test Semantic Scholar Connector

```typescript
import { SemanticScholarMCPServer } from '@research-os/mcp-connectors'

const server = new SemanticScholarMCPServer(process.env.SEMANTIC_SCHOLAR_API_KEY)

// Search papers
const papers = await server.searchPapers({
  query: 'transformers',
  limit: 10,
  minCitationCount: 100
})

// Get recommendations
const recommendations = await server.getRecommendations('paper-id', 10)
```

---

## 📦 Package Structure

```
research-os/
├── packages/
│   ├── core/                 ✅ Built
│   ├── mcp-connectors/       ✅ Built (arXiv + Semantic Scholar)
│   ├── ingestion/            ✅ Built
│   ├── agents/               ✅ Built
│   └── rag/                  ✅ Built
│
└── apps/
    └── web/                  ✅ Built (Next.js)
```

---

## 🛠️ Development Commands

### Build
```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@research-os/core
```

### Development
```bash
# Watch mode for packages
npm run dev --workspace=@research-os/core

# Start Next.js dev server
cd apps/web && npm run dev
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Run E2E tests
cd apps/web && npm run test:e2e
```

### Linting
```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix
```

### Database
```bash
cd apps/web

# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## 🔑 Environment Variables

Create `apps/web/.env`:

```env
# Database (Required)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/research_os"

# NextAuth (Optional - for future auth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# OpenAI (Optional - for embeddings in Phase 2)
OPENAI_API_KEY="your-openai-api-key"

# Semantic Scholar (Optional - increases rate limit from 1 to 100 req/sec)
SEMANTIC_SCHOLAR_API_KEY="your-api-key"

# Weaviate (Phase 2)
WEAVIATE_URL="https://your-cluster.weaviate.network"
WEAVIATE_API_KEY="your-weaviate-api-key"
```

---

## 📊 What's Implemented

### Phase 0: Foundation ✅
- Core types with Zod validation
- Utility functions (logger, errors, retry, rate-limiter)
- Next.js 14 application
- Prisma with PostgreSQL
- Testing infrastructure

### Phase 1: MVP ✅
- **MCP Connectors:**
  - arXiv (search, fetch, categories)
  - Semantic Scholar (search, fetch, recommendations)
- **Ingestion Pipeline:**
  - Paper fetcher
  - Text chunker
- **Agents:**
  - Base agent
  - Search agent
- **API Routes:**
  - POST /api/v1/searches
  - GET /api/v1/searches
  - GET /api/v1/searches/:id
  - GET /api/health

---

## 🎯 Next Steps (Phase 2)

1. **RAG Implementation**
   - Weaviate integration
   - Embedding generation
   - Vector search

2. **Advanced Agents**
   - Synthesis agent
   - Report writer
   - Multi-agent orchestration

3. **Frontend UI**
   - Search interface
   - Results display
   - Project management

4. **Authentication**
   - NextAuth.js setup
   - User registration

---

## 📚 Documentation

- `PHASE_1_COMPLETE.md` - Phase 1 implementation details
- `SETUP_COMPLETE.md` - Complete setup guide
- `ARCHITECTURE_UPDATE.md` - Architecture decisions
- `IMPLEMENTATION_TRACKER.md` - Progress tracking

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify DATABASE_URL in .env
cat apps/web/.env | grep DATABASE_URL
```

### Prisma Issues
```bash
cd apps/web

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate client
npm run prisma:generate
```

---

## 🎉 Success!

Your ResearchOS installation is complete and ready for development!

**Build Status:** ✅ All packages built successfully  
**API Routes:** ✅ 4 endpoints ready  
**MCP Connectors:** ✅ 2 connectors (arXiv, Semantic Scholar)  
**Database:** ⏳ Needs PostgreSQL setup

Start the dev server and begin building! 🚀
