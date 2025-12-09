# @research-os/rag

RAG (Retrieval-Augmented Generation) implementation for ResearchOS.

## Components

- **Retriever** - Hybrid search (BM25 + vector similarity)
- **Reranker** - Cross-encoder reranking
- **Context Builder** - Assembles context for LLM
- **Generator** - LLM-based generation

## Usage

```typescript
import { RAGPipeline } from '@research-os/rag'

const rag = new RAGPipeline({
  vectorDB: weaviateClient,
  model: 'gpt-4-turbo',
})

const answer = await rag.query('What are the latest advances in transformers?')
```

## Features

- Hybrid search (keyword + semantic)
- Metadata filtering
- Result diversity (MMR)
- Citation tracking
- Confidence scores
