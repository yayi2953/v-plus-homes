import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate, switchLang } from '../../lib/router.mjs'
import { useContact } from '../ici/contactContext.jsx'
import { Mail, Phone, WhatsApp, WeChat } from '../ici/Icons.jsx'
import './home-v8.css'

/* 特斯拉风格导航：左 Logo + 居中菜单 + 右侧图标组 + 房源巨型下拉菜单。
   菜单数据、锚点/路由跳转、类型切换逻辑与经典版同源，仅替换视觉皮肤。 */

const EASE_OUT = [0.22, 1, 0.36, 1]

// 房源类型 → 展示图映射（巨型菜单用）
const TYPE_IMAGES = {
  luxury: '/images/listing-penthouse.jpg',
  standard: '/images/listing-family.jpg',
  student: '/images/listing-student1.jpg',
  city: '/images/listing-studio.jpg'
}

const ICON_MAP = { mail: Mail, phone: Phone, whatsapp: WhatsApp, wechat: WeChat }

export default function V8Navbar({ solid = false }) {
  const { c, lang } = useIciI18n()
  const { openContact } = useContact()
  const { nav } = c
  const residenceTypes = c.discover.types ?? []
  const menus = nav.menus.map((m) =>
    m.subs && m.subs[0]?.event
      ? { ...m, subs: residenceTypes.map((t) => ({ key: t.key, event: t.key, label: t.label, img: TYPE_IMAGES[t.key], desc: t.desc })) }
      : m
  )
  const campusOptions = c.discover.schools ?? []
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const closeMenu = () => setOpen(false)

  const runOnHome = (fn) => {
    if (window.location.pathname !== '/') {
      navigate('/')
      window.setTimeout(fn, 350)
    } else {
      fn()
    }
  }

  const go = (m, e) => {
    // 外部链接（mailto / tel / http）不拦截，让浏览器默认处理
    if (m.href && !m.href.startsWith('/') && !m.href.startsWith('#')) {
      closeMenu()
      document.activeElement?.blur()
      return
    }
    e?.preventDefault()
    if (m.href && m.href.startsWith('/')) {
      navigate(m.href)
      closeMenu()
      return
    }
    runOnHome(() => {
      if (m.event) {
        window.dispatchEvent(new CustomEvent('ici:switch-tab', { detail: m.event }))
      }
      if (m.href && m.href.startsWith('#') && m.href.length > 1) {
        document.querySelector(m.href)?.scrollIntoView({ behavior: 'smooth' })
      }
    })
    closeMenu()
    // 移除焦点，避免 :focus-within 保持下拉展开
    document.activeElement?.blur()
  }

  const pickSub = (s, e) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (s.event) params.set('type', s.event)
    if (s.key && s.key.startsWith('student')) params.set('type', 'student')
    if (s.key && !s.key.startsWith('student') && s.key !== 'student-all') {
      params.set('type', 'student')
      params.set('school', s.key)
    }
    navigate(`/listings${params.toString() ? `?${params}` : ''}`)
    closeMenu()
    document.activeElement?.blur()
  }

  const book = () => {
    closeMenu()
    openContact()
  }

  return (
    <>
      <header className={`v8-nav${solid || scrolled ? ' is-solid' : ''}${solid ? ' v8-nav--solid-page' : ''}`}>
        <div className="v8-nav__in">
          {/* 左：Logo */}
          <a
            className="v8-wordmark"
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              runOnHome(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
            }}
          >
            V&nbsp;PLUS
          </a>

          {/* 中：居中导航 */}
          <nav className="v8-nav__links" aria-label="primary">
            {menus.map((m) =>
              m.subs ? (
                <span className="v8-nav__group" key={m.label}>
                  <a className="v8-nav__link" href={m.href} onClick={(e) => go(m, e)} aria-haspopup="true">
                    {m.label}
                  </a>
                  {/* 特斯拉式巨型下拉菜单 */}
                  <span className="v8-nav__mega" role="menu">
                    <span className="v8-nav__mega-card">
                      <span className="v8-nav__mega-main">
                        {m.subs.map((s) => {
                          const Icon = s.icon ? ICON_MAP[s.icon] : null
                          const external = s.href && !s.href.startsWith('#') && !s.href.startsWith('/')
                          return (
                            <a
                              className="v8-nav__mega-item"
                              key={s.key}
                              href={s.event ? '#listings' : (s.href || m.href)}
                              target={external ? '_blank' : undefined}
                              rel={external ? 'noopener noreferrer' : undefined}
                              onClick={(e) => s.event ? pickSub(s, e) : go({ href: s.href || m.href }, e)}
                            >
                              <span className="v8-nav__mega-img">
                                {Icon ? (
                                  <span className="v8-nav__mega-icon"><Icon size={32} /></span>
                                ) : (
                                  <img src={s.img} alt={s.label} loading="lazy" />
                                )}
                              </span>
                              <span className="v8-nav__mega-name">{s.label}</span>
                              {(s.desc || s.value) && <span className="v8-nav__mega-desc">{s.desc || s.value}</span>}
                              <span className="v8-nav__mega-actions">
                                <span className="v8-nav__mega-action">{lang === 'zh' ? '了解' : 'Learn'}</span>
                              </span>
                            </a>
                          )
                        })}
                      </span>
                      <span className="v8-nav__mega-side">
                        {m.subs[0]?.event ? (
                          <>
                            <a className="v8-nav__mega-sidelink" href="#listings" onClick={(e) => go({ href: '/listings' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '全部房源' : 'All Listings'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '浏览广州全部精选房源' : 'Browse all curated homes'}</span>
                            </a>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '预约看房' : 'Book a Viewing'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '专属顾问带你实地看房' : 'Dedicated consultant on-site'}</span>
                            </a>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '安家服务' : 'Relocation Services'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '签证、银行、保洁一站式' : 'Visa, banking, cleaning'}</span>
                            </a>
                          </>
                        ) : m.subs[0]?.icon ? (
                          <>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '预约咨询' : 'Book a Consultation'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '根据需求定制服务方案' : 'Tailored service to your needs'}</span>
                            </a>
                            <a className="v8-nav__mega-sidelink" href="#listings" onClick={(e) => go({ href: '/listings' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '浏览房源' : 'Browse Listings'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '查看精选在售房源' : 'Explore curated homes'}</span>
                            </a>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '安家服务' : 'Relocation Services'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '签证、银行、保洁一站式' : 'Visa, banking, cleaning'}</span>
                            </a>
                          </>
                        ) : (
                          <>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '联系专属顾问' : 'Talk to an Advisor'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '一站式安家服务，全程中英文对接' : 'One-stop relocation, bilingual support'}</span>
                            </a>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '预约咨询' : 'Book a Consultation'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '根据需求定制服务方案' : 'Tailored service to your needs'}</span>
                            </a>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '更多需求' : 'More Requests'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '签证、银行、保险等生活琐事' : 'Visa, banking, insurance & more'}</span>
                            </a>
                          </>
                        )}
                      </span>
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
          {/* 右：图标组 */}
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
                <svg className="v8-lang__globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18Z" />
                </svg>
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

            <button
              type="button"
              className="v8-nav__iconbtn"
              onClick={book}
              aria-label="Account"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
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

      {/* 下拉菜单激活时的毛玻璃遮罩（置于 header 外，避免 backdrop-filter 创建包含块） */}
      <span className="v8-nav__overlay" aria-hidden="true" />

      {/* 移动端抽屉 */}
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
                <span className="v8-wordmark">V&nbsp;PLUS</span>
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
                            key={s.key || s.label}
                            className="v8-drawer__link v8-drawer__link--sub"
                            href={s.event ? '#listings' : (s.href || m.href)}
                            onClick={(e) => s.event ? pickSub(s, e) : go({ href: s.href || m.href }, e)}
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
