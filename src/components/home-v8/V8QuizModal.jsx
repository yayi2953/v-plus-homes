import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { Close } from '../ici/Icons.jsx'

// 快速找房问卷：户型区视频下方蓝色文本触发。
// 四题逐问（区域 → 房型 → 房间数 → 预算）：前三题下拉默认「不限」（不筛选该维度），
// 价格题为双把手区间滑杆（连续取值、精准到个位）；「上一步」常驻左下角，
// 「确认？」常驻右下角，点确认才在首页结果区就地筛选展示。
// 弹窗外壳复用 legal-overlay / legal-modal + v8-tmodal（微圆角、× 无灰底）体系。

const STEPS = [
  { key: 'district', get: (c) => (c.discover?.tabs || []).map((x) => ({ v: x.key, label: x.label })) },
  { key: 'type', get: (c) => (c.discover?.types || []).map((x) => ({ v: x.key, label: x.label })) },
  { key: 'beds', get: (c, ft) => (ft.beds || []).map((x) => ({ v: x.v, label: x.label })) },
  { key: 'budget', get: (c, ft) => (ft.budgets || []).map((x) => ({ v: x.v, label: x.label })) }
]

const fmtYen = (n) => `¥${Number(n || 0).toLocaleString('en-US')}`

export default function V8QuizModal({ open, onClose }) {
  const { c, lang } = useIciI18n()
  const t = c.v8?.finder?.quiz || {}
  const ft = c.v8?.finder || {}
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  // 价格题：双把手区间滑杆（lo/hi 为元，渲染时钳制到有效范围；初值哨兵 = 全范围）
  const [range, setRange] = useState({ lo: 0, hi: Number.MAX_SAFE_INTEGER })

  useEffect(() => {
    if (!open) return undefined
    setStep(0)
    setAnswers({})
    setRange({ lo: 0, hi: Number.MAX_SAFE_INTEGER })
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const finish = () => {
    // 点确认：按 v8:show-type 契约通知首页就地展开结果区（未选择的维度 = 不限 = null）
    onClose?.()
    window.dispatchEvent(new CustomEvent('v8:show-type', {
      detail: {
        type: answers.type || 'all',
        school: null,
        quiz: {
          district: answers.district || null,
          beds: answers.beds || null,
          budget: { min: rLo, max: rHi }
        }
      }
    }))
  }

  const cur = STEPS[step]
  const opts = cur.get(c, ft)
  const labels = {
    back: t.back || (lang === 'zh' ? '上一步' : lang === 'ja' ? '戻る' : 'Back'),
    confirm: t.confirm || (lang === 'zh' ? '确认？' : lang === 'ja' ? '確定しますか？' : 'Confirm?')
  }

  // 价格题：连续区间（min/max 取自预算刻度的两端，step=1 精准到个位）
  const budgets = ft.budgets || []
  const PRICE_MIN = budgets.length ? budgets[0].v : 0
  const PRICE_MAX = budgets.length ? budgets[budgets.length - 1].v : 0
  const PRICE_SPAN = Math.max(1, PRICE_MAX - PRICE_MIN)
  const rLo = Math.max(PRICE_MIN, Math.min(range.lo, PRICE_MAX))
  const rHi = Math.max(rLo, Math.min(range.hi, PRICE_MAX))
  const loPct = ((rLo - PRICE_MIN) / PRICE_SPAN) * 100
  const hiPct = ((rHi - PRICE_MIN) / PRICE_SPAN) * 100
  // 把手更新：重叠时智能重定向（右拖右把手/左拖左把手），避免两把手互相卡死
  const onLo = (val) => {
    const v = Number(val)
    if (rLo === rHi && v > rLo) setRange({ lo: rLo, hi: Math.min(v, PRICE_MAX) })
    else setRange({ lo: Math.min(v, rHi), hi: rHi })
  }
  const onHi = (val) => {
    const v = Number(val)
    if (rLo === rHi && v < rHi) setRange({ lo: Math.max(v, PRICE_MIN), hi: rHi })
    else setRange({ lo: rLo, hi: Math.max(v, rLo) })
  }

  return createPortal(
    <AnimatePresence>
      <motion.div className="legal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onClose?.()}>
        <motion.div
          className="legal-modal v8-tmodal v8-quiz"
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="v8-tmodal__head">
            <h3 className="v8-tmodal__title" data-edit-key="v8.finder.quiz.title">
              {t.title}
              <span className="v8-quiz__step">{step + 1} / 4</span>
            </h3>
            <button type="button" className="legal-modal__close" onClick={() => onClose?.()} aria-label={lang === 'zh' ? '关闭' : 'Close'}>
              <Close size={16} />
            </button>
          </header>
          <div className="v8-tmodal__body">
            <p className="v8-quiz__q" data-edit-key={`v8.finder.quiz.questions.${step}`}>{(t.questions || [])[step]}</p>
            {cur.key === 'budget' ? (
              /* 价格题：双把手区间滑杆，连续取值精准到个位；下方刻度按真实位置参考 */
              <div className="v8-quiz__slider">
                <div className="v8-quiz__slider-val">
                  {rLo === rHi ? fmtYen(rLo) : `${fmtYen(rLo)} – ${fmtYen(rHi)}`}
                </div>
                <div
                  className="v8-quiz__range"
                  style={{ background: `linear-gradient(to right, #e3e5e9 ${loPct}%, #0070d5 ${loPct}%, #0070d5 ${hiPct}%, #e3e5e9 ${hiPct}%)` }}
                >
                  <input
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step="1"
                    value={rLo}
                    style={{ zIndex: rLo === rHi ? 3 : 1 }}
                    aria-label={(t.questions || [])[3]}
                    onChange={(e) => onLo(e.target.value)}
                  />
                  <input
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step="1"
                    value={rHi}
                    style={{ zIndex: rLo === rHi ? 1 : 2 }}
                    aria-label={(t.questions || [])[3]}
                    onChange={(e) => onHi(e.target.value)}
                  />
                </div>
                <div className="v8-quiz__slider-scale">
                  {budgets.map((o) => {
                    const pct = ((o.v - PRICE_MIN) / PRICE_SPAN) * 100
                    return (
                      <span
                        key={o.v}
                        style={{ left: `${pct}%` }}
                        className={o.v >= rLo && o.v <= rHi ? 'is-on' : ''}
                      >
                        {o.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* 区域 / 房型 / 房间数：下拉默认「不限」（不筛选），选中即进入下一题 */
              <select
                className="v8-quiz__select"
                value={answers[cur.key] || ''}
                aria-label={(t.questions || [])[step]}
                onChange={(e) => {
                  setAnswers({ ...answers, [cur.key]: e.target.value || null })
                  setStep(step + 1)
                }}
              >
                <option value="">{t.any}</option>
                {opts.map((o) => <option key={String(o.v)} value={String(o.v)}>{o.label}</option>)}
              </select>
            )}
            {/* 操作区：上一步常驻左下角（第 1 步无），确认？常驻右下角 */}
            <div className="v8-quiz__foot">
              {step > 0 && (
                <button type="button" className="v8-quiz__back" onClick={() => setStep(step - 1)} data-edit-key="v8.finder.quiz.back">
                  {labels.back}
                </button>
              )}
              <button type="button" className="v8-quiz__confirm" onClick={finish} data-edit-key="v8.finder.quiz.confirm">
                {labels.confirm}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
