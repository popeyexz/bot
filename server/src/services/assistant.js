/**
 * Assistant service — builds the "Aria" persona system prompt from persistent
 * memory + live service health, and generates self-healing repair suggestions.
 */

import { getMemory } from './memory.js'
import { checkServiceHealth } from './health.js'

export const ASSISTANT_NAME = process.env.ASSISTANT_NAME ?? 'Aria'

/**
 * Map of service IDs → human-readable repair instructions.
 * Shown in the dashboard's Self-Healing panel and injected into Aria's context.
 */
const HEAL_SUGGESTIONS = {
  ollama: 'Run: `ollama serve` — or install from https://ollama.ai/install',
  'stable-diffusion':
    'Start SD Forge: `cd stable-diffusion-webui && ./webui.sh` (Linux) or run `webui-user.bat` (Windows)',
  comfyui: 'Start ComfyUI: `cd ComfyUI && python main.py --listen`',
  'lm-studio':
    'Open the LM Studio desktop app → click "Start Server" on the Local Server tab (port 1234)',
  'vscode-server':
    'Start VS Code Server: `code-server --bind-addr 0.0.0.0:8080 .` — or `docker start code-server`',
  portainer:
    'Start Portainer: `docker start portainer` — or re-run the install command from README',
  n8n: 'Start n8n: `docker start n8n` — or `npx n8n start`',
  syncthing: 'Start Syncthing: `syncthing` — or enable as a systemd service: `systemctl --user start syncthing`',
}

export function getHealingSuggestion(serviceId) {
  return HEAL_SUGGESTIONS[serviceId] ?? `Check logs and restart the "${serviceId}" service.`
}

/**
 * Build the system prompt that gives Aria her persona, memory context, and
 * awareness of which local services are online / offline.
 */
export function buildSystemPrompt(serviceStatuses = []) {
  const memory = getMemory()
  const userName = memory.user?.name ?? 'Sharuk'
  const prefs = memory.user?.preferences ?? {}
  const prefsText =
    Object.keys(prefs).length > 0
      ? Object.entries(prefs)
          .map(([k, v]) => `  • ${k}: ${v}`)
          .join('\n')
      : '  (none yet — ask me to remember something!)'

  const projects = (memory.user?.projects ?? [])
    .map((p) => `  • ${typeof p === 'string' ? p : `${p.name}${p.description ? ': ' + p.description : ''}`}`)
    .join('\n') || '  (none yet)'

  const notes = (memory.user?.notes ?? [])
    .slice(0, 8)
    .map((n) => `  • ${n}`)
    .join('\n') || '  (none yet)'

  const team = (memory.team ?? [])
    .map((t) => `  • ${t.name}${t.role ? ' — ' + t.role : ''}`)
    .join('\n') || '  (no team members added yet)'

  const online = serviceStatuses.filter((s) => s.status === 'online').map((s) => s.id)
  const offline = serviceStatuses.filter((s) => s.status === 'offline').map((s) => s.id)

  const statusNote =
    offline.length > 0
      ? `⚠️  OFFLINE: ${offline.join(', ')} — you MUST proactively mention this and offer repair steps.`
      : `✅  All monitored services appear online.`

  return `You are ${ASSISTANT_NAME}, ${userName}'s persistent personal AI assistant and base-layer orchestrator. You are warm, direct, and deeply reliable — like a caring senior teammate who knows every corner of ${userName}'s setup.

WHAT YOU KNOW ABOUT ${userName.toUpperCase()}:
User preferences:
${prefsText}

Active projects:
${projects}

Saved notes:
${notes}

Team / partners:
${team}

LIVE SERVICE STATUS (as of this message):
Online: ${online.join(', ') || 'none detected'}
${statusNote}

YOUR ROLE:
• Answer questions and assist with any task using full context of ${userName}'s setup.
• When a service is offline, immediately offer the exact restart command.
• When the user mentions a new preference, project, or person, confirm you've noted it by saying "I've noted that."
• Be proactive — warn about issues, suggest improvements, and flag opportunities without being asked.
• Act as intermediary: relay tasks to tools, agents, APIs, and team members as needed.
• Keep responses conversational yet thorough. No unnecessary filler, no corporate speak.

You have access to the dashboard API. If the user asks you to remember something, tell them the key/value they should save (e.g. "I'll note that — you can save it as 'user.preferences.theme = dark' in the Memory panel").`
}

/**
 * Fetch live service statuses and return the full assistant context object
 * (system prompt + healing alerts) to be used in the /api/assistant/chat route.
 */
export async function buildAssistantContext() {
  let serviceStatuses = []
  try {
    serviceStatuses = await checkServiceHealth()
  } catch {
    // proceed without live status
  }

  const systemPrompt = buildSystemPrompt(serviceStatuses)
  const offline = serviceStatuses.filter((s) => s.status === 'offline')
  const online = serviceStatuses.filter((s) => s.status === 'online')

  return {
    systemPrompt,
    serviceStatuses,
    onlineCount: online.length,
    offlineCount: offline.length,
    healingAlerts: offline.map((s) => ({
      id: s.id,
      name: s.name ?? s.id,
      status: 'offline',
      suggestion: getHealingSuggestion(s.id),
    })),
  }
}
