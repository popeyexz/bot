import {
  Image,
  Network,
  Cpu,
  Bot,
  Code2,
  Container,
  Github,
  Box,
  Gamepad2,
  Sword,
  MessageSquare,
  Sparkles,
  Zap,
  Search,
  Workflow,
  RefreshCw,
  Monitor,
  FileText,
  Figma,
  MousePointer2,
  ExternalLink,
  type LucideProps,
} from 'lucide-react'
import type { FC } from 'react'

const ICON_MAP: Record<string, FC<LucideProps>> = {
  Image,
  Network,
  Cpu,
  Bot,
  Code2,
  Container,
  Github,
  Box,
  Gamepad2,
  Sword,
  MessageSquare,
  Sparkles,
  Zap,
  Search,
  Workflow,
  RefreshCw,
  Monitor,
  FileText,
  Figma,
  MousePointer2,
}

import { clsx } from 'clsx'
import type { Tool } from '../types'
import type { ServiceStatus } from '../types'

interface ToolCardProps {
  tool: Tool
  status?: ServiceStatus
  compact?: boolean
}

function StatusBadge({ status }: { status?: ServiceStatus }) {
  if (!status) return null
  return (
    <span
      className={clsx(
        'badge',
        status.status === 'online' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        status.status === 'offline' && 'bg-gray-100 text-gray-400 border border-gray-200',
        status.status === 'checking' && 'bg-amber-50 text-amber-600 border border-amber-200',
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full',
          status.status === 'online' && 'bg-emerald-500 animate-pulse',
          status.status === 'offline' && 'bg-gray-400',
          status.status === 'checking' && 'bg-amber-400 animate-pulse',
        )}
      />
      {status.status === 'online'
        ? status.latency
          ? `${status.latency}ms`
          : 'Online'
        : status.status === 'checking'
          ? 'Checking…'
          : 'Offline'}
    </span>
  )
}

export default function ToolCard({ tool, status, compact }: ToolCardProps) {
  const Icon = ICON_MAP[tool.icon] ?? Box

  const handleLaunch = () => {
    window.open(tool.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={clsx(
        'glass-card-hover group cursor-pointer flex flex-col',
        compact ? 'p-4' : 'p-5',
      )}
      onClick={handleLaunch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
      aria-label={`Launch ${tool.name}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={clsx(
            'rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg',
            compact ? 'w-9 h-9' : 'w-11 h-11',
            tool.color,
          )}
        >
          <Icon className={clsx('text-white', compact ? 'w-4 h-4' : 'w-5 h-5')} />
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
        </div>
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={clsx(
              'font-semibold text-gray-800 truncate',
              compact ? 'text-sm' : 'text-base',
            )}
          >
            {tool.name}
          </h3>
        </div>
        {!compact && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{tool.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className={clsx('flex items-center justify-between', compact ? 'mt-2' : 'mt-4')}>
        <span className="badge bg-gray-100 text-gray-500 border border-gray-200 text-[10px]">
          {tool.category}
        </span>
        {tool.isLocal && <StatusBadge status={status} />}
      </div>
    </div>
  )
}
