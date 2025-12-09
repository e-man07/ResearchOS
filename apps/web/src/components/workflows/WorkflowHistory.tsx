'use client'

import { useState, useEffect } from 'react'
import { Clock, Trash2, MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface WorkflowHistoryItem {
  id: string
  query: string
  workflowType: string
  status: string
  agentsUsed: string[]
  executionTimeMs: number | null
  totalPapers: number
  chatSessionId: string | null
  createdAt: string
  completedAt: string | null
}

interface WorkflowHistoryProps {
  currentWorkflowId?: string | null
  onSelectWorkflow: (workflowId: string, query: string) => void
}

export default function WorkflowHistory({ currentWorkflowId, onSelectWorkflow }: WorkflowHistoryProps) {
  const [workflows, setWorkflows] = useState<WorkflowHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/v1/workflows/history')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data)
      }
    } catch (error) {
      console.error('Failed to load workflow history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Delete this workflow? This action cannot be undone.')) {
      return
    }

    setDeletingId(workflowId)
    try {
      const response = await fetch(`/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId))
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'RUNNING':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 border-green-200'
      case 'FAILED':
        return 'bg-red-50 border-red-200'
      case 'RUNNING':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    )
  }

  if (workflows.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-2">
          <Clock className="w-12 h-12 mx-auto mb-3" />
        </div>
        <p className="text-gray-600 font-medium">No workflow history yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Your executed workflows will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          onClick={() => onSelectWorkflow(workflow.id, workflow.query)}
          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
            currentWorkflowId === workflow.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Query */}
              <h3 className="font-medium text-gray-900 truncate mb-1">
                {workflow.query}
              </h3>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  {getStatusIcon(workflow.status)}
                  {workflow.status.toLowerCase()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(workflow.createdAt)}
                </span>
                {workflow.totalPapers > 0 && (
                  <span>{workflow.totalPapers} papers</span>
                )}
              </div>

              {/* Workflow Type & Agents */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                  {workflow.workflowType}
                </span>
                {workflow.chatSessionId && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={(e) => handleDelete(workflow.id, e)}
              disabled={deletingId === workflow.id}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              title="Delete workflow"
            >
              {deletingId === workflow.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
