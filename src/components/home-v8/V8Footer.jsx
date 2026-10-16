import { useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { FooterLanguageSelect } from '../ici/LanguageSwitcher.jsx'
import LegalModal from '../ici/LegalModal.jsx'
import { navigate } from '../../lib/router.mjs'

const LEGAL_DOCS = ['privacy', 'cookies', 'terms']
function matchLegal(label, index) {
  const s = String(label).toLowerCase()
  if (s.includes('隐私') || s.includes('privacy')) return 'privacy'
  if (s.includes('cookie')) return 'cookies'
  if (s.includes('条款') || s.includes('细则') || s.includes('term')) return 'terms'
  return LEGAL_DOCS[index] || null
}

// 页脚链接仅有文案、无 href：按中英文关键词映射到站内锚点/路由，识别不出则渲染为纯文本
function footerAction(label) {
  const s = String(label).toLowerCase()
  if (s.includes('map') || s.includes('地图')) return () => navigate('/map')
  if (s.includes('guide') || s.includes('指南')) return () => navigate('/guides')
  const anchors = [
    [['listing', '房源', 'apartment', 'home', '住宅'], '#listings'],
    [['type', '户型', 'residence'], '#types'],
    [['service', '服务'], '#extra-services'],
    [['team', '团队', 'about'], '#team'],
    [['process', '流程'], '#process'],
    [['contact', '联系', 'contact'], '#get-started']
  ]
  for (const [words, id] of anchors) {
    if (words.some((w) => s.includes(w))) {
      return () => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }
  return null
}

// 已下线的模板列：全国房源/城市占位链接、资源占位链接（中英）
const HIDDEN_GROUP_TITLES = new Set(['房源', 'listings', '资源', 'resources'])

export default function V8Footer() {
  const { c } = useIciI18n()
  const f = c.footer || {}
  const [legalDoc, setLegalDoc] = useState(null)
  const groups = (Array.isArray(f.groups) ? f.groups : []).filter((g) => {
    const t = String(g.title || '').replace(/[.\s]/g, '').toLowerCase()
    return !HIDDEN_GROUP_TITLES.has(t)
  })

  return (
    <footer className="v8-footer">
      <div className="v8-footer-in">
        <div className="v8-footer-cols">
          <div className="v8-footer-brand">
            <a className="v8-wordmark" href="#top" onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}>
              {c.nav?.logo || c.siteName || 'VIVA'}
            </a>
            <p>{f.desc}</p>
            <p style={{ marginTop: 14 }}>
              {f.email && <a href={`mailto:${f.email}`} style={{ color: 'var(--v8-muted)' }}>{f.email}</a>}
              {f.email && f.phone && <span> &nbsp;·&nbsp; </span>}
              {f.phone && <a href={`tel:${String(f.phone).replace(/[^+\d]/g, '')}`} style={{ color: 'var(--v8-muted)' }}>{f.phone}</a>}
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h4>{g.title}</h4>
              <ul>
                {(g.links || []).filter(Boolean).map((l) => {
                  const act = footerAction(l)
                  return (
                    <li key={l}>
                      {act
                        ? <button type="button" onClick={act}>{l}</button>
                        : <span style={{ color: 'var(--v8-muted)' }}>{l}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="v8-footer-bottom">
          <span>{f.copyright}</span>
          <div className="v8-footer-legal">
            {(f.legal || []).filter(Boolean).map((l, i) => {
              const key = matchLegal(l, i)
              return key
                ? <a key={l} href="#legal" onClick={(e) => { e.preventDefault(); setLegalDoc(key) }}>{l}</a>
                : null
            })}
            <FooterLanguageSelect />
          </div>
        </div>
      </div>
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </footer>
  )
}
