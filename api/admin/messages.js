import { requireAdmin } from '../lib/guard.js'
import { getMessages, markMessageRead, deleteMessage } from '../lib/store.js'

export default async function handler(req, res) {
  const admin = requireAdmin(req)
  if (!admin) return res.status(403).json({ error: '需要管理员权限' })

  if (req.method === 'GET') {
    return res.status(200).json({ messages: getMessages() })
  }

  if (req.method === 'PUT') {
    const { id, action } = req.body || {}
    if (action === 'read' && id) {
      const msg = markMessageRead(id)
      return res.status(msg ? 200 : 404).json({ ok: !!msg })
    }
    return res.status(400).json({ error: '无效操作' })
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id || req.query?.id
    if (!id) return res.status(400).json({ error: '缺少 id' })
    const ok = deleteMessage(id)
    return res.status(ok ? 200 : 404).json({ ok })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
