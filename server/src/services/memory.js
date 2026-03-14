/**
 * Persistent memory service — stores user preferences, projects, notes, and
 * team context in a local JSON file, with a full audit log of every change.
 *
 * The data directory is configurable via MEMORY_FILE env var (default: ../data/memory.json
 * relative to this file's location).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const MEMORY_FILE =
  process.env.MEMORY_FILE ?? join(__dirname, '../../data/memory.json')

/** Default memory shape — created on first boot */
const DEFAULT_MEMORY = {
  user: {
    name: 'Sharuk',
    preferences: {},
    projects: [],
    notes: [],
  },
  team: [],
  auditLog: [],
  updatedAt: null,
}

function ensureDir(filePath) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

/** Load memory from disk, creating the file with defaults if absent. */
export function loadMemory() {
  try {
    ensureDir(MEMORY_FILE)
    if (!existsSync(MEMORY_FILE)) {
      writeFileSync(MEMORY_FILE, JSON.stringify(DEFAULT_MEMORY, null, 2), 'utf-8')
      return structuredClone(DEFAULT_MEMORY)
    }
    return JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'))
  } catch {
    return structuredClone(DEFAULT_MEMORY)
  }
}

/** Persist a memory object to disk. */
function saveMemory(memory) {
  ensureDir(MEMORY_FILE)
  writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8')
}

/** Append an entry to the in-memory audit log (capped at 200 entries). */
function appendAudit(memory, actor, action, path, prev, value) {
  if (!Array.isArray(memory.auditLog)) memory.auditLog = []
  memory.auditLog.unshift({ ts: new Date().toISOString(), actor, action, path, prev, value })
  if (memory.auditLog.length > 200) memory.auditLog.length = 200
  memory.updatedAt = new Date().toISOString()
}

/**
 * Resolve a dot-notation path within an object, returning { parent, key }.
 * Creates intermediate objects as needed when `create` is true.
 */
function resolvePath(obj, dotPath, create = false) {
  const parts = dotPath.split('.')
  let cursor = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (cursor[parts[i]] === undefined) {
      if (!create) return null
      cursor[parts[i]] = {}
    }
    cursor = cursor[parts[i]]
  }
  return { parent: cursor, key: parts[parts.length - 1] }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Return the full memory object. */
export function getMemory() {
  return loadMemory()
}

/**
 * Set a value at `path` (dot-notation) and save.
 * @returns {object} Updated memory object.
 */
export function setMemoryKey(path, value, actor = 'user') {
  const memory = loadMemory()
  const resolved = resolvePath(memory, path, true)
  const prev = resolved.parent[resolved.key]
  resolved.parent[resolved.key] = value
  appendAudit(memory, actor, 'set', path, prev, value)
  saveMemory(memory)
  return memory
}

/**
 * Delete a key at `path` (dot-notation) and save.
 * @returns {object} Updated memory object.
 */
export function deleteMemoryKey(path, actor = 'user') {
  const memory = loadMemory()
  const resolved = resolvePath(memory, path, false)
  if (!resolved) return memory
  const prev = resolved.parent[resolved.key]
  delete resolved.parent[resolved.key]
  appendAudit(memory, actor, 'delete', path, prev, null)
  saveMemory(memory)
  return memory
}

/** Paths that users must not write to directly (append-only via internal audit). */
const PROTECTED_PATHS = ['auditLog', 'updatedAt']

/** Returns true if dotPath equals or is nested under a protected path. */
export function isProtectedPath(dotPath) {
  return PROTECTED_PATHS.some(
    (p) => dotPath === p || dotPath.startsWith(p + '.'),
  )
}

/** Return the audit log array. */
export function getAuditLog() {
  return loadMemory().auditLog ?? []
}

/** Reset memory to defaults (keeps audit log). */
export function resetMemory(actor = 'user') {
  const memory = loadMemory()
  const prev = { user: memory.user, team: memory.team }
  const fresh = structuredClone(DEFAULT_MEMORY)
  fresh.auditLog = memory.auditLog ?? []
  appendAudit(fresh, actor, 'reset', '*', prev, null)
  saveMemory(fresh)
  return fresh
}
