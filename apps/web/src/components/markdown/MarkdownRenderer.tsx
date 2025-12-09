'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-bold text-gray-900 mt-5 mb-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-gray-800 leading-relaxed mb-4" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside space-y-2 mb-4 text-gray-800" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-800" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="ml-4" {...props} />
        ),
        code: ({ node, inline, ...props }: any) =>
          inline ? (
            <code className="px-1.5 py-0.5 bg-gray-100 text-purple-600 rounded text-sm font-mono" {...props} />
          ) : (
            <code className="block p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono mb-4" {...props} />
          ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4" {...props} />
        ),
        a: ({ node, ...props }) => (
          <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-gray-900" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-gray-800" {...props} />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
