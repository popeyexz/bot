/**
 * Automation Agent — uses the local chat API to plan and describe automation workflows.
 */

/**
 * @param {string} task   Description of the automation task (e.g. "scrape pricing data from…").
 * @param {{ model?: string, apiKey?: string, baseUrl?: string }} [options]
 * @returns {Promise<string>}
 */
export async function automationAgent(task, options = {}) {
  const baseUrl = options.baseUrl ?? `http://localhost:${process.env.PORT ?? 3001}`
  const model = options.model ?? 'ollama-local'
  const messages = [
    {
      role: 'system',
      content:
        'You are an automation specialist. When given a task, produce a clear, ' +
        'step-by-step automation plan. Where appropriate, provide shell commands, ' +
        'Python snippets, or n8n workflow descriptions. Be concise and actionable.',
    },
    { role: 'user', content: task },
  ]

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, apiKey: options.apiKey }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`automationAgent: chat API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.content ?? ''
}
