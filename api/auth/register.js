import { sign, verify, hashPassword, verifyPassword } from '../lib/auth.js'
import { findUserByEmail, createUser, getUsers } from '../lib/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, name } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' })
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: '该邮箱已注册' })
  }

  const user = createUser({
    email: email.trim().toLowerCase(),
    name: (name || email.split('@')[0]).trim(),
    password: hashPassword(password)
  })

  const token = sign({ sub: user.id, email: user.email, role: user.role })
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  })
}
