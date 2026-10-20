import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import SmartImage from '../common/SmartImage.jsx'

export default function V8Team() {
  const { c } = useIciI18n()
  const intro = c.teamIntro
  const members = intro?.members || []
  const t = c.v8?.team || {}
  if (!members.length) return null
  return (
    <section className="v8-team" id="team">
      <div className="v8-wrap v8-section">
        <div className="v8-sec-head v8-rise">
          <p className="v8-eyebrow" data-edit-key="v8.team.eyebrow">{t.eyebrow || intro.overline}</p>
          <h2 className="v8-h-sec" style={{ marginTop: 12 }} data-edit-key="v8.team.title">{t.title || intro.titleLead}</h2>
          <p className="v8-lede" data-edit-key="v8.team.desc">{t.desc || intro.desc}</p>
        </div>
        <div className="v8-team-grid v8-rise">
          {members.map((m) => (
            <article className="v8-member" key={m.index}>
              <div className="v8-member__ph">
                {m.img
                  ? <SmartImage src={m.img} alt={m.name} />
                  : <span aria-hidden="true">{(m.name || '?').trim().charAt(0).toUpperCase()}</span>}
              </div>
              <div className="v8-member__b">
                <div>
                  <div className="v8-member__name">{m.name}</div>
                  <div className="v8-member__role">{m.role}</div>
                </div>
                {m.linkedin
                  ? <a className="v8-member__in" href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} LinkedIn`}>in</a>
                  : <span className="v8-member__in" aria-hidden="true">in</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
