import { useEffect, useRef } from 'react'
import './SmartImage.css'

/* 全站统一图片：
   1) 距视口上下各 300px 才开始加载（IntersectionObserver；老内核无 IO 立即加载）
   2) 原图加载完成后 blur(20px)→清晰 + 1.04→1 轻轻缩回，500ms（WAAPI，
      避免与各场景既有的 hover 缩放/轮播显隐 CSS transition 冲突）
   3) 外层容器已固定尺寸（固定比例），加载前后不产生布局跳动
   占位：容器自身的主色底；未批准前不设置 src、不发起请求。
   注意：src 必须在命令式流程中「先挂原生 load 监听再赋值」，并在赋值后立即
   补检 complete——强缓存命中时 load 事件可能在一帧内派发，React 合成 onLoad
   与普通 useEffect 补检都存在竞争窗口，会导致图片已 complete 却永不渐显。 */

const ROOT_MARGIN = '300px 0px 300px 0px'
const DUR = 500

function prefersReduced() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function SmartImage({
  src,
  alt = '',
  className = '',
  style,
  draggable,
  ariaHidden
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !src) return undefined

    let done = false
    let io
    let finishTimer
    el.classList.remove('is-loaded', 'is-loading')
    el.removeAttribute('src') // src 切换（筛选/切房）后、重新批准前先回主色底，不残留旧图

    const commit = (anim) => {
      el.classList.add('is-loaded')
      if (finishTimer) { clearTimeout(finishTimer); finishTimer = null }
      if (anim) anim.cancel() // 释放动画栈：终态由类承接，既有 hover/轮播 CSS 重新接管
    }
    const markLoaded = () => {
      if (done) return
      done = true
      if (prefersReduced() || typeof el.animate !== 'function') {
        el.classList.add('is-loaded')
        return
      }
      // 立即渐显（opacity 过渡），与 blur/scale 动画并行
      el.classList.add('is-loading')
      const anim = el.animate(
        [
          { filter: 'blur(20px)', transform: 'scale(1.04)' },
          { filter: 'blur(0px)', transform: 'scale(1)' }
        ],
        { duration: DUR, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
      )
      // 不动画 opacity：轮播非活动 slide 有自己的 opacity:0（特异性更高），
      // 显隐由 .is-active 的 0.6s 淡入接管；普通图由 .is-loaded 渐显。
      // 双保险：onfinish 与定时器任一到达即提交（动画可能因祖先 display:none 被暂停，
      // 此时 finish 事件不来；定时器保证 500ms 后终态类一定加上）
      anim.onfinish = () => commit(anim)
      finishTimer = setTimeout(() => commit(anim), DUR + 60)
    }
    const markError = () => {
      if (done) return
      done = true
      // 加载失败也解除隐藏（交给浏览器默认破图态），避免永久空白占位
      el.classList.add('is-loaded')
    }
    const start = () => {
      // 顺序关键：监听先于 src，src 之后立即补检（强缓存一帧完成也不漏）
      el.addEventListener('load', markLoaded)
      el.addEventListener('error', markError)
      el.src = src
      if (el.complete && el.naturalWidth > 0) markLoaded()
    }
    const approve = () => {
      if (io) io.disconnect()
      start()
    }

    if (typeof IntersectionObserver === 'undefined') {
      start()
    } else {
      io = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) approve() },
        { rootMargin: ROOT_MARGIN }
      )
      io.observe(el)
    }

    return () => {
      if (io) io.disconnect()
      if (finishTimer) clearTimeout(finishTimer)
      el.removeEventListener('load', markLoaded)
      el.removeEventListener('error', markError)
    }
  }, [src])

  return (
    <img
      ref={ref}
      className={`smart-img${className ? ` ${className}` : ''}`}
      style={style}
      alt={alt}
      aria-hidden={ariaHidden}
      draggable={draggable}
    />
  )
}
