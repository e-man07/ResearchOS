# ResearchOS

> An autonomous research copilot powered by AI agents and MCP connectors

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)

## Overview

ResearchOS is an autonomous research copilot that leverages:
- **ADK-TS** for multi-agent orchestration
- **Model Context Protocol (MCP)** for modular data connectors
- **Weaviate** for vector database and RAG
- **Multiple scientific APIs** (arXiv, Semantic Scholar, PubMed, GitHub, etc.)

## Features

- 🔍 **Autonomous Literature Reviews** - Search across multiple sources automatically
- 🤖 **Multi-Agent System** - Specialized agents for retrieval, synthesis, and writing
- 📊 **Advanced Analytics** - Citation graphs, trend analysis, and insights
- 📝 **Multiple Output Formats** - Reports (PDF/Markdown), slides (PPTX), notebooks (Jupyter)
- 🔔 **Monitoring & Alerts** - Track research trends and get notified of new papers
- 🔐 **Enterprise Ready** - Authentication, authorization, and audit logs

## Quick Start

### Prerequisites

- Node.js 20+ LTS
- pnpm 8+
- Docker Desktop (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/research-os.git
cd research-os

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development services
docker-compose up -d

# Run database migrations
pnpm --filter @research-os/api migrate

# Start development
pnpm dev
```

### Usage

#### CLI

```bash
# Search for papers
pnpm --filter @research-os/cli dev search "transformer models"

# Generate a report
pnpm --filter @research-os/cli dev report <search-id>

# List projects
pnpm --filter @research-os/cli dev projects list
```

#### API

```bash
# Start API server
pnpm --filter @research-os/api dev

# API will be available at http://localhost:3000
```

## Project Structure

```
research-os/
├── packages/
│   ├── core/                 # Core utilities and types
│   ├── mcp-connectors/       # MCP server implementations
│   ├── agents/               # ADK-TS agent implementations
│   ├── ingestion/            # Data ingestion pipeline
│   └── rag/                  # RAG implementation
├── apps/
│   ├── api/                  # REST API server
│   ├── web/                  # Next.js web UI (Phase 2)
│   └── cli/                  # CLI tool
├── infrastructure/
│   ├── docker/               # Docker configurations
│   ├── k8s/                  # Kubernetes manifests (Phase 3)
│   └── terraform/            # Infrastructure as code (Phase 3)
└── docs/                     # Documentation
```

## Architecture

### High-Level Architecture

```
User Interface (CLI/Web/API)
          ↓
ADK-TS Agent Core (Orchestrator, Retrieval, Synthesis, Writer)
          ↓
MCP Gateway (Router, Rate Limiter, Cache)
          ↓
MCP Connectors (arXiv, Semantic Scholar, PubMed, GitHub, etc.)
          ↓
Ingestion Pipeline (Fetch, Normalize, Chunk, Embed, Deduplicate)
          ↓
Storage (Weaviate Vector DB, PostgreSQL, Redis, S3)
          ↓
RAG Pipeline (Retrieve, Rerank, Generate)
          ↓
Output Generation (Reports, Slides, Notebooks, Alerts)
```

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

- [Phase 0: Foundation](./docs/PHASE_0_FOUNDATION.md)
- [Phase 1: MVP](./docs/PHASE_1_MVP.md)
- [Phase 2: V1](./docs/PHASE_2_V1.md)
- [Phase 3: Advanced](./docs/PHASE_3_ADVANCED.md)
- [Implementation Tracker](./IMPLEMENTATION_TRACKER.md)

## Technology Stack

- **Language:** TypeScript 5+
- **Runtime:** Node.js 20 LTS
- **Package Manager:** pnpm 8+
- **Agent Framework:** ADK-TS
- **MCP SDK:** @modelcontextprotocol/sdk
- **Vector DB:** Weaviate Cloud
- **Metadata DB:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Testing:** Vitest
- **Linting:** ESLint + Prettier

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Roadmap

### Phase 0: Foundation (Week 1-2) ✅ In Progress
- Project setup and infrastructure
- Core type definitions
- Development environment

### Phase 1: MVP (Week 3-8) 📋 Planned
- arXiv and Semantic Scholar connectors
- Basic agent orchestration
- CLI tool and report generation

### Phase 2: V1 (Week 9-20) 📋 Planned
- Additional connectors (PubMed, Crossref, GitHub)
- Web UI
- User authentication
- Scheduled monitoring

### Phase 3: Advanced (Week 21-32) 📋 Planned
- Advanced output formats
- Code analysis agent
- Multi-agent orchestration
- Performance optimization

## Support

- 📧 Email: support@research-os.dev
- 💬 Discord: [Join our community](https://discord.gg/research-os)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/research-os/issues)

## Acknowledgments

- [ADK-TS](https://github.com/IQAIcom/adk-ts) - Agent Development Kit
- [Model Context Protocol](https://github.com/modelcontextprotocol) - MCP Specification
- [Weaviate](https://weaviate.io/) - Vector Database
