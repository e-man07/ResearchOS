# 🗄️ Database Migration Guide - Chat Feature

## Overview
This migration adds chat session functionality to ResearchOS.

---

## 📋 What Will Be Created

### New Tables:

1. **`chat_sessions`**
   - Stores chat sessions (one per search)
   - Links to searches
   - Tracks indexed papers

2. **`chat_messages`**
   - Stores conversation history
   - Links to chat sessions
   - Includes RAG context and token usage

3. **`MessageRole` Enum**
   - USER
   - ASSISTANT
   - SYSTEM

### Updated Tables:

1. **`searches`**
   - Added optional relationship to `chat_sessions`

---

## 🚀 Migration Steps

### Step 1: Create Migration
```bash
cd apps/web
npx prisma migrate dev --name add_chat_sessions
```

This will:
- Create migration SQL file
- Apply migration to database
- Regenerate Prisma Client

### Step 2: Verify Migration
```bash
npx prisma studio
```

Check that new tables exist:
- ✅ `chat_sessions`
- ✅ `chat_messages`

### Step 3: Test the Feature
```bash
npm run dev
```

Then:
1. Go to `/search`
2. Search for papers
3. Click "Index Papers & Start Chat"
4. Start chatting!

---

## 📊 Migration SQL Preview

```sql
-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "search_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "paper_ids" TEXT[],
    "paper_count" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "context_papers" TEXT[],
    "relevance_scores" JSONB,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_search_id_key" ON "chat_sessions"("search_id");

-- CreateIndex
CREATE INDEX "chat_sessions_search_id_idx" ON "chat_sessions"("search_id");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_search_id_fkey" 
    FOREIGN KEY ("search_id") REFERENCES "searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" 
    FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## ⚠️ Important Notes

### Database Requirements:
- PostgreSQL database
- Connection string in `.env` as `DATABASE_URL`

### Environment Variables Needed:
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI (for chat)
OPENAI_API_KEY="sk-..."

# Weaviate (for RAG)
WEAVIATE_URL="https://..."
WEAVIATE_API_KEY="..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
```

### Cascade Deletes:
- Deleting a search → Deletes chat session → Deletes all messages
- Deleting a chat session → Deletes all messages
- This is intentional to keep data clean

---

## 🧪 Testing Checklist

After migration, test:

- [ ] Search for papers
- [ ] Index papers (creates chat session)
- [ ] Send a message
- [ ] Receive AI response with sources
- [ ] Send follow-up question (tests memory)
- [ ] Switch between tabs
- [ ] Refresh page (tests session persistence)
- [ ] Search again (tests multiple sessions)

---

## 🔄 Rollback (if needed)

If something goes wrong:

```bash
# Rollback last migration
npx prisma migrate reset

# Or manually drop tables
psql $DATABASE_URL -c "DROP TABLE chat_messages CASCADE;"
psql $DATABASE_URL -c "DROP TABLE chat_sessions CASCADE;"
psql $DATABASE_URL -c "DROP TYPE MessageRole;"
```

---

## 📈 Database Size Estimate

### Per Chat Session:
- Session record: ~500 bytes
- Per message: ~1-2 KB (with context)
- 100 messages: ~100-200 KB

### Example:
- 10 searches with chat
- 50 messages per chat
- Total: ~5-10 MB

Very lightweight! 🎉

---

## 🚀 Production Deployment

### Before Deploying:

1. **Backup Database**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Run Migration on Production**
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify**
   ```bash
   npx prisma studio --browser none
   ```

### Vercel/Railway/Render:
- Migration runs automatically on deploy
- Set `DATABASE_URL` in environment variables
- Prisma generates client in postinstall

---

## ✅ Success Indicators

After migration, you should see:

```bash
✅ Migration applied successfully
✅ Prisma Client generated
✅ 2 new tables created
✅ 1 new enum created
✅ 4 indexes created
✅ 2 foreign keys created
```

---

## 🎉 You're Done!

After migration:
- Chat feature is fully functional
- Database is ready
- All APIs working
- UI integrated

**Start chatting with your papers!** 💬🎊
