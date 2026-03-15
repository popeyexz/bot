/**
 * Paperclip — secure file-upload service.
 *
 * Provides multer-based upload middleware with strict validation:
 *   • Allowed MIME types (images, PDFs, plain text, JSON)
 *   • Max file size (10 MB default, configurable via UPLOAD_MAX_MB)
 *   • Destination directory (UPLOAD_DIR env, defaults to server/data/uploads)
 *
 * Usage:
 *   import { uploadMiddleware, listUploads, deleteUpload } from './services/paperclip.js'
 *   app.post('/api/upload', uploadMiddleware, (req, res) => { ... })
 */

import multer from 'multer'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Configuration ───────────────────────────────────────────────────────────
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? join(__dirname, '../../data/uploads')

const MAX_FILE_SIZE_MB = parseInt(process.env.UPLOAD_MAX_MB ?? '10', 10)
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

/** Allowed MIME types — extend as needed. */
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/json',
])

/** Allowed file extensions (lower-case, with leading dot). */
const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.pdf', '.txt', '.json',
])

// ── Ensure upload directory exists ──────────────────────────────────────────
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

// ── Multer storage ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename(_req, file, cb) {
    const ext = extname(file.originalname).toLowerCase()
    // UUID prefix avoids collisions and hides original file names
    cb(null, `${randomUUID()}${ext}`)
  },
})

/**
 * Filter function — rejects files that fail MIME-type or extension checks.
 */
function fileFilter(_req, file, cb) {
  const ext = extname(file.originalname).toLowerCase()
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`File type "${file.mimetype}" is not allowed.`), false)
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File extension "${ext}" is not allowed.`), false)
  }
  cb(null, true)
}

/**
 * Ready-to-use multer middleware accepting a single file under the field
 * name "file".  Attach this to any route that should accept uploads.
 */
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('file')

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * List all files in the uploads directory with basic metadata.
 * @returns {{ name: string, size: number, createdAt: string }[]}
 */
export function listUploads() {
  if (!existsSync(UPLOAD_DIR)) return []
  return readdirSync(UPLOAD_DIR)
    .filter((f) => !f.startsWith('.'))
    .map((name) => {
      const full = join(UPLOAD_DIR, name)
      const info = statSync(full)
      return { name, size: info.size, createdAt: info.birthtime.toISOString() }
    })
}

/**
 * Delete a previously-uploaded file by name.
 * Returns `true` if the file was removed, `false` if it was not found.
 *
 * @param {string} filename
 */
export function deleteUpload(filename) {
  // Prevent directory traversal
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '')
  const full = join(UPLOAD_DIR, safe)
  if (!existsSync(full)) return false
  unlinkSync(full)
  return true
}
