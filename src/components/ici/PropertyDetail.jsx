import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useProperty } from './propertyContext.jsx'
import { Metro, FX, ChevronLeft } from './Icons.jsx'
import { mapsEmbedSrc } from '../../config/maps.js'
import { propertyPath, navigate } from '../../lib/router.mjs'
import { setSeo, clearSeo, SITE_ORIGIN } from '../../lib/seo.mjs'
import SmartImage from '../common/SmartImage.jsx'

const MELT = { layout: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } }

/* 规格行线性图标：白 + 浅灰配色，与网站类型卡同一图标语言（圆角/等粗描边） */
const SPEC_ICONS = {
  bed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-5.5a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 12.5V18" />
      <path d="M3 14.5h18" />
      <path d="M3.5 18v2" />
      <path d="M20.5 18v2" />
      <path d="M7.5 10V8.2A1.2 1.2 0 0 1 8.7 7h2.6a1.2 1.2 0 0 1 1.2 1.2V10" />
    </svg>
  ),
  shower: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15.2 3.8-3.2 3.2" />
      <circle cx="8.8" cy="10.2" r="4.2" />
      <path d="m6.6 15.8-1.1 1.5" />
      <path d="m9.2 16.4-1 1.6" />
      <path d="m11.8 15.6-.9 1.4" />
    </svg>
  ),
  ruler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z" />
      <path d="m7.5 10.5 2 2" />
      <path d="m10.5 7.5 2 2" />
      <path d="m13.5 4.5 2 2" />
      <path d="m4.5 13.5 2 2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.3 12.3 2.5 2.5 4.9-5.4" />
    </svg>
  )
}

const AMENITY_CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

const BACK_ICON = <ChevronLeft size={20} />

const COPY_OK_ICON = (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

// 左按钮「在线咨询」聊天气泡图标
const CHAT_ICON = (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.36-4.1-1L3 20l1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
)

// 复制按钮图标
const COPY_ICON = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
)

// 弹窗邮箱/电话选项小图标
const MAIL_ICON = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)
const PHONE_ICON = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9Z" />
  </svg>
)

// 客服联系方式（与站内页脚/联系区一致）
const CONTACT = { email: 'hello@v-plus.house', phone: '+352 621780307' }

// 双按钮 + 未登录弹窗的三语文案
const CTA_LABELS = {
  zh: {
    ask: '在线咨询', copy: '复制联系方式', copied: '已复制',
    popTitle: '选择咨询方式', popSub: '登录后可与在线客服实时对话',
    login: '登录后在线咨询', email: '邮箱联系', phone: '电话联系', copiedTip: '已复制到剪贴板'
  },
  en: {
    ask: 'Chat with Us', copy: 'Copy Contact', copied: 'Copied',
    popTitle: 'Choose how to contact us', popSub: 'Log in to chat with our agent in real time',
    login: 'Log in to chat', email: 'Email us', phone: 'Call us', copiedTip: 'Copied to clipboard'
  },
  ja: {
    ask: 'オンライン相談', copy: '連絡先をコピー', copied: 'コピーしました',
    popTitle: 'お問い合わせ方法をお選びください', popSub: 'ログインするとオンライン相談をご利用いただけます',
    login: 'ログインして相談', email: 'メールで連絡', phone: '電話で連絡', copiedTip: 'クリップボードにコピーしました'
  }
}

// 复制到剪贴板：优先现代 Clipboard API（https 下微信/iOS 均支持），
// 失败或老内核缺失时退化为隐藏 textarea + execCommand，保证微信内置浏览器可用
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 落到 execCommand 兜底
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    ta.style.left = '-9999px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

function DetailPanel({ active, closeProperty }) {
  const { c, lang } = useIciI18n()
  const { isAuthenticated } = useAuth()
  const p = c.properties[active.index]
  const d = c.detail
  const TL = CTA_LABELS[lang] || CTA_LABELS.zh
  const scrollRef = useRef(null)
  const trackRef = useRef(null)
  const rafRef = useRef(0)
  const dragRef = useRef(null)
  const mapTimer = useRef(null)
  const pushedRef = useRef(false)
  const [photo, setPhoto] = useState(0)
  const [mapError, setMapError] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [tab, setTab] = useState('overview')
  // 咨询双按钮交互状态：未登录弹窗 + 复制反馈
  const [contactOpen, setContactOpen] = useState(false)
  const [copiedWay, setCopiedWay] = useState(null)
  const [copiedContact, setCopiedContact] = useState(false)
  const contactTimer = useRef(null)

  // 打开瞬间定形态：PC（>900px）居中弹窗；平板/手机为整页跳转
  const [mode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches ? 'page' : 'modal'
  )
  const isPage = mode === 'page'

  // 图库：仅使用后台配置的组图（封面在前，去重去空；数量不做截断，缩略图条横向滚动）。
  const gallery = useMemo(() => {
    const own = Array.isArray(p.gallery)
      ? p.gallery.filter((x) => typeof x === 'string' && x && x !== p.img)
      : []
    return [p.img, ...own].filter(Boolean)
  }, [p])

  const amenities = useMemo(
    () => (Array.isArray(p.amenities) ? p.amenities.map((k) => [k, d.amenities?.[k]?.label]).filter(([, label]) => label) : []),
    [p.amenities, d.amenities]
  )

  /* 大图左右滑动：原生 scroll-snap 轨道，触摸手势零 JS；滚动位置反推当前图同步缩略图 */
  const scrollToPhoto = (i, smooth = true) => {
    const track = trackRef.current
    if (track) track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
  }

  const onTrackScroll = () => {
    const track = trackRef.current
    if (!track) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const i = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / track.clientWidth)))
      setPhoto((prev) => (prev === i ? prev : i))
    })
  }

  /* PC 无触摸：按住拖拽浏览，松手吸附最近一张 */
  const onTrackPointerDown = (e) => {
    if (e.pointerType === 'touch') return
    const track = trackRef.current
    if (!track) return
    dragRef.current = { x: e.clientX, left: track.scrollLeft }
    track.setPointerCapture?.(e.pointerId)
  }
  const onTrackPointerMove = (e) => {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag || !track) return
    track.scrollLeft = drag.left - (e.clientX - drag.x)
  }
  const endTrackDrag = () => {
    const track = trackRef.current
    if (!dragRef.current || !track) {
      dragRef.current = null
      return
    }
    dragRef.current = null
    const i = Math.max(0, Math.min(gallery.length - 1, Math.round(track.scrollLeft / track.clientWidth)))
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
  }

  // 统一 URL 同步（弹窗/整页两形态一致）：
  // 站内点击打开 → 压入 /properties/:code，系统返回手势即关闭；
  // 深链直达（URL 已是房源路径）→ 不占历史条目，关闭时站内跳回首页。
  useEffect(() => {
    const ownPath = propertyPath(p.code)
    if (window.location.pathname !== ownPath) {
      window.history.pushState({ iciDetail: true }, '', ownPath)
      pushedRef.current = true
    } else {
      // 深链直达时 history.state 无 iciDetail 标记 → 关闭回首页；
      // 用 state 标记而非布尔推断，可兼容 StrictMode 开发态 effect 双执行
      pushedRef.current = window.history.state?.iciDetail === true
    }
    const onPop = () => {
      if (window.location.pathname !== ownPath) closeProperty()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // active.index 变化（切换到另一套房源）时重新压入对应 URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.index])

  const requestClose = () => {
    if (pushedRef.current) {
      pushedRef.current = false
      window.history.back()
    } else {
      navigate('/')
    }
  }

  useEffect(() => {
    setPhoto(0)
    setMapError(false)
    setMapReady(false)
    setTab('overview')
    setContactOpen(false)
    setCopiedContact(false)
    setCopiedWay(null)
    clearTimeout(contactTimer.current)
    scrollRef.current?.scrollTo({ top: 0 })
    trackRef.current?.scrollTo({ left: 0 })
    // 地图 iframe 延迟到入场动画结束后再挂载，避免打开瞬间与动画争抢主线程
    const readyTimer = setTimeout(() => setMapReady(true), 320)
    // 网络无法到达 Google 时（iframe 既不 load 也不 error）定时显示兜底
    mapTimer.current = setTimeout(() => setMapError(true), 8000)
    return () => {
      clearTimeout(readyTimer)
      clearTimeout(mapTimer.current)
    }
  }, [active.index])

  // 卸载时清理复制反馈定时器
  useEffect(() => () => clearTimeout(contactTimer.current), [])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPage])

  const vars = { br: p.br, area: p.area, district: p.district, metro: p.metro }
  // 地图定位优先级：后台精确坐标 → 详细地址 → 最近地铁站（历史数据兜底）。
  const station = p.metro.split('·').pop().trim()
  const lat = Number(p.lat)
  const lng = Number(p.lng)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
  let mapQuery
  let mapZoom
  let mapLabel
  if (hasCoords) {
    mapQuery = `${lat},${lng}`
    mapZoom = 17
    mapLabel = p.address || station
  } else if (p.address) {
    mapQuery = lang === 'zh' ? `广州市${p.address}` : `${p.address}, Guangzhou, China`
    mapZoom = 16
    mapLabel = p.address
  } else {
    mapQuery = lang === 'zh' ? `广州地铁${station}` : `${station} Guangzhou Metro`
    mapZoom = 15
    mapLabel = station
  }
  const mapSrc = mapsEmbedSrc(mapQuery, { zoom: mapZoom, lang: lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja' : 'en' })
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  // 独立房源 URL 的 SEO：动态 title/描述/canonical/OG + Apartment 结构化数据；
  // 关闭时恢复首页默认（截图/分享/搜索引擎都拿到该房源专属落地页信息）
  useEffect(() => {
    const path = propertyPath(p.code)
    const rawText = `${p.intro || ''} ${p.locationText || ''}`.replace(/\s+/g, ' ').trim()
    const description = rawText
      ? rawText.slice(0, 155)
      : lang === 'zh'
        ? `广州${p.district || ''}${p.br}出租，${p.metro || ''}，精装修随时入住。V Plus 外籍人士租房服务。`
        : `${p.br} for rent in ${p.district || 'Guangzhou'}, near ${p.metro || 'metro'}. Furnished and move-in ready — V Plus apartments for expats in Guangzhou.`
    const title = lang === 'zh'
      ? `${p.code} ${p.br}出租·${p.district} | 广州租房 V Plus`
      : `${p.code} ${p.br} for Rent in ${p.district}, Guangzhou | V Plus`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Apartment',
      url: `${SITE_ORIGIN}${path}`,
      name: `${p.code} · ${p.br}`,
      description,
      ...(gallery[0] ? { image: gallery.slice(0, 6) } : {}),
      address: {
        '@type': 'PostalAddress',
        ...(p.address ? { streetAddress: p.address } : {}),
        addressLocality: p.district || 'Guangzhou',
        addressRegion: 'Guangdong',
        addressCountry: 'CN'
      },
      ...(hasCoords ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } } : {})
    }
    setSeo({ title, description, path, image: gallery[0], jsonLd })
    return () => clearSeo()
    // p 内容随远程数据更新可能变化，重跑以刷新落地元信息
  }, [lang, p])
  const specs = [
    { icon: SPEC_ICONS.bed, label: d.specs.beds, value: p.br },
    { icon: SPEC_ICONS.shower, label: d.specs.baths, value: lang === 'zh' ? `${p.baths} 卫` : lang === 'ja' ? `${p.baths}バス` : p.baths },
    // 建筑面积仅豪华住宅展示与录入，其它分类不出现该数据
    ...(p.categories?.includes('luxury')
      ? [{ icon: SPEC_ICONS.ruler, label: d.specs.area, value: `${p.area} m²` }]
      : []),
    { icon: SPEC_ICONS.check, label: d.specs.available, value: d.available }
  ]

  const tabs = [
    { id: 'pd-sec-overview', label: d.overview },
    ...(!p.copyHidden ? [{ id: 'pd-sec-about', label: d.aboutTitle }] : []),
    { id: 'pd-sec-location', label: d.locationTitle }
  ]

  // PC 弹窗形态：tab 为真切换，每次只显示对应一个区块，切换后回到顶部；
  // 手机/平板页面形态无 tab，所有区块纵向铺开，不受 tab 控制
  const goTab = (id) => {
    setTab(id)
    scrollRef.current?.scrollTo({ top: 0 })
  }
  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'pd-sec-overview'
  const secStyle = (id) => (isPage || activeTab === id ? undefined : { display: 'none' })

  // 组装当前房源的问询消息：卡片数据（仿精选房源卡样式渲染）+ 一句问询语
  const buildInquiry = () => {
    const text =
      lang === 'zh'
        ? '您好，我想咨询这套房源，请帮我安排看房。'
        : lang === 'ja'
          ? 'こんにちは、この物件について相談したいです。内見を手配してください。'
          : 'Hello, I would like to ask about this listing. Please arrange a viewing for me.'
    const card = {
      img: gallery[0] || '',
      title: p.district,
      sub: `${p.br} · ${p.metro}`,
      price: `${p.price}`,
      url: `${SITE_ORIGIN}${propertyPath(p.code)}`
    }
    return { text, card }
  }

  // 左按钮「在线咨询」：已登录 → 房源问询卡片带入聊天窗自动发送；未登录 → 弹出联系方式选择
  const onAskClick = () => {
    if (isAuthenticated) {
      try {
        sessionStorage.setItem('vplus_chat_pending', JSON.stringify(buildInquiry()))
      } catch {
        /* ignore */
      }
      navigate('/chat')
    } else {
      setCopiedWay(null)
      setContactOpen(true)
    }
  }

  // 右按钮「复制联系方式」：复制客服邮箱 + 电话
  const onCopyContact = async () => {
    const ok = await copyToClipboard(`Email: ${CONTACT.email}\nTel/WhatsApp: ${CONTACT.phone}`)
    if (ok) {
      setCopiedContact(true)
      clearTimeout(contactTimer.current)
      contactTimer.current = setTimeout(() => setCopiedContact(false), 2000)
    }
  }

  // 弹窗内选择邮箱/电话联系：复制对应联系方式并提示成功，随后自动收起弹窗
  const onPickContact = async (way) => {
    const ok = await copyToClipboard(way === 'email' ? CONTACT.email : CONTACT.phone)
    if (!ok) return
    setCopiedWay(way)
    clearTimeout(contactTimer.current)
    contactTimer.current = setTimeout(() => {
      setContactOpen(false)
      setCopiedWay(null)
    }, 1400)
  }

  // 弹窗「登录后在线咨询」
  const onPopLogin = () => {
    setContactOpen(false)
    navigate('/login')
  }

  const ctaGroup = (
    <div className="pd-cta-group">
      <button type="button" className="pd-cta pd-cta--main" onClick={onAskClick}>
        {CHAT_ICON}
        {TL.ask}
      </button>
      <button type="button" className="pd-cta pd-cta--copy" onClick={onCopyContact}>
        {copiedContact ? COPY_OK_ICON : COPY_ICON}
        {copiedContact ? TL.copied : TL.copy}
      </button>
    </div>
  )

  return createPortal(
    <motion.div
      className={`pd${isPage ? ' pd--page' : ''}`}
      onClick={isPage ? undefined : requestClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="pd-card"
        onClick={(e) => e.stopPropagation()}
        initial={isPage ? { x: 72, opacity: 0.3 } : { opacity: 0, y: 28, scale: 0.98 }}
        animate={isPage ? { x: 0, opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={
          isPage
            ? { x: 72, opacity: 0.2, transition: { duration: 0.24 } }
            : { opacity: 0, y: 14, scale: 0.98, transition: { duration: 0.22 } }
        }
        transition={{ duration: isPage ? 0.32 : 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        {isPage && (
          <header className="pd-appbar">
            <button type="button" className="pd-back" onClick={requestClose} aria-label={d.back}>
              {BACK_ICON}
            </button>
            <span className="pd-appbar-title">{p.code}</span>
          </header>
        )}

        {!isPage && (
          <nav className="pd-tabs" aria-label={d.overview}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`pd-tab${activeTab === t.id ? ' is-active' : ''}`}
                onClick={() => goTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}

        <div className="pd-scroll" ref={scrollRef}>
          {/* —— DJI 式双栏首屏：左图库 / 右购买信息 —— */}
          <section
            className={`pd-hero${gallery.length ? '' : ' pd-hero--nophoto'}`}
            id="pd-sec-overview"
            style={secStyle('pd-sec-overview')}
          >
            {gallery.length > 0 && (
              <div className="pd-gallery">
                <motion.div
                  className="pd-gallery-main"
                  layoutId={isPage || active.source === 'v8' ? undefined : `prop-media-${active.source}-${active.index}`}
                  transition={MELT}
                >
                  <div
                    ref={trackRef}
                    className="pd-gallery-track"
                    onScroll={onTrackScroll}
                    onPointerDown={onTrackPointerDown}
                    onPointerMove={onTrackPointerMove}
                    onPointerUp={endTrackDrag}
                    onPointerCancel={endTrackDrag}
                  >
                    {gallery.map((src, i) => (
                      <div className="pd-gallery-slide" key={src}>
                        <SmartImage
                          src={src}
                          alt={i === 0 ? p.district : ''}
                          ariaHidden={i === 0 ? undefined : true}
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                  {gallery.length > 1 && <span className="pd-gallery-count">{photo + 1} / {gallery.length}</span>}
                </motion.div>
                {gallery.length > 1 && (
                  <div className="pd-thumbs" aria-label={d.galleryTitle}>
                    {gallery.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        className={`pd-thumb${i === photo ? ' is-active' : ''}`}
                        onClick={() => scrollToPhoto(i)}
                        aria-label={`${d.galleryTitle} ${i + 1}`}
                      >
                        <SmartImage src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pd-info">
              <div className="pd-crumb">{p.code}</div>
              <h1 className="pd-title">{p.district}</h1>
              <p className="pd-line">
                <Metro size={15} /> {p.metro}
              </p>
              {p.address ? (
                <p className="pd-line pd-line--muted">
                  <span className="pd-pin" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>
                  {p.address}
                </p>
              ) : null}

              <div className="pd-price">
                <strong>
                  {p.price}
                  <span className="pd-price-unit">{c.ui.perMonth}</span>
                </strong>
                <span className="pd-price-fx">
                  <FX size={11} /> {p.fx}
                </span>
              </div>

              <ul className="pd-rows">
                {specs.map((s) => (
                  <li key={s.label}>
                    <span className="pd-row-icon">{s.icon}</span>
                    <span className="pd-row-label">{s.label}</span>
                    <span className="pd-row-value">{s.value}</span>
                  </li>
                ))}
              </ul>

              {amenities.length > 0 && (
                <div className="pd-amen">
                  <div className="pd-subtitle">{d.amenitiesTitle}</div>
                  <ul className="pd-amen-grid">
                    {amenities.map(([key, label]) => (
                      <li key={key}>
                        <span className="pd-amen-check">{AMENITY_CHECK}</span>
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <dl className="pd-terms">
                <div>
                  <dt>{d.depositLabel}</dt>
                  <dd>{d.depositValue}</dd>
                </div>
                <div>
                  <dt>{d.leaseLabel}</dt>
                  <dd>{d.leaseValue}</dd>
                </div>
              </dl>

              {!isPage && ctaGroup}
            </div>
          </section>

          {!p.copyHidden && (
            <section
              className="pd-band pd-band--gray"
              id="pd-sec-about"
              style={secStyle('pd-sec-about')}
            >
              <h2 className="pd-band-title">{d.aboutTitle}</h2>
              <p className="pd-band-text">{fill(p.intro || (p.categories?.includes('luxury') ? d.aboutText : d.aboutTextNoArea), vars)}</p>
            </section>
          )}

          <section className="pd-band" id="pd-sec-location" style={secStyle('pd-sec-location')}>
            <h2 className="pd-band-title">{d.locationTitle}</h2>
            {!p.copyHidden && <p className="pd-band-text">{fill(p.locationText || d.locationText, vars)}</p>}
            <figure className={`pd-map${mapError ? ' is-error' : ''}`}>
              {!mapError && mapReady && (
                <iframe
                  src={mapSrc}
                  title={d.mapTitle}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  onLoad={() => clearTimeout(mapTimer.current)}
                  onError={() => setMapError(true)}
                />
              )}
              <div className="pd-map-fallback" aria-hidden={!mapError}>
                <strong>{mapLabel}</strong>
                <a href={mapLink} target="_blank" rel="noopener noreferrer">
                  {d.mapOpen} ↗
                </a>
              </div>
            </figure>
          </section>
        </div>

        {isPage && (
          <footer className="pd-buybar">
            <div className="pd-buybar-price">
              <span className="pd-buybar-from">{c.ui.from}</span>
              <strong>
                {p.price}
                <span className="pd-price-unit">{c.ui.perMonth}</span>
              </strong>
            </div>
            {ctaGroup}
          </footer>
        )}

        {/* 未登录咨询弹窗：登录 / 邮箱 / 电话 三选一 */}
        {contactOpen && (
          <div className="pd-contact-mask" onClick={() => setContactOpen(false)}>
            <div className="pd-contact-pop" onClick={(e) => e.stopPropagation()}>
              <div className="pd-contact-pop__title">{TL.popTitle}</div>
              <p className="pd-contact-pop__sub">{TL.popSub}</p>
              <button type="button" className="pd-contact-pop__btn pd-contact-pop__btn--login" onClick={onPopLogin}>
                {CHAT_ICON}
                {TL.login}
              </button>
              <button type="button" className="pd-contact-pop__btn" onClick={() => onPickContact('email')}>
                {MAIL_ICON}
                <span className="pd-contact-pop__label">{TL.email}</span>
                <span className="pd-contact-pop__value">{CONTACT.email}</span>
                {copiedWay === 'email' && <span className="pd-contact-pop__ok">{TL.copied}</span>}
              </button>
              <button type="button" className="pd-contact-pop__btn" onClick={() => onPickContact('phone')}>
                {PHONE_ICON}
                <span className="pd-contact-pop__label">{TL.phone}</span>
                <span className="pd-contact-pop__value">{CONTACT.phone}</span>
                {copiedWay === 'phone' && <span className="pd-contact-pop__ok">{TL.copied}</span>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default function PropertyDetail() {
  const { active, closeProperty } = useProperty()
  return (
    <AnimatePresence>
      {active && <DetailPanel key={`detail-${active.index}-${active.source}`} active={active} closeProperty={closeProperty} />}
    </AnimatePresence>
  )
}
