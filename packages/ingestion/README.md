# @research-os/ingestion

Data ingestion pipeline for processing research papers.

## Components

- **Fetcher** - Parallel paper fetching with rate limiting
- **Normalizer** - Schema normalization and validation
- **Chunker** - Semantic text splitting
- **Embedder** - Vector embedding generation
- **Deduplicator** - DOI and hash-based deduplication

## Usage

```typescript
import { IngestionPipeline } from '@research-os/ingestion'

const pipeline = new IngestionPipeline({
  chunkSize: 512,
  chunkOverlap: 50,
  embeddingModel: 'text-embedding-3-large',
})

const result = await pipeline.process(papers)
```

## Pipeline Flow

```
Papers → Fetch → Normalize → Chunk → Embed → Deduplicate → Store
```

## Features

- Parallel processing with concurrency control
- Exponential backoff retry logic
- Progress tracking
- Cost monitoring
- Error handling
