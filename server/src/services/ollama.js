export async function ollamaModels() {
  const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434'
  const res = await fetch(`${ollamaUrl}/api/tags`, {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Ollama responded with ${res.status}`)
  const data = await res.json()
  return data
}
