import { useState, useCallback } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useContact } from '../ici/contactContext.jsx'

// 首屏轮播背景图
const BG_IMAGES = [
  '/images/hero-cityscape.jpg',
  '/images/dream-slide-pool.jpg',
  '/images/dream-slide-lake2.jpg'
]

export default function V8Hero() {
  const { c } = useIciI18n()
  const { openContact } = useContact()
  const [idx, setIdx] = useState(0)

  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + BG_IMAGES.length) % BG_IMAGES.length)
  }, [])

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % BG_IMAGES.length)
  }, [])

  const t = c.v8?.hero || {}

  return (
    <section className="v8-hero" id="top">
      <div className="v8-hero-canvas">
        {/* 轮播背景图 */}
        <div className="v8-hero-videobg" aria-hidden="true">
          {BG_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`v8-hero-slide${i === idx ? ' is-active' : ''}`}
            />
          ))}
        </div>

        {/* 图片上的文字层：上半部分居中白色 */}
        <div className="v8-hero-overlay">
          <p className="v8-hero-overlay__eyebrow">{t.eyebrow}</p>
          <h1 className="v8-hero-overlay__title">V&nbsp;PLUS</h1>
          <p className="v8-hero-overlay__sub">{t.lede}</p>
        </div>

        {/* 左右切换箭头 */}
        <button type="button" className="v8-hero-arrow v8-hero-arrow--prev" onClick={prev} aria-label="上一张">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button type="button" className="v8-hero-arrow v8-hero-arrow--next" onClick={next} aria-label="下一张">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* 轮播指示器：底部居中，特斯拉风格圆点 */}
        <div className="v8-hero-dots" role="tablist" aria-label="轮播图切换">
          {BG_IMAGES.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`第 ${i + 1} 张`}
              className={`v8-hero-dot${i === idx ? ' is-active' : ''}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      </div>
      <div className="v8-hero-body">
        <p className="v8-eyebrow">{t.eyebrow}</p>
        <p className="v8-lede">{t.lede}</p>
        <div className="v8-hero-cta">
          <button type="button" className="v8-tlink" onClick={openContact}>
            {t.whatsapp}
          </button>
        </div>
      </div>
    </section>
  )
}
