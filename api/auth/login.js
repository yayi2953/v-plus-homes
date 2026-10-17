import { sign, verifyPassword } from '../lib/auth.js'
import { findUserByEmail } from '../lib/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  const user = findUserByEmail(email)
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: '邮箱或密码错误' })
  }

  const token = sign({ sub: user.id, email: user.email, role: user.role })
  res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  })
}
