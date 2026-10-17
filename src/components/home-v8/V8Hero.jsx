import { useState, useCallback } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useContact } from '../ici/contactContext.jsx'

// 首屏轮播背景图（每张配独立文案组，切换图片时文字跟随变化）
const SLIDES = [
  '/images/hero-cityscape.jpg',
  '/images/dream-slide-pool.jpg',
  '/images/dream-slide-lake2.jpg'
]

// 第 1 张沿用原有 key（兼容已保存的覆盖项），第 2/3 张使用独立 key
function slideText(t, i) {
  if (i === 0) return { eyebrow: t.eyebrow, title: t.title, lede: t.lede, ek: 'v8.hero.eyebrow', tk: 'v8.hero.title', lk: 'v8.hero.lede' }
  if (i === 1) return { eyebrow: t.s2Eyebrow, title: t.s2Title, lede: t.s2Lede, ek: 'v8.hero.s2Eyebrow', tk: 'v8.hero.s2Title', lk: 'v8.hero.s2Lede' }
  return { eyebrow: t.s3Eyebrow, title: t.s3Title, lede: t.s3Lede, ek: 'v8.hero.s3Eyebrow', tk: 'v8.hero.s3Title', lk: 'v8.hero.s3Lede' }
}

export default function V8Hero() {
  const { c } = useIciI18n()
  const { openContact } = useContact()
  const [idx, setIdx] = useState(0)

  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % SLIDES.length)
  }, [])

  const t = c.v8?.hero || {}
  const ot = slideText(t, idx)

  return (
    <section className="v8-hero" id="top">
      <div className="v8-hero-canvas">
        {/* 轮播背景图 */}
        <div className="v8-hero-videobg" aria-hidden="true">
          {SLIDES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              data-edit-img={`v8.hero.slide${i + 1}`}
              className={`v8-hero-slide${i === idx ? ' is-active' : ''}`}
            />
          ))}
        </div>

        {/* 图片上的文字层：随当前轮播图切换 */}
        <div className="v8-hero-overlay" key={idx}>
          <p className="v8-hero-overlay__eyebrow" data-edit-key={ot.ek}>{ot.eyebrow}</p>
          <h1 className="v8-hero-overlay__title" data-edit-key={ot.tk}>{ot.title || 'V PLUS'}</h1>
          <p className="v8-hero-overlay__sub" data-edit-key={ot.lk}>{ot.lede}</p>
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
          {SLIDES.map((src, i) => (
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
        <p className="v8-eyebrow" data-edit-key="v8.hero.bodyEyebrow">{t.bodyEyebrow}</p>
        <p className="v8-lede" data-edit-key="v8.hero.bodyLede">{t.bodyLede}</p>
        <div className="v8-hero-cta">
          <button type="button" className="v8-tlink" onClick={openContact}>
            {t.whatsapp}
          </button>
        </div>
      </div>
    </section>
  )
}
