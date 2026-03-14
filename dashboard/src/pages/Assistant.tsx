import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  X,
  Copy,
  Check,
  BrainCircuit,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wrench,
  BookOpen,
} from 'lucide-react'
import { clsx } from 'clsx'
import { MODELS } from '../data/tools'
import type { Message, ModelConfig, HealingAlert, AssistantContext } from '../types'

const CONTEXT_TIMEOUT_MS = 5000
const CHAT_TIMEOUT_MS = 60000

// ── Healing Alert banner ──────────────────────────────────────────────────────

function HealingBanner({ alerts }: { alerts: HealingAlert[] }) {
  const [expanded, setExpanded] = useState(false)
  if (alerts.length === 0) return null

  return (
    <div className="glass-card border-amber-500/30 bg-amber-500/5 p-3 animate-fade-in">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-300">
            {alerts.length} service{alerts.length > 1 ? 's' : ''} offline — Aria has repair
            suggestions
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Wrench className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-amber-300 mb-0.5">{a.name}</div>
                <code className="text-xs text-amber-200/70 break-all">{a.suggestion}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  assistantName,
}: {
  msg: Message
  assistantName: string
}) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={clsx('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-violet-600 text-white'
            : 'bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-lg shadow-violet-900/30',
        )}
      >
        {isUser ? 'U' : assistantName[0]}
      </div>

      {/* Bubble */}
      <div className={clsx('max-w-[80%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        {!isUser && (
          <div className="text-[10px] text-violet-400 px-1 font-semibold">{assistantName}</div>
        )}
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-violet-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm',
          )}
        >
          <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
        </div>
        <div
          className={clsx(
            'flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-1',
            isUser ? 'justify-end' : 'justify-start',
          )}
        >
          <span className="text-[10px] text-gray-600">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={copy} className="text-gray-600 hover:text-gray-400 transition-colors">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Context sidebar panel ─────────────────────────────────────────────────────

function ContextPanel({ ctx }: { ctx: AssistantContext | null }) {
  if (!ctx) return null

  return (
    <div className="w-64 flex-shrink-0 space-y-3">
      {/* Status */}
      <div className="glass-card p-3">
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
          <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
          {ctx.name}'s Context
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Services online</span>
            <span className="text-green-400 font-semibold">{ctx.onlineCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Services offline</span>
            <span
              className={clsx(
                'font-semibold',
                ctx.offlineCount > 0 ? 'text-amber-400' : 'text-gray-600',
              )}
            >
              {ctx.offlineCount}
            </span>
          </div>
        </div>
      </div>

      {/* Healing alerts compact */}
      {ctx.healingAlerts.length > 0 && (
        <div className="glass-card border-amber-500/20 bg-amber-500/5 p-3">
          <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
            <Wrench className="w-3 h-3" />
            Self-Healing
          </div>
          <div className="space-y-1">
            {ctx.healingAlerts.map((a) => (
              <div key={a.id} className="text-[11px] text-amber-300/80">
                ⚠ {a.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory hint */}
      <div className="glass-card p-3">
        <div className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-violet-400" />
          Memory
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {ctx.name} remembers your preferences, projects, and team. Visit the{' '}
          <a href="/memory" className="text-violet-400 hover:text-violet-300">
            Memory
          </a>{' '}
          page to view or edit.
        </p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const INITIAL_GREETING = (name: string) =>
  `Hi! I'm ${name}, your persistent AI assistant and base layer. 🌟\n\nI know your projects, preferences, and live service status — and I can remember new things you tell me.\n\nHow can I help you today?`

export default function AssistantPage() {
  const [ctx, setCtx] = useState<AssistantContext | null>(null)
  const [ctxLoading, setCtxLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0])
  const [modelOpen, setModelOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchContext = useCallback(async () => {
    setCtxLoading(true)
    try {
      const res = await fetch('/api/assistant/context', { signal: AbortSignal.timeout(CONTEXT_TIMEOUT_MS) })
      if (res.ok) {
        const data: AssistantContext = await res.json()
        setCtx(data)
        // Set greeting only on first load
        setMessages((prev) =>
          prev.length === 0
            ? [
                {
                  id: '0',
                  role: 'assistant',
                  content: INITIAL_GREETING(data.name),
                  timestamp: new Date(),
                },
              ]
            : prev,
        )
      }
    } catch {
      setMessages((prev) =>
        prev.length === 0
          ? [
              {
                id: '0',
                role: 'assistant',
                content:
                  "Hi! I'm Aria, your persistent AI assistant. The backend server isn't reachable right now — start it with `cd server && npm start` and refresh.",
                timestamp: new Date(),
              },
            ]
          : prev,
      )
    } finally {
      setCtxLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContext()
  }, [fetchContext])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const history = messages
      .filter((m) => m.role !== 'system')
      .concat(userMsg)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel.id, messages: history }),
        signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content ?? data.error ?? 'No response',
          model: selectedModel.name,
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "⚠️ Couldn't reach the backend. Make sure it's running:\n\n`cd server && npm start`",
          timestamp: new Date(),
        },
      ])
    }
    setLoading(false)
  }

  const clearChat = () => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `Chat cleared. Still here whenever you need me! 🌟`,
        timestamp: new Date(),
      },
    ])
  }

  const assistantName = ctx?.name ?? 'Aria'

  return (
    <div className="animate-fade-in flex gap-4 h-full" style={{ height: 'calc(100vh - 3rem)' }}>
      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="section-header text-2xl flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-violet-400" />
              {assistantName}
            </h1>
            <p className="section-subheader">Your persistent AI base layer — always on, always remembering</p>
          </div>
          <button
            onClick={fetchContext}
            disabled={ctxLoading}
            className="btn-ghost"
            title="Refresh context"
          >
            <RefreshCw className={clsx('w-4 h-4', ctxLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Healing banner */}
        {ctx && <div className="mb-3"><HealingBanner alerts={ctx.healingAlerts} /></div>}

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-3 p-3 glass-card flex-wrap">
          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setModelOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-gray-600 text-sm text-gray-200 transition-colors"
            >
              <span className={clsx('w-2 h-2 rounded-full bg-current', selectedModel.color)} />
              <span className="font-medium">{selectedModel.name}</span>
              <ChevronDown
                className={clsx(
                  'w-3.5 h-3.5 text-gray-500 transition-transform',
                  modelOpen && 'rotate-180',
                )}
              />
            </button>
            {modelOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 glass-card p-1 z-20 shadow-xl shadow-black/40 animate-fade-in">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m)
                      setModelOpen(false)
                    }}
                    className={clsx(
                      'w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors text-sm',
                      m.id === selectedModel.id
                        ? 'bg-violet-600/20 text-violet-300'
                        : 'hover:bg-white/5 text-gray-300',
                    )}
                  >
                    <span className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-current', m.color)} />
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[11px] text-gray-500">{m.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={clearChat} className="btn-ghost ml-auto">
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto glass-card p-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} assistantName={assistantName} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {assistantName[0]}
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-3">
          <div className="flex gap-3 glass-card p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={`Ask ${assistantName} anything… (Enter to send, Shift+Enter for newline)`}
              rows={2}
              className="input-field flex-1 resize-none min-h-0"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={clsx(
                'btn-primary self-end flex-shrink-0',
                (!input.trim() || loading) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5 px-1">
            {assistantName} uses your configured AI model with full memory context. Requires API
            key in Settings or Ollama running locally.
          </p>
        </div>
      </div>

      {/* Right sidebar — context panel */}
      <div className="hidden xl:block">
        <ContextPanel ctx={ctx} />
      </div>
    </div>
  )
}
