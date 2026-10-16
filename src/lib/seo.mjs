// 轻量 SEO meta 管理器：SPA 切换到房源/文章等"子页面"时动态改写
// title、description、canonical、Open Graph、hreflang 与 JSON-LD；离开时恢复首页默认。
// I18n Provider 用 setDefaultTitle 设置默认站点名，存在 override 时不覆盖。
//
// 中英独立 URL（/zh/...、/en/...）：canonical 始终指向当前语言的前缀 URL，
// 每个页面同时输出 en / zh-CN / x-default 三组 hreflang，供 Google 建双语索引。

import { currentLangPrefix } from './router.mjs'

export const SITE_ORIGIN = 'https://www.vplushomes.com'
const LANG_PREFIX_RE = /^\/(zh|en)(?=\/|$)/

let defaultTitle = document.title
let override = null

function meta(selector, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
    document.head.appendChild(el)
  }
  return el
}

function setMetaContent(selector, attrs, content) {
  if (!content) return
  meta(selector, attrs).setAttribute('content', content)
}

function setLink(selector, attrs, href) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// 从（可能带语言前缀的）路径还原语言与无前缀路径
function resolvePath(path) {
  const safe = path || '/'
  const m = safe.match(LANG_PREFIX_RE)
  const explicit = m ? m[1] : null
  const bare = explicit ? safe.slice(explicit.length + 1) || '/' : safe
  // 路径自带前缀以它为准；否则用当前页面语言；都没有则默认英文（旧的无前缀链接归入英文索引）
  const lang = explicit || currentLangPrefix() || 'en'
  return { bare, lang }
}

function langUrl(lang, bare) {
  return `${SITE_ORIGIN}/${lang}${bare === '/' ? '' : bare}`
}

// canonical + 三个 hreflang 替代版本
function setLinks(path) {
  const { bare, lang } = resolvePath(path)
  const self = langUrl(lang, bare)
  setLink('link[rel="canonical"]', { rel: 'canonical' }, self)
  setLink('link[hreflang="en"]', { rel: 'alternate', hreflang: 'en' }, langUrl('en', bare))
  setLink('link[hreflang="zh-CN"]', { rel: 'alternate', hreflang: 'zh-CN' }, langUrl('zh', bare))
  setLink('link[hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default' }, langUrl('en', bare))
  return self
}

export function setDefaultTitle(t) {
  if (t) defaultTitle = t
  if (!override) document.title = defaultTitle
}

// seo: { title, description, path(可带语言前缀), image, type, jsonLd(object) }
export function setSeo(seo) {
  override = seo
  if (seo.title) document.title = seo.title
  const url = setLinks(seo.path || '/')
  if (seo.description) {
    setMetaContent('meta[name="description"]', { name: 'description' }, seo.description)
    setMetaContent('meta[property="og:description"]', { property: 'og:description' }, seo.description)
    meta('meta[name="twitter:description"]', { name: 'twitter:description' })
      .setAttribute('content', seo.description)
  }
  setMetaContent('meta[property="og:title"]', { property: 'og:title' }, seo.title)
  setMetaContent('meta[name="twitter:title"]', { name: 'twitter:title' }, seo.title)
  setMetaContent('meta[property="og:type"]', { property: 'og:type' }, seo.type || 'website')
  setMetaContent('meta[property="og:url"]', { property: 'og:url' }, url)
  if (seo.image) {
    setMetaContent('meta[property="og:image"]', { property: 'og:image' }, seo.image)
    setMetaContent('meta[name="twitter:image"]', { name: 'twitter:image' }, seo.image)
  }
  let script = document.getElementById('ici-seo-jsonld')
  if (seo.jsonLd) {
    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'ici-seo-jsonld'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(seo.jsonLd)
  } else if (script) {
    script.remove()
  }
}

// 语言在同一页面内切换（首页或子页面）时，按当前语言前缀刷新 canonical/hreflang/og:url；
// 子页面的 title/description 由各组件自身的 lang 副作用重新 setSeo
export function resyncSeo() {
  const url = setLinks(override?.path || '/')
  setMetaContent('meta[property="og:url"]', { property: 'og:url' }, url)
}

export function clearSeo() {
  if (!override) {
    // 即使没有子页面 SEO（如直接落在首页），canonical/hreflang 也要与当前语言一致
    setLinks('/')
    return
  }
  override = null
  document.title = defaultTitle
  const home = setLinks('/')
  setMetaContent('meta[property="og:type"]', { property: 'og:type' }, 'website')
  setMetaContent('meta[property="og:url"]', { property: 'og:url' }, home)
  const script = document.getElementById('ici-seo-jsonld')
  if (script) script.remove()
}
