import { useEffect, useRef } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useContact } from '../ici/contactContext.jsx'

// 首屏氛围背景视频（静音自动循环，仅作找房条的柔和背景）
const BG_VIDEO_SRC = '/videos/hero-intro.mp4'
// 视频未自动播放时的兜底海报图（避免黑底）
const BG_VIDEO_POSTER = '/images/dream-slide-pool.jpg'

export default function V8Hero() {
  const { c } = useIciI18n()
  const { openContact } = useContact()
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return undefined

    // 关键：muted 必须设为属性，部分微信内核只认 attribute 不认 property
    v.muted = true
    v.setAttribute('muted', '')
    // 微信 X5 / iOS WKWebView 内联播放三件套
    v.setAttribute('webkit-playsinline', 'true')
    v.setAttribute('playsinline', 'true')
    v.setAttribute('x5-playsinline', 'true')
    v.setAttribute('x5-video-player-type', 'h5')
    v.setAttribute('x5-video-player-fullscreen', 'false')
    v.setAttribute('preload', 'auto')

    let gestureBound = false
    const tryPlay = () => {
      if (v.paused === false) return
      v.load()
      const p = v.play()
      if (p && typeof p.then === 'function') {
        p.catch(() => {
          if (gestureBound) return
          gestureBound = true
          // 首次触摸/滚动/页面可见时再唤起
          const wake = () => {
            v.play().catch(() => {})
            document.removeEventListener('touchstart', wake)
            window.removeEventListener('scroll', wake)
            document.removeEventListener('visibilitychange', wake)
          }
          document.addEventListener('touchstart', wake, { passive: true })
          window.addEventListener('scroll', wake, { passive: true })
          document.addEventListener('visibilitychange', wake)
        })
      }
    }

    // 视频可播放时尝试播放
    v.addEventListener('canplay', tryPlay, { once: false })
    tryPlay()

    // 微信 JSBridge 就绪后，用 invoke 主动唤起（部分微信版本需要通过
    // getNetworkType 等调用触发内核播放许可）
    const onBridgeReady = () => {
      if (typeof window.WeixinJSBridge !== 'undefined' && typeof window.WeixinJSBridge.invoke === 'function') {
        try {
          window.WeixinJSBridge.invoke('getNetworkType', {}, () => {
            v.play().catch(() => {})
          })
        } catch {
          v.play().catch(() => {})
        }
      } else {
        v.play().catch(() => {})
      }
    }
    if (typeof window.WeixinJSBridge !== 'undefined') {
      onBridgeReady()
    } else {
      document.addEventListener('WeixinJSBridgeReady', onBridgeReady, { once: true })
    }

    return () => {
      v.removeEventListener('canplay', tryPlay)
      document.removeEventListener('WeixinJSBridgeReady', onBridgeReady)
    }
  }, [])

  const t = c.v8?.hero || {}

  return (
    <section className="v8-hero" id="top">
      <div className="v8-hero-canvas">
        {/* 氛围背景：自动播放视频 + 灰色毛玻璃 + 四周白色渐变羽化揉进页面背景 */}
        <div className="v8-hero-videobg" aria-hidden="true">
          <video
            ref={videoRef}
            src={BG_VIDEO_SRC}
            poster={BG_VIDEO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>
      </div>
      <div className="v8-hero-body">
        <p className="v8-eyebrow">{t.eyebrow}</p>
        <p className="v8-lede">{t.lede}</p>
        <div className="v8-hero-cta">
          {/* 主 CTA「帮我找房」已在找房条内，这里只保留咨询次入口，避免同屏重复意图 */}
          <button type="button" className="v8-tlink" onClick={openContact}>
            {t.whatsapp}
          </button>
        </div>
      </div>
    </section>
  )
}
