import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { ChevronDown } from '../ici/Icons.jsx'
import { navigate, switchLang } from '../../lib/router.mjs'
import { useContact } from '../ici/contactContext.jsx'
import './home-v8.css'

/* v8 粒子版专属导航：极简文字 wordmark + 毛玻璃悬浮头 + 黑色胶囊 CTA。
   菜单数据、锚点/路由跳转、类型切换、校区选择逻辑与经典版 Navbar 完全同源，
   仅替换视觉皮肤；桌面下拉与移动抽屉中学生公寓校区平铺，功能不缩水。 */

const EASE_OUT = [0.22, 1, 0.36, 1]

export default function V8Navbar({ solid = false }) {
  const { c, lang } = useIciI18n()
  const { openContact } = useContact()
  const { nav } = c
  // 房源类型子菜单由后台分类（residence_types）驱动，标签/顺序/停用实时生效
  const residenceTypes = c.discover.types ?? []
  const menus = nav.menus.map((m) =>
    m.subs ? { ...m, subs: residenceTypes.map((t) => ({ key: t.key, event: t.key, label: t.label })) } : m
  )
  // 学生公寓校区与移动端 TypePicker 同源
  const campusOptions = c.discover.schools ?? []
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  // 导航栏语言下拉（替代旧版强制语言弹窗）
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  /* 语言下拉：点击外部 / Esc 关闭 */
  useEffect(() => {
    if (!langOpen) return undefined
    const onDown = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setLangOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [langOpen])

  /* 滚动超过首屏后导航切换为毛玻璃白底 */
  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      setScrolled(window.scrollY > 24)
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* 抽屉打开期间锁定背景滚动 */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const closeMenu = () => setOpen(false)

  // 在首页执行锚点滚动/类型切换；若当前位于地图/指南页，先回 v8 首页，
  // 等区块（含懒加载 chunk）挂载后再执行，避免事件丢失、锚点不存在
  const runOnHome = (fn) => {
    if (window.location.pathname !== '/') {
      navigate('/')
      // v8 首页是懒加载独立分包，比经典版多留一个 chunk 加载节拍
      window.setTimeout(fn, 350)
    } else {
      fn()
    }
  }

  const go = (m, e) => {
    e?.preventDefault()
    // 站内真实路径（/map、/guides）：SPA History 跳转
    if (m.href && m.href.startsWith('/')) {
      navigate(m.href)
      closeMenu()
      return
    }
    runOnHome(() => {
      if (m.event) {
        window.dispatchEvent(new CustomEvent('ici:switch-tab', { detail: m.event }))
      }
      // 首页锚点（#top/#listings/#extra-services/#get-started）
      if (m.href && m.href.startsWith('#') && m.href.length > 1) {
        document.querySelector(m.href)?.scrollIntoView({ behavior: 'smooth' })
      }
    })
    closeMenu()
  }

  // 房源子项：跳转到 /listings 结果页并带上类型/校区筛选参数
  const pickSub = (s, e) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (s.event) params.set('type', s.event)
    if (s.key && s.key.startsWith('student')) params.set('type', 'student')
    if (s.key && !s.key.startsWith('student') && s.key !== 'student-all') {
      // 具体校区：type=student + school=key
      params.set('type', 'student')
      params.set('school', s.key)
    }
    navigate(`/listings${params.toString() ? `?${params}` : ''}`)
    closeMenu()
  }

  const book = () => {
    closeMenu()
    openContact()
  }

  return (
    <>
      <header className={`v8-nav${solid || scrolled ? ' is-solid' : ''}${solid ? ' v8-nav--solid-page' : ''}`}>
        <div className="v8-nav__in">
          <a
            className="v8-wordmark"
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              runOnHome(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
            }}
          >
            V PLUS HOMES
          </a>

          <nav className="v8-nav__links" aria-label="primary">
            {menus.map((m) =>
              m.subs ? (
                <span className="v8-nav__group" key={m.label}>
                  <a className="v8-nav__link" href={m.href} onClick={(e) => go(m, e)} aria-haspopup="true">
                    {m.label}
                    <ChevronDown size={12} />
                  </a>
                  <span className="v8-nav__drop" role="menu">
                    <span className="v8-nav__drop-card">
                    {m.subs.map((s) => (
                      <span className="v8-nav__dropgroup" key={s.key}>
                        <a
                          className="v8-nav__dropitem v8-nav__dropitem--parent"
                          role="menuitem"
                          href="#listings"
                          onClick={(e) => pickSub(s, e)}
                        >
                          {s.label}
                        </a>
                        {s.key === 'student' && (
                          <span className="v8-nav__schools">
                            <span className="v8-nav__schools-in">
                              <a
                                className="v8-nav__dropitem v8-nav__dropitem--school"
                                role="menuitem"
                                href="#listings"
                                onClick={(e) => pickSub({ key: 'student-all', event: 'student' }, e)}
                              >
                                {c.discover.schoolPickerAll}
                              </a>
                              {campusOptions.map((sc) => (
                                <a
                                  key={sc.key}
                                  className="v8-nav__dropitem v8-nav__dropitem--school"
                                  role="menuitem"
                                  href="#listings"
                                  onClick={(e) => pickSub({ key: sc.key }, e)}
                                >
                                  {sc.label}
                                </a>
                              ))}
                            </span>
                          </span>
                        )}
                      </span>
                    ))}
                    </span>
                  </span>
                </span>
              ) : (
                <a
                  key={m.label}
                  className="v8-nav__link"
                  href={m.href}
                  {...(m.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={(e) => go(m, e)}
                >
                  {m.label}
                </a>
              )
            )}
          </nav>

          <div className="v8-nav__right">
            <div className="v8-lang" ref={langRef}>
              <button
                type="button"
                className={`v8-lang__btn${langOpen ? ' is-open' : ''}`}
                onClick={() => setLangOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={langOpen}
                aria-label="Language"
              >
                <svg className="v8-lang__globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18Z" />
                </svg>
                <span className="v8-lang__label">{lang === 'zh' ? '中文' : 'English'}</span>
                <span className="v8-lang__chev"><ChevronDown size={12} /></span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    className="v8-lang__menu"
                    role="menu"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                  >
                    {[
                      { key: 'en', name: 'English' },
                      { key: 'zh', name: '中文' }
                    ].map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        role="menuitem"
                        lang={l.key === 'zh' ? 'zh-CN' : 'en'}
                        className={`v8-lang__item${lang === l.key ? ' is-active' : ''}`}
                        onClick={() => {
                          // 切换语言走独立语言 URL（/zh ↔ /en），由 popstate 统一更新语言状态
                          switchLang(l.key)
                          setLangOpen(false)
                        }}
                      >
                        <span>{l.name}</span>
                        <svg className="v8-lang__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button type="button" className="v8-btn v8-btn--dark v8-nav__book" onClick={book}>
              {c.getStarted?.book || nav.cta}
            </button>
            <button
              type="button"
              className={`v8-nav__burger${open ? ' is-open' : ''}`}
              onClick={() => (open ? closeMenu() : (setLangOpen(false), setOpen(true)))}
              aria-label="menu"
              aria-expanded={open}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="v8-drawer__veil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMenu}
          >
            <motion.aside
              className="v8-drawer"
              role="dialog"
              aria-modal="true"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.34, ease: EASE_OUT }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="v8-drawer__head">
                <span className="v8-wordmark">V PLUS HOMES</span>
                <button type="button" className="v8-drawer__close" onClick={closeMenu} aria-label="close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <nav className="v8-drawer__links">
                {menus.map((m) =>
                  m.subs ? (
                    <span className="v8-drawer__group" key={m.label}>
                      <a
                        className="v8-drawer__link v8-drawer__link--parent"
                        href={m.href}
                        onClick={(e) => go(m, e)}
                      >
                        {m.label}
                      </a>
                      <span className="v8-drawer__subs">
                        {m.subs.map((s) => (
                          <a
                            key={s.key}
                            className="v8-drawer__link v8-drawer__link--sub"
                            href="#listings"
                            onClick={(e) => pickSub(s, e)}
                          >
                            {s.label}
                          </a>
                        ))}
                      </span>
                    </span>
                  ) : (
                    <a
                      key={m.label}
                      className="v8-drawer__link"
                      href={m.href}
                      {...(m.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      onClick={(e) => go(m, e)}
                    >
                      {m.label}
                    </a>
                  )
                )}
              </nav>

              <div className="v8-drawer__foot">
                <button type="button" className="v8-btn v8-btn--dark v8-drawer__book" onClick={book}>
                  {c.getStarted?.book || nav.cta}
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
