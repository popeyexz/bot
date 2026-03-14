import { useState } from 'react'
import {
  ShieldAlert,
  Terminal,
  Copy,
  Check,
  Cpu,
  MemoryStick,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  Lock,
  Unlock,
  ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'
import { UNCENSORED_MODELS } from '../data/tools'
import type { UncensoredModelInfo } from '../types'

const TIER_LABEL: Record<UncensoredModelInfo['tier'], string> = {
  low: 'Entry — any modern PC',
  mid: 'Mid — 16 GB RAM',
  high: 'High-end — 32+ GB RAM / Mini PC',
}

const TIER_COLOR: Record<UncensoredModelInfo['tier'], string> = {
  low: 'text-green-400 bg-green-400/10 border-green-500/20',
  mid: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
  high: 'text-red-400 bg-red-400/10 border-red-500/20',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors flex-shrink-0"
      title="Copy command"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2 font-mono text-xs text-cyan-300 border border-white/5 mt-2">
      <Terminal className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
      <span className="flex-1 break-all">{code}</span>
      <CopyButton text={code} />
    </div>
  )
}

function ModelCard({ model }: { model: UncensoredModelInfo }) {
  const [expanded, setExpanded] = useState(false)
  const pullCmd = `ollama pull ${model.ollamaName}`
  const runCmd = `ollama run ${model.ollamaName}`

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-100 truncate">{model.name}</div>
            <div className="text-[11px] text-gray-500">{model.params} parameters</div>
          </div>
        </div>
        <span
          className={clsx(
            'text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0',
            TIER_COLOR[model.tier],
          )}
        >
          {model.tier.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed">{model.description}</p>

      {/* RAM */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <MemoryStick className="w-3.5 h-3.5" />
        <span>{model.ramRequired} minimum</span>
        <span className="mx-1 text-gray-700">·</span>
        <Cpu className="w-3.5 h-3.5" />
        <span>{TIER_LABEL[model.tier]}</span>
      </div>

      {/* Tags */}
      <div className="flex gap-1 flex-wrap">
        {model.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Install toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors w-fit"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? 'Hide commands' : 'Show install commands'}
      </button>

      {expanded && (
        <div className="space-y-1 text-xs text-gray-500">
          <div>Pull model:</div>
          <CodeBlock code={pullCmd} />
          <div className="mt-2">Run interactively:</div>
          <CodeBlock code={runCmd} />
          <p className="text-[10px] text-gray-600 mt-1">
            Requires <span className="text-cyan-400">Ollama</span> installed and running on{' '}
            <code className="text-cyan-400">localhost:11434</code>. After pulling, the model is
            available in the AI Chat page.
          </p>
        </div>
      )}
    </div>
  )
}

/** Detect basic hardware tier from navigator hints */
function useHardwareTier(): 'high' | 'mid' | 'low' {
  // navigator.deviceMemory is available in Chromium (in GB, rounded)
  const mem = (navigator as { deviceMemory?: number }).deviceMemory
  if (mem === undefined) return 'mid'
  if (mem >= 16) return 'high'
  if (mem >= 8) return 'mid'
  return 'low'
}

export default function LocalModelsPage() {
  const [uncensoredEnabled, setUncensoredEnabled] = useState(() => {
    return localStorage.getItem('strix_uncensored_enabled') === 'true'
  })
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem('strix_uncensored_disclaimer') === 'accepted'
  })
  const [filterTier, setFilterTier] = useState<UncensoredModelInfo['tier'] | 'all'>('all')

  const hwTier = useHardwareTier()

  const toggleUncensored = (value: boolean) => {
    if (value && !disclaimerAccepted) return // force disclaimer first
    setUncensoredEnabled(value)
    localStorage.setItem('strix_uncensored_enabled', String(value))
  }

  const acceptDisclaimer = () => {
    setDisclaimerAccepted(true)
    localStorage.setItem('strix_uncensored_disclaimer', 'accepted')
  }

  const filtered = UNCENSORED_MODELS.filter(
    (m) => filterTier === 'all' || m.tier === filterTier,
  )

  const recommended = UNCENSORED_MODELS.filter((m) => m.tier === hwTier || m.tier === 'low')

  return (
    <div className="animate-fade-in max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="section-header text-2xl flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" />
          Local & Permissive Models
        </h1>
        <p className="section-subheader">
          Uncensored and permissive open-source models — run 100% privately via Ollama on your own
          hardware.
        </p>
      </div>

      {/* Safety Disclaimer */}
      {!disclaimerAccepted ? (
        <div className="glass-card p-5 border-orange-500/30 bg-orange-500/5 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-orange-300">
                Safety &amp; Responsible Use Disclaimer
              </h2>
              <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>
                  These models have reduced or removed safety filters and may produce content that
                  some find offensive, disturbing, or inappropriate.
                </li>
                <li>
                  Use is limited to <strong className="text-gray-300">legal purposes only</strong>.
                  Do not generate illegal content, CSAM, or content designed to harm others.
                </li>
                <li>
                  All processing is{' '}
                  <strong className="text-gray-300">100% local on your hardware</strong> — data
                  never leaves your machine.
                </li>
                <li>
                  Intended for research, creative writing, automation pipelines, and adult
                  content-generation platforms where permitted by local law.
                </li>
                <li>
                  You are solely responsible for how you use these models and any content you
                  generate.
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={acceptDisclaimer}
            className="btn-primary bg-orange-600 hover:bg-orange-500 border-orange-500/30"
          >
            <Check className="w-4 h-4" />
            I understand — I am 18+ and will use this responsibly
          </button>
        </div>
      ) : (
        <div className="glass-card p-3 flex items-center gap-3 border-orange-500/20 bg-orange-500/5">
          <ShieldAlert className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <p className="text-xs text-gray-400 flex-1">
            Disclaimer accepted. Use responsibly and in accordance with your local laws.
          </p>
          <button
            onClick={() => {
              setDisclaimerAccepted(false)
              setUncensoredEnabled(false)
              localStorage.removeItem('strix_uncensored_disclaimer')
              localStorage.removeItem('strix_uncensored_enabled')
            }}
            className="text-[11px] text-gray-600 hover:text-gray-400 underline underline-offset-2"
          >
            Reset
          </button>
        </div>
      )}

      {/* Enable toggle */}
      {disclaimerAccepted && (
        <div className="glass-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {uncensoredEnabled ? (
              <Unlock className="w-5 h-5 text-orange-400" />
            ) : (
              <Lock className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <div className="text-sm font-medium text-gray-200">Permissive models in AI Chat</div>
              <div className="text-xs text-gray-500">
                {uncensoredEnabled
                  ? 'Uncensored models are visible in the Chat model selector'
                  : 'Enable to show uncensored models in the Chat page model selector'}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleUncensored(!uncensoredEnabled)}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
              uncensoredEnabled ? 'bg-orange-600' : 'bg-gray-700',
            )}
            role="switch"
            aria-checked={uncensoredEnabled}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                uncensoredEnabled ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>
      )}

      {/* Hardware detection */}
      {disclaimerAccepted && (
        <div className="glass-card p-4 flex items-start gap-3 border-blue-500/20 bg-blue-500/5">
          <Cpu className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-400 space-y-1">
            <div className="font-medium text-gray-300">Hardware Detection</div>
            <p>
              Detected hardware tier:{' '}
              <span className="font-semibold text-blue-300 uppercase">{hwTier}</span>.
              {hwTier === 'high' && (
                <span>
                  {' '}
                  Your machine (32+ GB RAM / high-end hardware) can run large models like{' '}
                  <code className="text-cyan-400">dolphin-mixtral</code> or{' '}
                  <code className="text-cyan-400">deepseek-v2</code>.
                </span>
              )}
              {hwTier === 'mid' && (
                <span>
                  {' '}
                  Your machine can comfortably run 7–13B parameter models such as{' '}
                  <code className="text-cyan-400">nous-hermes2</code> or{' '}
                  <code className="text-cyan-400">wizard-vicuna-uncensored</code>.
                </span>
              )}
              {hwTier === 'low' && (
                <span>
                  {' '}
                  Start with lighter 7B models such as{' '}
                  <code className="text-cyan-400">nous-hermes2</code> or{' '}
                  <code className="text-cyan-400">openhermes</code>.
                </span>
              )}
            </p>
            <p className="text-gray-600">
              Detection uses <code>navigator.deviceMemory</code>. For accurate results open in
              Chrome/Edge.
            </p>
          </div>
        </div>
      )}

      {/* Quick-start: Ollama install */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-violet-400" />
          Quick Start: Install Ollama
        </h2>
        <p className="text-xs text-gray-400">
          All local models require{' '}
          <a
            href="https://ollama.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
          >
            Ollama
            <ExternalLink className="w-3 h-3" />
          </a>{' '}
          running on your machine.
        </p>
        <CodeBlock code="curl -fsSL https://ollama.ai/install.sh | sh" />
        <p className="text-[11px] text-gray-600">
          Windows: download the installer from{' '}
          <a
            href="https://ollama.ai/download"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            ollama.ai/download
          </a>
        </p>
      </div>

      {disclaimerAccepted && (
        <>
          {/* Recommended for hardware */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-gray-200">
                Recommended for your hardware
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.slice(0, 3).map((m) => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          </div>

          {/* All models */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-semibold text-gray-200">All Permissive Models</h2>
              </div>
              {/* Tier filter */}
              <div className="flex gap-1.5">
                {(['all', 'low', 'mid', 'high'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTier(t)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                      filterTier === t
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'text-gray-500 bg-gray-900 border-gray-800 hover:text-gray-300',
                    )}
                  >
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="glass-card p-4 flex items-start gap-3 border-gray-700">
            <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                Once a model is pulled with <code className="text-cyan-400">ollama pull</code>, it
                appears automatically in the <strong className="text-gray-400">AI Chat</strong> page
                under the model selector (toggle "Show permissive models" on).
              </p>
              <p>
                Models run 100% on your hardware — no data leaves your machine. LM Studio users can
                also load these GGUF weights from{' '}
                <a
                  href="https://huggingface.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  HuggingFace
                </a>
                .
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
