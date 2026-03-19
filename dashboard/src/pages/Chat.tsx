import { useState, useRef, useEffect } from 'react'
import { Send, X, Copy, Check, Layers, ChevronDown, ShieldAlert, Flame } from 'lucide-react'
import { clsx } from 'clsx'
import { MAINSTREAM_MODELS, MODELS } from '../data/tools'
import type { Message, ModelConfig, MultiModelResult } from '../types'

function MessageBubble({ msg }: { msg: Message }) {
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
          'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-violet-600 text-white'
            : 'bg-gray-100 text-gray-500 border border-gray-200',
        )}
      >
        {isUser ? 'U' : msg.model ? msg.model[0].toUpperCase() : 'A'}
      </div>

      {/* Bubble */}
      <div className={clsx('max-w-[80%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        {msg.model && !isUser && (
          <div className="text-[10px] text-gray-600 px-1">{msg.model}</div>
        )}
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-violet-600 text-white rounded-tr-sm'
              : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-tl-sm',
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

function ModelSelector({
  selected,
  onChange,
  models,
}: {
  selected: ModelConfig
  onChange: (m: ModelConfig) => void
  models: ModelConfig[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-sm text-gray-700 transition-colors shadow-sm"
      >
        <span className={clsx('w-2 h-2 rounded-full bg-current', selected.color)} />
        <span className="font-medium">{selected.name}</span>
        {selected.isUncensored && <Flame className="w-3 h-3 text-orange-400" />}
        <ChevronDown className={clsx('w-3.5 h-3.5 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 glass-card p-1 z-20 shadow-xl shadow-black/40 animate-fade-in max-h-80 overflow-y-auto">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m)
                setOpen(false)
              }}
              className={clsx(
                'w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors text-sm',
                m.id === selected.id
                  ? 'bg-violet-50 text-violet-700'
                  : 'hover:bg-gray-50 text-gray-600',
              )}
            >
              <span className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-current', m.color)} />
              <div className="flex-1 min-w-0">
                <div className="font-medium flex items-center gap-1.5">
                  {m.name}
                  {m.isUncensored && (
                    <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-gray-500">{m.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        'Hello! I\'m your AI assistant. Select a model and start chatting.\n\nNote: You\'ll need to configure API keys in Settings for cloud models, or have Ollama running locally.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [showUncensored, setShowUncensored] = useState(() => {
    return (
      localStorage.getItem('strix_uncensored_enabled') === 'true' &&
      localStorage.getItem('strix_uncensored_disclaimer') === 'accepted'
    )
  })
  const activeModels = showUncensored ? MODELS : MAINSTREAM_MODELS
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(activeModels[0])
  const [multiModel, setMultiModel] = useState(false)
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set([activeModels[0].id]))
  const [loading, setLoading] = useState(false)
  const [multiResults, setMultiResults] = useState<MultiModelResult[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, multiResults])

  const toggleMultiModel = (id: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const buildApiMessages = () =>
    messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }))

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
    setMultiResults([])

    const history = [...buildApiMessages(), { role: 'user', content: input.trim() }]

    if (multiModel) {
      // Multi-model mode
      const modelIds = Array.from(selectedModels)
      const results: MultiModelResult[] = await Promise.all(
        modelIds.map(async (modelId) => {
          const start = Date.now()
          try {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: modelId, messages: history }),
              signal: AbortSignal.timeout(30000),
            })
            const data = await res.json()
            return {
              model: MODELS.find((m) => m.id === modelId)?.name ?? modelId,
              content: data.content ?? data.error ?? 'No response',
              latency: Date.now() - start,
            }
          } catch {
            return {
              model: MODELS.find((m) => m.id === modelId)?.name ?? modelId,
              content: '⚠️ Failed to reach backend. Is the server running?',
              error: 'network error',
              latency: Date.now() - start,
            }
          }
        }),
      )
      setMultiResults(results)
    } else {
      // Single model
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel.id, messages: history }),
          signal: AbortSignal.timeout(30000),
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
              '⚠️ Could not reach the backend server. Make sure it\'s running.\n\nStart with: `cd server && npm start`',
            model: selectedModel.name,
            timestamp: new Date(),
          },
        ])
      }
    }
    setLoading(false)
  }

  const clearChat = () => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: 'Chat cleared. Start a new conversation!',
        timestamp: new Date(),
      },
    ])
    setMultiResults([])
  }

  return (
    <div className="animate-fade-in h-full max-w-5xl flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
      <div className="mb-4">
        <h1 className="section-header text-2xl">AI Chat</h1>
        <p className="section-subheader">Chat with multiple AI models side by side</p>
      </div>

      {/* Uncensored model disclaimer banner */}
      {selectedModel.isUncensored && !multiModel && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>Permissive model active.</strong> Outputs are unfiltered. Use responsibly and in
            accordance with local law. All processing is 100% local.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 glass-card">
        {!multiModel && (
          <ModelSelector
            selected={selectedModel}
            onChange={setSelectedModel}
            models={activeModels}
          />
        )}

        {/* Multi-model toggle */}
        <button
          onClick={() => setMultiModel((m) => !m)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
            multiModel
              ? 'bg-violet-50 border-violet-200 text-violet-700'
              : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 shadow-sm',
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Multi-model
        </button>

        {/* Uncensored toggle (only shown if disclaimer was accepted) */}
        {localStorage.getItem('strix_uncensored_disclaimer') === 'accepted' && (
          <button
            onClick={() => {
              const next = !showUncensored
              setShowUncensored(next)
              localStorage.setItem('strix_uncensored_enabled', String(next))
              if (!next && selectedModel.isUncensored && MAINSTREAM_MODELS.length > 0) {
                setSelectedModel(MAINSTREAM_MODELS[0])
              }
            }}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
              showUncensored
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 shadow-sm',
            )}
            title="Toggle permissive/uncensored models"
          >
            <Flame className="w-3.5 h-3.5" />
            Permissive
          </button>
        )}

        {multiModel && (
          <div className="flex gap-1.5 flex-wrap">
            {activeModels.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMultiModel(m.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  selectedModels.has(m.id)
                    ? 'bg-violet-50 border-violet-200 text-violet-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700',
                )}
              >
                <span className={clsx('w-1.5 h-1.5 rounded-full bg-current', m.color)} />
                {m.name}
                {m.isUncensored && <Flame className="w-2.5 h-2.5 text-orange-400" />}
              </button>
            ))}
          </div>
        )}

        <button onClick={clearChat} className="btn-ghost ml-auto">
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass-card p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 text-xs">
              A
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Multi-model results */}
        {multiResults.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 px-1">Multi-model responses:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {multiResults.map((r) => (
                <div key={r.model} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-violet-400">{r.model}</span>
                    <span className="text-[10px] text-gray-600">{r.latency}ms</span>
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {r.content}
                  </pre>
                </div>
              ))}
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
            placeholder={`Message ${multiModel ? 'multiple models' : selectedModel.name}… (Enter to send, Shift+Enter for newline)`}
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
          Configure API keys in Settings. Ollama requires a local server on port 11434.
        </p>
      </div>
    </div>
  )
}
