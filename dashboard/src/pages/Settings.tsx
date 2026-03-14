import { useState } from 'react'
import { Eye, EyeOff, Save, Check, Key, Server, Info } from 'lucide-react'
import { clsx } from 'clsx'
import type { ApiKeys, ServiceUrls } from '../types'

const DEFAULT_URLS: ServiceUrls = {
  ollama: 'http://localhost:11434',
  stableDiffusion: 'http://localhost:7860',
  comfyui: 'http://localhost:8188',
  lmStudio: 'http://localhost:1234',
  server: 'http://localhost:3001',
}

const LS_KEYS_KEY = 'strix_api_keys'
const LS_URLS_KEY = 'strix_service_urls'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function MaskedInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'sk-…'}
          className="input-field pl-9 pr-9 font-mono text-xs"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

function UrlInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field pl-9 font-mono text-xs"
        />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeys>(() =>
    loadFromStorage(LS_KEYS_KEY, {
      openai: '',
      anthropic: '',
      google: '',
      deepseek: '',
    }),
  )
  const [urls, setUrls] = useState<ServiceUrls>(() =>
    loadFromStorage(LS_URLS_KEY, DEFAULT_URLS),
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem(LS_KEYS_KEY, JSON.stringify(keys))
    localStorage.setItem(LS_URLS_KEY, JSON.stringify(urls))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setUrls(DEFAULT_URLS)
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <div>
        <h1 className="section-header text-2xl">Settings</h1>
        <p className="section-subheader">Configure API keys and local service endpoints</p>
      </div>

      {/* Info banner */}
      <div className="glass-card p-4 flex gap-3 border-blue-500/20 bg-blue-500/5">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400 leading-relaxed">
          API keys are stored in your browser's localStorage only — never sent anywhere except the
          Strix backend server (running on your machine). For production, configure keys in the
          server's <code className="text-blue-400">.env</code> file instead.
        </p>
      </div>

      {/* API Keys */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Key className="w-4 h-4 text-violet-400" />
          API Keys
        </h2>

        <MaskedInput
          label="OpenAI API Key"
          value={keys.openai}
          onChange={(v) => setKeys((k) => ({ ...k, openai: v }))}
          placeholder="sk-..."
        />
        <MaskedInput
          label="Anthropic API Key"
          value={keys.anthropic}
          onChange={(v) => setKeys((k) => ({ ...k, anthropic: v }))}
          placeholder="sk-ant-..."
        />
        <MaskedInput
          label="Google API Key (Gemini)"
          value={keys.google}
          onChange={(v) => setKeys((k) => ({ ...k, google: v }))}
          placeholder="AIza..."
        />
        <MaskedInput
          label="DeepSeek API Key"
          value={keys.deepseek}
          onChange={(v) => setKeys((k) => ({ ...k, deepseek: v }))}
          placeholder="sk-..."
        />
      </div>

      {/* Service URLs */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-violet-400" />
            Local Service URLs
          </h2>
          <button onClick={handleReset} className="btn-ghost text-xs">
            Reset defaults
          </button>
        </div>

        <UrlInput
          label="Ollama"
          value={urls.ollama}
          onChange={(v) => setUrls((u) => ({ ...u, ollama: v }))}
        />
        <UrlInput
          label="Stable Diffusion Forge"
          value={urls.stableDiffusion}
          onChange={(v) => setUrls((u) => ({ ...u, stableDiffusion: v }))}
        />
        <UrlInput
          label="ComfyUI"
          value={urls.comfyui}
          onChange={(v) => setUrls((u) => ({ ...u, comfyui: v }))}
        />
        <UrlInput
          label="LM Studio"
          value={urls.lmStudio}
          onChange={(v) => setUrls((u) => ({ ...u, lmStudio: v }))}
        />
        <UrlInput
          label="Strix Backend Server"
          value={urls.server}
          onChange={(v) => setUrls((u) => ({ ...u, server: v }))}
        />
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className={clsx(
            'btn-primary',
            saved && 'bg-green-600 hover:bg-green-500',
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <p className="text-xs text-gray-600">
          Keys are saved to your browser's localStorage.
        </p>
      </div>
    </div>
  )
}
