'use client'

import { Search, Sparkles, MessageSquare, FileText, Lightbulb, X } from 'lucide-react'

interface CommandHintsProps {
  isVisible: boolean
  onClose: () => void
  onSelectCommand: (command: string) => void
}

const commands = [
  {
    category: 'Search',
    icon: Search,
    commands: [
      { text: 'Search for papers about [topic]', example: 'Search for papers about transformers' },
      { text: 'Find papers on [topic]', example: 'Find papers on quantum computing' },
    ],
  },
  {
    category: 'Research',
    icon: Sparkles,
    commands: [
      { text: 'Research [topic]', example: 'Research attention mechanisms' },
      { text: 'Analyze [topic]', example: 'Analyze large language models' },
    ],
  },
  {
    category: 'Questions',
    icon: MessageSquare,
    commands: [
      { text: 'What are the main findings?', example: '' },
      { text: 'Summarize the key methodologies', example: '' },
      { text: 'Compare the different approaches', example: '' },
    ],
  },
  {
    category: 'Actions',
    icon: FileText,
    commands: [
      { text: 'Index these papers', example: '' },
      { text: 'Export the report', example: '' },
    ],
  },
]

export function CommandHints({ isVisible, onClose, onSelectCommand }: CommandHintsProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-black border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Available Commands</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {commands.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.category}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-white/60" />
                  <h4 className="text-sm font-medium text-white/90 uppercase tracking-wider">
                    {category.category}
                  </h4>
                </div>
                <div className="space-y-2 pl-6">
                  {category.commands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectCommand(cmd.example || cmd.text)
                        onClose()
                      }}
                      className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-white/90 group-hover:text-white transition-colors">
                            {cmd.text}
                          </p>
                          {cmd.example && (
                            <p className="text-xs text-white/50 mt-1">e.g., "{cmd.example}"</p>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-4 h-4 border border-white/40 rounded rotate-45"></div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Tip: Just type naturally and I'll understand what you need!
          </p>
        </div>
      </div>
    </div>
  )
}

