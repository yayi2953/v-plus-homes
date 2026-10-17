import crypto from 'crypto'

const SECRET = process.env.JWT_SECRET || 'v-plus-dev-secret-change-me'

// 简易 JWT（HS256），无需 jsonwebtoken 依赖
function base64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

function sign(payload, expiresIn = '7d') {
  const expSeconds = parseExpires(expiresIn)
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + expSeconds, iat: Math.floor(Date.now() / 1000) }
  const head = base64url(header)
  const data = base64url(body)
  const sig = crypto.createHmac('sha256', SECRET).update(`${head}.${data}`).digest('base64url')
  return `${head}.${data}.${sig}`
}

function verify(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [head, data, sig] = parts
  const expected = crypto.createHmac('sha256', SECRET).update(`${head}.${data}`).digest('base64url')
  if (sig !== expected) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (payload.exp && Date.now() / 1000 > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

function parseExpires(s) {
  const m = String(s).match(/^(\d+)([smhd])$/)
  if (!m) return 7 * 86400
  const n = parseInt(m[1], 10)
  const u = { s: 1, m: 60, h: 3600, d: 86400 }[m[2]]
  return n * u
}

// 密码哈希（pbkdf2 + salt）
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash === check
}

export { sign, verify, hashPassword, verifyPassword }
