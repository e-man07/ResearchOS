# ResearchOS

> An autonomous research copilot powered by AI agents and MCP connectors

## Overview

**ResearchOS** is a production-ready autonomous research copilot that transforms weeks of manual research into minutes of intelligent automation. It leverages:

- **ADK-TS** for multi-agent orchestration (5 specialized agents)
- **Model Context Protocol (MCP)** for modular data connectors
- **Weaviate** for vector database and RAG-powered chat
- **Multiple scientific APIs** (arXiv, Semantic Scholar)
- **Gemini Fallback** for resilient LLM operations


## Features

###  Currently Implemented

-  **Unified Multi-Source Search** - Search arXiv and Semantic Scholar simultaneously
-  **Multi-Agent Workflows** - 5 specialized agents (Planner, Search, Synthesis, Report Writer, Q&A)
-  **RAG-Powered Chat** - Conversational interface for exploring indexed papers
-  **Automated Literature Reviews** - Generate comprehensive reports in minutes
-  **Authentication** - Google OAuth via NextAuth.js
-  **Workflow Management** - Real-time progress tracking and history
-  **Paper Indexing** - Automatic chunking and vector embedding
-  **Gemini Fallback** - Automatic fallback when OpenAI rate limits are hit
-  **Dashboard** - View workflows, papers, and chat sessions


## Quick Start

### Prerequisites

- Node.js 20+ LTS
- npm or pnpm
- PostgreSQL database (or use Neon, Supabase, etc.)
- Weaviate Cloud account (or self-hosted)
- OpenAI API key
- Google API key (optional, for Gemini fallback)

### Installation

```bash
# Clone the repository
git clone https://github.com/e-man07/ResearchOS.git
cd research-os

# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to apps/web/.env and apps/agent-server/.env
# Edit with your API keys and database URLs
```

### Environment Variables

**apps/web/.env:**
```env
# Database
DATABASE_URL="postgresql://..."

# Weaviate
WEAVIATE_URL="https://your-instance.weaviate.cloud"
WEAVIATE_API_KEY="your-api-key"

# OpenAI
OPENAI_API_KEY="sk-..."

# Gemini (optional, for fallback)
GOOGLE_API_KEY="..."
FALLBACK_LLM_MODEL="gemini-2.0-flash-exp"
ENABLE_LLM_FALLBACK=true

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Agent Server
AGENT_SERVER_URL="http://localhost:3002"
```

**apps/agent-server/.env:**
```env
# OpenAI
OPENAI_API_KEY="sk-..."

# Gemini (optional)
GOOGLE_API_KEY="..."
FALLBACK_LLM_MODEL="gemini-2.0-flash-exp"

# Server
AGENT_SERVER_PORT=3002
NODE_ENV=development
```

### Running the Application

```bash
# Option 1: Use the convenience script
./start-all.sh

# Option 2: Run manually in separate terminals

# Terminal 1: Agent Server
cd apps/agent-server
npm run dev

# Terminal 2: Web Application
cd apps/web
npm run dev

# Terminal 3: Database migrations (first time only)
cd apps/web
npx prisma migrate dev
```

### Access Points

- 🌐 **Web App**: http://localhost:3000
- 🤖 **Agent Server**: http://localhost:3002
- 📊 **Health Check**: http://localhost:3002/health
- 🔍 **API Docs**: See API routes in `apps/web/src/app/api/v1/`

## Project Structure

```
research-os/
├── packages/
│   ├── core/                 # Core utilities and types
│   ├── mcp-connectors/       # MCP server implementations (arXiv, Semantic Scholar)
│   ├── agents/               # ADK-TS agent implementations (5 agents)
│   ├── ingestion/            # Data ingestion pipeline (chunking, embedding)
│   └── rag/                  # RAG implementation (Weaviate, embeddings)
├── apps/
│   ├── web/                  # Next.js web application (UI + API routes)
│   │   ├── src/app/         # Next.js App Router
│   │   │   ├── api/v1/      # API endpoints
│   │   │   ├── workflows/   # Workflow UI
│   │   │   ├── chat/        # Chat interface
│   │   │   └── rag/         # RAG Q&A interface
│   │   └── prisma/          # Database schema
│   └── agent-server/         # Standalone Express server for ADK-TS agents
│       ├── src/routes/      # API routes (workflows, agents)
│       └── dist/            # Compiled TypeScript
└── docs/                     # Documentation
```

## Architecture

### System Architecture

```
┌─────────────────────────────────────────┐
│      Next.js Web Application            │
│  - User Interface (React)               │
│  - API Routes (Proxy to Agent Server)   │
│  - Authentication (NextAuth.js)          │
│  - Database (Prisma + PostgreSQL)       │
└──────────────────┬──────────────────────┘
                   │ HTTP
                   ↓
┌─────────────────────────────────────────┐
│      Agent Server (Express)              │
│  - ADK-TS Agent Orchestration            │
│  - Multi-Agent Workflows                 │
│  - MCP Tool Integration                  │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│      ADK-TS Agents (5 Agents)           │
│  - Planner Agent                         │
│  - Search Agent (with MCP tools)        │
│  - Synthesis Agent                       │
│  - Report Writer Agent                   │
│  - Q&A Agent (RAG-powered)              │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│      MCP Connectors                      │
│  - arXiv MCP Server                     │
│  - Semantic Scholar MCP Server          │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│      RAG Pipeline                        │
│  - Text Chunking                         │
│  - Vector Embeddings (OpenAI)           │
│  - Semantic Search (Weaviate)           │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│      Storage Layer                       │
│  - Weaviate (Vector DB)                  │
│  - PostgreSQL (Metadata)                │
└─────────────────────────────────────────┘
```

### Agent Workflow

The system uses **5 specialized AI agents** working together:

1. **Planner Agent** - Analyzes queries and creates research strategies
2. **Search Agent** - Retrieves papers using MCP connectors (arXiv, Semantic Scholar)
3. **Synthesis Agent** - Analyzes papers and identifies patterns
4. **Report Writer Agent** - Generates comprehensive literature reviews
5. **Q&A Agent** - Answers questions about indexed papers using RAG

See [PLATFORM_OVERVIEW.md](./PLATFORM_OVERVIEW.md) for detailed agent descriptions.

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter @research-os/core test
```

### Linting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm typecheck
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @research-os/core build
```

## Documentation

### Core Documentation
- **[Platform Overview](./PLATFORM_OVERVIEW.md)** - Comprehensive platform documentation
- **[Quick Start Guide](./QUICK_START.md)** - Get started quickly
- **[Current Status](./CURRENT_STATUS.md)** - Development status and progress

### Phase Documentation
- [Phase 0: Foundation](./docs/PHASE_0_FOUNDATION.md)
- [Phase 1: MVP](./docs/PHASE_1_MVP.md)
- [Phase 2: V1](./docs/PHASE_2_V1.md)
- [Phase 3: Advanced](./docs/PHASE_3_ADVANCED.md)

### Technical Documentation
- [Implementation Tracker](./IMPLEMENTATION_TRACKER.md)
- [ADK-TS Integration](./ADK_TS_INTEGRATION.md)
- [Gemini Fallback](./packages/agents/GEMINI_FALLBACK.md)
- [Agent Server README](./apps/agent-server/README.md)

## Technology Stack

### Core Technologies
- **Language:** TypeScript 5.3+
- **Runtime:** Node.js 20 LTS
- **Package Manager:** npm workspaces
- **Frontend:** Next.js 14 (App Router), React 18, TailwindCSS
- **Backend:** Next.js API Routes, Express.js (Agent Server)

### AI & Agents
- **Agent Framework:** ADK-TS (@iqai/adk v0.5.0)
- **LLM:** OpenAI GPT-4o (with Gemini fallback)
- **Embeddings:** OpenAI text-embedding-3-small
- **MCP SDK:** @modelcontextprotocol/sdk

### Data & Storage
- **Vector DB:** Weaviate Cloud
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js

### Development Tools
- **Testing:** Vitest, Jest
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode

