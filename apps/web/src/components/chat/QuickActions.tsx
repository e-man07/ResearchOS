'use client'

import { FileText, Download, Sparkles, MessageSquare, Database } from 'lucide-react'

interface QuickActionsProps {
  type: 'search' | 'workflow' | 'index'
  papers?: any[]
  searchId?: string
  report?: string
  onIndex?: () => void
  onExport?: () => void
  onResearch?: (query: string) => void
}

export function QuickActions({
  type,
  papers = [],
  searchId,
  report,
  onIndex,
  onExport,
  onResearch,
}: QuickActionsProps) {
  if (type === 'search' && papers.length > 0) {
    return (
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
        <button
          onClick={onIndex}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          <Database className="w-4 h-4" />
          <span>Index These Papers</span>
        </button>
        {onResearch && (
          <button
            onClick={() => onResearch('')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Research Workflow</span>
          </button>
        )}
      </div>
    )
  }

  if (type === 'workflow' && report) {
    return (
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
        <button
          onClick={() => {
            const textarea = document.createElement('textarea')
            textarea.value = report
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            // You could add a toast notification here
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Copy Report</span>
        </button>
      </div>
    )
  }

  if (type === 'index') {
    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-white/60">
          Papers indexed! You can now ask questions about them.
        </p>
      </div>
    )
  }

  return null
}

