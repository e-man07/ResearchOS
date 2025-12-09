'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to chat with a message about search
    router.replace('/chat')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Redirecting to AI Assistant...</span>
      </div>
    </div>
  )
}
