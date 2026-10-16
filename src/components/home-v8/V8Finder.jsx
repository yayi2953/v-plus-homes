import { useEffect, useRef, useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

/* 一句话找房：把房型 / 区域 / 户型 / 预算做成句中可点选的胶囊，即选即筛房源。
   完全受控（条件由 FinderProvider 持有），自身只负责弹层开关。 */

const CHEVRON_DOWN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
)
const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

function ChipSelect({ field, label, filled, open, side, onToggle, children }) {
  return (
    <span className={`v8-chip-wrap${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className={`v8-chip${filled ? ' is-filled' : ''}${open ? ' is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => onToggle(e)}
      >
        <span className="v8-chip__label">{label}</span>
        <span className="v8-chip__caret">{CHEVRON_DOWN}</span>
      </button>
      {open && (
        <span className={`v8-chip-menu${side === 'right' ? ' is-right' : ''}`} role="listbox" aria-label={field}>
          {children}
        </span>
      )}
    </span>
  )
}

export default function V8Finder({ district, beds, budget, type, count = 0, filtered = false, onChange, onReset, onConfirm }) {
  const { c } = useIciI18n()
  const t = c.v8?.finder || {}
  const districts = c.discover?.tabs ?? []
  const typeOpts = c.discover?.types ?? []
  const bedOpts = t.beds || []
  const budgetOpts = t.budgets || []
  const line = t.line || []

  const [openField, setOpenField] = useState(null)
  const [menuSide, setMenuSide] = useState('left')
  const rootRef = useRef(null)

  useEffect(() => {
    if (!openField) return undefined
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpenField(null)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpenField(null) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openField])

  const pick = (patch) => {
    onChange?.(patch)
    setOpenField(null)
  }

  // 首屏居中式句子：弹层打开后右边界会超出视口时改为右对齐，避免溢出
  const toggle = (field, e) => {
    if (openField === field) {
      setOpenField(null)
      return
    }
    const vw = window.innerWidth || document.documentElement.clientWidth || 1200
    const r = e.currentTarget.getBoundingClientRect()
    setMenuSide(r.left + 200 > vw - 8 ? 'right' : 'left')
    setOpenField(field)
  }

  const districtLabel = districts.find((x) => x.key === district)?.label || t.districtAny
  const typeLabel = typeOpts.find((x) => x.key === type)?.label || t.typeAny
  const bedLabel = bedOpts.find((x) => x.v === beds)?.label || t.bedsAny
  const budgetLabel = budgetOpts.find((x) => x.v === budget)?.label || t.budgetAny

  const renderField = (field) => {
    if (field === 'type') {
      return (
        <ChipSelect field={field} label={typeLabel} filled={!!type} open={openField === field} side={menuSide} onToggle={(e) => toggle(field, e)}>
          <button type="button" role="option" aria-selected={!type} className={`v8-chip-opt${!type ? ' is-selected' : ''}`} onClick={() => pick({ type: null })}>
            <span>{t.typeAny}</span>{!type && CHECK}
          </button>
          {typeOpts.map((ty) => (
            <button key={ty.key} type="button" role="option" aria-selected={type === ty.key} className={`v8-chip-opt${type === ty.key ? ' is-selected' : ''}`} onClick={() => pick({ type: ty.key })}>
              <span>{ty.label}</span>{type === ty.key && CHECK}
            </button>
          ))}
        </ChipSelect>
      )
    }
    if (field === 'district') {
      return (
        <ChipSelect field={field} label={districtLabel} filled={district !== 'all'} open={openField === field} side={menuSide} onToggle={(e) => toggle(field, e)}>
          <button type="button" role="option" aria-selected={district === 'all'} className={`v8-chip-opt${district === 'all' ? ' is-selected' : ''}`} onClick={() => pick({ district: 'all' })}>
            <span>{t.districtAny}</span>{district === 'all' && CHECK}
          </button>
          {districts.map((d) => (
            <button key={d.key} type="button" role="option" aria-selected={district === d.key} className={`v8-chip-opt${district === d.key ? ' is-selected' : ''}`} onClick={() => pick({ district: d.key })}>
              <span>{d.label}</span>{district === d.key && CHECK}
            </button>
          ))}
        </ChipSelect>
      )
    }
    if (field === 'beds') {
      return (
        <ChipSelect field={field} label={bedLabel} filled={beds != null} open={openField === field} side={menuSide} onToggle={(e) => toggle(field, e)}>
          <button type="button" role="option" aria-selected={beds == null} className={`v8-chip-opt${beds == null ? ' is-selected' : ''}`} onClick={() => pick({ beds: null })}>
            <span>{t.bedsAny}</span>{beds == null && CHECK}
          </button>
          {bedOpts.map((b) => (
            <button key={b.v} type="button" role="option" aria-selected={beds === b.v} className={`v8-chip-opt${beds === b.v ? ' is-selected' : ''}`} onClick={() => pick({ beds: b.v })}>
              <span>{b.label}</span>{beds === b.v && CHECK}
            </button>
          ))}
        </ChipSelect>
      )
    }
    return (
      <ChipSelect field={field} label={budgetLabel} filled={budget != null} open={openField === field} side={menuSide} onToggle={(e) => toggle(field, e)}>
        <button type="button" role="option" aria-selected={budget == null} className={`v8-chip-opt${budget == null ? ' is-selected' : ''}`} onClick={() => pick({ budget: null })}>
          <span>{t.budgetAny}</span>{budget == null && CHECK}
        </button>
        {budgetOpts.map((b) => (
          <button key={b.v} type="button" role="option" aria-selected={budget === b.v} className={`v8-chip-opt${budget === b.v ? ' is-selected' : ''}`} onClick={() => pick({ budget: b.v })}>
            <span>{b.label}</span>{budget === b.v && CHECK}
          </button>
        ))}
      </ChipSelect>
    )
  }

  return (
    <div className="v8-finder" ref={rootRef}>
      <p className="v8-finder__eyebrow">{t.eyebrow}</p>
      <p className="v8-finder__line">
        {line.map((seg, i) =>
          seg === 'district' || seg === 'beds' || seg === 'budget'
            ? <span key={i}>{renderField(seg)}</span>
            : <span key={i} className="v8-finder__txt">{seg}</span>
        )}
      </p>
      <p className="v8-finder__line v8-finder__line--type">
        <span className="v8-finder__txt">{t.typeAsk}</span>
        {renderField('type')}
      </p>
      <p className="v8-finder__foot">
        <span className="v8-finder__count">{String(t.count || '').replace('{n}', count)}</span>
        {filtered && (
          <button type="button" className="v8-finder__clear" onClick={onReset}>
            {t.clear}
          </button>
        )}
      </p>
      <div className="v8-finder__actions">
        <button type="button" className="v8-btn v8-btn--dark v8-finder__go" onClick={onConfirm}>
          {t.findBtn}
        </button>
      </div>
    </div>
  )
}
