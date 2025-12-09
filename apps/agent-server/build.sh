#!/bin/bash
# Build script for Render deployment
# This ensures workspace packages are built before agent-server

set -e  # Exit on error

echo "🔨 Building ResearchOS Agent Server for Render..."

# Go to repository root
cd ../..

echo "📦 Installing all workspace dependencies..."
npm install

echo "🏗️  Building workspace packages..."
# Build packages that agent-server depends on
cd packages/agents && npm run build && cd ../..
cd packages/mcp-connectors && npm run build && cd ../.. || echo "mcp-connectors build skipped"
cd packages/core && npm run build && cd ../.. || echo "core build skipped"

echo "🚀 Building agent-server..."
cd apps/agent-server
npm run build

echo "✅ Build complete!"

