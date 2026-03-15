/**
 * Coder Agent — uses the local chat API for code generation and review tasks.
 */

/**
 * @param {string} task   Description of the coding task (e.g. "write a Python script to…").
 * @param {{ model?: string, apiKey?: string, baseUrl?: string }} [options]
 * @returns {Promise<string>}
 */
export async function coderAgent(task, options = {}) {
  const baseUrl = options.baseUrl ?? `http://localhost:${process.env.PORT ?? 3001}`
  const model = options.model ?? 'ollama-local'
  const messages = [
    {
      role: 'system',
      content:
        'You are an expert software engineer. Write clean, well-commented code. ' +
        'Always include brief explanations of key design decisions. ' +
        'Prefer simple, readable solutions over clever one-liners.',
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
    throw new Error(`coderAgent: chat API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.content ?? ''
}
