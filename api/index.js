import { sign, verify, hashPassword, verifyPassword, generateVerificationToken, verifyToken } from './lib/auth.js'
import { sendVerificationEmail } from './lib/email.js'
import {
  initDb,
  getUsers, getListings, getMessages, getChats,
  findUserByEmail, findUserByVerificationToken, findUserByResetToken,
  createUser, updateUserPassword, updateUserVerification, updateUserResetToken,
  createListing, updateListing, deleteListing,
  createMessage, markMessageRead, deleteMessage,
  userSendMessage, adminReplyMessage, markChatReadAdmin,
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
    // 聊天轮询路由强制刷新（带 2 秒节流），保证 3 秒轮询能及时收到对方新消息
    const chatFresh = rel === '/chat' || rel === '/admin/chats'
    await initDb(chatFresh)

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
    if (rel === '/auth/verify-email') {
      // GET: 邮件里的链接点击 → 返回 HTML 结果页
      if (req.method === 'GET') {
        return verifyEmailGet(req, res)
      }
      // POST: 前端 API 调用验证
      if (req.method === 'POST') {
        return verifyEmailPost(req, res)
      }
    }
    if (rel === '/auth/resend-verification' && req.method === 'POST') {
      return resendVerification(req, res)
    }

    // ---------- Chat ----------
    if (rel === '/chat' && req.method === 'GET') {
      return chatGet(req, res)
    }
    if (rel === '/chat/send' && req.method === 'POST') {
      return chatSend(req, res)
    }

    // ---------- Admin ----------
    if (rel === '/admin/listings') {
      return adminListings(req, res)
    }
    if (rel === '/admin/users' && req.method === 'GET') {
      return adminUsers(req, res)
    }
    if (rel === '/admin/users/password' && req.method === 'POST') {
      return adminUserPassword(req, res)
    }
    if (rel === '/admin/messages') {
      return adminMessages(req, res)
    }
    if (rel === '/admin/chats') {
      return adminChats(req, res)
    }
    if (rel === '/admin/chats/reply' && req.method === 'POST') {
      return adminChatReply(req, res)
    }
    if (rel === '/admin/chats/read' && req.method === 'POST') {
      return adminChatRead(req, res)
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

  const verificationToken = generateVerificationToken()
  const user = await createUser({
    email: email.trim().toLowerCase(),
    name: (name || email.split('@')[0]).trim(),
    password: hashPassword(password),
    emailVerified: false,
    verificationToken
  })

  // 发送验证邮件
  try {
    await sendVerificationEmail(user.email, verificationToken, user.name)
  } catch (e) {
    console.error('Failed to send verification email:', e.message)
    // 邮件发送失败不影响注册，但标记为未验证
  }

  // 返回未验证状态，不自动登录
  return res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified
    },
    message: '注册成功，请查收验证邮件完成邮箱验证'
  })
}

async function login(req, res) {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' })
  const user = findUserByEmail(email)
  if (!user || !verifyPassword(password, user.password)) return res.status(401).json({ error: '邮箱或密码错误' })
  if (!user.emailVerified) return res.status(403).json({ error: '请先验证您的邮箱', code: 'EMAIL_NOT_VERIFIED' })
  const token = sign({ sub: user.id, email: user.email, role: user.role })
  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified }
  })
}

async function me(req, res) {
  const user = requireAuth(req)
  if (!user) return res.status(401).json({ error: '未登录或登录已过期' })
  const fresh = findUserByEmail(user.email)
  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: fresh ? !!fresh.emailVerified : false
    }
  })
}

// GET /auth/verify-email?token=xxx → 邮件链接点击后的 HTML 结果页
async function verifyEmailGet(req, res) {
  const { token } = req.query || {}
  if (!token) {
    return res.status(400).send(renderVerifyHtml('missing', '无效的验证链接', '验证链接缺少 token 参数。'))
  }

  const result = verifyToken(token)
  if (!result.valid) {
    const msg = result.reason === 'expired' ? '验证链接已过期' : '无效的验证链接'
    return res.status(400).send(renderVerifyHtml('error', msg, '请重新注册或申请新的验证邮件。'))
  }

  const user = findUserByVerificationToken(token)
  if (!user) {
    return res.status(400).send(renderVerifyHtml('error', '无效的验证链接', '该 token 不存在或已被使用。'))
  }

  if (user.emailVerified) {
    return res.status(200).send(renderVerifyHtml('ok', '邮箱已验证', '您已完成验证，可以直接登录了。'))
  }

  await updateUserVerification(user.id, {
    emailVerified: true,
    verificationToken: null
  })

  return res.status(200).send(renderVerifyHtml('ok', '邮箱验证成功！', '您现在可以登录了。'))
}

function renderVerifyHtml(status, title, message) {
  const color = status === 'ok' ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b'
  const icon = status === 'ok' ? '✓' : status === 'error' ? '✗' : '!'
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} - V PLUS</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#fff;border-radius:12px;padding:48px 40px;text-align:center;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .icon{width:64px;height:64px;border-radius:50%;background:${color}20;color:${color};font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-weight:bold}
  h1{font-size:22px;margin:0 0 12px;color:#1a1a1a}
  p{color:#666;margin:0;font-size:15px;line-height:1.6}
  .btn{display:inline-block;margin-top:28px;background:#1a1a1a;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:15px}
</style></head><body>
<div class="card"><div class="icon">${icon}</div>
<h1>${title}</h1><p>${message}</p>
<a class="btn" href="/">Go to Homepage</a></div></body></html>`
}

// POST /auth/verify-email → JSON 结果（供前端调用）
async function verifyEmailPost(req, res) {
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ error: '缺少 token' })

  const result = verifyToken(token)
  if (!result.valid) {
    return res.status(400).json({ error: result.reason === 'expired' ? '验证链接已过期' : '无效的验证链接' })
  }

  const user = findUserByVerificationToken(token)
  if (!user) return res.status(400).json({ error: '无效的验证链接' })
  if (user.emailVerified) return res.status(200).json({ ok: true, message: '邮箱已验证' })

  await updateUserVerification(user.id, {
    emailVerified: true,
    verificationToken: null
  })

  return res.status(200).json({ ok: true, message: '邮箱验证成功' })
}

// POST /auth/resend-verification → 重新发送验证邮件
async function resendVerification(req, res) {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: '请提供邮箱地址' })

  const user = findUserByEmail(email)
  if (!user) return res.status(200).json({ message: '如果该邮箱已注册，验证邮件已发送' }) // 不泄露用户是否存在

  if (user.emailVerified) return res.status(400).json({ error: '邮箱已验证，无需重复验证' })

  // 生成新 token
  const newToken = generateVerificationToken()
  await updateUserVerification(user.id, { verificationToken: newToken })

  try {
    await sendVerificationEmail(user.email, newToken, user.name)
  } catch (e) {
    console.error('Failed to resend verification email:', e.message)
    return res.status(500).json({ error: '邮件发送失败，请稍后重试' })
  }

  return res.status(200).json({ message: '验证邮件已发送，请查收' })
}

// ============ Chat handlers ============
// 用户端：获取自己的会话（3 秒轮询；入口已按 /chat 强制刷新缓存）
async function chatGet(req, res) {
  const user = requireAuth(req)
  if (!user) return res.status(401).json({ error: '未登录或登录已过期' })
  const chat = getChats().find((c) => c.userId === user.id)
  return res.status(200).json({
    chat: chat
      ? { id: chat.id, messages: chat.messages, updatedAt: chat.updatedAt }
      : { id: null, messages: [], updatedAt: 0 }
  })
}

// 用户端：发送消息（可附带房源卡片 card：{ img, title, sub, price, url }）
async function chatSend(req, res) {
  const user = requireAuth(req)
  if (!user) return res.status(401).json({ error: '未登录或登录已过期' })
  const { text, card } = req.body || {}
  const content = String(text || '').trim()
  // 卡片白名单：仅接受字符串字段，url 必须为 http(s) 链接，防注入与超长
  let cardSafe = null
  if (card && typeof card === 'object') {
    const s = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '')
    const url = s(card.url, 300)
    if (/^https?:\/\//.test(url)) {
      cardSafe = {
        img: s(card.img, 500),
        title: s(card.title, 60),
        sub: s(card.sub, 80),
        price: s(card.price, 30),
        url
      }
    }
  }
  // 纯卡片消息（card 消息 text 为空、话术单独一条）也允许发送；两者皆空才拒绝
  if (!content && !cardSafe) return res.status(400).json({ error: '消息不能为空' })
  const chat = await userSendMessage(user.id, user.name, user.email, content.slice(0, 1000), cardSafe)
  return res.status(201).json({
    chat: { id: chat.id, messages: chat.messages, updatedAt: chat.updatedAt }
  })
}

// 管理端：会话列表（GET /admin/chats?id=xx 返回单会话详情）
async function adminChats(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  const { id } = req.query || {}
  if (id) {
    const chat = getChats().find((c) => c.id === id)
    if (!chat) return res.status(404).json({ error: '会话不存在' })
    return res.status(200).json({ chat })
  }
  const chats = getChats().map((c) => ({
    id: c.id,
    userId: c.userId,
    userName: c.userName,
    userEmail: c.userEmail,
    lastMessage: c.messages[c.messages.length - 1] || null,
    messageCount: c.messages.length,
    unread: c.messages.filter((m) => m.from === 'user' && m.at > (c.lastReadAdmin || 0)).length,
    updatedAt: c.updatedAt
  }))
  chats.sort((a, b) => b.updatedAt - a.updatedAt)
  return res.status(200).json({ chats })
}

// 管理端：回复
async function adminChatReply(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  const { chatId, text } = req.body || {}
  const content = String(text || '').trim()
  if (!chatId || !content) return res.status(400).json({ error: '缺少 chatId 或消息为空' })
  const chat = await adminReplyMessage(chatId, content.slice(0, 1000))
  if (!chat) return res.status(404).json({ error: '会话不存在' })
  return res.status(201).json({ chat })
}

// 管理端：标记会话已读（打开会话时调用，清未读徽标）
async function adminChatRead(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  const { chatId } = req.body || {}
  if (!chatId) return res.status(400).json({ error: '缺少 chatId' })
  const chat = await markChatReadAdmin(chatId)
  return res.status(chat ? 200 : 404).json({ ok: !!chat })
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

// 管理端：修改指定用户密码（用户管理）
async function adminUserPassword(req, res) {
  if (!requireAdmin(req)) return res.status(403).json({ error: '需要管理员权限' })
  const { userId, password } = req.body || {}
  if (!userId || !password) return res.status(400).json({ error: '参数不完整' })
  if (String(password).length < 6) return res.status(400).json({ error: '密码至少 6 位' })
  const target = await updateUserPassword(userId, hashPassword(String(password)))
  if (!target) return res.status(404).json({ error: '用户不存在' })
  return res.status(200).json({ ok: true, user: target })
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
