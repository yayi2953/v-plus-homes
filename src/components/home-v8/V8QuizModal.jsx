import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { Close } from '../ici/Icons.jsx'

// 快速找房问卷：户型区视频下方蓝色文本触发。
// 四题逐问（区域 → 房型 → 房间数 → 预算），每题可选「不限」；价格题为双把手区间滑杆，
// 松手选完后右下角切换为「上一步 + 确认？」，点确认才在首页结果区就地筛选展示。
// 弹窗外壳复用 legal-overlay / legal-modal + v8-tmodal（微圆角、× 无灰底）体系。

const STEPS = [
  { key: 'district', get: (c) => (c.discover?.tabs || []).map((x) => ({ v: x.key, label: x.label })) },
  { key: 'type', get: (c) => (c.discover?.types || []).map((x) => ({ v: x.key, label: x.label })) },
  { key: 'beds', get: (c, ft) => (ft.beds || []).map((x) => ({ v: x.v, label: x.label })) },
  { key: 'budget', get: (c, ft) => (ft.budgets || []).map((x) => ({ v: x.v, label: x.label })) }
]

export default function V8QuizModal({ open, onClose }) {
  const { c, lang } = useIciI18n()
  const t = c.v8?.finder?.quiz || {}
  const ft = c.v8?.finder || {}
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  // 价格题：双把手区间滑杆（lo/hi 为 budgets 索引，渲染时钳制到有效范围）；
  // 松手选完后右下角切换为「上一步（原不限位）+ 确认？（原上一步位）」，点确认才展开结果区
  const [range, setRange] = useState({ lo: 0, hi: Number.MAX_SAFE_INTEGER })
  const [rangeTouched, setRangeTouched] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    setStep(0)
    setAnswers({})
    setRange({ lo: 0, hi: Number.MAX_SAFE_INTEGER })
    setRangeTouched(false)
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

  const finish = (final) => {
    // 答完不跳独立列表页：按 v8:show-type 契约通知首页就地展开结果区（带问卷条件）
    const a = final
    onClose?.()
    window.dispatchEvent(new CustomEvent('v8:show-type', {
      detail: {
        type: a.type || 'all',
        school: null,
        quiz: { district: a.district || null, beds: a.beds || null, budget: a.budget || null }
      }
    }))
  }

  const pick = (key, v) => {
    const next = { ...answers, [key]: v }
    setAnswers(next)
    if (step === STEPS.length - 1) finish(next)
    else setStep(step + 1)
  }

  const cur = STEPS[step]
  const opts = cur.get(c, ft)
  const labels = {
    back: lang === 'zh' ? '上一步' : lang === 'ja' ? '戻る' : 'Back',
    select: lang === 'zh' ? '请选择' : lang === 'ja' ? '選択してください' : 'Select…',
    confirm: t.confirm || (lang === 'zh' ? '确认？' : lang === 'ja' ? '確定しますか？' : 'Confirm?')
  }

  // 价格题区间滑杆的把手更新：重叠时智能重定向（右拖右把手/左拖左把手），避免两把手互相卡死
  const priceOpts = cur.key === 'budget' ? opts : []
  const maxIdx = Math.max(0, priceOpts.length - 1)
  const rLo = Math.max(0, Math.min(range.lo, maxIdx))
  const rHi = Math.max(rLo, Math.min(range.hi, maxIdx))
  const loPct = maxIdx > 0 ? (rLo / maxIdx) * 100 : 0
  const hiPct = maxIdx > 0 ? (rHi / maxIdx) * 100 : 0
  const onLo = (val) => {
    const v = Number(val)
    if (rLo === rHi && v > rLo) setRange({ lo: rLo, hi: Math.min(v, maxIdx) })
    else setRange({ lo: Math.min(v, rHi), hi: rHi })
  }
  const onHi = (val) => {
    const v = Number(val)
    if (rLo === rHi && v < rHi) setRange({ lo: Math.max(v, 0), hi: rHi })
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
            <h3 className="v8-tmodal__title">
              {t.title}
              <span className="v8-quiz__step">{step + 1} / {STEPS.length}</span>
            </h3>
            <button type="button" className="legal-modal__close" onClick={() => onClose?.()} aria-label={lang === 'zh' ? '关闭' : 'Close'}>
              <Close size={16} />
            </button>
          </header>
          <div className="v8-tmodal__body">
            <p className="v8-quiz__q">{(t.questions || [])[step]}</p>
            {cur.key === 'budget' ? (
              /* 价格题：双把手区间滑杆（最低 – 最高），松手选完后右下角出现「确认？」 */
              <div className="v8-quiz__slider">
                <div className="v8-quiz__slider-val">
                  {rLo === rHi ? priceOpts[rLo]?.label : `${priceOpts[rLo]?.label} – ${priceOpts[rHi]?.label}`}
                </div>
                <div
                  className="v8-quiz__range"
                  style={{ background: `linear-gradient(to right, #e3e5e9 ${loPct}%, #0070d5 ${loPct}%, #0070d5 ${hiPct}%, #e3e5e9 ${hiPct}%)` }}
                >
                  <input
                    type="range"
                    min="0"
                    max={maxIdx}
                    step="1"
                    value={rLo}
                    style={{ zIndex: rLo === rHi ? 3 : 1 }}
                    aria-label={(t.questions || [])[3]}
                    onChange={(e) => { onLo(e.target.value); setRangeTouched(true) }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={maxIdx}
                    step="1"
                    value={rHi}
                    style={{ zIndex: rLo === rHi ? 1 : 2 }}
                    aria-label={(t.questions || [])[3]}
                    onChange={(e) => { onHi(e.target.value); setRangeTouched(true) }}
                  />
                </div>
                <div className="v8-quiz__slider-scale">
                  {priceOpts.map((o, i) => <span key={o.v} className={i >= rLo && i <= rHi ? 'is-on' : ''}>{o.label}</span>)}
                </div>
              </div>
            ) : (
              /* 区域 / 房型 / 房间数：下拉选择，选中即进入下一题 */
              <select
                className="v8-quiz__select"
                value=""
                aria-label={(t.questions || [])[step]}
                onChange={(e) => pick(cur.key, e.target.value || null)}
              >
                <option value="" disabled>{labels.select}</option>
                {opts.map((o) => <option key={String(o.v)} value={String(o.v)}>{o.label}</option>)}
              </select>
            )}
            {/* 右下角操作区：价格题选完前为「不限 + 上一步」，选完后切换为「上一步（不限位）+ 确认？（原上一步位）」 */}
            <div className="v8-quiz__foot">
              {cur.key === 'budget' && rangeTouched ? (
                <>
                  <button
                    type="button"
                    className="v8-quiz__back"
                    onClick={() => { setRangeTouched(false); setStep(step - 1) }}
                  >
                    {labels.back}
                  </button>
                  <button
                    type="button"
                    className="v8-quiz__confirm"
                    onClick={() => finish({ ...answers, budget: { min: priceOpts[rLo]?.v ?? null, max: priceOpts[rHi]?.v ?? null } })}
                  >
                    {labels.confirm}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="v8-quiz__any" onClick={() => pick(cur.key, null)}>
                    {t.any}
                  </button>
                  {step > 0 && (
                    <button type="button" className="v8-quiz__back" onClick={() => setStep(step - 1)}>
                      {labels.back}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
