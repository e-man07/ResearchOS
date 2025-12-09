# Render Build Fix

## The Problem

Render is trying to build `agent-server` without first building the workspace packages it depends on (`@research-os/agents`, `@research-os/mcp-connectors`, `@research-os/core`).

## Solution: Updated Build Command

In your Render dashboard, update the **Build Command** to:

```bash
cd ../.. && npm install && cd packages/agents && npm run build && cd ../.. && cd packages/mcp-connectors && npm run build && cd ../.. && cd packages/core && npm run build && cd ../.. && cd apps/agent-server && npm run build
```

Or use the simpler version (if packages don't need building):

```bash
cd ../.. && npm install && npm run build --workspace=packages/agents && npm run build --workspace=apps/agent-server
```

## Alternative: Use the Build Script

I've created `apps/agent-server/build.sh` which handles everything. Update your Render Build Command to:

```bash
cd ../.. && bash apps/agent-server/build.sh
```

## Step-by-Step Fix

1. Go to Render dashboard
2. Click on your service
3. Go to **Settings** → **Build & Deploy**
4. Update **Build Command** to one of the options above
5. Click **Save Changes**
6. Go to **Manual Deploy** → **Deploy latest commit**

## What the Build Command Does

1. `cd ../..` - Goes to repository root
2. `npm install` - Installs all workspace dependencies
3. `cd packages/agents && npm run build` - Builds the agents package
4. `cd ../.. && cd packages/mcp-connectors && npm run build` - Builds mcp-connectors
5. `cd ../.. && cd packages/core && npm run build` - Builds core package
6. `cd ../.. && cd apps/agent-server && npm run build` - Finally builds agent-server

This ensures all workspace packages are built and available before agent-server tries to import them.

