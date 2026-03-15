/**
 * Security middleware — adds HTTP security headers via helmet, input
 * sanitisation for JSON payloads, and a timing-safe API-key comparison
 * utility used by the auth module.
 *
 * Import order in index.js:
 *   1. helmet()          — sets secure HTTP headers
 *   2. sanitiseInput()   — strips dangerous characters from string values
 */

import helmet from 'helmet'
import { timingSafeEqual } from 'crypto'

// ── Helmet (HTTP security headers) ──────────────────────────────────────────
/**
 * Pre-configured helmet middleware.
 * – CSP is relaxed enough for a local dashboard (inline styles, same-origin).
 * – HSTS is enabled so reverse-proxy deployments get strict transport.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // allow cross-origin images from local services
})

// ── Input Sanitisation ──────────────────────────────────────────────────────
/**
 * Recursively walk a value and strip characters commonly used in injection
 * attacks from every string leaf.  Arrays and plain objects are traversed;
 * other types are returned as-is.
 */
function sanitise(value) {
  if (typeof value === 'string') {
    return value
      .replace(/[<>]/g, '')     // strip angle brackets (basic XSS vector)
      .replace(/\0/g, '')       // strip null bytes
  }
  if (Array.isArray(value)) return value.map(sanitise)
  if (value !== null && typeof value === 'object') {
    const clean = {}
    for (const [k, v] of Object.entries(value)) {
      clean[k] = sanitise(v)
    }
    return clean
  }
  return value
}

/**
 * Express middleware that sanitises `req.body` on every request that
 * carries a JSON payload.
 */
export function sanitiseInput(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitise(req.body)
  }
  next()
}

// ── Timing-safe comparison ──────────────────────────────────────────────────
/**
 * Constant-time string comparison to prevent timing attacks on API key
 * validation.  Returns `false` when either argument is empty / undefined.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function safeEqual(a, b) {
  if (!a || !b) return false
  // Pad to equal length so timingSafeEqual doesn't throw
  const maxLen = Math.max(a.length, b.length)
  const bufA = Buffer.alloc(maxLen, 0)
  const bufB = Buffer.alloc(maxLen, 0)
  bufA.write(a)
  bufB.write(b)
  // Also check lengths explicitly so padded comparison can't be tricked
  return a.length === b.length && timingSafeEqual(bufA, bufB)
}
