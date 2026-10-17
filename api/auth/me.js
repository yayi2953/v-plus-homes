import { verify } from '../../lib/auth.js'
import { getUsers } from '../../lib/store.js'

function getToken(req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = getToken(req)
  if (!token) return res.status(401).json({ error: '未登录' })

  const payload = verify(token)
  if (!payload) return res.status(401).json({ error: '登录已过期' })

  const users = getUsers()
  const user = users.find((u) => u.id === payload.sub)
  if (!user) return res.status(401).json({ error: '用户不存在' })

  res.status(200).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  })
}
