import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate, switchLang, parsePath } from '../../lib/router.mjs'
import { Mail, Phone, WhatsApp, WeChat } from '../ici/Icons.jsx'
import LegalModal from '../ici/LegalModal.jsx'
import TypeModal from './TypeModal.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './home-v8.css'

/* 特斯拉风格导航：左 Logo + 居中菜单 + 右侧图标组 + 房源巨型下拉菜单。
   菜单数据、锚点/路由跳转、类型切换逻辑与经典版同源，仅替换视觉皮肤。 */

const EASE_OUT = [0.22, 1, 0.36, 1]

function matchLegal(label, index) {
  const s = String(label).toLowerCase()
  if (s.includes('隐私') || s.includes('privacy')) return 'privacy'
  if (s.includes('cookie')) return 'cookies'
  if (s.includes('条款') || s.includes('细则') || s.includes('term')) return 'terms'
  return ['privacy', 'cookies', 'terms'][index] || null
}

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
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
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
  const [legalDoc, setLegalDoc] = useState(null)
  // 房源下拉「了解」：类型详情弹窗
  const [detailType, setDetailType] = useState(null)
  // 下拉左侧信息区：随 hover 的类型切换显示对应描述（与首页 hover 切视频呼应）
  const [megaType, setMegaType] = useState(null)
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
    // 「首页」菜单项（#top）：与 Logo 一致，清除结果区筛选状态并回到首页顶部
    if (m.href === '#top') {
      runOnHome(() => window.dispatchEvent(new CustomEvent('v8:reset-home')))
      closeMenu()
      document.activeElement?.blur()
      return
    }
    // 「房源」主链接：与其他类型入口一致，就地展开全部房源，不再跳独立列表页
    if (m.href === '/listings') {
      goType('all')
      return
    }
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

  // 类型展示：不再跳转 /listings —— 首页内嵌展示区（V8TypeResults）就地展开；
  // 当前不在首页时带 ?type=（&school=）回首页，由展示区挂载时读取并展开
  const goType = (type, school) => {
    const { bare } = parsePath(window.location.pathname)
    if (bare === '/') {
      window.dispatchEvent(new CustomEvent('v8:show-type', { detail: { type, school } }))
    } else {
      const params = new URLSearchParams()
      params.set('type', type)
      if (school) params.set('school', school)
      navigate(`/?${params.toString()}`)
    }
    closeMenu()
    document.activeElement?.blur()
  }

  const pickSub = (s, e) => {
    e?.preventDefault()
    const key = typeof s.key === 'string' ? s.key : ''
    const isStudentMenu = key === 'student' || key === 'student-all' || key.startsWith('student-')
    if (isStudentMenu) {
      // 学生公寓菜单：key 形如 student / student-all / student-<校区>
      goType('student', key !== 'student' && key !== 'student-all' ? key : undefined)
    } else if (s.event) {
      // 四大类（豪华/普通/学生/城市）：event 即类型 key
      goType(s.event)
    } else if (s.href && s.href.startsWith('/')) {
      navigate(s.href)
      closeMenu()
      document.activeElement?.blur()
    } else {
      goType('all')
    }
  }

  const showAll = (e) => {
    e?.preventDefault()
    goType('all')
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
              // 回首页：清除结果区筛选状态并滚回顶部（runOnHome 处理跨页场景）
              runOnHome(() => window.dispatchEvent(new CustomEvent('v8:reset-home')))
            }}
          >
            <img src="/images/vlu-logo.png" alt="V PLUS" className="v8-wordmark__img" />
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
                    {m.subs[0]?.event && (() => {
                      // 左侧信息区：顶部与右侧快捷栏「全部房源」标题对齐，内容随 hover 类型切换
                      const active = m.subs.find((x) => x.key === megaType) || m.subs[0]
                      return (
                        <span className="v8-nav__mega-blurb">
                          <span className="v8-nav__mega-blurb-name">{active.label}</span>
                          <span className="v8-nav__mega-blurb-desc">{active.desc}</span>
                          {active.value && <span className="v8-nav__mega-blurb-meta">{active.value}</span>}
                        </span>
                      )
                    })()}
                    <span className={`v8-nav__mega-main${m.subs[0]?.event ? ' v8-nav__mega-main--list' : ''}`}>
                        {m.subs.map((s) => {
                          const Icon = s.icon ? ICON_MAP[s.icon] : null
                          const external = s.href && !s.href.startsWith('#') && !s.href.startsWith('/')
                          if (s.event) {
                            // 房源四类型：纵向居中列表（纯名称），hover 切换左侧信息区，点名称弹详情弹窗，点行展开房源
                            return (
                              <a
                                className="v8-nav__mega-item"
                                key={s.key}
                                href="#type-results"
                                onMouseEnter={() => setMegaType(s.key)}
                                onFocus={() => setMegaType(s.key)}
                                onClick={(e) => pickSub(s, e)}
                              >
                                <span className="v8-nav__mega-info">
                                  <span
                                    className="v8-nav__mega-name is-link"
                                    role="button"
                                    tabIndex={0}
                                    aria-haspopup="dialog"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDetailType(s.key) }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault(); e.stopPropagation(); setDetailType(s.key)
                                      }
                                    }}
                                  >
                                    {s.label}
                                  </span>
                                </span>
                              </a>
                            )
                          }
                          return (
                            <a
                              className="v8-nav__mega-item"
                              key={s.key}
                              href={s.event ? '#type-results' : (s.href || m.href)}
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
                            <a className="v8-nav__mega-sidelink" href="#type-results" onClick={showAll}>
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
                            <a className="v8-nav__mega-sidelink" href="#type-results" onClick={showAll}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '浏览房源' : 'Browse Listings'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '查看精选在售房源' : 'Explore curated homes'}</span>
                            </a>
                            <a className="v8-nav__mega-sidelink" href="#get-started" onClick={(e) => go({ href: '#get-started' }, e)}>
                              <span className="v8-nav__mega-sidetitle">{lang === 'zh' ? '安家服务' : 'Relocation Services'}</span>
                              <span className="v8-nav__mega-sidedesc">{lang === 'zh' ? '签证、银行、保洁一站式' : 'Visa, banking, cleaning'}</span>
                            </a>
                          </>
                        ) : (
                          <span className="v8-nav__mega-legal">
                            <span className="v8-nav__mega-copy">{c.footer?.copyright}</span>
                            <span className="v8-nav__mega-legallinks">
                              {(c.footer?.legal || []).filter(Boolean).map((l, i) => {
                                const key = matchLegal(l, i)
                                return key ? (
                                  <a key={l} href="#legal" onClick={(e) => { e.preventDefault(); setLegalDoc(key) }}>{l}</a>
                                ) : null
                              })}
                            </span>
                          </span>
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
                      { key: 'zh', name: '中文' },
                      { key: 'ja', name: '日本語' }
                    ].map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        role="menuitem"
                        lang={l.key === 'zh' ? 'zh-CN' : l.key === 'ja' ? 'ja' : 'en'}
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

            {isAuthenticated ? (
              <div className="v8-nav__account">
                {isAdmin && (
                  <button
                    type="button"
                    className="v8-nav__iconbtn v8-nav__iconbtn--admin"
                    onClick={() => navigate('/admin')}
                    aria-label="Admin"
                    title={lang === 'zh' ? '管理后台' : 'Admin Dashboard'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  className="v8-nav__iconbtn"
                  onClick={() => navigate('/chat')}
                  aria-label="Live Chat"
                  title={lang === 'zh' ? '在线客服' : lang === 'ja' ? 'オンラインサポート' : 'Live Chat'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="v8-nav__iconbtn"
                  onClick={() => { logout(); navigate('/') }}
                  aria-label="Logout"
                  title={`${lang === 'zh' ? '退出' : 'Sign out'} (${user?.name})`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="v8-nav__iconbtn"
                onClick={() => navigate('/login')}
                aria-label="Login"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}

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
                <span className="v8-wordmark"><img src="/images/vlu-logo.png" alt="V PLUS" className="v8-wordmark__img" /></span>
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
                            href={s.event ? '#type-results' : (s.href || m.href)}
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
                <button type="button" className="v8-btn v8-btn--dark v8-drawer__book">
                  {c.getStarted?.book || nav.cta}
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
      <TypeModal
        typeKey={detailType}
        onClose={() => setDetailType(null)}
        onBrowse={(k) => { setDetailType(null); goType(k) }}
      />
    </>
  )
}
