#!/bin/bash
# Build script for agent-server deployment
# Builds packages in dependency order

set -e  # Exit on error

echo "🔨 Building ResearchOS Agent Server..."

# Install all dependencies first
echo "📦 Installing dependencies..."
npm install

# Build in dependency order
echo "🏗️  Building core package..."
npm run build --workspace=packages/core

echo "🏗️  Building mcp-connectors package..."
npm run build --workspace=packages/mcp-connectors

echo "🏗️  Building rag package..."
npm run build --workspace=packages/rag

echo "🏗️  Building agents package..."
npm run build --workspace=packages/agents

echo "🚀 Building agent-server..."
npm run build --workspace=apps/agent-server

echo "✅ Build complete!"

