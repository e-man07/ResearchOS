#!/bin/bash

# ResearchOS - Clean Repository Script
# This script removes git history and reinitializes the repo

echo "🧹 Cleaning ResearchOS Repository..."

# Step 1: Remove current git
echo "📦 Step 1: Removing current git repository..."
rm -rf .git
echo "✅ Git removed"

# Step 2: Remove build artifacts and caches
echo "🗑️  Step 2: Removing build artifacts..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find . -name "build" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null
echo "✅ Build artifacts removed"

# Step 3: Remove node_modules caches
echo "🗑️  Step 3: Cleaning node_modules caches..."
find . -path "*/node_modules/.cache" -type d -exec rm -rf {} + 2>/dev/null
echo "✅ Caches cleaned"

# Step 4: Initialize new git repository
echo "🔧 Step 4: Initializing new git repository..."
git init
echo "✅ Git initialized"

# Step 5: Add all files
echo "📝 Step 5: Adding files to git..."
git add .
echo "✅ Files added"

# Step 6: Create initial commit
echo "💾 Step 6: Creating initial commit..."
git commit -m "🚀 Initial commit - ResearchOS

ResearchOS: AI-Powered Research Operating System

Features:
- 🔍 Multi-source search (arXiv + Semantic Scholar)
- 💬 RAG-powered Q&A with GPT-4o
- ✨ Multi-agent research workflows
- 📊 Vector search with Weaviate
- 🎨 Beautiful, modern UI

Tech Stack:
- Next.js 14, React 18, TypeScript
- Weaviate, OpenAI, Prisma
- ADK-TS, MCP Connectors
- TailwindCSS, react-markdown

Built for hackathon submission 🏆"
echo "✅ Initial commit created"

# Step 7: Show status
echo ""
echo "📊 Repository Status:"
git log --oneline -1
echo ""
git status --short | head -10
echo ""

echo "✨ Repository cleaned and reinitialized!"
echo ""
echo "📝 Next steps:"
echo "1. Add your remote: git remote add origin <your-repo-url>"
echo "2. Push to remote: git push -u origin main"
echo ""
echo "🎉 Done!"
