'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Loader2 } from 'lucide-react'
import { aiApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTIONS = [
  'What are whales doing on Mantle right now?',
  'Is Merchant Moe safe to LP in?',
  'Where is MEV risk highest today?',
  'Which pools should I avoid?',
  'What are the top signals in the last hour?',
  'Analyze the current exit sequence pattern',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `## Welcome to Ask Alpha

I'm AlphaSight AI — your autonomous on-chain intelligence system for the Mantle Network.

I have real-time access to:
- **Watcher wallet movements** and exit sequences
- **MEV bot activity** across Merchant Moe, Agni Finance, and Fusion X
- **On-chain signals** with supporting evidence
- **Historical pattern analysis**

What would you like to know about the Mantle ecosystem?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const { response } = await aiApi.chat(text)
      const aiMessage: Message = {
        role: 'assistant',
        content: response || 'Unable to process request. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Connection error. The AI backend may be starting up. Please try again in a moment.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="font-mono font-bold text-accent-green text-base mb-2">$1</h2>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-mono font-bold text-text-primary flex items-center gap-3">
          <MessageSquare size={24} className="text-accent-green" />
          Ask Alpha
        </h1>
        <p className="text-text-secondary text-sm mt-1">AI-powered on-chain intelligence chat</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-3xl rounded-2xl px-5 py-4',
                message.role === 'user'
                  ? 'bg-accent-green/10 border border-accent-green/20 text-text-primary'
                  : 'bg-surface border border-border text-text-primary',
              )}
            >
              {message.role === 'assistant' ? (
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
              <p className="text-xs text-text-muted font-mono mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 text-text-muted">
                <Loader2 size={14} className="animate-spin" />
                <span className="font-mono text-sm">Analyzing on-chain data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4">
          <p className="text-xs font-mono text-text-muted mb-3 uppercase">Suggested Questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs font-mono bg-surface-2 border border-border hover:border-accent-green/30 hover:text-accent-green text-text-secondary px-3 py-2 rounded-lg transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-border">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about wallets, MEV risk, market signals..."
            rows={2}
            className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted font-mono resize-none focus:outline-none focus:border-accent-green/40 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className={cn(
              'p-3 rounded-xl font-mono transition-all',
              isLoading || !input.trim()
                ? 'bg-surface-3 text-text-muted cursor-not-allowed'
                : 'bg-accent-green text-background hover:bg-accent-green-dim',
            )}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-xs text-text-muted font-mono mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
