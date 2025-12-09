# 🧹 Code Cleanup Report - ResearchOS

## 📊 Audit Summary

**Total Files:** 203 TypeScript/JavaScript files  
**Packages:** 5 (core, rag, mcp-connectors, agents, ingestion)  
**Apps:** 2 (web, agent-server)

---

## ❌ UNNECESSARY FILES TO REMOVE

### **1. Unused API Routes** (Not Used in UI)

```bash
# Remove these files - they're not connected to any UI
rm apps/web/src/app/api/v1/searches/route.ts
rm apps/web/src/app/api/v1/searches/[id]/route.ts
rm apps/web/src/app/api/v1/reports/[searchId]/route.ts
```

**Reason:**
- `/api/v1/searches` - Creates search records in DB, but UI doesn't use this
- Dashboard page tries to fetch from it, but it's not functional
- Reports API is a stub with TODO comments
- No actual functionality implemented

### **2. Dashboard Page** (Incomplete/Not Used)

```bash
# Remove dashboard - it's not linked anywhere and incomplete
rm -rf apps/web/src/app/dashboard/
```

**Reason:**
- Not linked in navigation
- Depends on unused `/api/v1/searches` endpoint
- Has hardcoded `temp-user-id` 
- Not part of core workflow (Search → RAG → Workflows)
- Adds unnecessary complexity

### **3. Unused Components**

```bash
# Check if these are actually used
apps/web/src/components/search/SearchForm.tsx
apps/web/src/components/search/SearchResults.tsx
apps/web/src/components/search/PaperDetailModal.tsx
```

**Status:** Keep for now (used in search page)

---

## ⚠️ UNUSED DEPENDENCIES TO REMOVE

### **apps/web/package.json**

#### **Remove:**
```json
{
  "@research-os/ingestion": "*",  // Only used once, can inline
  "@research-os/agents": "*",      // Not used in web app (used in agent-server)
}
```

#### **Testing Dependencies (Not Set Up):**
```json
{
  "@playwright/test": "^1.40.1",           // No tests exist
  "@testing-library/jest-dom": "^6.1.5",   // No tests exist
  "@testing-library/react": "^14.1.2",     // No tests exist
  "jest": "^29.7.0",                       // No tests exist
  "jest-environment-jsdom": "^29.7.0"      // No tests exist
}
```

**Decision:** 
- Remove if not planning to add tests before submission
- Keep if you'll add tests

---

## 🔧 ROOT PACKAGE.JSON CLEANUP

### **Remove Unused Dev Dependencies:**

```json
{
  "husky": "^8.0.3",           // No git hooks configured
  "lint-staged": "^15.2.0",    // No git hooks configured
  "vitest": "^1.1.0"           // No tests exist
}
```

---

## 📦 PACKAGE ANALYSIS

### **packages/ingestion/**
```
Status: ⚠️ BARELY USED
Files: 3 (chunker.ts, fetcher.ts, index.ts)
Usage: Only chunker.ts used in RAG package
Recommendation: Inline chunker.ts into RAG package, delete package
```

### **packages/agents/**
```
Status: ✅ USED (in agent-server)
Files: 9 agent files
Usage: Used by apps/agent-server
Recommendation: KEEP
```

### **packages/core/**
```
Status: ✅ USED
Usage: Shared types across packages
Recommendation: KEEP
```

### **packages/rag/**
```
Status: ✅ USED
Usage: Core RAG functionality
Recommendation: KEEP
```

### **packages/mcp-connectors/**
```
Status: ✅ USED
Usage: arXiv and Semantic Scholar connectors
Recommendation: KEEP
```

---

## 🗑️ FILES WITH TODO/INCOMPLETE CODE

### **1. apps/web/src/app/api/v1/reports/[searchId]/route.ts**
```typescript
// TODO: Implement actual report generation using agents
```
**Action:** DELETE (not used)

### **2. apps/web/src/app/api/v1/searches/route.ts**
```typescript
// TODO: Get userId from session
const userId = 'temp-user-id'
```
**Action:** DELETE (not used)

### **3. apps/web/src/app/dashboard/page.tsx**
- Uses hardcoded temp user
- Fetches from unused API
**Action:** DELETE

---

## 📋 CLEANUP CHECKLIST

### **Phase 1: Remove Unused Files**
```bash
# Remove unused API routes
rm apps/web/src/app/api/v1/searches/route.ts
rm apps/web/src/app/api/v1/searches/[id]/route.ts
rm apps/web/src/app/api/v1/reports/[searchId]/route.ts

# Remove dashboard
rm -rf apps/web/src/app/dashboard/

# Remove ingestion package (inline chunker into RAG)
# (Manual step - move chunker.ts to packages/rag/src/)
```

### **Phase 2: Clean Dependencies**

**apps/web/package.json:**
```bash
npm uninstall @research-os/ingestion @research-os/agents
npm uninstall @playwright/test @testing-library/jest-dom @testing-library/react jest jest-environment-jsdom
```

**Root package.json:**
```bash
npm uninstall husky lint-staged vitest
```

### **Phase 3: Clean Prisma Schema**

Remove unused models if dashboard is deleted:
```prisma
// Check if Search model is used elsewhere
// If not, remove it from schema.prisma
```

---

## ✅ KEEP THESE (ACTIVELY USED)

### **Core Features:**
- ✅ `/search` page + API
- ✅ `/rag` page + API  
- ✅ `/workflows` page + API
- ✅ Authentication (signin, register, error)
- ✅ Home page
- ✅ Layout & Navbar

### **Components:**
- ✅ `search/` - PaperCard, SearchForm, SearchResults, PaperDetailModal
- ✅ `markdown/` - MarkdownRenderer
- ✅ `workflows/` - AgentProgress
- ✅ `layout/` - Navbar
- ✅ `providers/` - SessionProvider

### **API Routes:**
- ✅ `/api/auth/` - Authentication
- ✅ `/api/v1/papers/search` - Multi-source search
- ✅ `/api/v1/papers/[paperId]/index` - RAG indexing
- ✅ `/api/v1/rag/ask` - Q&A
- ✅ `/api/v1/rag/debug` - Debug info
- ✅ `/api/v1/workflows/research` - Workflow execution
- ✅ `/api/health` - Health check
- ✅ `/api/setup` - Initial setup

### **Packages:**
- ✅ `@research-os/core` - Shared types
- ✅ `@research-os/rag` - RAG pipeline
- ✅ `@research-os/mcp-connectors` - API connectors
- ✅ `@research-os/agents` - Agent logic (for agent-server)

---

## 📊 SIZE REDUCTION ESTIMATE

### **Before Cleanup:**
- Files: 203
- Dependencies: ~50
- Unused code: ~15%

### **After Cleanup:**
- Files: ~190 (-13)
- Dependencies: ~40 (-10)
- Unused code: ~0%

### **Benefits:**
- ✅ Smaller bundle size
- ✅ Faster builds
- ✅ Cleaner codebase
- ✅ Easier to understand
- ✅ No confusing unused features

---

## 🚀 RECOMMENDED CLEANUP SCRIPT

```bash
#!/bin/bash

echo "🧹 Cleaning ResearchOS codebase..."

# 1. Remove unused API routes
echo "📁 Removing unused API routes..."
rm -f apps/web/src/app/api/v1/searches/route.ts
rm -f apps/web/src/app/api/v1/searches/\[id\]/route.ts
rm -f apps/web/src/app/api/v1/reports/\[searchId\]/route.ts
rm -rf apps/web/src/app/api/v1/searches/
rm -rf apps/web/src/app/api/v1/reports/

# 2. Remove dashboard
echo "📁 Removing unused dashboard..."
rm -rf apps/web/src/app/dashboard/

# 3. Clean web dependencies
echo "📦 Cleaning web app dependencies..."
cd apps/web
npm uninstall @research-os/ingestion @research-os/agents
npm uninstall @playwright/test @testing-library/jest-dom @testing-library/react jest jest-environment-jsdom
cd ../..

# 4. Clean root dependencies
echo "📦 Cleaning root dependencies..."
npm uninstall husky lint-staged vitest

# 5. Rebuild
echo "🔨 Rebuilding..."
npm run build

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "- Removed unused API routes"
echo "- Removed dashboard page"
echo "- Removed 10+ unused dependencies"
echo "- Codebase is now cleaner and leaner!"
```

---

## ⚠️ OPTIONAL CLEANUP (Consider)

### **1. Remove Prisma Models**

If dashboard is deleted, check if these are used:
```prisma
model Search {
  // Used by deleted dashboard
  // Check if used elsewhere before removing
}

model Project {
  // Not used anywhere
  // Safe to remove
}
```

### **2. Simplify Authentication**

Current setup has:
- Email/password registration
- Credentials provider
- Database sessions

**For hackathon, could simplify to:**
- Just demo mode (no auth)
- Or simple API key

**Decision:** Keep for now (shows full-stack capability)

---

## 🎯 FINAL RECOMMENDATION

### **Immediate Actions (Before Submission):**

1. ✅ **Remove unused files** (dashboard, unused API routes)
2. ✅ **Remove test dependencies** (no tests exist)
3. ✅ **Remove git hook tools** (husky, lint-staged)
4. ✅ **Update .gitignore** (already done)
5. ✅ **Rebuild and verify** everything still works

### **Keep for Future:**
- Authentication system (shows capability)
- All working features (search, RAG, workflows)
- Core packages
- Documentation

### **Size Impact:**
- **Before:** ~500MB with node_modules
- **After:** ~450MB (-10%)
- **Git repo:** ~5-8MB (clean)

---

## 📝 VERIFICATION STEPS

After cleanup:

```bash
# 1. Verify build works
npm run build

# 2. Verify dev works
npm run dev

# 3. Test all features
# - Search works
# - RAG Q&A works
# - Workflows work
# - Auth works

# 4. Check bundle size
cd apps/web && npm run build
# Look for "First Load JS" sizes

# 5. Verify git status
git status
# Should not show deleted files if committed
```

---

## ✅ CONCLUSION

**Total Cleanup:**
- 🗑️ 3 unused API route files
- 🗑️ 1 unused dashboard page
- 🗑️ 10+ unused dependencies
- 🗑️ 1 barely-used package (ingestion)

**Result:**
- ✨ Cleaner codebase
- 🚀 Faster builds
- 📦 Smaller bundle
- 🎯 Focus on core features

**Ready for hackathon submission!** 🏆
