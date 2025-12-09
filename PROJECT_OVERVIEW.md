# ResearchOS - Complete Project Overview

> An autonomous research copilot powered by AI agents and MCP connectors

---


## 🎯 Problem Statement

### The Challenge
Researchers face multiple pain points in the modern research landscape:

1. **Information Overload**
   - Millions of papers published annually across multiple platforms
   - No unified search across arXiv, PubMed, Semantic Scholar, etc.
   - Manual citation tracking is time-consuming and error-prone

2. **Fragmented Workflow**
   - Switching between multiple platforms (arXiv, Semantic Scholar, PubMed)
   - Manual paper download and organization
   - No centralized knowledge management

3. **Limited Context & Discovery**
   - Traditional search lacks semantic understanding
   - Citation networks are hard to visualize
   - Missing connections between related research

4. **Time-Consuming Synthesis**
   - Reading dozens of papers to write literature reviews
   - Manual extraction of key findings
   - No automated summarization across sources

5. **Lack of Personalization**
   - No memory of past searches and preferences
   - No conversational interface for exploring research
   - No intelligent recommendations

---

## 💡 Solution

ResearchOS is an **autonomous research copilot** that solves these problems through:

### 1. **Unified Multi-Source Search**
- Single interface to search arXiv, Semantic Scholar, PubMed, and more
- Parallel queries with automatic result deduplication
- Smart ranking combining relevance, citations, and recency

### 2. **Intelligent Agent System**
- **Search Agent**: Retrieves papers from multiple sources
- **Synthesis Agent**: Analyzes and summarizes research
- **Report Writer Agent**: Generates comprehensive literature reviews
- **Orchestrator Agent**: Coordinates multi-agent workflows

### 3. **RAG-Powered Chat Interface**
- Chat with your indexed research papers
- Semantic search using vector embeddings
- Context-aware responses with citations
- Conversational exploration of research topics

### 4. **Automated Workflow Execution**
- One-click generation of research reports
- Automatic paper indexing with chunking and embedding
- Real-time progress tracking
- Export to Markdown with proper citations

### 5. **Persistent Knowledge Base**
- All papers indexed in Weaviate vector database
- Chunk-based retrieval for precise context
- User-specific paper collections
- Workflow history and results storage

---

## 🏗️ Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │  Dashboard   │  │   Chat UI    │      │
│  │   Web App    │  │   Workflows  │  │  RAG Search  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  /papers   │  │ /workflows │  │   /chat    │           │
│  │  /search   │  │  /history  │  │ /messages  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   ADK-TS Agent Server                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Orchestrator Agent (ADK-TS)               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │   Search    │→ │  Synthesis  │→ │   Report    │ │  │
│  │  │   Agent     │  │    Agent    │  │   Writer    │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      MCP Gateway Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   arXiv    │  │  Semantic  │  │  PubMed    │           │
│  │    MCP     │  │  Scholar   │  │    MCP     │           │
│  │  Server    │  │    MCP     │  │  Server    │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Ingestion & RAG Pipeline                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Fetch   │→ │  Chunk   │→ │  Embed   │→ │  Store   │  │
│  │  Paper   │  │  Text    │  │  (OpenAI)│  │ (Weaviate)│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Storage Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Weaviate    │  │  PostgreSQL  │  │    Redis     │     │
│  │  (Vectors)   │  │  (Metadata)  │  │   (Cache)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

#### **1. Frontend (Next.js 14)**
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + Lucide Icons
- **Authentication**: NextAuth.js with Google OAuth
- **State Management**: React hooks + server components
- **Key Pages**: Dashboard, Workflows, Search, Chat

#### **2. Backend API (Next.js API Routes)**
- RESTful API endpoints
- Server-side rendering for SEO
- API route handlers for CRUD operations
- Integration with agent server

#### **3. Agent Server (Express + ADK-TS)**
- Standalone Node.js server (Port 3001)
- Runs ADK-TS agents independently
- Handles long-running workflows
- Stream-based progress updates

#### **4. RAG Pipeline**
- **Text Chunking**: 512 tokens with 50-token overlap
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector Store**: Weaviate Cloud
- **Retrieval**: Semantic search with similarity threshold
- **Generation**: OpenAI GPT-4 with context injection

#### **5. Data Layer**
- **Weaviate**: Vector embeddings and semantic search
- **PostgreSQL**: User data, papers, workflows, chat sessions
- **Prisma ORM**: Type-safe database access

---

## 🛠️ Technology Stack

### **Core Technologies**
```
Language       : TypeScript 5.3+
Runtime        : Node.js 20 LTS
Package Mgr    : npm workspaces
Framework      : Next.js 14 (App Router)
```

### **Frontend Stack**
```
UI Framework   : React 18
Styling        : TailwindCSS 3.4
Icons          : Lucide React
Markdown       : react-markdown + remark-gfm
```

### **Backend Stack**
```
API Server     : Next.js API Routes
Agent Server   : Express.js
Authentication : NextAuth.js
ORM            : Prisma 5.8
Validation     : Zod
```

### **AI & Agent Stack**
```
Agent Framework: ADK-TS (@iqai/adk v0.5.0)
MCP SDK        : @modelcontextprotocol/sdk
LLM Provider   : OpenAI (GPT-4, GPT-3.5-turbo)
Embeddings     : OpenAI text-embedding-3-small
```

### **Data & Storage**
```
Vector DB      : Weaviate Cloud
Relational DB  : PostgreSQL 15+ (via Prisma)
Cache          : Redis 7+ (optional)
```

### **External APIs**
```
arXiv          : arXiv.org API
Semantic Scholar: Semantic Scholar API
PubMed         : NCBI Entrez API (future)
```

### **Development Tools**
```
Linting        : ESLint + Prettier
Testing        : Vitest, Jest
E2E Testing    : Playwright
Type Checking  : TypeScript strict mode
```

---

## 🤖 ADK-TS Integration

### What is ADK-TS?
**ADK (Agent Development Kit for TypeScript)** is a framework by IQAI for building multi-agent AI systems with:
- Agent orchestration and coordination
- Tool calling and function execution
- Memory management
- Streaming responses

### How We Use ADK-TS

#### **1. Agent Definitions**
```typescript
// packages/agents/src/adk/

SearchAgent extends ADKAgent
  - Tools: arxiv_search, semantic_scholar_search
  - Purpose: Retrieve papers from multiple sources
  - Output: Unified paper list

SynthesisAgent extends ADKAgent
  - Tools: analyze_papers, extract_themes
  - Purpose: Analyze and summarize papers
  - Output: Key findings and themes

ReportWriterAgent extends ADKAgent
  - Tools: generate_markdown, format_citations
  - Purpose: Write comprehensive reports
  - Output: Markdown report with citations

OrchestratorAgent extends ADKAgent
  - Coordinates: All sub-agents
  - Purpose: Manage workflow execution
  - Output: Complete research report
```

#### **2. Workflow Execution**
```typescript
// Agent Server: apps/agent-server/src/routes/research-workflow.ts

1. Receive workflow request (query, preferences)
2. Initialize OrchestratorAgent with ADK
3. OrchestratorAgent delegates to:
   a. SearchAgent → Fetch papers
   b. SynthesisAgent → Analyze papers
   c. ReportWriterAgent → Generate report
4. Stream progress updates to frontend
5. Save results to database
```

#### **3. Key ADK Features Used**
- **Multi-Agent Coordination**: Orchestrator manages sub-agents
- **Tool Integration**: Each agent has specific tools (MCP connectors)
- **Streaming**: Real-time progress updates via SSE
- **Context Management**: Agents share context across workflow
- **Error Handling**: Graceful failure and retry logic

#### **4. Agent Communication Flow**
```
User Query
    ↓
OrchestratorAgent (ADK)
    ↓
┌─────────────────────────────────┐
│  SearchAgent                    │
│  - Call arxiv MCP               │
│  - Call semantic_scholar MCP    │
│  - Deduplicate results          │
└─────────────────────────────────┘
    ↓ (Papers)
┌─────────────────────────────────┐
│  SynthesisAgent                 │
│  - Analyze abstracts            │
│  - Extract key themes           │
│  - Identify trends              │
└─────────────────────────────────┘
    ↓ (Analysis)
┌─────────────────────────────────┐
│  ReportWriterAgent              │
│  - Structure report             │
│  - Generate sections            │
│  - Format citations             │
└─────────────────────────────────┘
    ↓
Final Report (Markdown)
```

---

## 🔌 MCP Connectors

### What is MCP?
**Model Context Protocol (MCP)** is a standard by Anthropic for:
- Connecting LLMs to external data sources
- Tool-based interactions
- Standardized resource access

### Our MCP Implementations

#### **1. arXiv MCP Server**
```typescript
// packages/mcp-connectors/src/arxiv/

Resources:
  - arxiv://search       → Search papers
  - arxiv://paper/{id}   → Get paper details

Tools:
  - arxiv_search(query, max_results)
  - arxiv_get_paper(arxiv_id)
  - arxiv_get_pdf(arxiv_id)

Features:
  - Query parsing and optimization
  - Result normalization
  - PDF download support
  - Metadata extraction
```

#### **2. Semantic Scholar MCP Server**
```typescript
// packages/mcp-connectors/src/semantic-scholar/

Resources:
  - s2://search          → Search papers
  - s2://paper/{id}      → Get paper + citations
  - s2://author/{id}     → Get author info

Tools:
  - s2_search(query, filters)
  - s2_get_paper(paper_id)
  - s2_get_citations(paper_id)
  - s2_get_references(paper_id)

Features:
  - Citation graph traversal
  - Author disambiguation
  - Venue information
  - Impact metrics
```

#### **3. Future MCP Connectors**
- **PubMed MCP**: Medical literature search
- **Crossref MCP**: DOI resolution and metadata
- **GitHub MCP**: Code repository analysis

### MCP Integration Pattern
```typescript
1. MCP Server exposes tools via stdio
2. ADK Agent discovers available tools
3. Agent calls tools during workflow
4. MCP Server returns structured data
5. Agent processes and uses results
```

---

## ✨ Key Features

### **1. Workflow Management**
- Create research workflows with natural language queries
- Real-time progress tracking with agent status
- View complete workflow history
- Re-run workflows with different parameters
- Export reports to Markdown

### **2. Paper Search & Indexing**
- Multi-source search (arXiv, Semantic Scholar)
- Automatic deduplication
- Manual paper indexing for RAG
- View indexed paper library
- Track paper usage across workflows

### **3. RAG-Powered Chat**
- Chat with indexed papers from workflows
- Semantic search with vector embeddings
- Context-aware responses with citations
- View paper sources for each response
- Persistent chat history

### **4. Dashboard & Analytics**
- View all workflows, searches, and indexed papers
- Stats: Total workflows, papers, chat sessions
- Quick actions for common tasks
- Filter by status and date

### **5. Authentication & Security**
- Google OAuth via NextAuth.js
- Secure session management
- User-specific data isolation
- API authentication

---

## 📊 System Diagrams

### Data Flow Diagram
```
┌──────────┐
│   User   │
└────┬─────┘
     │ "artificial intelligence research"
     ↓
┌────────────────────┐
│  Next.js Web App   │
│  (Port 3000)       │
└────────┬───────────┘
         │ POST /api/workflows
         ↓
┌────────────────────┐
│  API Route Handler │
│  workflows/route   │
└────────┬───────────┘
         │ HTTP POST
         ↓
┌────────────────────────────┐
│  Agent Server (Port 3001)  │
│  ┌──────────────────────┐  │
│  │ OrchestratorAgent    │  │
│  │   (ADK-TS)           │  │
│  └──────────────────────┘  │
└────────┬───────────────────┘
         │ Delegates
         ↓
┌─────────────────────────────┐
│      SearchAgent            │
│  ┌────────┐  ┌────────┐    │
│  │ arXiv  │  │   S2   │    │
│  │  MCP   │  │  MCP   │    │
│  └────────┘  └────────┘    │
└──────────┬──────────────────┘
           │ Returns papers
           ↓
┌──────────────────────────────┐
│    SynthesisAgent            │
│  Analyzes papers with GPT-4  │
└──────────┬───────────────────┘
           │ Returns analysis
           ↓
┌──────────────────────────────┐
│   ReportWriterAgent          │
│  Generates Markdown report   │
└──────────┬───────────────────┘
           │ Returns report
           ↓
┌──────────────────────────────┐
│   Save to PostgreSQL         │
│   - WorkflowExecution        │
│   - Papers                   │
│   - Report                   │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│   Index Papers in Weaviate   │
│   - Chunk text               │
│   - Generate embeddings      │
│   - Store vectors            │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│   Return to User             │
│   - Display report           │
│   - Enable chat              │
└──────────────────────────────┘
```

### RAG Chat Flow
```
User Message: "What are the key findings?"
           ↓
┌──────────────────────────────┐
│  Chat API Route              │
│  /api/v1/chat/[id]/messages  │
└──────────┬───────────────────┘
           │ 1. Get session papers
           ↓
┌──────────────────────────────┐
│  RAG Pipeline                │
│  ┌────────────────────────┐  │
│  │ Generate query embedding│  │
│  │ (OpenAI)               │  │
│  └────────────────────────┘  │
└──────────┬───────────────────┘
           │ 2. Search vectors
           ↓
┌──────────────────────────────┐
│  Weaviate Vector Store       │
│  - Similarity search         │
│  - Filter by paper IDs       │
│  - Return top chunks         │
└──────────┬───────────────────┘
           │ 3. Relevant chunks
           ↓
┌──────────────────────────────┐
│  Context Assembly            │
│  - Format chunks             │
│  - Add metadata              │
│  - Build prompt              │
└──────────┬───────────────────┘
           │ 4. Prompt + context
           ↓
┌──────────────────────────────┐
│  OpenAI GPT-4                │
│  - Generate response         │
│  - Include citations         │
└──────────┬───────────────────┘
           │ 5. AI response
           ↓
┌──────────────────────────────┐
│  Save & Return               │
│  - Store message in DB       │
│  - Return with sources       │
└──────────────────────────────┘
```



## 🎯 Conclusion

### What We've Built
ResearchOS is a **production-ready autonomous research copilot** that combines:
- **Multi-agent orchestration** via ADK-TS
- **Modular data access** via MCP connectors
- **Semantic search** via Weaviate RAG
- **Modern web interface** via Next.js 14
- **Conversational AI** for exploring research

### Key Achievements
✅ **Unified Search**: Single interface for multiple research platforms  
✅ **Intelligent Automation**: AI agents handle complex workflows  
✅ **RAG Integration**: Chat with indexed research papers  
✅ **Full-Stack Application**: Frontend + Backend + Agents  
✅ **Scalable Architecture**: Modular, maintainable, extensible  

### Technical Innovations
1. **ADK-TS Multi-Agent System**: Coordinated agents for complex research tasks
2. **MCP Connector Pattern**: Standardized integration with external APIs
3. **Hybrid Architecture**: Next.js + Express for optimal performance
4. **RAG Pipeline**: Context-aware chat with vector embeddings
5. **Workflow Memory**: Persistent knowledge base across sessions

