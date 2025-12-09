'use client'

import { Check, Loader2, Brain, Search, Lightbulb, FileText } from 'lucide-react'

export interface AgentStep {
  agent: 'planner' | 'search' | 'synthesis' | 'report'
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
  startTime?: number
  endTime?: number
}

interface AgentProgressProps {
  steps: AgentStep[]
}

const agentConfig = {
  planner: {
    icon: Brain,
    name: 'Planner Agent',
    color: 'purple',
    description: 'Creating research strategy',
  },
  search: {
    icon: Search,
    name: 'Search Agent',
    color: 'blue',
    description: 'Finding relevant papers',
  },
  synthesis: {
    icon: Lightbulb,
    name: 'Synthesis Agent',
    color: 'yellow',
    description: 'Analyzing findings',
  },
  report: {
    icon: FileText,
    name: 'Report Agent',
    color: 'green',
    description: 'Generating report',
  },
}

export function AgentProgress({ steps }: AgentProgressProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const config = agentConfig[step.agent]
        const Icon = config.icon
        const isLast = index === steps.length - 1

        const getStatusColor = () => {
          switch (step.status) {
            case 'completed':
              return 'bg-green-500'
            case 'running':
              return 'bg-blue-500'
            case 'error':
              return 'bg-red-500'
            default:
              return 'bg-gray-300'
          }
        }

        const getTextColor = () => {
          switch (step.status) {
            case 'completed':
              return 'text-green-700'
            case 'running':
              return 'text-blue-700'
            case 'error':
              return 'text-red-700'
            default:
              return 'text-gray-500'
          }
        }

        const duration = step.startTime && step.endTime 
          ? ((step.endTime - step.startTime) / 1000).toFixed(1) 
          : null

        return (
          <div key={step.agent} className="relative">
            {/* Connecting Line */}
            {!isLast && (
              <div 
                className={`absolute left-6 top-14 w-0.5 h-8 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}

            {/* Agent Card */}
            <div className={`flex items-start gap-4 p-6 rounded-xl border-2 transition-all ${
              step.status === 'running' 
                ? 'border-blue-400 bg-blue-50 shadow-lg scale-105' 
                : step.status === 'completed'
                ? 'border-green-300 bg-green-50'
                : step.status === 'error'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}>
              {/* Icon */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor()} transition-all`}>
                {step.status === 'completed' ? (
                  <Check className="w-6 h-6 text-white" />
                ) : step.status === 'running' ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Icon className="w-6 h-6 text-white opacity-50" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-lg font-bold ${getTextColor()}`}>
                    {config.name}
                  </h3>
                  {duration && (
                    <span className="text-xs text-gray-500 font-mono">
                      {duration}s
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {step.message || config.description}
                </p>

                {/* Progress Bar for Running */}
                {step.status === 'running' && (
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
