import { Check } from '../ici/Icons.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

export default function V8CTA() {
  const { c } = useIciI18n()
  const g = c.getStarted || {}
  const foot = c.v8?.cta?.footnote
  return (
    <section className="v8-cta" id="get-started">
      <p className="v8-eyebrow v8-rise">{g.eyebrow}</p>
      <h2 className="v8-h-sec v8-rise" style={{ marginTop: 14 }}>
        {g.titleA}<span style={{ color: 'var(--v8-muted)' }}>{g.titleAccent}</span>{g.titleB}
      </h2>
      <p className="v8-lede v8-rise">{g.desc}</p>
      <div className="v8-cta-row v8-rise">
        <button type="button" className="v8-btn v8-btn--dark">{g.book}</button>
        <button type="button" className="v8-btn v8-btn--wa">{g.whatsapp}</button>
      </div>
      {Array.isArray(g.checks) && g.checks.filter(Boolean).length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '26px 0 0', display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
          {g.checks.filter(Boolean).map((text) => (
            <li key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: 'var(--v8-muted)' }}>
              <Check size={14} /> {text}
            </li>
          ))}
        </ul>
      )}
      {foot && <p className="v8-cta-foot">{foot}</p>}
    </section>
  )
}
