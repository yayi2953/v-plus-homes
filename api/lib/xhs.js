// 小红书笔记抓取：从分享链接提取无水印图片、标题、文案、价格、位置
// 页面数据源：window.__INITIAL_STATE__（noteDetailMap → note）
// 无水印策略：优先取 imageList[].urlDefault；统一剥掉 ~tplv-xxx 图片处理模板
// （模板里含 :watermark 时服务端会压上水印，剥掉后返回原始图）

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const IMG_HEADERS = {
  'User-Agent': UA,
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Referer': 'https://www.xiaohongshu.com/'
}
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

// 从用户粘贴的分享文案中提取小红书链接（支持纯链接、短链 xhslink.com/.cn、整段分享文本）
export function extractShareUrl(input) {
  const m = String(input || '').match(
    /https?:\/\/[^\s"'<>（）()]+|(?:www\.)?(?:xiaohongshu\.com|xhslink\.[a-z]{2,3})\/[^\s"'<>（）()]+/i
  )
  if (!m) return null
  let u = m[0].replace(/[),.]+$/, '')
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u
  try {
    const host = new URL(u).hostname
    if (!/(^|\.)xiaohongshu\.com$|(^|\.)xhslink\.(com|cn)$/i.test(host)) return null
  } catch {
    return null
  }
  return u
}

// 去掉 state 里内嵌的 JS 构造：new Map(...) / new Set(...) → 保留内部参数（小红书 state 非纯 JSON）
function stripJsConstructs(s) {
  let out = s
  for (let guard = 0; guard < 30; guard++) {
    const m = out.match(/new\s+(?:Map|Set)\(/)
    if (!m) break
    const open = m.index + m[0].length
    let depth = 1, inStr = false, esc = false, i = open
    for (; i < out.length && depth > 0; i++) {
      const c = out[i]
      if (inStr) {
        if (esc) esc = false
        else if (c === '\\') esc = true
        else if (c === '"') inStr = false
        continue
      }
      if (c === '"') inStr = true
      else if (c === '(') depth++
      else if (c === ')') depth--
    }
    if (depth !== 0) break // 括号不配对，放弃剥离避免越界
    const inner = out.slice(open, i - 1)
    out = out.slice(0, m.index) + inner + out.slice(i)
  }
  return out
}

// 提取 window.__INITIAL_STATE__ 的 JSON：大括号配平扫描（容忍字符串内花括号），
// 再处理 JS 字面量（undefined → null、new Map/Set 剥壳）后 JSON.parse
export function extractInitialState(html) {
  const start = html.indexOf('window.__INITIAL_STATE__=')
  if (start < 0) return null
  const begin = html.indexOf('{', start)
  if (begin < 0) return null
  let depth = 0, inStr = false, esc = false
  for (let j = begin; j < html.length; j++) {
    const c = html[j]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        let raw = html.slice(begin, j + 1).replace(/([:\[,\s])undefined\b/g, '$1null')
        raw = stripJsConstructs(raw)
        try { return JSON.parse(raw) } catch { return null }
      }
    }
  }
  return null
}

// 从 __INITIAL_STATE__ 里找到笔记对象
// 已知两种布局：顶层 noteDetailMap（旧版）、state.note.noteDetailMap（当前 PC 版）
export function parseNote(state) {
  const map = state?.noteDetailMap || state?.note?.noteDetailMap
  if (map && typeof map === 'object') {
    for (const k of Object.keys(map)) {
      const n = map[k]?.note
      if (n && (n.noteId || n.title || n.desc || Array.isArray(n.imageList))) return n
    }
  }
  return null
}

// 剥掉 ~tplv-... 处理模板（含水印/缩放参数），返回原始 CDN 图
export function cleanImageUrl(u) {
  const s = String(u || '')
  const t = s.indexOf('~tplv-')
  return t > 0 ? s.slice(0, t) : s
}

// 收集笔记图片：所有候选统一剥掉 ~tplv-... 模板（含 :watermark 水印参数）得到无水印原图；
// 仅当水印在路径本身时才排除
export function pickImageUrls(note, maxImages = 18) {
  const out = []
  const seen = new Set()
  const push = (u) => {
    if (!u) return
    const clean = cleanImageUrl(u)
    if (!clean || seen.has(clean)) return
    if (/watermark/i.test(clean)) return
    seen.add(clean)
    out.push(clean)
  }
  for (const it of (note?.imageList || [])) {
    if (it && typeof it === 'object') {
      push(it.urlDefault)
      for (const info of (it.infoList || [])) push(info?.url)
      push(it.url)
      push(it.urlPre)
    } else if (typeof it === 'string') {
      push(it)
    }
    if (out.length >= maxImages) break
  }
  return out
}

// 从标题+文案中识别租金/价格（元/月），识别不到返回 ''
// 金额支持千分位写法（¥3,800 / 4,500元/月）
export function extractPrice(text) {
  const s = String(text || '').replace(/\s+/g, ' ')
  if (!s) return ''
  const num = '(\\d{1,3}(?:,\\d{3})+|\\d{3,6}(?:\\.\\d+)?)'
  const patterns = [
    new RegExp('[¥￥]\\s*' + num),                  // ¥4500 / ¥3,800
    new RegExp('月租\\s*[:：]?\\s*[¥￥]?\\s*' + num), // 月租4500
    new RegExp('租金\\s*[:：]?\\s*[¥￥]?\\s*' + num), // 租金：4500
    new RegExp('价格\\s*[:：]?\\s*[¥￥]?\\s*' + num), // 价格：4500
    new RegExp(num + '\\s*(?:元|块|R|rmb|RMB)?\\s*[/每]\\s*月'), // 4500/月、4500每月
    new RegExp(num + '\\s*(?:元|块)\\s*每?\\s*月')    // 4500元每月
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ''))
      if (n >= 100 && n <= 999999) return String(n)
    }
  }
  return ''
}

// 中文数字（一~九/两）转阿拉伯数字
function cnToInt(s) {
  if (/^\d{1,2}$/.test(s)) return parseInt(s, 10)
  const map = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
  return map[s] ?? NaN
}
// 数字类：阿拉伯数字 1-2 位 或 中文数字
const NUM_CLS = '(\\d{1,2}|[一二两三四五六七八九])'

// 面积：53m² / 53㎡ / 53平米 / 53平方 / 53平
export function extractArea(text) {
  const s = String(text || '').replace(/\s+/g, '')
  const m = s.match(/(\d{2,4}(?:\.\d{1,2})?)(?:m²|m2|M²|M2|㎡|平米|平方|平)(?!\d)/)
  if (!m) return ''
  const n = parseFloat(m[1])
  if (n >= 8 && n <= 2000) return String(n)
  return ''
}

// 卧室数：两居室 / 2居室 / 两房一厅 / 3房 / 2室1厅 / 单间（→1）
export function extractBedrooms(text) {
  const s = String(text || '').replace(/\s+/g, '')
  const patterns = [
    new RegExp(NUM_CLS + '\\s*居\\s*[室房]'),
    new RegExp(NUM_CLS + '\\s*房\\s*(?:\\d|[一二两三四五六七八九])?\\s*厅'),
    new RegExp(NUM_CLS + '\\s*室\\s*(?:\\d|[一二两三四五六七八九])?\\s*厅')
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) {
      const n = cnToInt(m[1])
      if (n >= 1 && n <= 9) return String(n)
    }
  }
  if (/单间|开间|单身公寓/.test(s)) return '1'
  return ''
}

// 卫生间数：2卫 / 两卫 / 独卫 / 干湿分离 / 提到卫生间（→1）
export function extractBathrooms(text) {
  const s = String(text || '').replace(/\s+/g, '')
  const m = s.match(new RegExp(NUM_CLS + '\\s*[个只]?\\s*卫'))
  if (m) {
    const n = cnToInt(m[1])
    if (n >= 1 && n <= 9) return String(n)
  }
  if (/独卫|干湿分离|卫生间/.test(s)) return '1'
  return ''
}

// 提取 og: meta（登录墙/风控时的降级数据源）
export function extractOgMeta(html) {
  const og = {}
  const re = /<meta\s+[^>]*?(?:property|name)=["']og:(\w+)["'][^>]*?content=["']([^"']*)["']/gi
  const re2 = /<meta\s+[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']og:(\w+)["']/gi
  for (const reX of [re, re2]) {
    let m
    while ((m = reX.exec(html))) {
      const key = reX === re ? m[1] : m[2]
      const val = reX === re ? m[2] : m[1]
      if (val && !og[key]) og[key] = val
    }
  }
  return og
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

// 手动跟随重定向：fetch 跨域跳转会丢弃 Cookie 头，必须逐跳携带（短链 → 正文页跨域）
async function fetchXhsPage(url) {
  const headers = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': 'https://www.xiaohongshu.com/',
    // 可选：配置 XHS_COOKIE 环境变量（网页版登录后的完整 Cookie，含 web_session），
    // 小红书 PC 网页版强制登录，没有它笔记页一律被风控拦截
    ...(process.env.XHS_COOKIE ? { Cookie: process.env.XHS_COOKIE } : {})
  }
  let current = url
  for (let hop = 0; hop < 8; hop++) {
    const res = await fetch(current, { headers, redirect: 'manual', signal: AbortSignal.timeout(15000) })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return { res, finalUrl: current }
      current = new URL(loc, current).href
      continue
    }
    return { res, finalUrl: current }
  }
  throw new Error('重定向次数过多，链接解析失败')
}

// 主流程：抓取笔记页 → 解析 → 下载原图 → 通过 uploadImage 上传到图床
// 返回 { title, desc, price, city, address, area, bedrooms, bathrooms, images, missing: [] }
export async function scrapeXhsNote(url, { uploadImage, maxImages = 12 } = {}) {
  if (!uploadImage) throw new Error('图床上传不可用')

  const { res: pageRes, finalUrl } = await fetchXhsPage(url)
  if (!pageRes.ok) throw new Error(`小红书页面请求失败（HTTP ${pageRes.status}）`)
  const html = await pageRes.text()

  // 诊断跳转结果：短链没落到笔记页 = 短码无效；404/error_code = 笔记不存在；login = 需要登录
  let diag = ''
  try {
    const fp = new URL(finalUrl)
    const wasShort = /xhslink\./i.test(url)
    const landedOnNote = /\/(?:explore|discovery\/item)\/[0-9a-zA-Z]+/.test(finalUrl)
    if (wasShort && !landedOnNote) {
      diag = '短链未解析到笔记：链接可能复制不完整或已失效，请在小红书 App 重新分享并复制完整链接'
    } else if (fp.pathname.startsWith('/404') || /error_code=/.test(finalUrl)) {
      diag = '笔记不存在或暂时无法浏览（可能已删除或受限）'
    } else if (fp.pathname.startsWith('/login')) {
      diag = '该笔记需要登录才能查看（可配置 XHS_COOKIE 后重试）'
    }
  } catch { /* ignore */ }

  const state = extractInitialState(html)
  const note = state ? parseNote(state) : null
  const og = extractOgMeta(html)

  const title = decodeEntities(note?.title || og.title || '').trim().replace(/\s*-\s*小红书$/, '')
  const desc = decodeEntities(note?.desc || og.description || '').trim()
  if (!title && !desc) {
    throw new Error((diag ? diag + '。' : '') + '无法读取笔记内容，请手动填写')
  }
  if (diag) console.warn('xhs-scrape diag:', diag, 'finalUrl:', finalUrl)

  // 位置：优先笔记定位（POI），其次「地标xxx」（正文自述），再次 #xx租房 话题，最后 IP 属地（只能到省）
  const poi = typeof note?.location === 'string' ? note.location.trim() : ''
  const ipLoc = typeof note?.ipLocation === 'string' ? note.ipLocation.trim() : ''
  let city = poi || ''
  if (!city) {
    const lm = desc.match(/地标[:：]?([\u4e00-\u9fa5]{2,12}?市)/) // 地标广州市越秀区...
    const hm = desc.match(/#([\u4e00-\u9fa5]{2,6}?)租房/) // #广州租房
    city = (lm && lm[1]) || (hm && hm[1]) || ''
  }
  if (!city) city = ipLoc || ''

  // 地址：优先「地标」自述片段，其次「xx路xx号」类地址片段（找不到就留空让用户填）
  let address = ''
  const lmAddr = desc.match(/地标[:：]?([\u4e00-\u9fa5A-Za-z0-9]{4,25}?)(?:[，,。！!；;]|$)/)
  if (lmAddr) address = lmAddr[1]
  if (!address) {
    const addrMatch = desc.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:路|街|巷|道|村|大厦|广场|小区|公寓|花园|中心)[\u4e00-\u9fa5A-Za-z0-9\-—－]{0,20}(?:号|栋|座|单元|室)?)/)
    if (addrMatch) address = addrMatch[1]
  }

  const metaText = `${title} ${desc}`
  const price = extractPrice(metaText)
  const area = extractArea(metaText)
  const bedrooms = extractBedrooms(metaText)
  const bathrooms = extractBathrooms(metaText)

  // 图片：笔记图 → 降级 og:image
  let candidates = pickImageUrls(note, maxImages)
  if (!candidates.length && og.image) candidates = [cleanImageUrl(og.image)]
  if (!candidates.length) {
    throw new Error('未找到笔记图片（视频笔记或图片受限），请手动上传图片')
  }

  const images = []
  for (let i = 0; i < Math.min(candidates.length, maxImages); i++) {
    try {
      const imgRes = await fetch(candidates[i], {
        headers: IMG_HEADERS,
        signal: AbortSignal.timeout(15000)
      })
      if (!imgRes.ok) continue
      const buf = Buffer.from(await imgRes.arrayBuffer())
      if (!buf.length || buf.length > MAX_IMAGE_BYTES) continue
      const name = `xhs-${Date.now().toString(36)}-${i + 1}.jpg`
      const { url: final } = await uploadImage(name, buf.toString('base64'))
      if (final) images.push(final)
    } catch { /* 单张失败跳过，不阻断整体导入 */ }
  }

  const missing = []
  if (!price) missing.push('价格')
  if (!city) missing.push('城市')
  if (!address) missing.push('地址')
  if (!area) missing.push('面积')
  if (!bedrooms) missing.push('卧室')
  if (!bathrooms) missing.push('卫生间')
  if (!images.length) missing.push('图片')

  return { title, desc, price, city, address, area, bedrooms, bathrooms, images, missing, sourceUrl: finalUrl }
}
