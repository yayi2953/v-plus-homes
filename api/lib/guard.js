import { verify } from './auth.js'
import { getUsers } from './store.js'

// 解析并校验管理员身份，失败返回 null
export function requireAdmin(req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const payload = verify(m[1])
  if (!payload) return null
  if (payload.role !== 'admin') return null
  const users = getUsers()
  const user = users.find((u) => u.id === payload.sub)
  if (!user || user.role !== 'admin') return null
  return user
}

// 解析普通登录用户
export function requireAuth(req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const payload = verify(m[1])
  if (!payload) return null
  const users = getUsers()
  return users.find((u) => u.id === payload.sub) || null
}
