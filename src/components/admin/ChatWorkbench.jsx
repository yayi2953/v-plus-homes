import { useState, useEffect, useRef, useCallback, Fragment } from 'react'

const POLL_MS = 3000 // 轮询间隔：实时接收用户消息

export default function ChatWorkbench({ authFetch }) {
  const zh = navigator.language?.startsWith('zh')
  const t = (z, e) => (zh ? z : e)

  const [chats, setChats] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)
  const pollRef = useRef(null)
  const activeIdRef = useRef(null)
  const lastCountRef = useRef(0)
  const localPushRef = useRef(false) // 回复后的乐观更新标记

  activeIdRef.current = activeId

  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString(zh ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // 会话列表轮询
  const loadChats = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/chats')
      if (!res.ok) return
      const d = await res.json()
      setChats(d.chats || [])
    } catch { /* 网络抖动忽略，下轮重试 */ }
  }, [authFetch])

  // 选中会话详情轮询
  const loadActive = useCallback(async () => {
    const id = activeIdRef.current
    if (!id) return
    try {
      const res = await authFetch(`/api/admin/chats?id=${encodeURIComponent(id)}`)
      if (!res.ok) return
      const d = await res.json()
      const msgs = d.chat?.messages || []
      // 仅在消息数增加或有待确认的本地乐观回复时更新，避免轮询空转触发自动滚底
      if (msgs.length > lastCountRef.current || localPushRef.current) {
        localPushRef.current = false
        lastCountRef.current = msgs.length
        setActiveChat(d.chat)
      }
    } catch { /* ignore */ }
  }, [authFetch])

  useEffect(() => {
    loadChats()
    pollRef.current = setInterval(() => { loadChats(); loadActive() }, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [loadChats, loadActive])

  // 消息数变化（即有新消息）才自动滚底
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [activeChat])

  function selectChat(id) {
    setActiveId(id)
    setActiveChat(null)
    lastCountRef.current = 0
    // 打开会话即标记已读（清列表未读徽标）
    authFetch('/api/admin/chats/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: id })
    }).then(() => loadChats()).catch(() => {})
  }

  async function reply() {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    setDraft('')
    // 乐观更新：先本地展示，随后轮询校正
    localPushRef.current = true
    lastCountRef.current += 1
    setActiveChat((c) => ({
      ...c,
      messages: [...(c?.messages || []), { id: `local-${Date.now()}`, from: 'admin', text, at: Date.now() }]
    }))
    try {
      await authFetch('/api/admin/chats/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeId, text })
      })
    } catch { /* ignore，轮询会校正 */ } finally {
      setSending(false)
    }
  }

  return (
    <div className="v8-admin__panel v8-cw">
      {/* 左：会话列表 */}
      <aside className="v8-cw__list">
        <div className="v8-cw__list-head">
          <h2>{t('客服会话', 'Chats')}</h2>
          <span className="v8-cw__live"><i aria-hidden="true" />{t('实时', 'Live')}</span>
        </div>
        {chats.length === 0 && <p className="v8-cw__none">{t('暂无会话，用户从首页「在线客服」发起对话后显示在这里', 'No chats yet — they appear here once a user starts one')}</p>}
        {chats.map((c) => (
          <button
            key={c.id}
            className={`v8-cw__item${activeId === c.id ? ' is-active' : ''}`}
            onClick={() => selectChat(c.id)}
          >
            <div className="v8-cw__item-top">
              <strong>{c.userName || c.userEmail}</strong>
              <time>{fmtTime(c.updatedAt)}</time>
            </div>
            <div className="v8-cw__item-bottom">
              <span className="v8-cw__preview">
                {c.lastMessage ? `${c.lastMessage.from === 'admin' ? t('我: ', 'Me: ') : ''}${c.lastMessage.text}` : t('（无消息）', '(no messages)')}
              </span>
              {c.unread > 0 && <span className="v8-cw__badge">{c.unread}</span>}
            </div>
          </button>
        ))}
      </aside>

      {/* 右：聊天窗 */}
      <div className="v8-cw__window">
        {!activeId && (
          <div className="v8-cw__placeholder">
            <p>{t('选择左侧会话开始回复', 'Select a chat on the left to reply')}</p>
          </div>
        )}
        {activeId && (
          <>
            <header className="v8-cw__head">
              <strong>{activeChat ? (activeChat.userName || activeChat.userEmail) : t('加载中...', 'Loading...')}</strong>
              {activeChat?.userEmail && <span>{activeChat.userEmail}</span>}
            </header>
            <div className="v8-cw__messages" ref={listRef}>
              {(activeChat?.messages || []).map((m, i, arr) => {
                const showTime = i === 0 || m.at - arr[i - 1].at >= 3 * 60 * 1000
                return (
                  <Fragment key={m.id}>
                    {showTime && <div className="v8-cw__time">{fmtTime(m.at)}</div>}
                    <div className={`v8-cw__row v8-cw__row--${m.from === 'admin' ? 'me' : 'user'}`}>
                      <div className={`v8-cw__bubble${m.card ? ' v8-cw__bubble--card' : ''}`}>
                        {m.card && (
                          <a className="v8-cw__propcard" href={m.card.url} target="_blank" rel="noopener noreferrer">
                            {m.card.img && <img className="v8-cw__propcard-img" src={m.card.img} alt={m.card.title} loading="lazy" />}
                            <span className="v8-cw__propcard-shade" aria-hidden="true" />
                            <span className="v8-cw__propcard-info">
                              <strong>{m.card.title}</strong>
                              {m.card.sub && <small>{m.card.sub}</small>}
                              {m.card.price && <em>{m.card.price}</em>}
                            </span>
                          </a>
                        )}
                        <p>{m.text}</p>
                      </div>
                    </div>
                  </Fragment>
                )
              })}
              {activeChat && activeChat.messages.length === 0 && (
                <p className="v8-cw__none">{t('该会话暂无消息', 'No messages in this chat')}</p>
              )}
            </div>
            <footer className="v8-cw__inputbar">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); reply() } }}
                placeholder={t('输入回复，回车发送', 'Type a reply and press Enter')}
                maxLength={1000}
              />
              <button onClick={reply} disabled={sending || !draft.trim()}>
                {sending ? t('发送中...', 'Sending...') : t('发送', 'Send')}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
