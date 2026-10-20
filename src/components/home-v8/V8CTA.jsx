import { Check } from '../ici/Icons.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

export default function V8CTA() {
  const { c } = useIciI18n()
  const g = c.getStarted || {}
  const foot = c.v8?.cta?.footnote
  return (
    <section className="v8-cta" id="get-started">
      <p className="v8-eyebrow v8-rise" data-edit-key="v8.getStarted.eyebrow">{g.eyebrow}</p>
      <h2 className="v8-h-sec v8-rise" style={{ marginTop: 14 }}>
        <span data-edit-key="v8.getStarted.titleA">{g.titleA}</span><span data-edit-key="v8.getStarted.titleAccent" style={{ color: 'var(--v8-muted)' }}>{g.titleAccent}</span><span data-edit-key="v8.getStarted.titleB">{g.titleB}</span>
      </h2>
      <p className="v8-lede v8-rise" data-edit-key="v8.getStarted.desc">{g.desc}</p>
      <div className="v8-cta-row v8-rise">
        <button type="button" className="v8-btn v8-btn--dark" data-edit-key="v8.getStarted.book">{g.book}</button>
        <button type="button" className="v8-btn v8-btn--wa" data-edit-key="v8.getStarted.whatsapp">{g.whatsapp}</button>
      </div>
      {Array.isArray(g.checks) && g.checks.filter(Boolean).length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '26px 0 0', display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
          {g.checks.filter(Boolean).map((text, i) => (
            <li key={text} data-edit-key={`v8.getStarted.checks.${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: 'var(--v8-muted)' }}>
              <Check size={14} /> {text}
            </li>
          ))}
        </ul>
      )}
      {foot && <p className="v8-cta-foot" data-edit-key="v8.cta.footnote">{foot}</p>}
    </section>
  )
}
