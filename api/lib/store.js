import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { hashPassword } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Vercel serverless 只能写 /tmp（仅作 GitHub 不可用时的降级），开发态写项目 data 目录
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

// GitHub API：整个数据库持久化到仓库（冷启动/多实例共享，数据不会丢失）
const GITHUB_REPO = 'yayi2953/v-plus-homes'
const GITHUB_DB_PATH = 'api/data/db.json'
const GITHUB_TEXTS_PATH = 'api/data/texts.json'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GH_API = (p) => `https://api.github.com/repos/${GITHUB_REPO}/contents/${p}`
const DB_TTL = 10_000 // 读缓存 10 秒；写操作始终先拉远端最新数据，不受缓存影响
const CHAT_TTL = 2_000 // 聊天轮询强制刷新的最小间隔（节流，省 GitHub API 配额）

// 默认管理员账号
const ADMIN_EMAIL = 'admin@v-plus.house'
const ADMIN_PASSWORD = 'admin123'

// 初始数据（仓库无 db.json 时创建）
const SEED = {
  users: [],
  listings: [],
  messages: [],
  services: [],
  chats: [],
  texts: {}
}

let cache = null // 内存中的当前数据库
let cacheTime = 0
let dbSha = null // 当前 db.json 的 blob sha（CAS 写入用）
let writeChain = Promise.resolve() // 写队列：同一实例内串行，避免并发互相覆盖

function ghHeaders(extra = {}) {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'v-plus-api',
    ...extra
  }
}

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch { /* ignore */ }
}

function seedAdmin(db) {
  if (!db.users.find((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
    db.users.push({
      id: 'u-admin',
      email: ADMIN_EMAIL,
      name: '管理员',
      role: 'admin',
      password: hashPassword(ADMIN_PASSWORD),
      emailVerified: true, // 管理员默认已验证
      createdAt: Date.now()
    })
  }
}

function saveLocal(data) {
  ensureDir()
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch { /* 只读文件系统时忽略 */ }
}

function loadLocal() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch { /* ignore */ }
  return structuredClone(SEED)
}

function genId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---------- GitHub 数据库读写 ----------
async function fetchRemoteDb() {
  if (!GITHUB_TOKEN) return null
  try {
    const res = await fetch(GH_API(GITHUB_DB_PATH), { headers: ghHeaders() })
    if (res.status === 404) return { sha: null, db: null } // 仓库还没有 db.json
    if (!res.ok) return null
    const json = await res.json()
    const db = JSON.parse(Buffer.from(json.content, 'base64').toString('utf-8'))
    return { sha: json.sha, db }
  } catch {
    return null
  }
}

async function pushDb(db) {
  if (!GITHUB_TOKEN) {
    saveLocal(db)
    cache = db
    cacheTime = Date.now()
    return true
  }
  // 串行写入，避免同实例并发请求互相覆盖 sha
  writeChain = writeChain.then(async () => {
    try {
      const body = {
        message: 'update db',
        content: Buffer.from(JSON.stringify(db, null, 2), 'utf-8').toString('base64')
      }
      if (dbSha) body.sha = dbSha
      const res = await fetch(GH_API(GITHUB_DB_PATH), {
        method: 'PUT',
        headers: ghHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body)
      })
      if (res.ok) {
        const j = await res.json()
        dbSha = j.content?.sha || dbSha
        cache = db
        cacheTime = Date.now()
        return true
      }
      // sha 过期（其它实例已写入）→ 返回 false 触发上层重试
      return false
    } catch {
      return false
    }
  })
  return writeChain
}

// 首次调用预热：把远端数据库加载进内存缓存
// force=true：聊天轮询用的强制刷新（带 CHAT_TTL 节流，避免烧 GitHub API 配额）
export async function initDb(force = false) {
  if (cache) {
    const ttl = force ? CHAT_TTL : DB_TTL
    if (Date.now() - cacheTime < ttl) return cache
  }
  const remote = await fetchRemoteDb()
  if (remote) {
    if (remote.db) {
      cache = remote.db
      dbSha = remote.sha
    } else {
      // 仓库还没有 db.json：播种并创建
      cache = structuredClone(SEED)
      dbSha = null
      await pushDb(cache)
      return cache
    }
  } else if (!cache) {
    // GitHub 不可用：降级本地 /tmp
    cache = loadLocal()
  }
  if (!Array.isArray(cache.chats)) cache.chats = [] // 旧数据兼容
  seedAdmin(cache)
  cacheTime = Date.now()
  saveLocal(cache)
  return cache
}

// 读接口（同步）：handler 入口已 await initDb() 预热，这里直接读内存缓存
function getUsers() { return (cache || loadLocal()).users }
function getListings() { return (cache || loadLocal()).listings }
function getMessages() { return (cache || loadLocal()).messages }
function getServices() { return (cache || loadLocal()).services }

// 写接口（异步）：先拉远端最新 → 应用变更 → 推送；sha 冲突自动重试，
// 保证多实例并发写不丢数据
async function mutateDb(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const remote = await fetchRemoteDb()
    let db
    if (remote && remote.db) {
      db = remote.db
      dbSha = remote.sha
    } else if (remote && remote.sha === null) {
      db = structuredClone(SEED) // 远端还没有文件
      dbSha = null
    } else {
      db = structuredClone(cache || loadLocal()) // GitHub 不可用时基于内存降级
    }
    const result = fn(db)
    if (!Array.isArray(db.chats)) db.chats = []
    seedAdmin(db)
    if (await pushDb(db)) return result
  }
  // 重试耗尽：至少写入本地/内存，尽力而为
  const db = structuredClone(cache || loadLocal())
  const result = fn(db)
  if (!Array.isArray(db.chats)) db.chats = []
  seedAdmin(db)
  saveLocal(db)
  return result
}

// ---------- 文案覆盖项（texts.json，独立于数据库） ----------
let textsCache = null
let textsCacheTime = 0

async function fetchTextsFromGitHub() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_TEXTS_PATH}`,
      { headers: { 'Cache-Control': 'no-cache' } }
    )
    if (res.ok) {
      const data = await res.json()
      textsCache = data
      textsCacheTime = Date.now()
      return data
    }
  } catch { /* ignore */ }
  return {}
}

async function getTexts() {
  // 缓存 30 秒，避免频繁请求 GitHub
  if (textsCache && Date.now() - textsCacheTime < 30000) {
    return textsCache
  }
  return await fetchTextsFromGitHub()
}

async function updateTexts(updates) {
  const current = await getTexts()
  const next = { ...current, ...updates }

  if (GITHUB_TOKEN) {
    try {
      // 获取当前文件的 sha
      const metaRes = await fetch(
        GH_API(GITHUB_TEXTS_PATH),
        { headers: ghHeaders() }
      )
      const meta = await metaRes.json()
      const sha = meta.sha

      // 提交更新
      const content = Buffer.from(JSON.stringify(next, null, 2), 'utf-8').toString('base64')
      const putRes = await fetch(
        GH_API(GITHUB_TEXTS_PATH),
        {
          method: 'PUT',
          headers: ghHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            message: 'update text overrides',
            content,
            sha
          })
        }
      )
      if (putRes.ok) {
        textsCache = next
        textsCacheTime = Date.now()
        return next
      }
    } catch (e) {
      console.error('GitHub update failed:', e.message)
    }
  }

  // 降级：写 /tmp（不持久，但至少当前实例可用）
  textsCache = next
  textsCacheTime = Date.now()
  return next
}

async function resetTexts() {
  const next = {}
  if (GITHUB_TOKEN) {
    try {
      const metaRes = await fetch(
        GH_API(GITHUB_TEXTS_PATH),
        { headers: ghHeaders() }
      )
      const meta = await metaRes.json()
      const content = Buffer.from(JSON.stringify({}, null, 2), 'utf-8').toString('base64')
      const putRes = await fetch(
        GH_API(GITHUB_TEXTS_PATH),
        {
          method: 'PUT',
          headers: ghHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ message: 'reset text overrides', content, sha: meta.sha })
        }
      )
      if (putRes.ok) {
        textsCache = {}
        textsCacheTime = Date.now()
        return {}
      }
    } catch (e) {
      console.error('GitHub reset failed:', e.message)
    }
  }
  textsCache = {}
  textsCacheTime = Date.now()
  return {}
}

// ---------- 业务操作 ----------
function findUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

function findUserByVerificationToken(token) {
  return getUsers().find((u) => u.verificationToken === token)
}

function findUserByResetToken(token) {
  return getUsers().find((u) => u.resetToken === token)
}

async function updateUserVerification(userId, updates) {
  return mutateDb((db) => {
    const u = (db.users || []).find((x) => x.id === userId)
    if (!u) return null
    Object.assign(u, updates)
    return { id: u.id, email: u.email, name: u.name, role: u.role, emailVerified: u.emailVerified }
  })
}

async function updateUserResetToken(userId, token, expires) {
  return mutateDb((db) => {
    const u = (db.users || []).find((x) => x.id === userId)
    if (!u) return null
    u.resetToken = token
    u.resetTokenExpires = expires
    return { id: u.id, email: u.email }
  })
}

async function createUser(data) {
  return mutateDb((db) => {
    const user = { id: genId('u'), role: 'user', createdAt: Date.now(), ...data }
    db.users.push(user)
    return user
  })
}

// 用户管理：管理员修改指定用户密码（password 已在 handler 中 hash）
async function updateUserPassword(id, hashed) {
  return mutateDb((db) => {
    const u = (db.users || []).find((x) => x.id === id)
    if (!u) return null
    u.password = hashed
    return { id: u.id, email: u.email, name: u.name, role: u.role }
  })
}

async function createListing(data) {
  return mutateDb((db) => {
    const listing = { id: genId('l'), createdAt: Date.now(), updatedAt: Date.now(), ...data }
    db.listings.unshift(listing)
    return listing
  })
}

async function updateListing(id, data) {
  return mutateDb((db) => {
    const idx = db.listings.findIndex((l) => l.id === id)
    if (idx < 0) return null
    db.listings[idx] = { ...db.listings[idx], ...data, updatedAt: Date.now() }
    return db.listings[idx]
  })
}

async function deleteListing(id) {
  return mutateDb((db) => {
    const idx = db.listings.findIndex((l) => l.id === id)
    if (idx < 0) return false
    db.listings.splice(idx, 1)
    return true
  })
}

async function createMessage(data) {
  return mutateDb((db) => {
    const msg = { id: genId('m'), createdAt: Date.now(), read: false, ...data }
    db.messages.unshift(msg)
    return msg
  })
}

async function markMessageRead(id) {
  return mutateDb((db) => {
    const msg = db.messages.find((m) => m.id === id)
    if (msg) msg.read = true
    return msg || null
  })
}

async function deleteMessage(id) {
  return mutateDb((db) => {
    const idx = db.messages.findIndex((m) => m.id === id)
    if (idx < 0) return false
    db.messages.splice(idx, 1)
    return true
  })
}

// ---------- 在线客服（会话存 db.chats，用户/管理员通过轮询收发） ----------
function getChats() {
  const db = cache || loadLocal()
  if (!Array.isArray(db.chats)) db.chats = []
  return db.chats
}

// 用户发消息：无会话则自动创建，同时视为用户端已读
async function userSendMessage(userId, userName, userEmail, text, card) {
  return mutateDb((db) => {
    let chat = db.chats.find((c) => c.userId === userId)
    if (!chat) {
      chat = {
        id: genId('c'),
        userId,
        userName,
        userEmail,
        messages: [],
        lastReadAdmin: 0,
        lastReadUser: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      db.chats.push(chat)
    }
    // 房源卡片消息：card 为可选结构化字段（图片/标题/副文/价格/链接），点击卡片新窗口打开房源
    const msg = { id: genId('m'), from: 'user', text, at: Date.now(), ...(card ? { card } : {}) }
    chat.messages.push(msg)
    chat.updatedAt = msg.at
    chat.lastReadUser = msg.at
    return chat
  })
}

// 管理员回复
async function adminReplyMessage(chatId, text) {
  return mutateDb((db) => {
    const chat = db.chats.find((c) => c.id === chatId)
    if (!chat) return null
    const msg = { id: genId('m'), from: 'admin', text, at: Date.now() }
    chat.messages.push(msg)
    chat.updatedAt = msg.at
    return chat
  })
}

// 管理员打开会话 → 标记用户消息已读（用于会话列表未读徽标）
async function markChatReadAdmin(chatId) {
  return mutateDb((db) => {
    const chat = db.chats.find((c) => c.id === chatId)
    if (!chat) return null
    chat.lastReadAdmin = Date.now()
    return chat
  })
}

// ---------- 图片上传（存入仓库 public/images/uploads/，返回 raw 直链） ----------
async function uploadImageToGitHub(name, dataBase64) {
  if (!GITHUB_TOKEN) throw new Error('未配置 GITHUB_TOKEN')
  const safeName = name.replace(/[^\w.-]/g, '_')
  const filePath = `public/images/uploads/${Date.now().toString(36)}-${safeName}`
  const content = dataBase64
  const body = {
    message: `upload image ${safeName}`,
    content
  }
  const res = await fetch(GH_API(filePath), {
    method: 'PUT',
    headers: ghHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`GitHub 上传失败（HTTP ${res.status}）${t ? ': ' + t.slice(0, 200) : ''}`)
  }
  return {
    path: filePath,
    url: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${filePath}`
  }
}

export {
  genId,
  getUsers, getListings, getMessages, getServices, getTexts, getChats,
  findUserByEmail, findUserByVerificationToken, findUserByResetToken,
  createUser, updateUserPassword, updateUserVerification, updateUserResetToken,
  createListing, updateListing, deleteListing,
  createMessage, markMessageRead, deleteMessage,
  userSendMessage, adminReplyMessage, markChatReadAdmin,
  updateTexts, resetTexts, uploadImageToGitHub
}
