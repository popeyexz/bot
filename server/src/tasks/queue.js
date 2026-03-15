/**
 * Task Queue — a lightweight in-process queue that dispatches agent jobs
 * every 5 seconds.  Suitable for a single-instance mini-PC deployment.
 *
 * Usage:
 *   import { addTask, getQueueStatus } from './tasks/queue.js'
 *   addTask('research', 'Latest news on open-source LLMs', { model: 'ollama-local' })
 */

import { runAgent } from '../agents/manager.js'

/** @typedef {{ id: string, agent: string, task: string, opts: object, addedAt: string }} QueueItem */
/** @typedef {{ id: string, agent: string, task: string, status: string, result?: string, error?: string, startedAt: string, finishedAt: string }} HistoryItem */

/** @type {QueueItem[]} */
let queue = []

/** @type {HistoryItem[]} */
let history = []
const HISTORY_CAP = 100

let isProcessing = false

/** Monotonic counter for deterministic job IDs within the process lifetime. */
let jobCounter = 0

/**
 * Add a task to the queue.
 *
 * @param {string} agent  Agent type (research | coder | automation).
 * @param {string} task   Task description.
 * @param {object} [opts] Options forwarded to the agent.
 * @returns {string} The assigned job ID.
 */
export function addTask(agent, task, opts = {}) {
  jobCounter += 1
  const id = `job-${Date.now()}-${jobCounter}`
  queue.push({ id, agent, task, opts, addedAt: new Date().toISOString() })
  console.log(`[Queue] Task added: ${id} → agent=${agent}`)
  return id
}

/** Return a snapshot of the current queue and recent history. */
export function getQueueStatus() {
  return { pending: [...queue], history: [...history] }
}

/** Process one job from the front of the queue. */
async function processNext() {
  if (isProcessing || queue.length === 0) return
  isProcessing = true

  const job = queue.shift()
  const startedAt = new Date().toISOString()
  console.log(`[Queue] Processing ${job.id} (agent=${job.agent})`)

  try {
    const result = await runAgent(job.agent, job.task, job.opts)
    const entry = { ...job, status: 'done', result, startedAt, finishedAt: new Date().toISOString() }
    history.unshift(entry)
    console.log(`[Queue] Finished ${job.id}`)
  } catch (err) {
    const entry = {
      ...job,
      status: 'error',
      error: String(err),
      startedAt,
      finishedAt: new Date().toISOString(),
    }
    history.unshift(entry)
    console.error(`[Queue] Error on ${job.id}:`, err)
  } finally {
    if (history.length > HISTORY_CAP) history.length = HISTORY_CAP
    isProcessing = false
  }
}

// Poll every 5 seconds — non-blocking, does nothing when queue is empty.
setInterval(processNext, 5000)
