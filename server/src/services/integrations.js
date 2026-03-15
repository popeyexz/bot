/**
 * Free API Integration Service
 *
 * Provides a registry of free, public APIs that are useful for dashboard
 * enrichment (crypto prices, exchange rates, news headlines, weather).
 * Each integration is validated through a security check before activation.
 *
 * Security checks performed before any API is called:
 *   1. URL must be HTTPS
 *   2. Domain must be in the allow-list
 *   3. Rate limiting per-integration (configurable)
 *   4. Response size limit (prevents memory exhaustion)
 *   5. Request timeout (prevents hanging)
 */

// ── Security Allow-List ─────────────────────────────────────────────────────
/**
 * Only domains in this set may be contacted.  Add new free APIs here after
 * reviewing their privacy policy and terms of service.
 */
const ALLOWED_DOMAINS = new Set([
  'api.coingecko.com',
  'open.er-api.com',
  'api.exchangerate.host',
  'newsdata.io',
  'wttr.in',
  'api.github.com',
])

/** Maximum response body size (512 KB) to prevent memory abuse. */
const MAX_RESPONSE_BYTES = 512 * 1024

/** Default per-request timeout (8 seconds). */
const TIMEOUT_MS = 8_000

// ── Per-integration sliding-window rate limiter ─────────────────────────────
/** @type {Map<string, number[]>} integrationId → timestamps */
const hitMap = new Map()

/**
 * Returns `true` if the integration has exceeded its rate limit.
 * @param {string} id   Integration identifier.
 * @param {number} max  Max requests per window.
 * @param {number} windowMs  Window length in milliseconds.
 */
function isRateLimited(id, max, windowMs) {
  const now = Date.now()
  const ts = (hitMap.get(id) ?? []).filter((t) => t > now - windowMs)
  if (ts.length >= max) return true
  ts.push(now)
  hitMap.set(id, ts)
  return false
}

// ── Security Gate ───────────────────────────────────────────────────────────
/**
 * Validates a URL before making a request.  Throws on failure.
 * @param {string} urlString
 */
function securityCheck(urlString) {
  const url = new URL(urlString)
  if (url.protocol !== 'https:') {
    throw new Error(`Security: only HTTPS URLs are allowed (got ${url.protocol})`)
  }
  if (!ALLOWED_DOMAINS.has(url.hostname)) {
    throw new Error(`Security: domain "${url.hostname}" is not in the allow-list`)
  }
}

/**
 * Perform a validated fetch:  security check → rate-limit check → fetch with
 * timeout and response-size guard.
 *
 * @param {string} id       Integration identifier (for rate limiting).
 * @param {string} url      Target URL (must be HTTPS + allow-listed).
 * @param {{ max?: number, windowMs?: number }} [limits]
 * @returns {Promise<any>}  Parsed JSON body.
 */
async function safeFetch(id, url, limits = {}) {
  securityCheck(url)

  const max = limits.max ?? 30
  const windowMs = limits.windowMs ?? 60_000
  if (isRateLimited(id, max, windowMs)) {
    throw new Error(`Rate limit exceeded for integration "${id}".`)
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Strix-Dashboard/1.0' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Integration "${id}" returned HTTP ${res.status}`)
  }

  // Guard against oversized responses
  const text = await res.text()
  if (text.length > MAX_RESPONSE_BYTES) {
    throw new Error(`Integration "${id}" response exceeds size limit`)
  }
  return JSON.parse(text)
}

// ── Integration Registry ────────────────────────────────────────────────────

/**
 * Each entry describes a free API integration.
 *
 * Fields:
 *   id          – unique slug
 *   name        – human-readable label
 *   description – what it provides
 *   category    – grouping tag
 *   fetch()     – async function that returns the data (calls safeFetch)
 */
const INTEGRATIONS = [
  {
    id: 'coingecko-prices',
    name: 'CoinGecko Crypto Prices',
    description: 'Top cryptocurrency prices (BTC, ETH, SOL) in USD — free, no API key required.',
    category: 'finance',
    async fetch() {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'
      return safeFetch('coingecko-prices', url, { max: 15, windowMs: 60_000 })
    },
  },
  {
    id: 'exchange-rates',
    name: 'Open Exchange Rates',
    description: 'Live USD exchange rates for major currencies — free, no API key required.',
    category: 'finance',
    async fetch() {
      const url = 'https://open.er-api.com/v6/latest/USD'
      return safeFetch('exchange-rates', url, { max: 15, windowMs: 60_000 })
    },
  },
  {
    id: 'github-trending',
    name: 'GitHub Trending Repos',
    description: 'Search for recently created popular repositories on GitHub — free, no API key required.',
    category: 'developer',
    async fetch() {
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      const url = `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=10`
      return safeFetch('github-trending', url, { max: 10, windowMs: 60_000 })
    },
  },
  {
    id: 'weather',
    name: 'Weather (wttr.in)',
    description: 'Current weather summary — free, no API key required.',
    category: 'utility',
    async fetch() {
      const url = 'https://wttr.in/?format=j1'
      return safeFetch('weather', url, { max: 10, windowMs: 60_000 })
    },
  },
]

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Return metadata for every registered integration (without calling them).
 */
export function listIntegrations() {
  return INTEGRATIONS.map(({ id, name, description, category }) => ({
    id,
    name,
    description,
    category,
  }))
}

/**
 * Run a single integration by ID.
 * @param {string} id
 * @returns {Promise<{ id: string, data: any }>}
 */
export async function runIntegration(id) {
  const integration = INTEGRATIONS.find((i) => i.id === id)
  if (!integration) throw new Error(`Unknown integration: "${id}"`)
  const data = await integration.fetch()
  return { id, name: integration.name, category: integration.category, data }
}

/**
 * Run every registered integration in parallel, collecting results and errors.
 * Never rejects — partial failures are returned alongside successes.
 *
 * @returns {Promise<{ results: object[], errors: object[] }>}
 */
export async function runAllIntegrations() {
  const settled = await Promise.allSettled(
    INTEGRATIONS.map(async (i) => {
      const data = await i.fetch()
      return { id: i.id, name: i.name, category: i.category, data }
    }),
  )

  const results = []
  const errors = []
  for (const s of settled) {
    if (s.status === 'fulfilled') results.push(s.value)
    else errors.push({ error: String(s.reason) })
  }
  return { results, errors }
}
