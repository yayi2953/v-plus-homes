import { requireAdmin } from '../../lib/guard.js'
import { getUsers } from '../../lib/store.js'

export default async function handler(req, res) {
  const admin = requireAdmin(req)
  if (!admin) return res.status(403).json({ error: '需要管理员权限' })

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const users = getUsers().map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
  }))

  res.status(200).json({ users })
}
