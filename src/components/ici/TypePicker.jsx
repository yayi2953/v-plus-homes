import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

/* 房源类型二级选择弹窗（移动端/平板端使用）
   —— 学生公寓选择「校区」，豪华/普通/城市公寓选择「区域」。
   明确「不铺满全屏」：居中卡片，四周保留安全留白，列表超高时仅内部滚动。 */

const CapIcon = ({ variant }) => {
  if (variant === 'student') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 4 10 5-10 5L2 9l10-5Z" />
        <path d="M6 11.4V16c0 1.3 2.7 3 6 3s6-1.7 6-3v-4.6" />
        <path d="M22 9v5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

const AllIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export default function TypePicker() {
  const { c } = useIciI18n()
  const dc = c.discover
  const types = dc.types ?? []
  const reduceMotion = useReducedMotion()

  const [typeKey, setTypeKey] = useState(null)

  useEffect(() => {
    // 四类房源统一入口：详情携带住宅类型 key
    const onPick = (e) => {
      if (typeof e.detail === 'string' && types.some((t) => t.key === e.detail)) setTypeKey(e.detail)
    }
    // 兼容旧事件名
    const onPickSchool = () => setTypeKey('student')
    window.addEventListener('ici:pick-type', onPick)
    window.addEventListener('ici:pick-school', onPickSchool)
    return () => {
      window.removeEventListener('ici:pick-type', onPick)
      window.removeEventListener('ici:pick-school', onPickSchool)
    }
  }, [types])

  /* 弹窗打开期间锁定背景滚动 */
  useEffect(() => {
    if (!typeKey) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [typeKey])

  /* Esc 关闭 */
  useEffect(() => {
    if (!typeKey) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setTypeKey(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [typeKey])

  const activeType = types.find((t) => t.key === typeKey) ?? null
  const isStudent = typeKey === 'student'
  const options = isStudent ? dc.schools ?? [] : dc.tabs ?? []
  const title = isStudent ? dc.schoolPickerTitle : dc.areaPickerTitle
  const sub = isStudent ? dc.schoolPickerSub : dc.areaPickerSub.replace('{type}', activeType?.label ?? '')
  const allLabel = isStudent ? dc.schoolPickerAll : dc.areaPickerAll
  const closeLabel = isStudent ? dc.schoolPickerClose : dc.areaPickerClose
  const capVariant = isStudent ? 'student' : 'area'

  const choose = (key) => {
    // 先关弹窗，再广播选择：
    // 学生公寓 → ici:select-school(校区 key) / 全部校区 → ici:switch-tab(student)
    // 其他类型 → ici:type-district({type, district}) / 全部区域 → ici:switch-tab(type)
    setTypeKey(null)
    if (isStudent) {
      if (key) {
        window.dispatchEvent(new CustomEvent('ici:select-school', { detail: key }))
      } else {
        window.dispatchEvent(new CustomEvent('ici:switch-tab', { detail: 'student' }))
      }
    } else if (key) {
      window.dispatchEvent(new CustomEvent('ici:type-district', { detail: { type: typeKey, district: key } }))
    } else {
      window.dispatchEvent(new CustomEvent('ici:switch-tab', { detail: typeKey }))
    }
    // 平板/桌面：Discover 区域承载结果，滚动到位；手机端该节点隐藏，no-op
    window.setTimeout(() => {
      document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const dur = reduceMotion ? 0.01 : 0.24

  return createPortal(
    <AnimatePresence>
      {typeKey && (
        <motion.div
          className="type-picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur }}
          onClick={() => setTypeKey(null)}
        >
          <motion.div
            className="type-picker__dialog"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="type-picker__head">
              <div>
                <h2 className="type-picker__title">{title}</h2>
                <p className="type-picker__sub">{sub}</p>
              </div>
              <button
                type="button"
                className="type-picker__close"
                aria-label={closeLabel}
                onClick={() => setTypeKey(null)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <ul className="type-picker__list">
              <li>
                <button type="button" className="type-picker__option type-picker__option--all" onClick={() => choose(null)}>
                  <span className="type-picker__cap" aria-hidden="true">
                    <AllIcon />
                  </span>
                  <span className="type-picker__label">{allLabel}</span>
                  <span className="type-picker__chevron" aria-hidden="true">
                    <ChevronIcon />
                  </span>
                </button>
              </li>
              {options.map((o) => (
                <li key={o.key}>
                  <button type="button" className="type-picker__option" onClick={() => choose(o.key)}>
                    <span className="type-picker__cap" aria-hidden="true">
                      <CapIcon variant={capVariant} />
                    </span>
                    <span className="type-picker__label">{o.label}</span>
                    <span className="type-picker__chevron" aria-hidden="true">
                      <ChevronIcon />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
