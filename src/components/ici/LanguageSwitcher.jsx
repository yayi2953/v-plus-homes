import { useEffect, useRef, useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { ChevronDown } from './Icons.jsx'
import { switchLang } from '../../lib/router.mjs'

// 语言下拉（首屏底部信息条内，站内唯一语言切换入口）
export function FooterLanguageSelect() {
  const { lang } = useIciI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="lang-select" ref={ref}>
      <button className="lang-select__btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {lang === 'zh' ? '中文' : 'English'} <ChevronDown size={13} />
      </button>
      {open && (
        <div className="lang-select__menu">
          <button
            className={lang === 'en' ? 'is-active' : ''}
            onClick={() => {
              switchLang('en')
              setOpen(false)
            }}
          >
            English
          </button>
          <button
            className={lang === 'zh' ? 'is-active' : ''}
            onClick={() => {
              switchLang('zh')
              setOpen(false)
            }}
          >
            中文
          </button>
        </div>
      )}
    </div>
  )
}
