import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  History,
  Save,
  User,
  Briefcase,
  FileText,
  Users,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { MemoryData, AuditLogEntry } from '../types'

const API_TIMEOUT_MS = 5000

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.FC<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-gray-200">{title}</span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// ── Inline editable list ──────────────────────────────────────────────────────

function EditableList({
  items,
  onAdd,
  onDelete,
  placeholder,
}: {
  items: string[]
  onAdd: (value: string) => void
  onDelete: (index: number) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    if (draft.trim()) {
      onAdd(draft.trim())
      setDraft('')
    }
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <span className="flex-1 text-sm text-gray-300 bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800 leading-snug">
            {item}
          </span>
          <button
            onClick={() => onDelete(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-600 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder={placeholder}
          className="input-field flex-1 text-sm"
        />
        <button
          onClick={commit}
          disabled={!draft.trim()}
          className="btn-secondary disabled:opacity-40 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Key-value preferences editor ─────────────────────────────────────────────

function PreferencesEditor({
  prefs,
  onSet,
  onDelete,
}: {
  prefs: Record<string, string>
  onSet: (key: string, value: string) => void
  onDelete: (key: string) => void
}) {
  const [draftKey, setDraftKey] = useState('')
  const [draftVal, setDraftVal] = useState('')

  const commit = () => {
    if (draftKey.trim()) {
      onSet(draftKey.trim(), draftVal.trim())
      setDraftKey('')
      setDraftVal('')
    }
  }

  return (
    <div className="space-y-2">
      {Object.entries(prefs).map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 group">
          <span className="w-32 text-xs font-mono text-violet-400 bg-gray-900/50 rounded px-2 py-1.5 border border-gray-800 truncate">
            {k}
          </span>
          <span className="flex-1 text-sm text-gray-300 bg-gray-900/50 rounded-lg px-3 py-1.5 border border-gray-800 truncate">
            {v}
          </span>
          <button
            onClick={() => onDelete(k)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-600 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          placeholder="key"
          className="input-field w-32 text-xs font-mono"
        />
        <input
          type="text"
          value={draftVal}
          onChange={(e) => setDraftVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="value"
          className="input-field flex-1 text-sm"
        />
        <button
          onClick={commit}
          disabled={!draftKey.trim()}
          className="btn-secondary disabled:opacity-40 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Team member editor ────────────────────────────────────────────────────────

function TeamEditor({
  team,
  onAdd,
  onDelete,
}: {
  team: { name: string; role?: string }[]
  onAdd: (name: string, role: string) => void
  onDelete: (index: number) => void
}) {
  const [draftName, setDraftName] = useState('')
  const [draftRole, setDraftRole] = useState('')

  const commit = () => {
    if (draftName.trim()) {
      onAdd(draftName.trim(), draftRole.trim())
      setDraftName('')
      setDraftRole('')
    }
  }

  return (
    <div className="space-y-2">
      {team.map((m, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="w-32 text-sm text-gray-300 bg-gray-900/50 rounded px-2 py-1.5 border border-gray-800 truncate font-medium">
            {m.name}
          </span>
          <span className="flex-1 text-xs text-gray-500 bg-gray-900/50 rounded-lg px-3 py-1.5 border border-gray-800 truncate">
            {m.role ?? 'No role'}
          </span>
          <button
            onClick={() => onDelete(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-600 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Name"
          className="input-field w-32 text-sm"
        />
        <input
          type="text"
          value={draftRole}
          onChange={(e) => setDraftRole(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="Role / description"
          className="input-field flex-1 text-sm"
        />
        <button
          onClick={commit}
          disabled={!draftName.trim()}
          className="btn-secondary disabled:opacity-40 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Audit log ─────────────────────────────────────────────────────────────────

function AuditLog({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-600 py-2">No changes recorded yet.</p>
  }
  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
      {entries.map((e, i) => (
        <div key={i} className="flex gap-2 text-xs py-1.5 border-b border-white/5">
          <span className="text-gray-600 flex-shrink-0 w-36">
            {new Date(e.ts).toLocaleString([], {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span
            className={clsx(
              'w-12 flex-shrink-0 font-semibold',
              e.action === 'delete' || e.action === 'reset'
                ? 'text-red-400'
                : 'text-green-400',
            )}
          >
            {e.action}
          </span>
          <span className="font-mono text-violet-400 flex-shrink-0">{e.path}</span>
          <span className="text-gray-600 truncate ml-auto">by {e.actor}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MemoryPage() {
  const [memory, setMemory] = useState<MemoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [resetConfirm, setResetConfirm] = useState(false)

  const fetchMemory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/memory', { signal: AbortSignal.timeout(API_TIMEOUT_MS) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: MemoryData = await res.json()
      setMemory(data)
      setUserName(data.user?.name ?? '')
    } catch (e) {
      setError(
        'Could not load memory from the backend. Make sure the server is running (`cd server && npm start`).',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMemory()
  }, [fetchMemory])

  const patch = async (path: string, value: unknown) => {
    setSaving(true)
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, value }),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated: MemoryData = await res.json()
      setMemory(updated)
    } catch (e) {
      setError('Failed to save. Check the backend server.')
    } finally {
      setSaving(false)
    }
  }

  const deleteKey = async (path: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/memory/${path}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated: MemoryData = await res.json()
      setMemory(updated)
    } catch {
      setError('Failed to delete. Check the backend server.')
    } finally {
      setSaving(false)
    }
  }

  const resetAll = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/memory/reset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'user' }),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated: MemoryData = await res.json()
      setMemory(updated)
      setUserName(updated.user?.name ?? '')
      setResetConfirm(false)
    } catch {
      setError('Failed to reset memory.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center gap-3 text-gray-400 pt-20 justify-center">
        <RefreshCw className="w-5 h-5 animate-spin" />
        Loading memory…
      </div>
    )
  }

  if (error && !memory) {
    return (
      <div className="animate-fade-in max-w-2xl">
        <div className="glass-card border-red-500/20 bg-red-500/5 p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 font-medium mb-1">Could not load memory</p>
            <p className="text-xs text-gray-400">{error}</p>
            <button onClick={fetchMemory} className="btn-ghost mt-3 text-xs">
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const projects = (memory?.user?.projects ?? []).map((p) =>
    typeof p === 'string' ? p : `${p.name}${p.description ? ': ' + p.description : ''}`,
  )

  return (
    <div className="animate-fade-in max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-violet-400" />
            Memory
          </h1>
          <p className="section-subheader">
            Everything Aria knows about you — view, edit, and audit every change
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />}
          <button onClick={fetchMemory} className="btn-ghost" disabled={loading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card border-amber-500/20 bg-amber-500/5 p-3 flex gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* User identity */}
      <Section title="Identity" icon={User}>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Your name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="input-field"
              placeholder="Your name"
            />
          </div>
          <button
            onClick={() => patch('user.name', userName)}
            disabled={userName === memory?.user?.name || !userName.trim()}
            className="btn-primary disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences" icon={FileText}>
        <PreferencesEditor
          prefs={memory?.user?.preferences ?? {}}
          onSet={(key, value) => patch(`user.preferences.${key}`, value)}
          onDelete={(key) => deleteKey(`user.preferences.${key}`)}
        />
      </Section>

      {/* Projects */}
      <Section title="Projects" icon={Briefcase}>
        <EditableList
          items={projects}
          onAdd={(val) => patch('user.projects', [...(memory?.user?.projects ?? []), val])}
          onDelete={(idx) => {
            const next = (memory?.user?.projects ?? []).filter((_, i) => i !== idx)
            patch('user.projects', next)
          }}
          placeholder="Add a project (e.g. Ghost Empire dashboard)…"
        />
      </Section>

      {/* Notes */}
      <Section title="Notes" icon={FileText}>
        <EditableList
          items={memory?.user?.notes ?? []}
          onAdd={(val) => patch('user.notes', [...(memory?.user?.notes ?? []), val])}
          onDelete={(idx) => {
            const next = (memory?.user?.notes ?? []).filter((_, i) => i !== idx)
            patch('user.notes', next)
          }}
          placeholder="Add a note for Aria to remember…"
        />
      </Section>

      {/* Team */}
      <Section title="Team & Partners" icon={Users}>
        <TeamEditor
          team={memory?.team ?? []}
          onAdd={(name, role) => {
            const next = [...(memory?.team ?? []), { name, role }]
            patch('team', next)
          }}
          onDelete={(idx) => {
            const next = (memory?.team ?? []).filter((_, i) => i !== idx)
            patch('team', next)
          }}
        />
      </Section>

      {/* Audit log */}
      <Section title="Audit Log" icon={History} defaultOpen={false}>
        <AuditLog entries={memory?.auditLog ?? []} />
      </Section>

      {/* Danger zone */}
      <div className="glass-card border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-400">Reset Memory</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Clears all preferences, projects, notes, and team data. The audit log is preserved.
            </p>
          </div>
          {!resetConfirm ? (
            <button onClick={() => setResetConfirm(true)} className="btn-ghost text-red-400 hover:text-red-300 border border-red-500/20">
              <Trash2 className="w-4 h-4" />
              Reset
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-300">Are you sure?</span>
              <button
                onClick={resetAll}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
              >
                Yes, reset
              </button>
              <button onClick={() => setResetConfirm(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {memory?.updatedAt && (
        <p className="text-[10px] text-gray-700 pb-2">
          Last updated: {new Date(memory.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
