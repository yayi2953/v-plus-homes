import { useEffect, useMemo } from 'react'
import { iciContent } from '../../i18n/iciContent.js'
import { flattenTexts, setByPath, getByPath } from '../../i18n/flatten.js'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

// 规范化空白：合并连续空白为单个空格，去除首尾
function norm(s) {
  return (s || '').replace(/\s+/g, ' ').trim()
}

// 遍历对象，收集所有字符串值的路径（用于从 c 构建反向映射）
function walk(obj, prefix, out) {
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => walk(item, `${prefix}.${i}`, out))
  } else if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      walk(obj[k], prefix ? `${prefix}.${k}` : k, out)
    }
  } else if (typeof obj === 'string' && obj.trim()) {
    out.push([prefix, obj])
  }
}

/**
 * 可视化编辑模式：当 URL 包含 ?edit=1 时激活。
 */
export default function EditMode() {
  const { lang, c, reloadTexts } = useIciI18n()

  // 默认文案（用于 key → {zh, en} 的完整映射）
  const flat = useMemo(() => flattenTexts(iciContent.zh, iciContent.en), [])

  // 反向映射：显示文本 → [keys]（基于实际显示的 c，包含覆盖项）
  const reverseMap = useMemo(() => {
    const entries = []
    walk(c, '', entries)
    const map = new Map()
    for (const [key, val] of entries) {
      const text = norm(val)
      if (!text) continue
      if (!map.has(text)) map.set(text, [])
      map.get(text).push(key)
    }
    return map
  }, [c])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') !== '1' && !window.__EDIT_MODE__) return

    // 设置全局标记，让 router 跳转时保留编辑模式
    window.__EDIT_MODE__ = true

    let highlighted = null
    let highlightedImg = null
    const highlightStyle = document.createElement('style')
    highlightStyle.textContent = `
      [data-edit-highlight="1"] {
        outline: 2px solid #3e6ae1 !important;
        outline-offset: 2px !important;
        background: rgba(62, 106, 225, 0.08) !important;
        cursor: pointer !important;
        position: relative !important;
      }
      [data-edit-highlight="1"]::after {
        content: attr(data-edit-key);
        position: absolute;
        top: -18px;
        left: 0;
        background: #3e6ae1;
        color: #fff;
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 3px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 99999;
        font-family: monospace;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      /* 图片可替换：hover 高亮 + 放开被 pointer-events:none 容器挡住的图 */
      img[data-edit-highlight-img="1"] {
        outline: 2px solid #1a73e8 !important;
        outline-offset: -2px !important;
        cursor: pointer !important;
      }
      .v8-hero-videobg img, .v8-hero-videobg {
        pointer-events: auto !important;
      }
      /* 轮播堆叠：只允许当前激活的图接收点击，避免点到隐藏层 */
      .v8-hero-videobg img:not(.is-active) {
        pointer-events: none !important;
      }
      .v8-hero-dots, .v8-hero-arrow {
        pointer-events: auto !important;
      }
      .v8-hero-videobg img[data-edit-highlight-img="1"] {
        outline: 2px dashed #1a73e8 !important;
      }
    `
    document.head.appendChild(highlightStyle)

    // 获取元素的可见文本（规范化空白）
    function getElText(el) {
      return norm(el.textContent || '')
    }

    function findEditableAncestor(target) {
      // 优先使用元素上声明的 data-edit-key（同文案多处出现时可精确区分）
      const tagged = target.closest?.('[data-edit-key]')
      if (tagged) {
        const text = getElText(tagged)
        if (text) return { el: tagged, text, key: tagged.getAttribute('data-edit-key') }
      }
      let el = target
      while (el && el !== document.body && el !== document.documentElement) {
        const text = getElText(el)
        if (text && reverseMap.has(text)) {
          return { el, text }
        }
        el = el.parentElement
      }
      return null
    }

    // 目标是否为可替换图片：img 元素或带 data-edit-img 声明的元素
    function findEditableImg(target) {
      const img = target.closest?.('img, [data-edit-img]')
      if (!img) return null
      const el = img.tagName === 'IMG' ? img : img.querySelector('img')
      if (!el) return null
      const key = img.getAttribute('data-edit-img')
        || el.getAttribute('data-original-src')
        || el.getAttribute('src')
        || ''
      // 无 key 或内联 base64 图不作为可替换目标
      if (!key || key.startsWith('data:')) return null
      return { el, key }
    }

    function clearImgHighlight() {
      if (highlightedImg) {
        highlightedImg.removeAttribute('data-edit-highlight-img')
        highlightedImg = null
      }
    }

    function onMouseMove(e) {
      // 图片优先：命中图片时不高亮文字
      const img = findEditableImg(e.target)
      clearImgHighlight()
      if (img) {
        highlightedImg = img.el
        img.el.setAttribute('data-edit-highlight-img', '1')
        return
      }
      const found = findEditableAncestor(e.target)
      if (highlighted && (!found || found.el !== highlighted)) {
        highlighted.removeAttribute('data-edit-highlight')
        highlighted.removeAttribute('data-edit-key')
        highlighted = null
      }
      if (found && found.el !== highlighted) {
        highlighted = found.el
        const keys = found.key ? [found.key] : reverseMap.get(found.text)
        highlighted.setAttribute('data-edit-highlight', '1')
        highlighted.setAttribute('data-edit-key', keys[0])
      }
    }

    function isInteractive(el) {
      // 检查元素是否是链接、按钮或表单元素（这些应该允许正常交互）
      let node = el
      while (node && node !== document.body) {
        const tag = node.tagName
        if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
          return true
        }
        node = node.parentElement
      }
      return false
    }

    function onClick(e) {
      // 图片优先：点击图片（即使包在链接里）进入图片替换，编辑优先于跳转
      const img = findEditableImg(e.target)
      if (img && img.key) {
        e.preventDefault()
        e.stopPropagation()
        window.parent.postMessage({
          type: 'IMG_EDIT',
          imgKey: img.key,
          src: img.el.getAttribute('data-original-src') || img.el.getAttribute('src') || '',
          lang
        }, '*')
        return
      }
      // 如果点击的是链接/按钮/表单元素，允许正常跳转，不拦截
      if (isInteractive(e.target)) return

      const found = findEditableAncestor(e.target)
      if (!found) return
      e.preventDefault()
      e.stopPropagation()
      const keys = found.key ? [found.key] : reverseMap.get(found.text)
      window.parent.postMessage({
        type: 'EDIT_TEXT',
        text: found.text,
        keys,
        lang
      }, '*')
    }

    document.addEventListener('mousemove', onMouseMove, true)
    document.addEventListener('click', onClick, true)

    // 监听父窗口的更新消息，实时修改 DOM
    function onMessage(e) {
      // 图片替换完成：覆盖项由 imageOverrides 的 MutationObserver 自动应用
      if (e.data?.type === 'IMG_UPDATED') {
        reloadTexts()
        return
      }
      if (e.data?.type !== 'TEXT_UPDATED') return
      const { key, zh, en } = e.data
      const newVal = lang === 'zh' ? zh : en
      if (newVal === undefined || newVal === null) return
      const oldVal = norm(getByPath(c, key))
      // 只更新声明了该 key 的元素（同文案多处出现时避免联动）。
      // 未标记的元素不做全局文本替换：reloadTexts() 会触发 React 重渲染，
      // 每个位置只按自己的 key 更新，天然隔离同名文案。
      const tagged = key ? document.querySelectorAll(`[data-edit-key="${key}"]`) : []
      tagged.forEach((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
        const nodes = []
        let n
        while ((n = walker.nextNode())) nodes.push(n)
        nodes.forEach((node) => {
          if (!oldVal || norm(node.textContent) === oldVal || !node.textContent.trim()) {
            node.textContent = newVal
          }
        })
      })
      // 刷新 i18n 上下文，让 reverseMap 包含新值，这样修改后的文案可再次编辑
      reloadTexts()
    }
    window.addEventListener('message', onMessage)

    return () => {
      document.removeEventListener('mousemove', onMouseMove, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('message', onMessage)
      highlightStyle.remove()
      clearImgHighlight()
      if (highlighted) {
        highlighted.removeAttribute('data-edit-highlight')
        highlighted.removeAttribute('data-edit-key')
      }
    }
  }, [reverseMap, c, lang, reloadTexts])

  return null
}
