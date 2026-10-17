import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { hashPassword } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Vercel serverless 只能写 /tmp，开发态写项目 data 目录
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

// GitHub API 配置（文案持久化到仓库 texts.json）
const GITHUB_REPO = 'yayi2953/v-plus-homes'
const GITHUB_TEXTS_PATH = 'api/data/texts.json'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

// 默认管理员账号
const ADMIN_EMAIL = 'admin@v-plus.house'
const ADMIN_PASSWORD = 'admin123'

// 初始数据（首次运行时写入）
const SEED = {
  users: [],
  listings: [],
  messages: [],
  services: [],
  texts: {}
}

let cache = null
let textsCache = null
let textsCacheTime = 0

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
      createdAt: Date.now()
    })
  }
}

function load() {
  if (cache) return cache
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      cache = JSON.parse(raw)
    } else {
      cache = structuredClone(SEED)
    }
  } catch {
    cache = structuredClone(SEED)
  }
  seedAdmin(cache)
  save(cache)
  return cache
}

function save(data) {
  ensureDir()
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
    cache = data
  } catch (e) {
    // 写入失败（只读文件系统），仅更新内存
    cache = data
  }
}

function genId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function getUsers() { return load().users }
function getListings() { return load().listings }
function getMessages() { return load().messages }
function getServices() { return load().services }
// 通过 GitHub API 读取文案覆盖项（持久化到仓库）
async function fetchTextsFromGitHub() {
  if (!GITHUB_TOKEN) return {}
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_TEXTS_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (res.ok) {
      const data = await res.json()
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      const parsed = JSON.parse(content)
      textsCache = parsed
      textsCacheTime = Date.now()
      return parsed
    }
    console.error('[texts] GitHub read failed:', res.status, res.statusText)
  } catch (e) {
    console.error('[texts] GitHub read error:', e.message)
  }
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

  if (!GITHUB_TOKEN) {
    console.error('[texts] GITHUB_TOKEN not set, cannot persist')
    throw new Error('GITHUB_TOKEN not configured')
  }

  try {
    // 获取当前文件的 sha
    const metaRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_TEXTS_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (!metaRes.ok) {
      console.error('[texts] GitHub meta failed:', metaRes.status, metaRes.statusText)
      throw new Error(`GitHub meta request failed: ${metaRes.status}`)
    }
    const meta = await metaRes.json()
    if (!meta.sha) {
      console.error('[texts] No sha in GitHub response:', JSON.stringify(meta).slice(0, 200))
      throw new Error('GitHub response missing sha')
    }

    // 提交更新
    const content = Buffer.from(JSON.stringify(next, null, 2), 'utf-8').toString('base64')
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_TEXTS_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'update text overrides',
          content,
          sha: meta.sha
        })
      }
    )
    if (!putRes.ok) {
      const errText = await putRes.text()
      console.error('[texts] GitHub PUT failed:', putRes.status, errText.slice(0, 300))
      throw new Error(`GitHub write failed: ${putRes.status}`)
    }

    textsCache = next
    textsCacheTime = Date.now()
    return next
  } catch (e) {
    console.error('[texts] updateTexts error:', e.message)
    throw e
  }
}

// 上传图片到仓库 public/images/uploads/（GitHub Contents API 新建文件）
async function uploadImageToGitHub(name, dataBase64) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not configured')
  }
  const safe = String(name || 'image').replace(/[^\w.-]+/g, '-').slice(-80) || 'image'
  const path = `public/images/uploads/${Date.now().toString(36)}-${safe}`
  try {
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `upload image ${safe}`,
          content: dataBase64
        })
      }
    )
    if (!putRes.ok) {
      const errText = await putRes.text()
      console.error('[images] GitHub upload failed:', putRes.status, errText.slice(0, 300))
      throw new Error(`GitHub upload failed: ${putRes.status}`)
    }
    return path
  } catch (e) {
    console.error('[images] uploadImageToGitHub error:', e.message)
    throw e
  }
}

async function resetTexts() {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not configured')
  }
  try {
    const metaRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_TEXTS_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (!metaRes.ok) throw new Error(`GitHub meta failed: ${metaRes.status}`)
    const meta = await metaRes.json()
    const content = Buffer.from(JSON.stringify({}, null, 2), 'utf-8').toString('base64')
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_TEXTS_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'reset text overrides', content, sha: meta.sha })
      }
    )
    if (!putRes.ok) throw new Error(`GitHub reset failed: ${putRes.status}`)
    textsCache = {}
    textsCacheTime = Date.now()
    return {}
  } catch (e) {
    console.error('[texts] resetTexts error:', e.message)
    throw e
  }
}

function findUserByEmail(email) {
  return load().users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

function createUser(data) {
  const db = load()
  const user = { id: genId('u'), role: 'user', createdAt: Date.now(), ...data }
  db.users.push(user)
  save(db)
  return user
}

function createListing(data) {
  const db = load()
  const listing = { id: genId('l'), createdAt: Date.now(), updatedAt: Date.now(), ...data }
  db.listings.unshift(listing)
  save(db)
  return listing
}

function updateListing(id, data) {
  const db = load()
  const idx = db.listings.findIndex((l) => l.id === id)
  if (idx < 0) return null
  db.listings[idx] = { ...db.listings[idx], ...data, updatedAt: Date.now() }
  save(db)
  return db.listings[idx]
}

function deleteListing(id) {
  const db = load()
  const idx = db.listings.findIndex((l) => l.id === id)
  if (idx < 0) return false
  db.listings.splice(idx, 1)
  save(db)
  return true
}

function createMessage(data) {
  const db = load()
  const msg = { id: genId('m'), createdAt: Date.now(), read: false, ...data }
  db.messages.unshift(msg)
  save(db)
  return msg
}

function markMessageRead(id) {
  const db = load()
  const msg = db.messages.find((m) => m.id === id)
  if (msg) {
    msg.read = true
    save(db)
  }
  return msg
}

function deleteMessage(id) {
  const db = load()
  const idx = db.messages.findIndex((m) => m.id === id)
  if (idx < 0) return false
  db.messages.splice(idx, 1)
  save(db)
  return true
}

export {
  genId,
  getUsers, getListings, getMessages, getServices, getTexts,
  findUserByEmail, createUser,
  createListing, updateListing, deleteListing,
  createMessage, markMessageRead, deleteMessage,
  updateTexts, resetTexts, uploadImageToGitHub
}
