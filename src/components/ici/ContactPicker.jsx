import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import {
  WeChat, WhatsApp, Phone, Mail, TikTok, Check, ArrowUpRight
} from './Icons.jsx'

// 咨询方式选择弹窗：
// 布局固定为 电话 | TikTok / 微信 | 邮箱 / WhatsApp（整行）。
// 仅 WhatsApp 为直接跳转；电话、TikTok、微信、邮箱点击后只复制对应联系方式，
// 卡片即时给出「已复制」反馈。
export default function ContactPicker({ open, onClose }) {
  const { c } = useIciI18n()
  const m = c.contactModal
  const contact = c.contact || {}
  const [copiedKey, setCopiedKey] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function close() {
    setCopiedKey(null)
    onClose?.()
  }

  async function copy(key, value) {
    if (!value || copiedKey === key) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiedKey(key)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopiedKey(null), 1600)
    } catch {
      /* 复制失败时用户仍可长按 / 手动选中卡片下方的联系方式 */
    }
  }

  // 顺序即前台展示顺序：电话 | TikTok / 微信 | 邮箱
  const copyChannels = [
    { key: 'tel', label: m.tel, value: contact.tel, Icon: Phone, cls: 'contact-opt--tel' },
    { key: 'tiktok', label: m.tiktok, value: contact.tiktok, Icon: TikTok, cls: 'contact-opt--tiktok' },
    { key: 'wechat', label: m.wechat, value: contact.wechatId, Icon: WeChat, cls: 'contact-opt--wechat' },
    { key: 'email', label: m.email, value: contact.email, Icon: Mail, cls: 'contact-opt--email' }
  ]

  const waReady = !!contact.whatsapp

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="contact-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="contact-modal"
            role="dialog"
            aria-modal="true"
            aria-label={m.title}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="contact-modal__title">{m.title}</h3>
            <p className="contact-modal__desc">{m.desc}</p>

            <div className="contact-modal__options">
              {copyChannels.map(({ key, label, value, Icon, cls }) => {
                const ready = !!value
                const isCopied = copiedKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    className={`contact-opt ${cls}${isCopied ? ' is-copied' : ''}${ready ? '' : ' is-off'}`}
                    onClick={() => copy(key, value)}
                    disabled={!ready}
                    title={ready ? value : m.unavailable}
                    aria-label={ready ? `${label} · ${value}` : label}
                  >
                    <span className="contact-opt__icon">
                      {isCopied ? <Check size={24} /> : <Icon size={24} />}
                    </span>
                    <span className="contact-opt__label">{isCopied ? m.copied : label}</span>
                    {ready ? (
                      <span className="contact-opt__value">{value}</span>
                    ) : (
                      <span className="contact-opt__na">{m.unavailable}</span>
                    )}
                  </button>
                )
              })}

              <button
                type="button"
                className={`contact-opt contact-opt--whatsapp contact-opt--wide${waReady ? '' : ' is-off'}`}
                onClick={() => waReady && (window.location.href = contact.whatsapp)}
                disabled={!waReady}
                title={waReady ? contact.whatsapp : m.unavailable}
              >
                <span className="contact-opt__icon"><WhatsApp size={24} /></span>
                <span className="contact-opt__main">
                  <span className="contact-opt__label">{m.whatsapp}</span>
                  <span className="contact-opt__hint">{waReady ? m.openWhatsapp : m.unavailable}</span>
                </span>
                {waReady ? <ArrowUpRight size={18} /> : null}
              </button>
            </div>

            <button className="contact-modal__cancel" onClick={close}>{m.cancel}</button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
