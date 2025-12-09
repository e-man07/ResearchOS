# @research-os/core

Core utilities, types, and schemas for ResearchOS.

## Features

- **Type Definitions**: Comprehensive TypeScript types for all entities
- **Zod Schemas**: Runtime validation schemas
- **Utilities**: Shared utility functions
- **Configuration**: Configuration management

## Usage

```typescript
import { PaperSchema, type Paper } from '@research-os/core'

// Validate paper data
const paper = PaperSchema.parse(rawData)
```

## Exports

- `types/` - TypeScript type definitions
- `schemas/` - Zod validation schemas
- `utils/` - Utility functions
- `config/` - Configuration management
