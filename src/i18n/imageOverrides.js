// 站内图片覆盖：把后台替换的图片 URL 应用到 DOM 中的 <img>。
// 覆盖项存储在 texts.json 中，key 形如 `img:<图片标识>`，值 { url }。
// 图片标识两种：
//   1) 逻辑 key —— 元素带 data-edit-img="v8.hero.slide1" 等声明
//   2) 原始 src 路径 —— 如 "/images/hero-cityscape.jpg"，未声明的图片按 src 匹配
// React 重渲染会把 src 重置回原值，所以用 MutationObserver 持续再应用。

// 从 i18n overrides 中提取图片覆盖映射：{ 图片标识: url }
export function collectImageOverrides(overrides) {
  const map = {}
  for (const [key, val] of Object.entries(overrides || {})) {
    if (!key.startsWith('img:')) continue
    if (val && typeof val === 'object' && typeof val.url === 'string' && val.url) {
      map[key.slice(4)] = val.url
    }
  }
  return map
}

function applyToElement(el, map) {
  if (!el || el.tagName !== 'IMG') return
  const tagged = el.getAttribute('data-edit-img')
  const src = el.getAttribute('src')
  let applied = el.getAttribute('data-applied-src')
  let original = el.getAttribute('data-original-src')
  if (!original) {
    // 首次见到该图：当前 src 即原始值
    if (!src) return
    original = src
    el.setAttribute('data-original-src', original)
  } else if (src && src !== original && src !== applied) {
    // 应用程序合法地更换了图片（如筛选/切房）：以新 src 作为新的原始值
    original = src
    el.setAttribute('data-original-src', original)
    el.removeAttribute('data-applied-src')
    applied = null
  }
  const target = (tagged && map[tagged]) || map[original]
  if (target) {
    if (src !== target) {
      el.setAttribute('src', target)
    }
    if (applied !== target) {
      el.setAttribute('data-applied-src', target)
    }
  } else if (applied) {
    // 覆盖项已被移除（恢复默认）：src 仍是我们设的覆盖值时才还原，
    // 避免误伤应用程序设置的其它 src
    if (src === applied) {
      el.setAttribute('src', original)
    }
    el.removeAttribute('data-applied-src')
  }
}

function applyAll(root, map) {
  root.querySelectorAll('img').forEach((el) => applyToElement(el, map))
}

// 启动持续应用：立即应用一次 + 监听后续 DOM 变化（React 重渲染、懒加载设置 src）
// 返回断开函数
export function startImageOverrides(getMap) {
  if (typeof document === 'undefined') return () => {}
  let timer = null
  const run = () => {
    if (timer) { clearTimeout(timer); timer = null }
    applyAll(document, getMap())
  }
  const schedule = () => {
    if (timer) return
    timer = setTimeout(run, 50)
  }
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes') {
        // src 被改成覆盖目标本身时不再触发，避免循环
        const el = m.target
        if (el.tagName === 'IMG') applyToElement(el, getMap())
      } else if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return
          if (n.tagName === 'IMG') applyToElement(n, getMap())
          else if (n.querySelectorAll) n.querySelectorAll('img').forEach((img) => applyToElement(img, getMap()))
        })
      }
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'data-edit-img']
  })
  run()
  return () => {
    if (timer) clearTimeout(timer)
    observer.disconnect()
  }
}
