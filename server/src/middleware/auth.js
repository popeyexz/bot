/**
 * Optional API key authentication middleware.
 *
 * When API_SECRET_KEY is set in the environment, every request must supply it
 * via the `X-API-Key` request header.
 * If the env variable is NOT set the middleware is a no-op, preserving
 * backward-compatible behaviour for local / development installs.
 *
 * Usage:
 *   import { requireApiKey } from './middleware/auth.js'
 *   app.post('/api/memory', requireApiKey, ...)
 */

const SECRET = process.env.API_SECRET_KEY

/**
 * Express middleware that enforces the API_SECRET_KEY when it is configured.
 * The key must be supplied via the `X-API-Key` request header.
 * Returns 401 for missing credentials and 403 for wrong credentials.
 */
export function requireApiKey(req, res, next) {
  if (!SECRET) return next()

  const supplied = req.headers['x-api-key'] ?? ''
  if (!supplied) {
    return res.status(401).json({ error: 'Missing API key. Supply X-API-Key header.' })
  }
  if (supplied !== SECRET) {
    return res.status(403).json({ error: 'Invalid API key.' })
  }
  return next()
}
