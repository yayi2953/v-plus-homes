import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { hashPassword } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Vercel serverless 只能写 /tmp，开发态写项目 data 目录
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

// 默认管理员账号
const ADMIN_EMAIL = 'admin@v-plus.house'
const ADMIN_PASSWORD = 'admin123'

// 初始数据（首次运行时写入）
const SEED = {
  users: [],
  listings: [],
  messages: [],
  services: []
}

let cache = null

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
  getUsers, getListings, getMessages, getServices,
  findUserByEmail, createUser,
  createListing, updateListing, deleteListing,
  createMessage, markMessageRead, deleteMessage
}
