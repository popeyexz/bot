import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import rateLimit from 'express-rate-limit'
import { checkServiceHealth, getLocalTools } from './services/health.js'
import { chatHandler } from './services/chat.js'
import { syncHandler } from './services/sync.js'
import { ollamaModels } from './services/ollama.js'
import { getMemory, setMemoryKey, deleteMemoryKey, getAuditLog, resetMemory, isProtectedPath } from './services/memory.js'
import { buildAssistantContext, ASSISTANT_NAME } from './services/assistant.js'
import { requireApiKey } from './middleware/auth.js'
import { securityHeaders, sanitizeInput, safeEqual } from './middleware/security.js'
import { runAgent, AGENT_TYPES } from './agents/manager.js'
import { addTask, getQueueStatus } from './tasks/queue.js'
import { uploadMiddleware, listUploads, deleteUpload } from './services/paperclip.js'
import { listIntegrations, runIntegration, runAllIntegrations } from './services/integrations.js'

const syncLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false })
const modelsLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false })
const memoryLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false })
const assistantLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false })
const agentLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false })
const uploadLimiter = rateLimit({ windowMs: 60_000, max: 15, standardHeaders: true, legacyHeaders: false })
const integrationLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false })

/** Permissive / uncensored Ollama model IDs — usage is logged for accountability. */
const PERMISSIVE_MODEL_IDS = new Set([
  'nous-hermes2',
  'openhermes',
  'dolphin-mistral',
  'dolphin-mixtral',
  'wizard-vicuna-uncensored',
  'llama2-uncensored',
])

/** Log permissive-model usage to stdout (extend to a file / DB as needed). */
function logPermissiveUsage(model, req) {
  const ts = new Date().toISOString()
  const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown'
  console.log(`[PERMISSIVE] ts=${ts} model=${model} ip=${ip}`)
}

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)
// Bind to localhost only by default — set BIND_ADDRESS=0.0.0.0 only when a
// reverse-proxy (nginx, caddy) sits in front and handles external TLS/auth.
const BIND_ADDRESS = process.env.BIND_ADDRESS ?? '127.0.0.1'
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(securityHeaders)
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:4173'],
    credentials: true,
  }),
)
app.use(express.json({ limit: '4mb' }))
app.use(sanitizeInput)

// ── Global rate limiter (catch-all for unlisted routes) ──────────────────────
// Per-route limiters (stricter) are defined above; this is a defence-in-depth
// backstop for any routes not covered by a dedicated limiter.
const globalLimiter = rateLimit({ windowMs: 60_000, max: 500, standardHeaders: true, legacyHeaders: false })
app.use(globalLimiter)


app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), ts: new Date().toISOString() })
})

app.get('/api/tools', (_req, res) => {
  res.json(getLocalTools())
})

app.get('/api/status', async (_req, res) => {
  try {
    const statuses = await checkServiceHealth()
    res.json(statuses)
  } catch (err) {
    res.status(500).json({ error: 'Failed to check service health', detail: String(err) })
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages } = req.body ?? {}
    // Only log permissive usage for valid, well-formed requests
    if (model && Array.isArray(messages) && PERMISSIVE_MODEL_IDS.has(model)) {
      logPermissiveUsage(model, req)
    }
    await chatHandler(req, res)
  } catch (err) {
    res.status(500).json({ error: 'Chat error', detail: String(err) })
  }
})

app.post('/api/sync', syncLimiter, async (req, res) => {
  try {
    await syncHandler(req, res)
  } catch (err) {
    res.status(500).json({ error: 'Sync error', detail: String(err) })
  }
})

app.get('/api/models', modelsLimiter, async (_req, res) => {
  try {
    const models = await ollamaModels()
    res.json(models)
  } catch (err) {
    // Return 200 with empty list so the UI degrades gracefully when Ollama is offline
    res.status(200).json({ models: [], error: String(err) })
  }
})

// ── Memory routes ─────────────────────────────────────────────────────────────
app.get('/api/memory', memoryLimiter, (_req, res) => {
  res.json(getMemory())
})

app.get('/api/memory/audit', memoryLimiter, (_req, res) => {
  res.json(getAuditLog())
})

app.post('/api/memory', memoryLimiter, requireApiKey, (req, res) => {
  const { path, value, actor } = req.body ?? {}
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: '"path" (string, dot-notation) is required' })
  }
  // Prevent writing to the audit log or updatedAt fields directly
  if (isProtectedPath(path)) {
    return res.status(400).json({ error: `The path "${path}" is read-only` })
  }
  try {
    const updated = setMemoryKey(path, value, actor ?? 'user')
    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update memory', detail: String(err) })
  }
})

app.delete('/api/memory/reset', memoryLimiter, requireApiKey, (req, res) => {
  try {
    const updated = resetMemory(req.body?.actor ?? 'user')
    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset memory', detail: String(err) })
  }
})

app.delete('/api/memory/:path(*)', memoryLimiter, requireApiKey, (req, res) => {
  const dotPath = req.params.path
  if (!dotPath) return res.status(400).json({ error: 'path is required' })
  if (isProtectedPath(dotPath)) {
    return res.status(400).json({ error: `The path "${dotPath}" is read-only` })
  }
  try {
    const updated = deleteMemoryKey(dotPath, req.body?.actor ?? 'user')
    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete memory key', detail: String(err) })
  }
})

// ── Assistant routes ──────────────────────────────────────────────────────────
app.get('/api/assistant/context', assistantLimiter, async (_req, res) => {
  try {
    const ctx = await buildAssistantContext()
    res.json({ name: ASSISTANT_NAME, ...ctx })
  } catch (err) {
    res.status(500).json({ error: 'Failed to build assistant context', detail: String(err) })
  }
})

app.post('/api/assistant/chat', assistantLimiter, async (req, res) => {
  const { model, messages, apiKey } = req.body ?? {}
  if (!model || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'model and messages are required' })
  }
  try {
    // Inject the Aria system prompt as the first message
    const ctx = await buildAssistantContext()
    const enrichedMessages = [
      { role: 'system', content: ctx.systemPrompt },
      ...messages.filter((m) => m.role !== 'system'),
    ]
    // Reuse the existing chatHandler but with the enriched messages
    req.body = { model, messages: enrichedMessages, apiKey }
    return await chatHandler(req, res)
  } catch (err) {
    return res.status(500).json({ error: 'Assistant chat error', detail: String(err) })
  }
})

// ── Agent routes ──────────────────────────────────────────────────────────────

/**
 * POST /api/agent/run
 * Body: { agent: "research" | "coder" | "automation", task: string, model?: string, apiKey?: string }
 * Runs an agent synchronously and returns the result.
 */
app.post('/api/agent/run', agentLimiter, requireApiKey, async (req, res) => {
  const { agent, task, model, apiKey } = req.body ?? {}
  if (!agent || !task) {
    return res.status(400).json({ error: '"agent" and "task" are required' })
  }
  if (!AGENT_TYPES.includes(agent)) {
    return res.status(400).json({ error: `Unknown agent "${agent}". Valid: ${AGENT_TYPES.join(', ')}` })
  }
  try {
    const result = await runAgent(agent, task, { model, apiKey, baseUrl: `http://localhost:${PORT}` })
    return res.json({ agent, task, result })
  } catch (err) {
    return res.status(500).json({ error: 'Agent error', detail: String(err) })
  }
})

/**
 * POST /api/agent/task
 * Body: { agent: string, task: string, model?: string }
 * Adds the task to the background queue and returns a job ID immediately.
 */
app.post('/api/agent/task', agentLimiter, requireApiKey, (req, res) => {
  const { agent, task, model } = req.body ?? {}
  if (!agent || !task) {
    return res.status(400).json({ error: '"agent" and "task" are required' })
  }
  if (!AGENT_TYPES.includes(agent)) {
    return res.status(400).json({ error: `Unknown agent "${agent}". Valid: ${AGENT_TYPES.join(', ')}` })
  }
  const id = addTask(agent, task, { model, baseUrl: `http://localhost:${PORT}` })
  return res.json({ id, status: 'queued' })
})

/**
 * GET /api/agent/queue
 * Returns the current task queue and recent job history.
 */
app.get('/api/agent/queue', agentLimiter, requireApiKey, (_req, res) => {
  return res.json(getQueueStatus())
})

// ── Paperclip (file upload) routes ────────────────────────────────────────────

/**
 * POST /api/upload
 * Accepts a single file (multipart/form-data, field "file").
 * Validates MIME type, extension, and size before writing to disk.
 */
app.post('/api/upload', uploadLimiter, requireApiKey, (req, res) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      return res.status(status).json({ error: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Use field name "file".' })
    }
    return res.json({
      success: true,
      file: {
        name: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    })
  })
})

/** GET /api/uploads — list all uploaded files. */
app.get('/api/uploads', uploadLimiter, (_req, res) => {
  res.json(listUploads())
})

/** DELETE /api/uploads/:name — remove a specific upload. */
app.delete('/api/uploads/:name', uploadLimiter, requireApiKey, (req, res) => {
  const removed = deleteUpload(req.params.name)
  if (!removed) return res.status(404).json({ error: 'File not found.' })
  return res.json({ success: true })
})

// ── Integration routes (free APIs with security checks) ──────────────────────

/** GET /api/integrations — list all available integrations (metadata only). */
app.get('/api/integrations', integrationLimiter, (_req, res) => {
  res.json(listIntegrations())
})

/**
 * GET /api/integrations/run/:id — execute a single integration by ID.
 * Each call passes through the security gate (HTTPS-only, domain allow-list,
 * per-integration rate limit, response-size guard, request timeout).
 */
app.get('/api/integrations/run/:id', integrationLimiter, async (req, res) => {
  try {
    const result = await runIntegration(req.params.id)
    return res.json(result)
  } catch (err) {
    return res.status(400).json({ error: String(err.message ?? err) })
  }
})

/**
 * GET /api/integrations/run-all — execute every registered integration in
 * parallel and return combined results + any errors.
 */
app.get('/api/integrations/run-all', integrationLimiter, async (_req, res) => {
  try {
    const { results, errors } = await runAllIntegrations()
    return res.json({ results, errors })
  } catch (err) {
    return res.status(500).json({ error: String(err.message ?? err) })
  }
})

// ── HTTP + WebSocket server ────────────────────────────────────────────────────
const httpServer = createServer(app)

/** Optional WS token — set WS_TOKEN in .env to require authentication. */
const WS_TOKEN = process.env.WS_TOKEN

const wss = new WebSocketServer({ server: httpServer })

wss.on('connection', (ws, req) => {
  // ── WebSocket authentication ────────────────────────────────────────────────
  // When WS_TOKEN is configured, the client must include it as a query param:
  //   ws://localhost:3001?token=<WS_TOKEN>
  if (WS_TOKEN) {
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`)
    const token = url.searchParams.get('token') ?? ''
    if (!safeEqual(token, WS_TOKEN)) {
      ws.close(1008, 'Unauthorized')
      return
    }
  }

  console.log('[WS] client connected')

  const sendStatus = async () => {
    if (ws.readyState !== ws.OPEN) return
    try {
      const statuses = await checkServiceHealth()
      ws.send(JSON.stringify({ type: 'status_update', data: statuses }))
    } catch {
      // ignore
    }
  }

  sendStatus()
  const statusInterval = setInterval(sendStatus, 15_000)

  ws.on('close', () => {
    clearInterval(statusInterval)
    console.log('[WS] client disconnected')
  })

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }))
      }
    } catch {
      // ignore malformed messages
    }
  })
})

httpServer.listen(PORT, BIND_ADDRESS, () => {
  console.log(`\n🚀 Strix server running on http://${BIND_ADDRESS}:${PORT}`)
  console.log(`   WebSocket: ws://${BIND_ADDRESS}:${PORT}`)
  console.log(`   Health:    http://${BIND_ADDRESS}:${PORT}/health\n`)
})
