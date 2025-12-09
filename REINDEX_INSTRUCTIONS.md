# 🔄 Re-Index Papers Instructions

**Problem:** Previously indexed papers don't have the `paper_title` metadata, so RAG Q&A can't find them.

**Solution:** Re-index your papers with the updated indexing code that includes metadata.

---

## 🚀 Quick Fix

### **Option 1: Delete and Re-Index (Recommended)**

1. **Clear Weaviate** (delete all chunks):
   - Go to your Weaviate Cloud Console
   - Or use the reset endpoint (if available)

2. **Clear Database Chunks**:
   ```sql
   -- In your PostgreSQL database
   DELETE FROM "Chunk";
   ```

3. **Re-Index Papers**:
   - Go to http://localhost:3000/search
   - Search for papers
   - Click on each paper
   - Click "Index with RAG" again
   - Wait ~15 seconds per paper

### **Option 2: Use Prisma Studio**

```bash
cd apps/web
npx prisma studio
```

Then:
1. Open the `Chunk` table
2. Delete all records
3. Re-index papers from the UI

### **Option 3: Quick SQL Command**

```bash
# Connect to your database
psql $DATABASE_URL

# Delete all chunks
DELETE FROM "Chunk";

# Exit
\q
```

Then re-index papers from the search page.

---

## ✅ What Changed

### **Before (No Metadata)**
```typescript
{
  content: "...",
  paperId: "123",
  metadata: {}  // ❌ Empty!
}
```

### **After (With Metadata)**
```typescript
{
  content: "...",
  paperId: "123",
  metadata: {
    paper_id: "123",
    paper_title: "Attention Is All You Need",  // ✅ Now included!
    paper_year: 2017,
    paper_venue: "NeurIPS",
    paper_arxiv_id: "1706.03762"
  }
}
```

---

## 🧪 Test After Re-Indexing

1. **Index a paper:**
   - Search "attention mechanisms"
   - Click "Attention Is All You Need"
   - Click "Index with RAG"
   - Wait for success message

2. **Ask a question:**
   - Go to http://localhost:3000/rag
   - Ask: "What are attention mechanisms?"
   - Should now get an answer! ✅

3. **Check sources:**
   - Answer should include paper title
   - Sources should show relevance scores
   - Content previews should be visible

---

## 🔍 Verify It's Working

### **Check Logs:**
Look for these in your terminal:
```
🤔 RAG Question: what are attention mechanisms?
🔍 Searching for relevant content...
✅ Found 3 relevant chunks
🤖 Generating answer...
✅ Answer generated
```

### **Check Response:**
Should return:
```json
{
  "answer": "Attention mechanisms are...",
  "sources": [
    {
      "paperId": "...",
      "title": "Attention Is All You Need",  // ✅ Title present!
      "content": "...",
      "score": 0.85
    }
  ]
}
```

---

## 🎯 Why This Happened

1. **Initial Implementation:** Chunks were created without paper metadata
2. **Vector Search:** Could find chunks, but couldn't extract paper titles
3. **Result:** RAG pipeline couldn't build proper context
4. **Fix:** Added metadata during indexing

---

## 📝 Prevention

Going forward, all new papers will automatically include metadata when indexed. You only need to re-index papers that were indexed before this fix.

---

## 🆘 Still Not Working?

### **Debug Checklist:**

1. ✅ Papers are indexed (check database)
2. ✅ Weaviate has chunks (check count)
3. ✅ Metadata includes `paper_title`
4. ✅ Query embedding is generated
5. ✅ Vector search returns results
6. ✅ Scores are above threshold (0.7)

### **Check Weaviate:**
```bash
curl http://localhost:3000/api/v1/rag/debug
```

Should show:
```json
{
  "weaviate": {
    "healthy": true,
    "totalChunks": 10,  // > 0
    "url": "https://..."
  },
  "testSearch": {
    "resultsFound": 5  // > 0
  }
}
```

---

## ✅ Summary

**Action Required:** Re-index your papers to add metadata  
**Time:** ~15 seconds per paper  
**Result:** RAG Q&A will work perfectly! 🎉

**Steps:**
1. Delete old chunks (database + Weaviate)
2. Re-index papers from search page
3. Test Q&A feature
4. Enjoy! ✨
