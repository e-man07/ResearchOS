#!/bin/bash

# ResearchOS - Code Cleanup Script
# Removes unused files and dependencies

echo "🧹 Starting ResearchOS Code Cleanup..."
echo ""

# Confirm with user
read -p "This will remove unused files and dependencies. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo "📋 Cleanup Plan:"
echo "  - Remove unused API routes (searches, reports)"
echo "  - Remove dashboard page"
echo "  - Remove unused dependencies"
echo ""

# 1. Remove unused API routes
echo "🗑️  Step 1: Removing unused API routes..."
rm -rf apps/web/src/app/api/v1/searches/
rm -rf apps/web/src/app/api/v1/reports/
echo "✅ Removed unused API routes"

# 2. Remove dashboard
echo "🗑️  Step 2: Removing unused dashboard..."
rm -rf apps/web/src/app/dashboard/
echo "✅ Removed dashboard page"

# 3. Clean web dependencies
echo "📦 Step 3: Cleaning web app dependencies..."
cd apps/web

# Remove unused internal packages
npm uninstall @research-os/ingestion @research-os/agents 2>/dev/null

# Remove unused testing dependencies
npm uninstall @playwright/test @testing-library/jest-dom @testing-library/react jest jest-environment-jsdom 2>/dev/null

cd ../..
echo "✅ Cleaned web dependencies"

# 4. Clean root dependencies
echo "📦 Step 4: Cleaning root dependencies..."
npm uninstall husky lint-staged vitest 2>/dev/null
echo "✅ Cleaned root dependencies"

# 5. Remove ingestion package (barely used)
echo "🗑️  Step 5: Removing barely-used ingestion package..."
# First, inline the chunker into RAG package
if [ -f "packages/ingestion/src/chunker.ts" ]; then
    echo "⚠️  Note: chunker.ts from ingestion package should be moved to RAG package"
    echo "   Manual step required after cleanup"
fi
# Don't delete yet - needs manual migration
echo "⚠️  Ingestion package kept for now (needs manual migration)"

# 6. Clean build artifacts
echo "🧹 Step 6: Cleaning build artifacts..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.tsbuildinfo" -delete 2>/dev/null
echo "✅ Build artifacts cleaned"

# 7. Verify structure
echo ""
echo "📊 Cleanup Summary:"
echo "  ✅ Removed unused API routes"
echo "  ✅ Removed dashboard page"
echo "  ✅ Removed 10+ unused dependencies"
echo "  ✅ Cleaned build artifacts"
echo ""

# 8. Show git status
echo "📝 Git Status:"
git status --short | head -20
echo ""

# 9. Next steps
echo "🎯 Next Steps:"
echo "  1. Review changes: git status"
echo "  2. Test the app: npm run dev"
echo "  3. Rebuild: npm run build"
echo "  4. Commit changes: git add . && git commit -m 'chore: code cleanup'"
echo ""

echo "✨ Cleanup complete!"
echo ""
echo "⚠️  Manual Steps Required:"
echo "  - Move packages/ingestion/src/chunker.ts to packages/rag/src/"
echo "  - Update imports in RAG package"
echo "  - Then delete packages/ingestion/"
echo ""
