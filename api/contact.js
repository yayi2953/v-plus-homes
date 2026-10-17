import { createMessage } from './lib/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, phone, message, type } = req.body || {}
  if (!name || !email || !message) {
    return res.status(400).json({ error: '姓名、邮箱和留言不能为空' })
  }

  const msg = createMessage({
    name: String(name).slice(0, 100),
    email: String(email).slice(0, 200),
    phone: phone ? String(phone).slice(0, 50) : '',
    message: String(message).slice(0, 2000),
    type: type || 'contact'
  })

  res.status(201).json({ ok: true, message: msg })
}
