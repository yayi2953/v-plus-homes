import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

export default function V8Stats() {
  const { c } = useIciI18n()
  const stats = (c.stats || []).filter((s) => s && s.value)
  if (!stats.length) return null
  return (
    <section className="v8-stats" id="stats" aria-label="stats">
      <div
        className="v8-stats-in"
        style={{ '--v8-stat-cols': Math.min(4, stats.length) }}
      >
        {stats.slice(0, 4).map((s, i) => (
          <div className="v8-stat v8-rise" key={s.label}>
            <b>{s.value}</b>
            <span data-edit-key={`stats.${i}.label`}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
