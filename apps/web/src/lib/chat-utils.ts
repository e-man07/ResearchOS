/**
 * Chat utility functions
 */

export interface CreateChatSessionParams {
  searchId: string
  paperIds: string[]
}

export interface ChatSession {
  id: string
  searchId: string
  title: string
  description: string | null
  paperIds: string[]
  paperCount: number
  totalMessages: number
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Create or get existing chat session for a search
 */
export async function createOrGetChatSession(
  searchId: string,
  paperIds: string[]
): Promise<ChatSession> {
  // First, try to get existing session
  const existingResponse = await fetch(
    `/api/v1/chat/sessions?searchId=${searchId}`
  )

  if (existingResponse.ok) {
    return existingResponse.json()
  }

  // Create new session if it doesn't exist
  const createResponse = await fetch('/api/v1/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchId, paperIds }),
  })

  if (!createResponse.ok) {
    throw new Error('Failed to create chat session')
  }

  return createResponse.json()
}

/**
 * Index a paper and auto-create/update chat session
 */
export async function indexPaperWithChat(
  paperId: string,
  searchId?: string
): Promise<{ success: boolean; chunkCount: number }> {
  const response = await fetch(`/api/v1/papers/${paperId}/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to index paper')
  }

  const data = await response.json()
  return {
    success: true,
    chunkCount: data.chunkCount,
  }
}

/**
 * Index multiple papers and create chat session
 */
export async function indexPapersWithChat(
  paperIds: string[],
  searchId: string,
  onProgress?: (indexed: number, total: number) => void
): Promise<{
  indexed: number
  failed: number
  chatSessionId: string
}> {
  let indexed = 0
  let failed = 0

  // Index papers one by one
  for (let i = 0; i < paperIds.length; i++) {
    try {
      await indexPaperWithChat(paperIds[i], searchId)
      indexed++
      onProgress?.(indexed, paperIds.length)
    } catch (error) {
      console.error(`Failed to index paper ${paperIds[i]}:`, error)
      failed++
    }
  }

  // Get the chat session that was auto-created
  const session = await createOrGetChatSession(searchId, paperIds)

  return {
    indexed,
    failed,
    chatSessionId: session.id,
  }
}
