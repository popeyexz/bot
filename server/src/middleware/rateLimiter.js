/**
 * Simple in-memory sliding-window rate limiter.
 * No external dependencies — suitable for single-instance deployments.
 */

/** @type {Map<string, number[]>} ip → array of request timestamps */
const store = new Map()

/**
 * Returns an Express middleware that limits requests to `maxRequests` per `windowMs`.
 * Responds with 429 when the limit is exceeded.
 *
 * @param {{ windowMs: number, maxRequests: number, message?: string }} opts
 */
export function rateLimiter({ windowMs, maxRequests, message = 'Too many requests, please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    const timestamps = (store.get(ip) ?? []).filter((t) => t > windowStart)
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: message })
    }
    timestamps.push(now)
    store.set(ip, timestamps)
    return next()
  }
}
