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

// 从用户粘贴的分享文案中提取小红书链接（支持纯链接、短链、整段分享文本）
export function extractShareUrl(input) {
  const m = String(input || '').match(
    /https?:\/\/[^\s"'<>（）()]+|(?:www\.)?(?:xiaohongshu\.com|xhslink\.com)\/[^\s"'<>（）()]+/i
  )
  if (!m) return null
  let u = m[0].replace(/[),.]+$/, '')
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u
  try {
    const host = new URL(u).hostname
    if (!/(^|\.)xiaohongshu\.com$|(^|\.)xhslink\.com$/i.test(host)) return null
  } catch {
    return null
  }
  return u
}

// 提取 window.__INITIAL_STATE__ 的 JSON：大括号配平扫描（容忍字符串内花括号），
// 再把 JS 的 undefined 字面量转为 null 后 JSON.parse
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
        const raw = html.slice(begin, j + 1).replace(/([:\[,\s])undefined\b/g, '$1null')
        try { return JSON.parse(raw) } catch { return null }
      }
    }
  }
  return null
}

// 从 __INITIAL_STATE__ 里找到笔记对象（noteDetailMap[noteId].note，兼容旧结构）
export function parseNote(state) {
  const map = state?.noteDetailMap
  if (map && typeof map === 'object') {
    for (const k of Object.keys(map)) {
      const n = map[k]?.note
      if (n && (n.noteId || n.title || n.desc || Array.isArray(n.imageList))) return n
    }
  }
  if (state?.note && (state.note.noteId || state.note.desc)) return state.note
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

// 主流程：抓取笔记页 → 解析 → 下载原图 → 通过 uploadImage 上传到图床
// 返回 { title, desc, price, city, address, images, missing: [] }
export async function scrapeXhsNote(url, { uploadImage, maxImages = 12 } = {}) {
  if (!uploadImage) throw new Error('图床上传不可用')

  const pageRes = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.xiaohongshu.com/'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000)
  })
  if (!pageRes.ok) throw new Error(`小红书页面请求失败（HTTP ${pageRes.status}）`)
  const html = await pageRes.text()
  const finalUrl = pageRes.url || url

  const state = extractInitialState(html)
  const note = state ? parseNote(state) : null
  const og = extractOgMeta(html)

  const title = decodeEntities(note?.title || og.title || '').trim()
  const desc = decodeEntities(note?.desc || og.description || '').trim()
  if (!title && !desc) {
    throw new Error('无法读取笔记内容：链接可能已失效、笔记受限或需要登录，请手动填写')
  }

  // 位置：优先笔记定位（POI），其次 IP 属地
  const poi = typeof note?.location === 'string' ? note.location.trim() : ''
  const ipLoc = typeof note?.ipLocation === 'string' ? note.ipLocation.trim() : ''
  const city = poi || ipLoc || ''

  // 地址：从文案里找「xx路xx号」类地址片段（找不到就留空让用户填）
  let address = ''
  const addrMatch = desc.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:路|街|巷|道|村|大厦|广场|小区|公寓|花园|中心)[\u4e00-\u9fa5A-Za-z0-9\-—－]{0,20}(?:号|栋|座|单元|室)?)/)
  if (addrMatch) address = addrMatch[1]

  const price = extractPrice(`${title} ${desc}`)

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
  if (!images.length) missing.push('图片')

  return { title, desc, price, city, address, images, missing, sourceUrl: finalUrl }
}
