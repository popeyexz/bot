import { readdir, copyFile, mkdir, stat } from 'fs/promises'
import { join } from 'path'

export async function syncHandler(req, res) {
  const source = req.body?.source ?? process.env.SYNC_SOURCE_DIR
  const target = req.body?.target ?? process.env.SYNC_TARGET_DIR

  if (!source || !target) {
    return res.status(400).json({
      error: 'source and target directories are required',
      hint: 'Set SYNC_SOURCE_DIR and SYNC_TARGET_DIR in .env or pass in request body',
    })
  }

  try {
    await stat(source)
  } catch {
    return res.status(400).json({ error: `Source directory not found: ${source}` })
  }

  try {
    await mkdir(target, { recursive: true })
  } catch (err) {
    return res.status(500).json({ error: `Cannot create target directory: ${String(err)}` })
  }

  const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff'])
  let copied = 0
  let skipped = 0

  try {
    const entries = await readdir(source, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = entry.name.split('.').pop()?.toLowerCase() ?? ''
      if (!IMAGE_EXTS.has(`.${ext}`)) {
        skipped++
        continue
      }
      const src = join(source, entry.name)
      const dst = join(target, entry.name)
      try {
        await copyFile(src, dst)
        copied++
      } catch {
        skipped++
      }
    }
    return res.json({ success: true, copied, skipped, source, target })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
