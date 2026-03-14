/** Local tool definitions mirrored server-side for status checks */
export const LOCAL_SERVICES = [
  { id: 'stable-diffusion', name: 'Stable Diffusion Forge', port: 7860, envKey: 'STABLE_DIFFUSION_URL' },
  { id: 'comfyui', name: 'ComfyUI', port: 8188, envKey: 'COMFYUI_URL' },
  { id: 'lm-studio', name: 'LM Studio', port: 1234, envKey: 'LM_STUDIO_URL' },
  { id: 'ollama', name: 'Ollama', port: 11434, envKey: 'OLLAMA_URL' },
  { id: 'vscode-server', name: 'VS Code Server', port: 8080, envKey: null },
  { id: 'portainer', name: 'Portainer', port: 9000, envKey: null },
  { id: 'n8n', name: 'n8n', port: 5678, envKey: null },
  { id: 'syncthing', name: 'Syncthing', port: 8384, envKey: null },
]

export function getLocalTools() {
  return LOCAL_SERVICES.map((s) => {
    const baseUrl = s.envKey ? process.env[s.envKey] : null
    const url = baseUrl ?? `http://localhost:${s.port}`
    return { id: s.id, name: s.name, port: s.port, url }
  })
}

/**
 * Attempt an HTTP HEAD/GET to check if a service is reachable.
 * Returns { id, status, latency } for each service.
 */
export async function checkServiceHealth() {
  const results = await Promise.allSettled(
    LOCAL_SERVICES.map(async (svc) => {
      const baseUrl = svc.envKey ? (process.env[svc.envKey] ?? null) : null
      const url = baseUrl ?? `http://localhost:${svc.port}`
      const start = Date.now()
      try {
        const res = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
          // Ignore self-signed certs in local network
          headers: { Accept: '*/*' },
        })
        const latency = Date.now() - start
        // Consider any HTTP response (even 401/403) as "online"
        return { id: svc.id, status: res.ok || res.status < 500 ? 'online' : 'offline', latency }
      } catch {
        return { id: svc.id, status: 'offline', latency: Date.now() - start }
      }
    }),
  )
  return results.map((r) => (r.status === 'fulfilled' ? r.value : { id: 'unknown', status: 'offline', latency: 0 }))
}
