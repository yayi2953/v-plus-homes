import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'
import './chat.css'

const POLL_MS = 3000 // 轮询间隔：实时接收往返消息

// 三语文案
const L = {
  zh: {
    title: '在线客服',
    online: '客服在线 · 通常几分钟内回复',
    loginFirst: '请先登录后再联系客服',
    loginBtn: '去登录',
    back: '返回网站',
    placeholder: '输入消息...',
    send: '发送',
    empty: '您好，请问有什么可以帮您？',
    sending: '发送中...',
    agent: 'V PLUS 客服',
    loadErr: '连接中断，正在重连...'
  },
  en: {
    title: 'Live Chat',
    online: 'Agent online · usually replies within minutes',
    loginFirst: 'Please sign in to chat with our support team',
    loginBtn: 'Sign In',
    back: 'Back to site',
    placeholder: 'Type a message...',
    send: 'Send',
    empty: 'Hi there! How can we help you today?',
    sending: 'Sending...',
    agent: 'V PLUS Support',
    loadErr: 'Connection lost, reconnecting...'
  },
  ja: {
    title: 'オンラインサポート',
    online: 'サポート対応中 · 通常数分以内に返信',
    loginFirst: 'サポートに相談するにはログインしてください',
    loginBtn: 'ログイン',
    back: 'サイトに戻る',
    placeholder: 'メッセージを入力...',
    send: '送信',
    empty: 'こんにちは。ご用件をお聞かせください。',
    sending: '送信中...',
    agent: 'V PLUS サポート',
    loadErr: '接続が切断されました。再接続中...'
  }
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
  const listRef = useRef(null)
  const pollRef = useRef(null)
  const lastCountRef = useRef(0)

  const scrollBottom = useCallback((smooth = true) => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // 应用服务端会话数据（仅在新消息更多时替换，避免覆盖本地乐观消息）
  const applyChat = useCallback((chat) => {
    const msgs = chat?.messages || []
    if (msgs.length >= lastCountRef.current) {
      lastCountRef.current = msgs.length
      setMessages(msgs)
    }
  }, [])

  // 拉取会话
  const loadChat = useCallback(async () => {
    try {
      const res = await authFetch('/api/chat')
      if (res.status === 401) return // token 失效，AuthContext 会自行清理
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

  // 消息变化滚到底部
  useEffect(() => {
    scrollBottom(messages.length > 0)
  }, [messages, scrollBottom])

  async function send() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setDraft('')
    // 乐观更新：先本地展示，服务器响应后校正
    lastCountRef.current += 1
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

  // 未登录：提示登录
  if (!isAuthenticated) {
    return (
      <div className="v8-chat">
        <div className="v8-chat__gate">
          <div className="v8-chat__gate-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h1>{T.loginFirst}</h1>
          <button className="v8-chat__gate-btn" onClick={() => navigate('/login')}>{T.loginBtn}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="v8-chat">
      <div className="v8-chat__shell">
        {/* 顶栏 */}
        <header className="v8-chat__header">
          <button className="v8-chat__back" onClick={() => navigate('/')} aria-label={T.back}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <div className="v8-chat__head-info">
            <span className="v8-chat__avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h3M18 12h3" /><path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" /><rect x="2" y="8" width="4" height="6" rx="1.5" /><rect x="18" y="8" width="4" height="6" rx="1.5" /><path d="M20 14v2a2 2 0 0 1-2 2h-4" /><circle cx="12.5" cy="18" r="1.6" />
              </svg>
            </span>
            <div>
              <strong>{T.title}</strong>
              <span className="v8-chat__status"><i aria-hidden="true" />{T.online}</span>
            </div>
          </div>
        </header>

        {/* 消息流 */}
        <div className="v8-chat__list" ref={listRef}>
          {messages.length === 0 && <p className="v8-chat__empty">{T.empty}</p>}
          {messages.map((m) => (
            <div key={m.id} className={`v8-chat__row v8-chat__row--${m.from === 'user' ? 'me' : 'agent'}`}>
              <div className="v8-chat__bubble">
                <p>{m.text}</p>
                <time>{fmtTime(m.at, lang)}</time>
              </div>
            </div>
          ))}
          {netErr && <p className="v8-chat__err">{T.loadErr}</p>}
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
          <button onClick={send} disabled={sending || !draft.trim()}>
            {sending ? T.sending : T.send}
          </button>
        </footer>
      </div>
      <p className="v8-chat__who">{user?.name} · {user?.email}</p>
    </div>
  )
}
