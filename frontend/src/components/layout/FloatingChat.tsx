'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Minimize2 } from 'lucide-react'
import { aiApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'Whales exiting right now?',
  'MEV risk today?',
  'Is Merchant Moe safe?',
]

export function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ask me anything about Mantle on-chain activity. I have live data from all 3 agents.' },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Don't show on the dedicated /chat page
  if (pathname === '/chat') return null

  useEffect(() => {
    if (open) {
      setHasNewMessage(false)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return
    setMessages((p) => [...p, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      const { response } = await aiApi.chat(text)
      const reply = response || 'No response received.'
      setMessages((p) => [...p, { role: 'assistant', content: reply }])
      if (!open) setHasNewMessage(true)
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: '⚠️ Connection error. Try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMsg = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/## (.*?)(\n|$)/g, '<span class="font-bold text-accent-green">$1</span><br/>')
      .replace(/\n/g, '<br/>')

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ maxHeight: '60vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🧠</span>
              <span className="font-mono font-bold text-sm text-text-primary">Ask Alpha</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-indicator" />
            </div>
            <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                  m.role === 'user'
                    ? 'bg-accent-green/10 border border-accent-green/20 text-text-primary'
                    : 'bg-surface-3 text-text-secondary',
                )}
                  dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? formatMsg(m.content) : m.content }}
                />
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-3 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-accent-green" />
                  <span className="text-xs text-text-muted font-mono">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-xs font-mono bg-surface-2 border border-border hover:border-accent-green/30 hover:text-accent-green text-text-muted px-2 py-1 rounded-lg transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-border">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask about Mantle..."
              className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green/40"
            />
            <button
              onClick={() => send(input)}
              disabled={isLoading || !input.trim()}
              className={cn(
                'p-2 rounded-lg transition-all shrink-0',
                isLoading || !input.trim()
                  ? 'bg-surface-3 text-text-muted'
                  : 'bg-accent-green text-background hover:bg-accent-green-dim',
              )}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200',
          open
            ? 'bg-surface-3 border border-border text-text-secondary hover:text-text-primary scale-95'
            : 'bg-accent-green text-background hover:bg-accent-green-dim hover:scale-110 glow-green',
        )}
        aria-label="Ask Alpha AI"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}

        {/* New message badge */}
        {!open && hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full border-2 border-background" />
        )}
      </button>
    </>
  )
}
