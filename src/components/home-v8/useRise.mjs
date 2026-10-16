import { useEffect, useRef } from 'react'

// 进入视口时给元素加 .in（对应 home-v8.css 的 .v8-rise/.v8-rise.in 淡入上滑）。
// 每个元素可带 data-rise-delay（ms）设置错峰延迟。
//
// 实现要点：挂载时建立一次 IntersectionObserver，并用 MutationObserver 终身接管
// 后续新出现/被重建的 .v8-rise 元素。不能只按外部依赖扫描——典型事故：
// V8Process 步骤卡片以文案标题为 key，切换语言（或轮询内容替换数组）时 React
// 重建卡片 DOM，新节点不带 .in，而依赖项（remoteReady/房源数）未变，旧版不再
// 重新扫描，导致标题在、卡片永久 opacity:0。
export function useRise() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })

    const seen = new WeakSet()
    const observe = (el) => {
      if (!el || seen.has(el) || el.classList.contains('in')) return
      seen.add(el)
      io.observe(el)
    }
    const scan = (node) => {
      if (node.nodeType !== 1) return
      if (node.classList?.contains('v8-rise')) observe(node)
      node.querySelectorAll?.('.v8-rise:not(.in)').forEach(observe)
    }

    // 首扫：挂载时已存在的元素
    root.querySelectorAll('.v8-rise:not(.in)').forEach(observe)

    // 后挂载/重建（语言切换、内容轮询、条件渲染首次出现）立即纳入观察
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach(scan)
      }
    })
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return rootRef
}
