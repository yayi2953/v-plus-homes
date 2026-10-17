import { sign, verify, hashPassword, verifyPassword } from './lib/auth.js'
import {
  initDb,
  getUsers, getListings, getMessages,
  findUserByEmail, createUser,
  createListing, updateListing, deleteListing,
  createMessage, markMessageRead, deleteMessage,
  getTexts, updateTexts, resetTexts, uploadImageToGitHub
} from './lib/store.js'

// 统一入口：所有 /api/* 路由在此函数内分发，共享同一个 /tmp/db.json
// （Vercel 各 serverless 函数 /tmp 隔离，合并到单函数才能跨接口共享数据）
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname

  // 去掉可能的 /api 前缀，得到相对路径
  const rel = path.replace(/^\/api/, '') || '/'

  // CORS（如有需要）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    // 预热：从 GitHub 加载数据库到内存（后续读接口走缓存）
    await initDb()

    // ---------- Auth ----------
    if (rel === '/auth/register' && req.method === 'POST') {
      return register(req, res)
    }
    if (rel === '/auth/login' && req.method === 'POST') {
      return login(req, res)
    }
    if (rel === '/auth/me' && req.method === 'GET') {
      return me(req, res)
    }

    // ---------- Admin ----------
    if (rel === '/admin/listings') {
      return adminListings(req, res)
    }
    if (rel === '/admin/users' && req.method === 'GET') {
      return adminUsers(req, res)
    }
    if (rel === '/admin/messages') {
      return adminMessages(req, res)
    }
    if (rel === '/admin/texts') {
      return adminTexts(req, res)
    }
    if (rel === '/admin/images' && req.method === 'POST') {
      return adminImageUpload(req, res)
    }

    // ---------- Public ----------
    if (rel === '/contact' && req.method === 'POST') {
      return contact(req, res)
    }
    if (rel === '/listings' && req.method === 'GET') {
      return listingsPublic(req, res)
    }
    if (rel === '/messages' && req.method === 'GET') {
      return messagesPublic(req, res)
    }
    if (rel === '/texts' && req.method === 'GET') {
      return textsPublic(req, res)
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (e) {
    console.error('API error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ============ Auth handlers ============
function getToken(req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

function requireAdmin(req) {
  const token = getToken(req)
  if (!token) return null
  const payload = verify(token)
  if (!payload || payload.role !== 'admin') return null
  const user = getUsers().find((u) => u.id === payload.sub)
  if (!user || user.role !== 'admin') return null
  return user
}

function requireAuth(req) {
  const token = getToken(req)
  if (!token) return null
  const payload = verify(token)
  if (!payload) return null
  return getUsers().find((u) => u.id === payload.sub) || null
}

async function register(req, res) {
  const { email, password, name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' })
  if (password.length < 6) return res.status(400).json({ error: '密码至少 6 位' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: '邮箱格式不正确' })
  if (findUserByEmail(email)) return res.status(409).json({ error: '该邮箱已注册' })

  const user = await createUser({
    email: email.trim().toLowerCase(),
    name: (name || email.split('@')[0]).trim(),
    password: hashPassword(password)
  })
  const token = sign({ sub: user.id, email: user.email, role: user.role })
  return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}

async function login(req, res) {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' })
  const user = findUserByEmail(email)
  if (!user || !verifyPassword(password, user.password)) return res.status(401).json({ error: '邮箱或密码错误' })
  const token = sign({ sub: user.id, email: user.email, role: user.role })
  return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}

async function me(req, res) {
  const user = requireAuth(req)
  if (!user) return res.status(401).json({ error: '未登录或登录已过期' })
  return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}

// ============ Admin handlers ============
async function adminListings(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  if (req.method === 'GET') return res.status(200).json({ listings: getListings() })
  if (req.method === 'POST') {
    const data = req.body || {}
    for (const f of ['title', 'type', 'price', 'city']) {
      if (!data[f]) return res.status(400).json({ error: `缺少字段: ${f}` })
    }
    return res.status(201).json({ listing: await createListing(data) })
  }
  if (req.method === 'PUT') {
    const { id, ...fields } = req.body || {}
    if (!id) return res.status(400).json({ error: '缺少 id' })
    const listing = await updateListing(id, fields)
    if (!listing) return res.status(404).json({ error: '房源不存在' })
    return res.status(200).json({ listing })
  }
  if (req.method === 'DELETE') {
    const id = req.body?.id || req.query?.id
    if (!id) return res.status(400).json({ error: '缺少 id' })
    const ok = await deleteListing(id)
    return res.status(ok ? 200 : 404).json({ ok })
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

async function adminUsers(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  const users = getUsers().map((u) => ({
    id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt
  }))
  return res.status(200).json({ users })
}

async function adminMessages(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  if (req.method === 'GET') return res.status(200).json({ messages: getMessages() })
  if (req.method === 'PUT') {
    const { id, action } = req.body || {}
    if (action === 'read' && id) {
      const msg = await markMessageRead(id)
      return res.status(msg ? 200 : 404).json({ ok: !!msg })
    }
    return res.status(400).json({ error: '无效操作' })
  }
  if (req.method === 'DELETE') {
    const id = req.body?.id || req.query?.id
    if (!id) return res.status(400).json({ error: '缺少 id' })
    const ok = await deleteMessage(id)
    return res.status(ok ? 200 : 404).json({ ok })
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

// 上传图片：body { name, dataBase64 }（纯 base64，无 data: 前缀），推到仓库 public/images/uploads/
async function adminImageUpload(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  const { name, dataBase64 } = req.body || {}
  if (!name || !dataBase64) return res.status(400).json({ error: '缺少 name 或 dataBase64' })
  if (typeof dataBase64 !== 'string' || dataBase64.length > 1_400_000) {
    return res.status(413).json({ error: '图片过大，请压缩后重试（< 1MB）' })
  }
  try {
    const { path, url } = await uploadImageToGitHub(name, dataBase64)
    return res.status(200).json({ ok: true, path, url })
  } catch (e) {
    console.error('adminImageUpload error:', e.message)
    return res.status(500).json({ error: '上传失败: ' + e.message })
  }
}

// ============ Public handlers ============
async function contact(req, res) {
  const { name, email, phone, message, type } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ error: '姓名、邮箱和留言不能为空' })
  const msg = await createMessage({
    name: String(name).slice(0, 100),
    email: String(email).slice(0, 200),
    phone: phone ? String(phone).slice(0, 50) : '',
    message: String(message).slice(0, 2000),
    type: type || 'contact'
  })
  return res.status(201).json({ ok: true, message: msg })
}

async function listingsPublic(req, res) {
  const listings = getListings().filter((l) => l.published !== false)
  return res.status(200).json({ listings })
}

async function messagesPublic(req, res) {
  // 返回已读/未读的公开留言（不暴露邮箱、电话）
  const messages = getMessages()
    .filter((m) => m.type === 'message-board')
    .map((m) => ({ id: m.id, name: m.name, message: m.message, createdAt: m.createdAt }))
  return res.status(200).json({ messages })
}

// ============ Texts handlers ============
async function textsPublic(req, res) {
  // 公开接口：返回所有文案覆盖项（前端合并到默认翻译）
  return res.status(200).json({ texts: await getTexts() })
}

async function adminTexts(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  if (req.method === 'GET') {
    return res.status(200).json({ texts: await getTexts() })
  }
  if (req.method === 'PUT') {
    const { key, zh, en, url, posX, posY, posXm, posYm, scale, scaleM } = req.body || {}
    if (!key) return res.status(400).json({ error: '缺少 key' })
    try {
      // 图片覆盖项：值形如 { url, posX?, posY?, scale?, posXm?, posYm?, scaleM? }；文案覆盖项：{ zh, en }
      let value
      if (url !== undefined) {
        value = { url }
        if (Number.isFinite(Number(posX))) value.posX = Number(posX)
        if (Number.isFinite(Number(posY))) value.posY = Number(posY)
        if (Number.isFinite(Number(scale))) value.scale = Math.min(3, Math.max(1, Number(scale)))
        if (Number.isFinite(Number(posXm))) value.posXm = Number(posXm)
        if (Number.isFinite(Number(posYm))) value.posYm = Number(posYm)
        if (Number.isFinite(Number(scaleM))) value.scaleM = Math.min(3, Math.max(1, Number(scaleM)))
      } else {
        value = { zh, en }
      }
      const updated = await updateTexts({ [key]: value })
      return res.status(200).json({ ok: true, texts: updated })
    } catch (e) {
      console.error('adminTexts PUT error:', e.message)
      return res.status(500).json({ error: '保存失败: ' + e.message })
    }
  }
  if (req.method === 'DELETE') {
    const { key } = req.body || {}
    try {
      if (key) {
        // 重置单个 key：从覆盖项中删除
        const db = await getTexts()
        delete db[key]
        await updateTexts(db)
        return res.status(200).json({ ok: true })
      }
      // 无 key 则全部重置
      await resetTexts()
      return res.status(200).json({ ok: true })
    } catch (e) {
      console.error('adminTexts DELETE error:', e.message)
      return res.status(500).json({ error: '重置失败: ' + e.message })
    }
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
