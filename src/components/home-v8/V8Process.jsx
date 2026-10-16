import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

export default function V8Process() {
  const { c } = useIciI18n()
  const t = c.v8?.process || {}
  const steps = t.steps || []
  if (!steps.length) return null
  return (
    <section className="v8-section" id="process">
      <div className="v8-wrap">
        <div className="v8-sec-head v8-rise">
          <p className="v8-eyebrow">{t.eyebrow}</p>
          <h2 className="v8-h-sec" style={{ marginTop: 12 }}>{t.title}</h2>
        </div>
        <div className="v8-proc">
          {steps.map((s, i) => (
            <div className="v8-proc-row v8-rise" key={i}>
              <div className="v8-proc-num">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
