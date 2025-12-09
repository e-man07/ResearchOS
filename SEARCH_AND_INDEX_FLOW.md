# 🔍 Search & Index Flow - ResearchOS

**Last Updated:** October 22, 2025

---

## 📊 System Architecture

ResearchOS has **two search modes**:

### **Mode 1: Direct MCP Search** (Fast)
- Direct calls to MCP connectors
- No AI agent overhead
- Quick results
- Good for simple searches

### **Mode 2: ADK-TS Agent Search** (Intelligent)
- Uses Search Agent with reasoning
- Better deduplication and ranking
- Can analyze and filter results
- Slower but smarter

---

## 🔄 Complete Flow

### **1. User Searches for Papers**

**Page:** `/search`

**User Actions:**
1. Toggle ADK-TS mode (ON/OFF)
2. Enter search query
3. Select sources (arXiv, Semantic Scholar)
4. Set filters (year range, max results)
5. Click "Search Papers"

---

### **2A. Direct MCP Search Flow** (ADK OFF)

```
User Query
    ↓
/api/v1/papers/search
    ↓
ArxivMCPServer.searchPapers()
SemanticScholarMCPServer.searchPapers()
    ↓
Combine & Deduplicate
    ↓
Save to PostgreSQL (papers table)
    ↓
Return to Frontend
    ↓
Display in PaperCard components
```

**Database Tables Updated:**
- `papers` - Paper metadata
- `searches` - Search history

**Time:** ~2-5 seconds

---

### **2B. ADK-TS Agent Search Flow** (ADK ON)

```
User Query
    ↓
/api/v1/papers/search-adk
    ↓
Create ADK-TS Search Agent
    ↓
Agent.ask(searchPrompt)
    ↓
Agent uses tools:
  - search_arxiv
  - search_semantic_scholar
    ↓
Agent analyzes & ranks results
    ↓
Agent returns structured JSON
    ↓
Save to PostgreSQL (papers table)
    ↓
Return to Frontend
    ↓
Display in PaperCard components
```

**Database Tables Updated:**
- `papers` - Paper metadata
- `searches` - Search history

**Time:** ~5-15 seconds (slower due to AI reasoning)

**Advantages:**
- Better deduplication
- Intelligent ranking
- Can filter low-quality papers
- Provides reasoning for selections

---

### **3. User Clicks on a Paper**

```
Click Paper Card
    ↓
Open PaperDetailModal
    ↓
Display:
  - Full abstract
  - Authors
  - Metadata
  - Action buttons
```

---

### **4. User Clicks "Index with RAG"**

**This is where the magic happens!**

```
Click "Index with RAG" button
    ↓
POST /api/v1/papers/:paperId/index
    ↓
Get paper from PostgreSQL
    ↓
Check if already indexed
    ↓
If not indexed:
    ↓
    Initialize RAG Pipeline:
      - WeaviateVectorStore
      - EmbeddingService (OpenAI)
      - RAGPipeline
    ↓
    Chunk the paper:
      - TextChunker (512 tokens, 50 overlap)
      - Content: title + abstract
      - Creates ~5-10 chunks per paper
    ↓
    Generate embeddings:
      - OpenAI text-embedding-3-small
      - 1536 dimensions
      - One embedding per chunk
    ↓
    Save chunks to PostgreSQL:
      - chunks table
      - paperId, content, chunkIndex, metadata
    ↓
    Index in Weaviate:
      - Store vectors
      - Store metadata
      - Enable semantic search
    ↓
Return success
    ↓
Show "✅ Indexed" in modal
```

**Database Tables Updated:**
- `chunks` - Text chunks with metadata

**Vector Database Updated:**
- Weaviate - Embeddings + metadata

**Time:** ~10-20 seconds per paper

---

## 🗄️ Database Schema

### **papers** table
```sql
- id (UUID)
- title
- abstract
- year, month
- venue, publisher
- pdfUrl, htmlUrl
- topics[], keywords[], categories[]
- citations
- source, sourceId
- rawJson
- createdAt, updatedAt
```

### **chunks** table
```sql
- id (UUID)
- paperId (FK → papers.id)
- content (text)
- chunkIndex (int)
- section, sectionIndex, page
- embeddingModel
- metadata (JSON)
- createdAt, updatedAt
```

### **searches** table
```sql
- id (UUID)
- userId (FK → users.id)
- query
- filters (JSON)
- status (PENDING/RUNNING/COMPLETED/FAILED)
- totalResults
- createdAt, updatedAt
```

---

## 🧠 What Happens After Indexing?

Once papers are indexed, you can:

### **1. RAG Q&A** (`/rag`)
```
User asks: "What are attention mechanisms?"
    ↓
POST /api/v1/rag/ask
    ↓
Generate query embedding
    ↓
Search Weaviate for similar chunks
    ↓
Retrieve top 5 most relevant chunks
    ↓
Send to LLM with context
    ↓
Generate answer with citations
    ↓
Return to user
```

### **2. Research Workflows** (`/workflows`)
```
User query: "transformer models"
    ↓
POST /api/v1/workflows/research
    ↓
Multi-agent pipeline:
  1. Planner creates strategy
  2. Search finds papers
  3. Synthesis analyzes (uses indexed chunks!)
  4. Report generates deliverable
    ↓
Return comprehensive report
```

---

## 🎯 Key Differences

| Feature | Direct MCP | ADK-TS Agent |
|---------|-----------|--------------|
| **Speed** | Fast (2-5s) | Slower (5-15s) |
| **Intelligence** | Basic | Advanced |
| **Deduplication** | Simple | Smart |
| **Ranking** | Citation-based | AI-analyzed |
| **Filtering** | None | Quality checks |
| **Use Case** | Quick searches | Research workflows |

---

## 💡 Best Practices

### **When to use Direct MCP:**
- Quick exploratory searches
- Known specific papers
- Time-sensitive queries
- Simple keyword matching

### **When to use ADK-TS Agent:**
- Complex research questions
- Need quality filtering
- Want intelligent ranking
- Building on results (workflows)

### **When to index papers:**
- Want to ask questions about them
- Need for synthesis/reports
- Building knowledge base
- Long-term reference

---

## 🔮 Future Enhancements

1. **Auto-indexing** - Automatically index top N results
2. **Batch indexing** - Index multiple papers at once
3. **Smart caching** - Cache agent responses
4. **Incremental updates** - Update indexed papers
5. **Cross-paper analysis** - Find connections between papers

---

## 🐛 Troubleshooting

### **Papers not appearing?**
- Check console for errors
- Verify database connection
- Check if sources are rate-limited

### **Indexing fails?**
- Check Weaviate connection
- Verify OpenAI API key
- Check paper has abstract

### **Agent search slow?**
- Normal! AI reasoning takes time
- Use direct MCP for speed
- Consider caching results

---

**Your ResearchOS now has dual-mode search with intelligent indexing!** 🚀
