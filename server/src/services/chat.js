/**
 * Proxy AI chat requests to OpenAI, Anthropic, Google, DeepSeek, or Ollama.
 * Falls back to an informative error message when keys are missing.
 */

async function openaiChat(model, messages, apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) return { content: '⚠️ OpenAI API key not configured. Add OPENAI_API_KEY to .env or Settings.' }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 2048 }),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  if (!res.ok) return { content: `OpenAI error: ${data.error?.message ?? res.statusText}` }
  return { content: data.choices?.[0]?.message?.content ?? '' }
}

async function anthropicChat(model, messages, apiKey) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) return { content: '⚠️ Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env or Settings.' }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, messages, max_tokens: 2048 }),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  if (!res.ok) return { content: `Anthropic error: ${data.error?.message ?? res.statusText}` }
  return { content: data.content?.[0]?.text ?? '' }
}

async function googleChat(messages, apiKey) {
  const key = apiKey || process.env.GOOGLE_API_KEY
  if (!key) return { content: '⚠️ Google API key not configured. Add GOOGLE_API_KEY to .env or Settings.' }

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
      signal: AbortSignal.timeout(30000),
    },
  )
  const data = await res.json()
  if (!res.ok) return { content: `Gemini error: ${data.error?.message ?? res.statusText}` }
  return { content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' }
}

async function deepseekChat(messages, apiKey) {
  const key = apiKey || process.env.DEEPSEEK_API_KEY
  if (!key) return { content: '⚠️ DeepSeek API key not configured. Add DEEPSEEK_API_KEY to .env or Settings.' }

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 2048 }),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  if (!res.ok) return { content: `DeepSeek error: ${data.error?.message ?? res.statusText}` }
  return { content: data.choices?.[0]?.message?.content ?? '' }
}

async function ollamaChat(messages, requestedModel) {
  const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434'

  // If a specific model was requested (e.g. an uncensored model), use it directly.
  // Otherwise auto-pick the first available model from Ollama's list.
  let model = requestedModel && requestedModel !== 'ollama-local' ? requestedModel : null
  if (!model) {
    model = 'llama3'
    try {
      const listRes = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
      if (listRes.ok) {
        const listData = await listRes.json()
        if (listData.models?.length > 0) model = listData.models[0].name
      }
    } catch {
      // use default
    }
  }

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) {
    const text = await res.text()
    return { content: `Ollama error (${res.status}): ${text}` }
  }
  const data = await res.json()
  return { content: data.message?.content ?? '' }
}

/** Model IDs that map to local Ollama models (uncensored / permissive) */
const OLLAMA_LOCAL_MODELS = new Set([
  'ollama-local',
  'nous-hermes2',
  'openhermes',
  'dolphin-mistral',
  'dolphin-mixtral',
  'wizard-vicuna-uncensored',
  'deepseek-v2',
  'llama2-uncensored',
])

export async function chatHandler(req, res) {
  const { model, messages, apiKey } = req.body ?? {}

  if (!model || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'model and messages are required' })
  }

  let result
  if (model.startsWith('gpt-') || model.startsWith('o1')) {
    result = await openaiChat(model, messages, apiKey)
  } else if (model.startsWith('claude-')) {
    result = await anthropicChat(model, messages, apiKey)
  } else if (model.startsWith('gemini')) {
    result = await googleChat(messages, apiKey)
  } else if (model === 'deepseek-chat' || (model.startsWith('deepseek') && !OLLAMA_LOCAL_MODELS.has(model))) {
    result = await deepseekChat(messages, apiKey)
  } else if (OLLAMA_LOCAL_MODELS.has(model) || model.startsWith('ollama')) {
    // Route both the generic ollama-local and named uncensored models to Ollama
    result = await ollamaChat(messages, model)
  } else {
    // Unknown model — try Ollama as a fallback (user may have pulled a custom model).
    // Wrap in try-catch so we return a helpful message if the model is not found.
    try {
      result = await ollamaChat(messages, model)
    } catch {
      result = {
        content: `Unknown model: "${model}". If this is a custom Ollama model, make sure Ollama is running and the model has been pulled with \`ollama pull ${model}\`.`,
      }
    }
  }

  return res.json(result)
}
