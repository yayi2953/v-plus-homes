// 极简 History API 路由（无路由库）：
// 支持独立中英 URL（SEO 用，服务端按前缀预渲染 + hreflang）：
// /zh/...                 → 中文页面，英文对应 /en/...；无前缀旧链默认归入英文版
// /                       → 首页
// /map                    → 地图找房
// /properties/:code       → 房源详情（深链可分享，服务端 rewrite 到 /api/page）
// /guides                 → 租房指南列表
// /guides/:slug           → 指南文章
export const LANGS = ['zh', 'en']
const LANG_PREFIX_RE = /^\/(zh|en)(?=\/|$)/

// 当前位置的语言前缀（由 syncRouter 在导航/popstate 时维护，供 propertyPath 等使用）
let activePrefix = null

export function parsePath(pathname = window.location.pathname) {
  const m = pathname.match(LANG_PREFIX_RE)
  const prefix = m ? m[1] : null
  // bare 始终以 / 开头；/zh → '/'，/zh/map → '/map'
  const bare = (prefix ? pathname.slice(prefix.length + 1) : pathname) || '/'
  return { prefix, bare }
}

// 首次加载的初始语言：URL 前缀最优先（爬虫预渲染落地），其次本地偏好，最后英文
export function urlLang(pathname) {
  try {
    const { prefix } = parsePath(pathname || window.location.pathname)
    if (prefix) return prefix
  } catch {
    /* ignore */
  }
  return null
}

export function syncRouter(pathname) {
  activePrefix = parsePath(pathname).prefix
  return activePrefix
}

export function currentLangPrefix() {
  return activePrefix
}

// 给站内路径补上当前语言前缀；已带前缀或当前无前缀时原样返回
export function withPrefix(barePath, lang = activePrefix) {
  const m = barePath.match(LANG_PREFIX_RE)
  if (m) return barePath
  if (!lang) return barePath
  return `/${lang}${barePath === '/' ? '' : barePath}`
}

// 语言切换：把当前 URL 换成另一语言的对应页面（保留查询串），走统一的 popstate 事件流
export function switchLang(target) {
  if (!LANGS.includes(target)) return
  syncRouter(window.location.pathname)
  const { bare } = parsePath(window.location.pathname)
  const next = `/${target}${bare === '/' ? '' : bare}${window.location.search}`
  if (window.location.pathname + window.location.search === next) return
  window.history.pushState({}, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export const PROPERTY_RE = /^\/properties\/([^/]+)\/?$/
const GUIDE_ARTICLE_RE = /^\/guides\/([^/]+)\/?$/

export function propertyPath(code, lang) {
  return withPrefix(`/properties/${encodeURIComponent(code)}`, lang)
}

export function readRoute(pathname = window.location.pathname) {
  const { prefix, bare } = parsePath(pathname)
  const pm = bare.match(PROPERTY_RE)
  if (pm) return { type: 'property', code: decodeURIComponent(pm[1]), lang: prefix }
  if (bare === '/map' || bare === '/map/') return { type: 'map', lang: prefix }
  if (bare === '/guides' || bare === '/guides/') return { type: 'guides', lang: prefix }
  if (bare === '/listings' || bare === '/listings/') return { type: 'listings', lang: prefix }
  const gm = bare.match(GUIDE_ARTICLE_RE)
  if (gm) return { type: 'guide', slug: decodeURIComponent(gm[1]), lang: prefix }
  return { type: 'home', lang: prefix }
}

// 站内跳转：压历史并主动派发 popstate，各页面统一监听一个事件源
export function navigate(path, { replace = false } = {}) {
  syncRouter(window.location.pathname)
  const target = withPrefix(path)
  if (window.location.pathname === target) return
  window.history[replace ? 'replaceState' : 'pushState']({}, '', target)
  syncRouter(target)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
