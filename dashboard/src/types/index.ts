export interface Tool {
  id: string
  name: string
  description: string
  url: string
  category: ToolCategory
  icon: string
  color: string
  isLocal: boolean
  port?: number
  tags?: string[]
}

export type ToolCategory =
  | 'AI/ML'
  | 'Dev Tools'
  | 'Creative'
  | 'Cloud AI'
  | 'Automation'
  | 'Productivity'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  timestamp: Date
  isStreaming?: boolean
}

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'ollama'
  description: string
  requiresKey: boolean
  maxTokens: number
  color: string
  /** True for permissive/uncensored open-source models (run locally via Ollama) */
  isUncensored?: boolean
  /** Exact Ollama model tag used with `ollama pull <ollamaName>` */
  ollamaName?: string
}

export interface UncensoredModelInfo {
  /** Matches ModelConfig.id */
  id: string
  name: string
  ollamaName: string
  description: string
  /** Approximate VRAM/RAM needed, e.g. "8 GB RAM" */
  ramRequired: string
  /** Relative hardware tier: 'low' | 'mid' | 'high' */
  tier: 'low' | 'mid' | 'high'
  tags: string[]
  /** Approximate parameter count for display */
  params: string
}

export interface ServiceStatus {
  id: string
  name: string
  url: string
  port?: number
  status: 'online' | 'offline' | 'checking'
  latency?: number
  lastChecked?: Date
}

export interface SystemStats {
  cpuUsage: number
  memoryUsage: number
  memoryTotal: number
  diskUsage: number
  diskTotal: number
  uptime: number
  activeServices: number
  totalServices: number
}

export interface ApiKeys {
  openai: string
  anthropic: string
  google: string
  deepseek: string
}

export interface ServiceUrls {
  ollama: string
  stableDiffusion: string
  comfyui: string
  lmStudio: string
  server: string
}

export interface ChatRequest {
  model: string
  messages: { role: string; content: string }[]
  apiKey?: string
}

export interface MultiModelResult {
  model: string
  content: string
  error?: string
  latency: number
}
