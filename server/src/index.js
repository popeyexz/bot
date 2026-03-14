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

const syncLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false })
const modelsLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false })

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:4173'],
    credentials: true,
  }),
)
app.use(express.json({ limit: '4mb' }))

// ── Routes ────────────────────────────────────────────────────────────────────
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

// ── HTTP + WebSocket server ────────────────────────────────────────────────────
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer })

wss.on('connection', (ws) => {
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

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Strix server running on http://localhost:${PORT}`)
  console.log(`   WebSocket: ws://localhost:${PORT}`)
  console.log(`   Health:    http://localhost:${PORT}/health\n`)
})
