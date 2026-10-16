import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { iciContent } from './iciContent.js'
import { setDefaultTitle, resyncSeo } from '../lib/seo.mjs'
import { urlLang, syncRouter } from '../lib/router.mjs'

const IciI18nContext = createContext(null)
const STORAGE_KEY = 'hereici-lang'

// 区块开关默认值
const DEFAULT_SECTIONS = {
  hero: true, types: true, discover: true, team: true,
  why: true, extras: true, getstarted: true, footer: true
}

function getInitialLang() {
  const fromUrl = urlLang()
  if (fromUrl === 'zh' || fromUrl === 'en') return fromUrl
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch { /* ignore */ }
  return 'en'
}

export function IciI18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)

  useEffect(() => { syncRouter(window.location.pathname) }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    resyncSeo()
  }, [lang])

  const value = useMemo(() => {
    const c = { ...iciContent[lang] }
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
    const t = typeof c.siteName === 'string' ? c.siteName.trim() : ''
    if (t) setDefaultTitle(t)
    return {
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === 'zh' ? 'en' : 'zh')),
      c,
      remoteReady: true
    }
  }, [lang])

  return <IciI18nContext.Provider value={value}>{children}</IciI18nContext.Provider>
}

export function useIciI18n() {
  const ctx = useContext(IciI18nContext)
  if (!ctx) throw new Error('useIciI18n must be used within IciI18nProvider')
  return ctx
}
