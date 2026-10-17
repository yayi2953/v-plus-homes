import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { iciContent } from './iciContent.js'
import { setDefaultTitle, resyncSeo } from '../lib/seo.mjs'
import { urlLang, syncRouter } from '../lib/router.mjs'
import { setByPath } from './flatten.js'
import { collectImageOverrides, startImageOverrides } from './imageOverrides.js'

const IciI18nContext = createContext(null)
const STORAGE_KEY = 'hereici-lang'

// 区块开关默认值
const DEFAULT_SECTIONS = {
  hero: true, types: true, discover: true, team: true,
  why: true, extras: true, getstarted: true, footer: true
}

function getInitialLang() {
  const fromUrl = urlLang()
  if (fromUrl === 'zh' || fromUrl === 'en' || fromUrl === 'ja') return fromUrl
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en' || saved === 'ja') return saved
  } catch { /* ignore */ }
  return 'en'
}

// 深拷贝翻译对象，避免修改原数据
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function IciI18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)
  const [overrides, setOverrides] = useState({})
  const [realListings, setRealListings] = useState([])

  useEffect(() => { syncRouter(window.location.pathname) }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja' : 'en'
    resyncSeo()
  }, [lang])

  // 从后端拉取文案覆盖项
  const loadOverrides = useCallback(async () => {
    try {
      const res = await fetch('/api/texts')
      if (res.ok) {
        const data = await res.json()
        setOverrides(data.texts || {})
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadOverrides() }, [loadOverrides])

  // 从后端拉取真实房源（管理后台创建），追加到虚拟房源列表之后
  const TYPE_MAP = { luxury: 'luxury', standard: 'standard', student: 'student', city: 'city' }
  const loadRealListings = useCallback(async () => {
    try {
      const res = await fetch('/api/listings')
      if (!res.ok) return
      const data = await res.json()
      const normalized = (data.listings || [])
        .filter((l) => l.published !== false)
        .map((l) => {
          const imgs = (Array.isArray(l.images) && l.images.length ? l.images : (l.image ? [l.image] : [])).filter(Boolean)
          const beds = parseInt(l.bedrooms, 10) || 1
          return {
            code: l.code || l.id,
            br: `${beds} BR`,
            baths: parseInt(l.bathrooms, 10) || 1,
            area: parseInt(l.area, 10) || 0,
            amenities: [],
            district: [l.address, l.city].filter(Boolean).join(' · ') || l.city || '',
            districtKey: null,
            price: `¥${l.price}`,
            img: imgs[0] || '/images/listing-family.jpg',
            gallery: imgs.slice(1),
            categories: [TYPE_MAP[l.type] || 'standard'],
            schoolKeys: [],
            metro: '',
            _real: true
          }
        })
      setRealListings(normalized)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadRealListings() }, [loadRealListings])

  // 应用图片覆盖项：立即应用 + 监听 DOM 变化持续再应用
  const imgMap = useMemo(() => collectImageOverrides(overrides), [overrides])
  useEffect(() => {
    return startImageOverrides(() => imgMap)
  }, [imgMap])

  const value = useMemo(() => {
    const c = deepClone(iciContent[lang])
    delete c.lang
    c.sections = { ...DEFAULT_SECTIONS, ...(c.sections || {}) }
    // 房源类型/校区多选兼容
    c.properties = (Array.isArray(c.properties) ? c.properties : []).map((p) => ({
      ...p,
      categories: Array.isArray(p.categories) && p.categories.length
        ? p.categories : (p.category ? [p.category] : []),
      schoolKeys: Array.isArray(p.schoolKeys) && p.schoolKeys.length
        ? p.schoolKeys : (p.schoolKey ? [p.schoolKey] : [])
    }))

    // 追加后台真实房源（index 全局唯一，详情页按 index 直接打开）
    c.properties = [...c.properties, ...realListings]

    // 应用后端文案覆盖项
    for (const [key, val] of Object.entries(overrides)) {
      if (val && typeof val === 'object') {
        const text = val[lang]
        if (text !== undefined && text !== null) {
          setByPath(c, key, text)
        }
      }
    }

    const t = typeof c.siteName === 'string' ? c.siteName.trim() : ''
    if (t) setDefaultTitle(t)
    return {
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === 'zh' ? 'en' : 'zh')),
      c,
      remoteReady: true,
      reloadTexts: loadOverrides
    }
  }, [lang, overrides, realListings, loadOverrides])

  return <IciI18nContext.Provider value={value}>{children}</IciI18nContext.Provider>
}

export function useIciI18n() {
  const ctx = useContext(IciI18nContext)
  if (!ctx) throw new Error('useIciI18n must be used within IciI18nProvider')
  return ctx
}
