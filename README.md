# Strix — AI Tools Dashboard

> A unified, production-quality dashboard for launching, managing, and chatting with AI tools — local and cloud.

![Dark theme dashboard with sidebar, tool grid, and AI chat](https://img.shields.io/badge/theme-dark-1a1a2e?style=flat-square) ![React 18](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript) ![Node.js](https://img.shields.io/badge/Node.js-20-5fa04e?style=flat-square&logo=node.js) ![License MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quickstart](#quickstart)
3. [Docker Usage](#docker-usage)
4. [Environment Variables](#environment-variables)
5. [AI Model Setup](#ai-model-setup)
6. [Ollama Integration](#ollama-integration)
7. [Tool Categories](#tool-categories)
8. [Feature Details](#feature-details)
9. [Expansion Guide](#expansion-guide)
10. [Secrets Management](#secrets-management)

---

## Architecture Overview

```
strix/
├── dashboard/          # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── components/ # Layout, Sidebar, ToolCard
│   │   ├── pages/      # Dashboard, Tools, Chat, Analytics, Settings
│   │   ├── data/       # Tool and model definitions
│   │   ├── hooks/      # useServiceStatus (real-time polling)
│   │   └── types/      # TypeScript interfaces
│   └── Dockerfile      # nginx multi-stage build
│
├── server/             # Express + Node.js backend
│   └── src/
│       ├── index.js            # HTTP + WebSocket server
│       └── services/
│           ├── chat.js         # AI provider proxies
│           ├── health.js       # Service health checks
│           ├── sync.js         # File sync utility
│           └── ollama.js       # Ollama model listing
│
├── docker-compose.yml  # Production deployment
├── install.sh          # One-command setup
├── .env.example        # Config template
└── README.md
```

**Data flow:**

```
Browser (port 3000)
  │
  ├── /api/*  ──────►  Express server (port 3001)
  │                       ├── OpenAI / Anthropic / Google / DeepSeek
  │                       ├── Ollama  (localhost:11434)
  │                       └── Health checks → local services
  │
  └── WebSocket ──────►  Real-time status updates (15s interval)
```

---

## Quickstart

### Prerequisites

- **Node.js ≥ 18** — [nodejs.org](https://nodejs.org)
- Git

### One-command install

```bash
git clone <your-repo-url> strix && cd strix
bash install.sh
```

The script will:
1. Verify Node.js ≥ 18
2. Copy `.env.example` → `.env`
3. Install and build the frontend
4. Install server dependencies

### Manual setup

```bash
# 1. Frontend
cd dashboard
npm install
npm run dev          # http://localhost:3000

# 2. Backend (separate terminal)
cd server
cp ../.env.example ../.env   # edit with your keys
npm start            # http://localhost:3001
```

---

## Docker Usage

```bash
# Copy and edit env vars
cp .env.example .env
nano .env

# Build and start all services
docker compose up --build

# Dashboard:  http://localhost:3000
# API server: http://localhost:3001
```

**Docker Compose services:**

| Service     | Port  | Description                        |
|-------------|-------|------------------------------------|
| `dashboard` | 3000  | nginx serving React SPA            |
| `server`    | 3001  | Node.js API + WebSocket server     |

> Local AI services (Ollama, Stable Diffusion, etc.) run **outside** Docker on your host machine. The server container reaches them via `host.docker.internal`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable               | Default                        | Description                      |
|------------------------|--------------------------------|----------------------------------|
| `OPENAI_API_KEY`       | —                              | OpenAI key (GPT-4o)             |
| `ANTHROPIC_API_KEY`    | —                              | Anthropic key (Claude 3.5)      |
| `GOOGLE_API_KEY`       | —                              | Google AI key (Gemini Pro)      |
| `DEEPSEEK_API_KEY`     | —                              | DeepSeek API key                |
| `OLLAMA_URL`           | `http://localhost:11434`       | Ollama server URL               |
| `STABLE_DIFFUSION_URL` | `http://localhost:7860`        | SD Forge / AUTOMATIC1111        |
| `COMFYUI_URL`          | `http://localhost:8188`        | ComfyUI URL                     |
| `LM_STUDIO_URL`        | `http://localhost:1234`        | LM Studio URL                   |
| `PORT`                 | `3001`                         | Backend server port             |
| `FRONTEND_URL`         | `http://localhost:3000`        | Allowed CORS origin             |
| `SYNC_SOURCE_DIR`      | —                              | Source dir for art sync         |
| `SYNC_TARGET_DIR`      | —                              | Target dir for art sync         |

---

## AI Model Setup

### OpenAI (GPT-4o)

1. Get a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to `.env`: `OPENAI_API_KEY=sk-...`

### Anthropic (Claude 3.5 Sonnet)

1. Get a key at [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### Google (Gemini Pro)

1. Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Add to `.env`: `GOOGLE_API_KEY=AIza...`

### DeepSeek

1. Get a key at [platform.deepseek.com](https://platform.deepseek.com)
2. Add to `.env`: `DEEPSEEK_API_KEY=sk-...`

---

## Ollama Integration

[Ollama](https://ollama.ai) lets you run LLMs locally — no API key needed.

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3
ollama pull mistral
ollama pull codellama
ollama pull phi3

# Ollama runs automatically on http://localhost:11434
```

The dashboard will:
- Auto-detect available Ollama models via `GET /api/models`
- Show Ollama status in the service health panel
- Route "Ollama (Local)" chat messages to the running server

---

## Tool Categories

| Category     | Tools                                                          |
|--------------|----------------------------------------------------------------|
| **AI/ML**    | Stable Diffusion Forge, ComfyUI, LM Studio, Ollama            |
| **Dev Tools**| VS Code Server, Portainer, GitHub                             |
| **Creative** | Blender, Unity, Godot                                         |
| **Cloud AI** | ChatGPT, Claude, Gemini, Perplexity                          |
| **Automation**| n8n, Syncthing, RustDesk                                     |
| **Productivity**| Notion, Figma, Cursor                                      |

Each card shows:
- Gradient icon with tool brand colour
- Live status badge (online/offline) for local services with latency
- Category tag
- One-click launch in new tab

---

## Feature Details

### Dashboard Overview (`/`)
- Welcome header with gradient accent
- Quick stats: total tools, AI models, local services, online count
- Featured 6-tool grid for fast access
- Local service status grid

### Tool Launcher (`/tools`)
- Category filter tabs + search box
- Responsive grid (2–5 columns)
- Live status polling every 30 seconds

### AI Chat (`/chat`)
- Single-model chat with model selector
- **Multi-model mode**: send one prompt to multiple models simultaneously and compare results side-by-side
- Message history with copy button
- Streaming-ready architecture (extend with `stream: true`)

### Analytics (`/analytics`)
- CPU activity sparkline (updates every 5s with mock + real data)
- Memory, disk, uptime stat cards
- Per-service latency display
- Model usage breakdown chart

### Settings (`/settings`)
- Masked API key inputs (show/hide toggle)
- Local service URL overrides
- Persisted to `localStorage` (or use `.env` for server-side)

---

## Expansion Guide

### Add a new tool

Edit `dashboard/src/data/tools.ts`:

```typescript
{
  id: 'my-tool',
  name: 'My Tool',
  description: 'What it does',
  url: 'http://localhost:9999',
  category: 'Dev Tools',   // or any ToolCategory
  icon: 'Terminal',        // any lucide-react icon name
  color: 'from-indigo-500 to-purple-600',
  isLocal: true,
  port: 9999,
  tags: ['my', 'tags'],
}
```

Then add it to `server/src/services/health.js` `LOCAL_SERVICES` array for status monitoring.

### Add a new AI provider

Edit `server/src/services/chat.js` — add a new async function and route it in `chatHandler`.

Add the model config to `dashboard/src/data/tools.ts` `MODELS` array.

### Add a new page

1. Create `dashboard/src/pages/MyPage.tsx`
2. Add route in `dashboard/src/App.tsx`
3. Add nav item in `dashboard/src/components/Sidebar.tsx`

### Enable real streaming

In `chat.js`, change the OpenAI call to `stream: true` and pipe the SSE response back to the client. In `Chat.tsx`, consume a `ReadableStream` and update message content incrementally.

---

## Secrets Management

| Approach | When to use |
|----------|-------------|
| **`.env` file** | Local development and self-hosted production. Never commit. |
| **Browser localStorage** (Settings page) | Per-user keys on a shared install. Keys stay in the browser. |
| **Docker secrets / env vars** | `docker compose` injects env vars from `.env` at runtime. |
| **Vault / secret manager** | Production multi-user deployments — replace `process.env` reads in `chat.js` with vault SDK calls. |

**Important:** The `.env` file is in `.gitignore`. Never commit real API keys. Rotate keys immediately if accidentally exposed.

---

## License

MIT — see [LICENSE](LICENSE) for details.
