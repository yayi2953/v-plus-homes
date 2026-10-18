import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'
import './chat.css'

const POLL_MS = 3000 // 轮询间隔：实时接收往返消息

// 侧边栏顶部轮播图（站内房产主题，生成图源）
const SLIDE_IMGS = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20luxury%20apartment%20living%20room%20interior%20with%20floor%20to%20ceiling%20windows%2C%20bright%20natural%20light%2C%20minimalist%20furniture%2C%20photorealistic&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bright%20modern%20student%20apartment%20bedroom%20with%20study%20desk%2C%20clean%20minimal%20interior%2C%20photorealistic&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20city%20apartment%20building%20glass%20facade%20at%20dusk%2C%20warm%20lights%2C%20photorealistic&image_size=landscape_16_9'
]
const PROMO_IMG = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=new%20apartment%20keys%20with%20blue%20keychain%20on%20clean%20white%20table%2C%20minimal%20product%20photography%2C%20soft%20light&image_size=square'

// 三语文案与快捷内容
const L = {
  zh: {
    title: '在线客服',
    loginFirst: '请先登录后再联系客服',
    loginBtn: '去登录',
    placeholder: '请输入您想咨询的产品和问题',
    send: '发送',
    sending: '发送中...',
    loadErr: '连接中断，正在重连...',
    guess: '猜您想问',
    shuffle: '换一换',
    selfService: '自助服务',
    bannerTitle: 'V PLUS 精选房源',
    bannerSub: '小而美家，尽在 V PLUS',
    promoTitle: 'V PLUS 新客礼',
    promoSub: '首月租金立减 200 元',
    quick: [
      '有哪些豪华住宅在租？',
      '学生公寓最便宜多少钱？',
      '如何预约线下看房？',
      '押金和付款方式是什么？',
      '可以短租吗？最短租期多久？',
      'V PLUS 会员有什么权益？'
    ],
    chips: ['🔥 新房源上线', '豪华住宅', '学生公寓', '城市公寓', '预约看房'],
    sideLinks: [
      { icon: 'search', label: '房源信息', q: '请介绍一下当前的房源信息' },
      { icon: 'calendar', label: '自助看房', q: '如何预约线下看房？' },
      { icon: 'flag', label: '租房申报', q: '我想申报租房相关事宜' },
      { icon: 'clock', label: '服务进度', q: '我想查询我的租房进度' },
      { icon: 'tag', label: '房源价格查询', q: '请提供房源价格查询' }
    ]
  },
  en: {
    title: 'Live Chat',
    loginFirst: 'Please sign in to chat with our support team',
    loginBtn: 'Sign In',
    placeholder: 'Type your question here...',
    send: 'Send',
    sending: 'Sending...',
    loadErr: 'Connection lost, reconnecting...',
    guess: 'You may ask',
    shuffle: 'Shuffle',
    selfService: 'Self Service',
    bannerTitle: 'V PLUS Selected Homes',
    bannerSub: 'A home that fits you, at V PLUS',
    promoTitle: 'V PLUS Welcome Offer',
    promoSub: '¥200 off your first month',
    quick: [
      'What luxury homes are available?',
      'Cheapest student apartment price?',
      'How do I book a viewing?',
      'Deposit and payment options?',
      'Is short-term rental possible?',
      'What are V PLUS member benefits?'
    ],
    chips: ['🔥 New listings', 'Luxury', 'Student', 'City', 'Book a viewing'],
    sideLinks: [
      { icon: 'search', label: 'Listings', q: 'Please introduce the current listings' },
      { icon: 'calendar', label: 'Book a viewing', q: 'How do I book a viewing?' },
      { icon: 'flag', label: 'Rental requests', q: 'I want to submit a rental request' },
      { icon: 'clock', label: 'Service progress', q: 'I want to check my rental progress' },
      { icon: 'tag', label: 'Price inquiry', q: 'Please provide listing prices' }
    ]
  },
  ja: {
    title: 'オンラインサポート',
    loginFirst: 'サポートに相談するにはログインしてください',
    loginBtn: 'ログイン',
    placeholder: 'ご質問を入力してください...',
    send: '送信',
    sending: '送信中...',
    loadErr: '接続が切断されました。再接続中...',
    guess: 'よくある質問',
    shuffle: '更新',
    selfService: 'セルフサービス',
    bannerTitle: 'V PLUS 厳選物件',
    bannerSub: 'あなたに合う住まいが、V PLUS に',
    promoTitle: 'V PLUS 新客特典',
    promoSub: '初月家賃から 200 元引き',
    quick: [
      '現在募集中の高級住宅は？',
      '学生アパートの最安値は？',
      '内見の予約方法は？',
      '敷金と支払い方法を教えてください',
      '短期賃貸は可能ですか？',
      'V PLUS 会員の特典は？'
    ],
    chips: ['🔥 新着物件', '高級住宅', '学生アパート', 'シティアパート', '内見予約'],
    sideLinks: [
      { icon: 'search', label: '物件情報', q: '現在の物件情報を紹介してください' },
      { icon: 'calendar', label: '内見予約', q: '内見の予約方法は？' },
      { icon: 'flag', label: '申請・届出', q: '賃貸に関する申請をしたいです' },
      { icon: 'clock', label: 'サービス進捗', q: '契約の進捗を確認したいです' },
      { icon: 'tag', label: '価格照会', q: '物件価格を教えてください' }
    ]
  }
}

// 统一描边风格图标（与站内现有一致的几何线条图标）
function Icon({ name, size = 16 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></>,
    crown: <><polyline points="4 16 5.5 8 10 12 12 6 14 12 18.5 8 20 16" /><line x1="4" y1="19" x2="20" y2="19" /></>,
    box: <><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><polyline points="3 8 12 13 21 8" /><line x1="12" y1="13" x2="12" y2="21" /></>,
    list: <><line x1="9" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="9" y1="18" x2="21" y2="18" /><circle cx="4.5" cy="6" r="0.5" /><circle cx="4.5" cy="12" r="0.5" /><circle cx="4.5" cy="18" r="0.5" /></>,
    tag: <><path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7" cy="7" r="1.5" /></>,
    flag: <><line x1="4" y1="22" x2="4" y2="4" /><path d="M4 4c3-2 6 2 9 0s5-1 7 0v9c-2-1-4-2-7 0s-6-2-9 0" /></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><polyline points="9 12 11 14 15 10" /></>,
    send: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
    refresh: <><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10" /><path d="M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></>,
    left: <polyline points="15 18 9 12 15 6" />,
    right: <polyline points="9 18 15 12 9 6" />,
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function fmtTime(ts, lang) {
  try {
    return new Date(ts).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function ChatPage() {
  const { lang } = useIciI18n()
  const T = L[lang] || L.zh
  const { user, isAuthenticated, token, authFetch } = useAuth()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [netErr, setNetErr] = useState(false)
  const [guessOffset, setGuessOffset] = useState(0)
  const [slideIdx, setSlideIdx] = useState(0)
  const canvasRef = useRef(null)
  const chipsRef = useRef(null)
  const pollRef = useRef(null)
  const bannerRef = useRef(null)
  const lastCountRef = useRef(0)

  const scrollBottom = useCallback((smooth = true) => {
    const el = canvasRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // 应用服务端会话数据（仅在消息数增加时更新，避免轮询空转触发自动滚底）
  const applyChat = useCallback((chat) => {
    const msgs = chat?.messages || []
    if (msgs.length > lastCountRef.current) {
      lastCountRef.current = msgs.length
      setMessages(msgs)
    }
  }, [])

  const loadChat = useCallback(async () => {
    try {
      const res = await authFetch('/api/chat')
      if (res.status === 401) return
      const d = await res.json()
      applyChat(d.chat)
      setNetErr(false)
    } catch {
      setNetErr(true)
    }
  }, [authFetch, applyChat])

  // 首次加载 + 3 秒轮询
  useEffect(() => {
    if (!isAuthenticated || !token) return
    loadChat()
    pollRef.current = setInterval(loadChat, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [isAuthenticated, token, loadChat])

  // 消息数变化（即有新消息）才自动滚底
  useEffect(() => {
    scrollBottom(messages.length > 0)
  }, [messages, scrollBottom])

  // 侧边栏轮播（4 秒切换）
  useEffect(() => {
    if (!isAuthenticated) return
    bannerRef.current = setInterval(() => setSlideIdx((i) => (i + 1) % SLIDE_IMGS.length), 4000)
    return () => clearInterval(bannerRef.current)
  }, [isAuthenticated])

  // 房源详情页带来的自动问询：登录态进入聊天窗后仅发送一次
  useEffect(() => {
    if (!isAuthenticated || !token) return
    let pending = null
    try {
      pending = sessionStorage.getItem('vplus_chat_pending')
      if (pending) sessionStorage.removeItem('vplus_chat_pending')
    } catch {
      /* ignore */
    }
    if (!pending) return
    // 稍等首屏历史消息加载完成，再自动发出问询，保证排序在最后
    const timer = setTimeout(() => send(pending), 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token])

  async function send(textArg) {
    const text = (textArg ?? draft).trim()
    if (!text || sending) return
    setSending(true)
    setDraft('')
    // 乐观更新：先本地展示，服务器响应后校正（不改动计数，避免失败后漏计新消息）
    setMessages((m) => [...m, { id: `local-${Date.now()}`, from: 'user', text, at: Date.now() }])
    try {
      const res = await authFetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`)
      applyChat(d.chat)
      setNetErr(false)
    } catch {
      setNetErr(true)
    } finally {
      setSending(false)
    }
  }

  function scrollChips(dir) {
    chipsRef.current?.scrollBy({ left: dir * 140, behavior: 'smooth' })
  }

  // 未登录：提示登录
  if (!isAuthenticated) {
    return (
      <div className="v8-chat">
        <div className="v8-chat__gate">
          <div className="v8-chat__gate-icon" aria-hidden="true">
            <Icon name="search" size={24} />
          </div>
          <h1>{T.loginFirst}</h1>
          <button className="v8-chat__gate-btn" onClick={() => navigate('/login')}>{T.loginBtn}</button>
        </div>
      </div>
    )
  }

  const guessVisible = Array.from({ length: 4 }, (_, i) => T.quick[(guessOffset + i) % T.quick.length])

  return (
    <div className="v8-chat">
      <div className="v8-chat__shell">
        {/* 顶栏：品牌 Logo + 关闭 */}
        <header className="v8-chat__header">
          <img src="/images/vlu-logo.png" alt="V PLUS" className="v8-chat__logo" />
          <button className="v8-chat__close" onClick={() => navigate('/')} aria-label={lang === 'zh' ? '关闭' : 'Close'}>
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="v8-chat__body">
          {/* 左：聊天区 */}
          <section className="v8-chat__main">
            {/* 消息画布 */}
            <div className="v8-chat__canvas" ref={canvasRef}>
              {/* 猜您想问 */}
              <div className="v8-chat__guess">
                <div className="v8-chat__guess-head">
                  <strong>{T.guess}</strong>
                  <button className="v8-chat__shuffle" onClick={() => setGuessOffset((o) => o + 4)}>
                    <Icon name="refresh" size={12} />{T.shuffle}
                  </button>
                </div>
                <ul>
                  {guessVisible.map((q, i) => (
                    <li key={q + i}>
                      <button onClick={() => send(q)}>{q}</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 推广卡片 */}
              <button className="v8-chat__promo" onClick={() => navigate('/listings')}>
                <img src={PROMO_IMG} alt={T.promoTitle} loading="lazy" />
                <span className="v8-chat__promo-title">{T.promoTitle}</span>
                <span className="v8-chat__promo-sub">{T.promoSub}</span>
              </button>

              {/* 会话消息（时间以居中分隔标签显示，间隔 ≥3 分钟才出现） */}
              {messages.map((m, i) => {
                const showTime = i === 0 || m.at - messages[i - 1].at >= 3 * 60 * 1000
                return (
                  <Fragment key={m.id}>
                    {showTime && <div className="v8-chat__time">{fmtTime(m.at, lang)}</div>}
                    <div className={`v8-chat__row v8-chat__row--${m.from === 'user' ? 'me' : 'agent'}`}>
                      <div className="v8-chat__bubble">
                        <p>{m.text}</p>
                      </div>
                    </div>
                  </Fragment>
                )
              })}
              {netErr && <p className="v8-chat__err">{T.loadErr}</p>}
            </div>

            {/* 话题胶囊 */}
            <div className="v8-chat__chips">
              <button className="v8-chat__chip-nav" onClick={() => scrollChips(-1)} aria-label="◀">
                <Icon name="left" size={13} />
              </button>
              <div className="v8-chat__chips-track" ref={chipsRef}>
                {T.chips.map((c) => (
                  <button key={c} className="v8-chat__chip" onClick={() => send(c)}>{c}</button>
                ))}
              </div>
              <button className="v8-chat__chip-nav" onClick={() => scrollChips(1)} aria-label="▶">
                <Icon name="right" size={13} />
              </button>
            </div>

            {/* 输入区 */}
            <footer className="v8-chat__inputbar">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
                placeholder={T.placeholder}
                maxLength={1000}
                aria-label={T.placeholder}
              />
              <button className="v8-chat__send" onClick={() => send()} disabled={sending || !draft.trim()}>
                <Icon name="send" size={13} />{sending ? T.sending : T.send}
              </button>
            </footer>
          </section>

          {/* 右：自助服务栏 */}
          <aside className="v8-chat__side">
            <div className="v8-chat__banner">
              {SLIDE_IMGS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={T.bannerTitle}
                  className={`v8-chat__banner-img${i === slideIdx ? ' is-active' : ''}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              ))}
              <div className="v8-chat__banner-scrim" aria-hidden="true" />
              <div className="v8-chat__banner-text">
                <strong>{T.bannerTitle}</strong>
                <span>{T.bannerSub}</span>
              </div>
              <div className="v8-chat__banner-dots" role="tablist">
                {SLIDE_IMGS.map((_, i) => (
                  <button
                    key={i}
                    className={i === slideIdx ? 'is-active' : ''}
                    onClick={() => setSlideIdx(i)}
                    aria-label={`${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <h3 className="v8-chat__side-head">{T.selfService}</h3>
            <div className="v8-chat__side-links">
              {T.sideLinks.map((l) => (
                <button key={l.label} className="v8-chat__side-link" onClick={() => send(l.q)}>
                  <Icon name={l.icon} size={15} />
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
      <p className="v8-chat__who">{user?.name} · {user?.email}</p>
    </div>
  )
}
