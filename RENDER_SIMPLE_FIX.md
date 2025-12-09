# Simple Render Deployment Fix

## The Problem

The monorepo structure requires building packages in dependency order:
1. `core` (no dependencies)
2. `mcp-connectors` (depends on core)
3. `rag` (depends on core)  
4. `agents` (depends on core, mcp-connectors, rag)
5. `agent-server` (depends on agents)

## Simple Solution

I've created a build script that handles everything. Use these settings in Render:

### Render Configuration

1. **Root Directory**: Leave EMPTY (deploy from repo root)
2. **Build Command**: 
   ```bash
   bash build-agent-server.sh
   ```
3. **Start Command**: 
   ```bash
   cd apps/agent-server && node dist/index.js
   ```

That's it! The build script handles all the complexity.

## What the Build Script Does

The `build-agent-server.sh` script:
1. Installs all npm dependencies (including workspace packages)
2. Builds packages in correct dependency order:
   - core → mcp-connectors → rag → agents → agent-server
3. Ensures each package is built before its dependents

## Alternative: Manual Build Command

If you prefer not to use the script, use this build command:

```bash
npm install && npm run build --workspace=packages/core && npm run build --workspace=packages/mcp-connectors && npm run build --workspace=packages/rag && npm run build --workspace=packages/agents && npm run build --workspace=apps/agent-server
```

But the script is cleaner and easier to maintain.

## Quick Steps

1. In Render dashboard → Your Service → Settings
2. **Root Directory**: (leave empty/blank)
3. **Build Command**: `bash build-agent-server.sh`
4. **Start Command**: `cd apps/agent-server && node dist/index.js`
5. Save and deploy

This should work! 🚀

