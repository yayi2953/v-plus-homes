// 贝壳网（gz.ke.com）房源详情抓取：详情页有 hip.ke.com/captcha 风控，
// 无 Cookie 的服务端请求会被拦截 —— 需配置 BEIKE_COOKIE（浏览器登录后的完整 Cookie）
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0'

// 从粘贴文本中提取贝壳房源链接（支持 www/m/gz/gz.zu.ke.com 的 ershoufang/zufang/xiaoqu 详情页，可无协议）
export function extractBeikeUrl(input) {
  const s = String(input || '')
  const m = s.match(/(?:https?:\/\/)?(?:[a-z0-9-]+\.)*ke\.com\/(?:[a-z]{2}\/)?(?:ershoufang|zufang|xiaoqu|chuzu)\/[0-9A-Za-z]+\.html/i)
  if (!m) return null
  return m[0].startsWith('http') ? m[0] : 'https://' + m[0]
}

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

// 解析属性区块（div.base / div.transaction）中的 <li><span class="label">K</span>V</li> 键值对
export function parseAttrList(html, section) {
  const out = {}
  if (!html) return out
  const seg = section
    ? (html.match(new RegExp('class="' + section + '"[\\s\\S]{0,4000}?</ul>', 'i')) || [])[0] || html
    : html
  const liRe = /<li[^>]*>\s*<span class="label">([\s\S]*?)<\/span>([\s\S]*?)<\/li>/g
  let m
  while ((m = liRe.exec(seg))) {
    const key = stripTags(m[1])
    const val = stripTags(m[2])
    if (key && val) out[key] = val
  }
  return out
}

// 户型「3室2厅2卫」→ 卧室/卫生间数；单间 → 1/1
export function parseLayout(text) {
  const s = String(text || '')
  if (/单间/.test(s)) return { bedrooms: 1, bathrooms: 1 }
  const b = s.match(/(\d+)\s*室/) || s.match(/(\d+)\s*房/)
  const t = s.match(/(\d+)\s*卫/)
  return { bedrooms: b ? Number(b[1]) : undefined, bathrooms: t ? Number(t[1]) : undefined }
}

// 收集并清洗图片：剥 !m_fill,w_xxx 缩放后缀与 ?from= 追踪参数，按 URL 去重
export function pickBeikeImages(html, maxImages = 15) {
  const seen = new Set()
  const out = []
  const re = /(?:data-original|data-src|src)="(https:\/\/[^"]*(?:ljcdn|ke-image|ke\.com)[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
  let m
  while ((m = re.exec(html))) {
    let u = m[1]
    if (/blank\.gif|logo|icon|avatar|qrcode|vrgold|weixin|app-/.test(u)) continue
    u = u.split('!')[0].split('?')[0]
    if (!/^https:\/\//.test(u) || seen.has(u)) continue
    seen.add(u)
    out.push(u)
    if (out.length >= maxImages) break
  }
  return out
}

async function fetchBeikePage(url) {
  const cookie = process.env.BEIKE_COOKIE
  const r = await fetch(url, {
    headers: {
      'user-agent': UA,
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'zh-CN,zh;q=0.9',
      'referer': 'https://gz.ke.com/',
      ...(cookie ? { cookie } : {})
    },
    redirect: 'follow'
  })
  if (!r.ok) throw new Error(`贝壳返回 HTTP ${r.status}`)
  const finalUrl = r.url || url
  const html = await r.text()
  if (/hip\.ke\.com\/captcha|<title>CAPTCHA/i.test(finalUrl + html)) {
    throw new Error(
      cookie
        ? '贝壳风控拦截：BEIKE_COOKIE 已失效，请在浏览器重新复制 Cookie 更新'
        : '贝壳风控拦截：需要配置 BEIKE_COOKIE（浏览器登录贝壳后复制）'
    )
  }
  return html
}

// 下载单张图片并经 uploadImage 转存图床（返回 { url }）
async function transferImage(imgUrl, idx, uploadImage) {
  const r = await fetch(imgUrl, {
    headers: { 'user-agent': UA, referer: 'https://gz.ke.com/' }
  })
  if (!r.ok) throw new Error(`图片下载失败 HTTP ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 3000) throw new Error('图片过小，疑似占位图')
  const ext = (/\.png$/i.test(imgUrl) ? 'png' : /\.webp$/i.test(imgUrl) ? 'webp' : 'jpg')
  const name = `beike-bk${Date.now()}-${idx}.${ext}`
  const { url: final } = await uploadImage(name, buf.toString('base64'))
  return final
}

function pick(obj, keys) {
  for (const k of keys) if (obj[k]) return obj[k]
  return ''
}

// 主流程：抓取详情页 → 解析红框属性 → 图片转存图床
// 无数据字段填「无数据」；主表单字段（价格/面积/户型等）能映射则映射
export async function scrapeBeikeListing(url, { uploadImage, maxImages = 12 } = {}) {
  if (!uploadImage) throw new Error('图床上传不可用')
  const html = await fetchBeikePage(url)

  // 标题：详情页 <h1 class="main">
  const title =
    stripTags((html.match(/<h1 class="main"[^>]*>([\s\S]*?)<\/h1>/) || [])[1]) ||
    stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]) ||
    ''

  // 价格：二手房 .total 为万；租房为元/月
  const totalNum = stripTags((html.match(/class="total"[^>]*>([\s\S]*?)</) || [])[1]).replace(/[^\d.]/g, '')
  const isZufang = /ke\.com\/(zufang|chuzu)\//.test(url)
  const price = totalNum ? (isZufang ? `${totalNum}元/月` : `${totalNum}万`) : ''

  // 红框字段：基本属性 + 交易属性
  const base = parseAttrList(html, 'base')
  const trans = parseAttrList(html, 'transaction')

  // 小区/区域：优先详情页小区链接，其次面包屑区域
  const xiaoqu =
    stripTags((html.match(/class="info_xiaoqu"[^>]*>([\s\S]*?)<\/a>/) || [])[1]) ||
    stripTags((html.match(/xiaoqu\/(\d+)/) ? '' : '')) ||
    stripTags((html.match(/resblockName['"]\s*:\s*['"]([^'"]+)/) || [])[1])
  const areaSpans = (html.match(/class="areaName"[\s\S]{0,600}?<\/div>/) || [])[0] || ''
  const areaParts = (areaSpans.match(/<a[^>]*>([^<]+)<\/a>/g) || []).map((a) => stripTags(a)).filter(Boolean)
  const district = areaParts.slice(1).join('') // 第一个通常是城市「广州」

  const layout = base['房源户型'] || ''
  const { bedrooms, bathrooms } = parseLayout(layout)
  const areaNum = (base['建筑面积'] || '').match(/([\d.]+)/)
  const area = areaNum ? areaNum[1] : ''

  // 图片：URL 去重 → 逐张下载转存（失败跳过）
  const imgUrls = pickBeikeImages(html, maxImages)
  const images = []
  for (let i = 0; i < imgUrls.length; i++) {
    try {
      images.push(await transferImage(imgUrls[i], i + 1, uploadImage))
    } catch (e) {
      console.error(`beike image ${i + 1} failed:`, e.message)
    }
  }

  // 贝壳专属信息栏：有数据填真实数据，无数据填「无数据」
  const beike = {
    小区: xiaoqu || '无数据',
    户型: layout || '无数据',
    建筑面积: base['建筑面积'] || '无数据',
    户型结构: base['户型结构'] || '无数据',
    楼层类型: base['楼层类型'] || '无数据',
    所在楼层: base['所在楼层'] || '无数据',
    装修类型: base['装修类型'] || base['装修情况'] || '无数据',
    房屋朝向: base['房屋朝向'] || '无数据',
    建筑类型: base['建筑类型'] || '无数据',
    电梯: base['电梯情况'] || base['有无电梯'] || '无数据',
    楼户比例: base['楼户比例'] || '无数据',
    挂牌时间: trans['挂牌时间'] || '无数据',
    交易权属: trans['交易权属'] || '无数据',
    上次交易: trans['上次交易'] || '无数据',
    房屋用途: trans['房屋用途'] || '无数据',
    房屋年限: trans['房屋年限'] || '无数据',
    产权所属: trans['产权所属'] || '无数据',
    抵押信息: trans['抵押信息'] || '无数据',
    房源编码: trans['房源编码'] || trans['房源编号'] || url.match(/([0-9A-Za-z]+)\.html/)?.[1] || '无数据'
  }

  // 描述：核心卖点/房源介绍 + 结构化贝壳信息块（公开详情页可见）
  const intro =
    stripTags((html.match(/class="content"[^>]*>([\s\S]{100,4000}?)<\/div>/) || [])[1]).slice(0, 600) || ''
  const detailLines = Object.entries(beike)
    .map(([k, v]) => `${k}：${v}`)
    .join('\n')
  const description =
    (intro ? intro + '\n\n' : '') + `【贝壳房源信息】\n${detailLines}`

  const city = /gz\.ke\.com/.test(url) ? '广州市' : district ? district.slice(0, 3) : ''
  const address = [district, xiaoqu].filter(Boolean).join('') || ''

  const missing = []
  if (!title) missing.push('标题')
  if (!price) missing.push('价格')
  if (!images.length) missing.push('图片')

  return { title, price, city, address, area, bedrooms, bathrooms, description, images, beike, missing }
}
