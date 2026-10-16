import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { Close } from './Icons.jsx'
import { legalContent, LEGAL_UPDATED } from './legalContent.js'

// 法务文档弹窗：隐私政策 / Cookie 政策 / 条款与细则（入口位于首屏底部信息条）
// 内容较长，正文区独立滚动；支持遮罩点击与 Esc 关闭，打开期间锁定背景滚动。
export default function LegalModal({ doc, onClose }) {
  const { lang, c } = useIciI18n()
  const t = legalContent[lang] || legalContent.zh
  const data = doc ? t[doc] : null

  useEffect(() => {
    if (!doc) return undefined
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
  }, [doc, onClose])

  const email = c?.footer?.email || ''
  const phone = c?.footer?.phone || ''

  return createPortal(
    <AnimatePresence>
      {doc && data ? (
        <motion.div
          className="legal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose?.()}
        >
          <motion.div
            className="legal-modal"
            role="dialog"
            aria-modal="true"
            aria-label={data.title}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="legal-modal__head">
              <div>
                <h3 className="legal-modal__title">{data.title}</h3>
                <span className="legal-modal__date">
                  {t.updatedLabel}：{LEGAL_UPDATED}
                </span>
              </div>
              <button
                type="button"
                className="legal-modal__close"
                onClick={() => onClose?.()}
                aria-label={t.close}
              >
                <Close size={16} />
              </button>
            </header>

            <div className="legal-modal__body">
              <p className="legal-modal__intro">{data.intro}</p>
              {data.sections.map((s) => (
                <section key={s.h}>
                  <h4>{s.h}</h4>
                  {s.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </section>
              ))}
              <section>
                <h4>{lang === 'zh' ? '联系方式' : 'Contact'}</h4>
                <p>
                  {lang === 'zh'
                    ? '如对本文件有任何疑问，欢迎随时联系我们：'
                    : 'If you have any questions about this document, please contact us:'}
                  {email ? (
                    <a href={`mailto:${email}`} className="legal-modal__contact"> {email}</a>
                  ) : null}
                  {phone ? <span className="legal-modal__contact"> · {phone}</span> : null}
                </p>
              </section>
            </div>

            <footer className="legal-modal__foot">
              <button type="button" className="legal-modal__ok" onClick={() => onClose?.()}>
                {t.close}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
