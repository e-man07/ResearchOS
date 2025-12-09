# Architecture Update - Next.js + Prisma

## Changes from Original Plan

### 1. Frontend & API Consolidation
**Before:** Separate API server (Express) + Web UI (Next.js)  
**After:** Single Next.js application with API routes

**Benefits:**
- Simplified deployment (single app)
- Built-in API routes
- Better TypeScript integration
- Automatic code splitting
- Server-side rendering capabilities

### 2. Database Layer
**Before:** Direct PostgreSQL queries  
**After:** Prisma ORM

**Benefits:**
- Type-safe database queries
- Automatic migrations
- Database schema versioning
- Better developer experience
- Built-in connection pooling

### 3. Testing Strategy
**Before:** Vitest for all testing  
**After:** Jest + React Testing Library + Playwright

**Testing Approach:**
- **Unit Tests:** Jest for packages (core, mcp-connectors, agents)
- **Integration Tests:** Jest for API routes
- **Component Tests:** React Testing Library for UI
- **E2E Tests:** Playwright for full workflows

**Test-Driven Development:**
- Write tests BEFORE implementation
- Test after each phase completion
- Minimum 80% code coverage

---

## Updated Project Structure

```
research-os/
├── packages/
│   ├── core/                 # Core utilities and types
│   ├── mcp-connectors/       # MCP server implementations
│   ├── agents/               # ADK-TS agent implementations
│   ├── ingestion/            # Data ingestion pipeline
│   └── rag/                  # RAG implementation
│
├── apps/
│   └── web/                  # Next.js 14 application
│       ├── src/
│       │   ├── app/          # App router pages
│       │   │   ├── (auth)/   # Auth pages
│       │   │   ├── (dashboard)/ # Dashboard pages
│       │   │   └── api/      # API routes
│       │   ├── components/   # React components
│       │   ├── lib/          # Client utilities
│       │   └── server/       # Server-side code
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       └── package.json
│
├── prisma/                   # Root Prisma (if shared)
└── package.json
```

---

## Phase 0 Updates

### New Tasks
- [x] T0.1-T0.4: Project setup ✅
- [x] T0.8: Core types ✅
- [ ] T0.11: Set up Next.js application
- [ ] T0.12: Set up Prisma with PostgreSQL
- [ ] T0.13: Configure Jest and testing infrastructure
- [ ] T0.14: Write initial tests for core package

---

## Next.js Application Structure

### API Routes (`apps/web/src/app/api/`)
```
api/
├── v1/
│   ├── searches/
│   │   ├── route.ts           # POST /api/v1/searches
│   │   └── [id]/
│   │       └── route.ts       # GET /api/v1/searches/:id
│   ├── papers/
│   │   └── [id]/
│   │       └── route.ts       # GET /api/v1/papers/:id
│   ├── projects/
│   │   ├── route.ts           # GET, POST /api/v1/projects
│   │   └── [id]/
│   │       └── route.ts       # GET, PUT, DELETE
│   └── reports/
│       └── [searchId]/
│           └── route.ts       # POST /api/v1/reports/:searchId
└── auth/
    └── [...nextauth]/
        └── route.ts           # NextAuth.js
```

### Pages (`apps/web/src/app/`)
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── page.tsx              # Dashboard
│   ├── search/
│   │   └── page.tsx          # Search interface
│   ├── projects/
│   │   ├── page.tsx          # Projects list
│   │   └── [id]/
│   │       └── page.tsx      # Project detail
│   └── settings/
│       └── page.tsx          # Settings
└── layout.tsx                # Root layout
```

---

## Prisma Schema (Initial)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  passwordHash  String?   @map("password_hash")
  role          Role      @default(USER)
  isActive      Boolean   @default(true) @map("is_active")
  isVerified    Boolean   @default(false) @map("is_verified")
  
  projects      Project[]
  searches      Search[]
  
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  lastLoginAt   DateTime? @map("last_login_at")
  
  @@map("users")
}

enum Role {
  USER
  ADMIN
  RESEARCHER
}

model Paper {
  id              String    @id @default(uuid())
  title           String
  abstract        String    @db.Text
  
  // Identifiers
  doi             String?
  arxivId         String?   @map("arxiv_id")
  pubmedId        String?   @map("pubmed_id")
  semanticScholarId String? @map("semantic_scholar_id")
  
  // Metadata
  year            Int
  month           Int?
  venue           String?
  publisher       String?
  
  // URLs
  pdfUrl          String?   @map("pdf_url")
  htmlUrl         String?   @map("html_url")
  
  // Classification
  topics          String[]
  keywords        String[]
  categories      String[]
  
  // Metrics
  citations       Int?
  
  // Source
  source          String
  sourceId        String    @map("source_id")
  rawJson         Json?     @map("raw_json")
  
  chunks          Chunk[]
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  publishedAt     DateTime? @map("published_at")
  
  @@unique([source, sourceId])
  @@index([arxivId])
  @@index([doi])
  @@map("papers")
}

model Chunk {
  id              String   @id @default(uuid())
  paperId         String   @map("paper_id")
  paper           Paper    @relation(fields: [paperId], references: [id], onDelete: Cascade)
  
  content         String   @db.Text
  chunkIndex      Int      @map("chunk_index")
  
  section         String?
  sectionIndex    Int?     @map("section_index")
  page            Int?
  
  embeddingModel  String?  @map("embedding_model")
  metadata        Json?
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@index([paperId])
  @@map("chunks")
}

model Project {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?  @db.Text
  query           String?
  
  status          ProjectStatus @default(ACTIVE)
  
  searches        Search[]
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@index([userId])
  @@map("projects")
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  DELETED
}

model Search {
  id              String   @id @default(uuid())
  projectId       String?  @map("project_id")
  project         Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  userId          String   @map("user_id")
  
  query           String
  filters         Json?
  
  status          SearchStatus @default(PENDING)
  errorMessage    String?  @map("error_message") @db.Text
  executionTimeMs Int?     @map("execution_time_ms")
  
  totalResults    Int      @default(0) @map("total_results")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  startedAt       DateTime? @map("started_at")
  completedAt     DateTime? @map("completed_at")
  
  @@index([userId])
  @@index([projectId])
  @@map("searches")
}

enum SearchStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## Testing Strategy

### Phase 0: Foundation Tests
```typescript
// packages/core/src/types/__tests__/paper.test.ts
describe('PaperSchema', () => {
  it('should validate valid paper data', () => {
    const validPaper = {
      title: 'Test Paper',
      authors: [{ name: 'John Doe' }],
      abstract: 'Test abstract',
      year: 2024,
      source: 'arxiv',
      source_id: '2401.00001',
    }
    expect(() => CreatePaperSchema.parse(validPaper)).not.toThrow()
  })
  
  it('should reject invalid paper data', () => {
    const invalidPaper = {
      title: '',
      authors: [],
      abstract: 'Test',
    }
    expect(() => CreatePaperSchema.parse(invalidPaper)).toThrow()
  })
})
```

### Phase 1: MCP Connector Tests
```typescript
// packages/mcp-connectors/src/arxiv/__tests__/server.test.ts
describe('ArxivMCPServer', () => {
  let server: ArxivMCPServer
  
  beforeEach(() => {
    server = new ArxivMCPServer()
  })
  
  it('should search papers successfully', async () => {
    const results = await server.searchPapers({
      query: 'machine learning',
      max_results: 5,
    })
    
    expect(results).toHaveLength(5)
    expect(results[0]).toHaveProperty('title')
    expect(results[0]).toHaveProperty('arxiv_id')
  })
  
  it('should respect rate limits', async () => {
    // Test rate limiting logic
  })
})
```

### Phase 1: API Route Tests
```typescript
// apps/web/tests/integration/api/searches.test.ts
describe('POST /api/v1/searches', () => {
  it('should create a new search', async () => {
    const response = await fetch('/api/v1/searches', {
      method: 'POST',
      body: JSON.stringify({
        query: 'transformers',
        filters: { sources: ['arxiv'] },
      }),
    })
    
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data.status).toBe('pending')
  })
})
```

---

## Implementation Order (Updated)

### Phase 0: Foundation (Current)
1. ✅ Core types and schemas
2. ✅ arXiv MCP connector
3. 🔄 Next.js application setup
4. 🔄 Prisma setup
5. 🔄 Testing infrastructure
6. 🔄 Write and run Phase 0 tests

### Phase 1: MVP
1. Write tests for Semantic Scholar connector
2. Implement Semantic Scholar connector
3. Write tests for ingestion pipeline
4. Implement ingestion pipeline
5. Write tests for basic agents
6. Implement basic agents
7. Write tests for API routes
8. Implement API routes
9. Run all Phase 1 tests

### Testing Checkpoints
- **After each component:** Unit tests pass
- **After each phase:** Integration tests pass
- **Before deployment:** E2E tests pass
