/**
 * Research Agent — uses the local chat API to answer research queries.
 * Sends the query to the configured AI model and returns the response text.
 */

/**
 * @param {string} query  The research question or topic.
 * @param {{ model?: string, apiKey?: string, baseUrl?: string }} [options]
 * @returns {Promise<string>}
 */
export async function researchAgent(query, options = {}) {
  const baseUrl = options.baseUrl ?? `http://localhost:${process.env.PORT ?? 3001}`
  const model = options.model ?? 'ollama-local'
  const messages = [
    {
      role: 'system',
      content:
        'You are a focused research assistant. Provide concise, factual answers with key sources where relevant.',
    },
    { role: 'user', content: query },
  ]

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, apiKey: options.apiKey }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`researchAgent: chat API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.content ?? ''
}
