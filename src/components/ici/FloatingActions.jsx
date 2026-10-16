import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { WhatsApp } from './Icons.jsx'
import { useContact } from './contactContext.jsx'

export default function FloatingActions() {
  const { c } = useIciI18n()
  const { openContact } = useContact()
  const [showTop, setShowTop] = useState(false)
  const [cookie, setCookie] = useState(true)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <button className="fab-whatsapp" aria-label="WhatsApp" onClick={openContact}>
        <WhatsApp size={26} />
      </button>

      <AnimatePresence>
        {showTop && (
          <motion.button
            className="fab-top"
            aria-label="Back to top"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 15 6-6 6 6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cookie && (
          <motion.div
            className="cookie"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <p>{c.cookie.text}</p>
            <div className="cookie__actions">
              <button className="cookie__btn cookie__btn--ghost" onClick={() => setCookie(false)}>
                {c.cookie.reject}
              </button>
              <button className="cookie__btn cookie__btn--ok" onClick={() => setCookie(false)}>
                {c.cookie.accept}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
