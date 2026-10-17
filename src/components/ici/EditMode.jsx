import { useEffect, useMemo } from 'react'
import { iciContent } from '../../i18n/iciContent.js'
import { flattenTexts } from '../../i18n/flatten.js'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

/**
 * 可视化编辑模式：当 URL 包含 ?edit=1 时激活。
 * - 鼠标悬停文本时高亮
 * - 点击文本时，通过 postMessage 将匹配到的 i18n key 发送给父窗口（后台）
 * - 监听父窗口的更新消息，实时修改 DOM 文本
 */
export default function EditMode() {
  const { lang, c } = useIciI18n()

  // 扁平化文案：key -> { zh, en }
  const flat = useMemo(() => flattenTexts(iciContent.zh, iciContent.en), [])

  // 反向映射：文本值 -> [keys]（当前语言的值）
  const reverseMap = useMemo(() => {
    const map = new Map()
    for (const [key, val] of Object.entries(flat)) {
      const text = (val[lang] || '').trim()
      if (!text) continue
      if (!map.has(text)) map.set(text, [])
      map.get(text).push(key)
    }
    return map
  }, [flat, lang])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') !== '1') return

    let highlighted = null
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
      }
    `
    document.head.appendChild(highlightStyle)

    function getTextOfElement(el) {
      // 获取元素的直接文本内容（不包含子元素文本）
      let text = ''
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) text += node.textContent
      }
      return text.trim()
    }

    function findEditableAncestor(target) {
      let el = target
      while (el && el !== document.body) {
        const text = getTextOfElement(el)
        if (text && reverseMap.has(text)) return { el, text }
        el = el.parentElement
      }
      // 兜底：用元素的全部文本
      el = target
      while (el && el !== document.body) {
        const text = (el.textContent || '').trim()
        if (text && reverseMap.has(text)) return { el, text }
        el = el.parentElement
      }
      return null
    }

    function onMouseMove(e) {
      const found = findEditableAncestor(e.target)
      if (highlighted && (!found || found.el !== highlighted)) {
        highlighted.removeAttribute('data-edit-highlight')
        highlighted.removeAttribute('data-edit-key')
        highlighted = null
      }
      if (found && found.el !== highlighted) {
        highlighted = found.el
        const keys = reverseMap.get(found.text)
        highlighted.setAttribute('data-edit-highlight', '1')
        highlighted.setAttribute('data-edit-key', keys[0])
      }
    }

    function onClick(e) {
      const found = findEditableAncestor(e.target)
      if (!found) return
      e.preventDefault()
      e.stopPropagation()
      const keys = reverseMap.get(found.text)
      // 发送给父窗口
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
      if (e.data?.type !== 'TEXT_UPDATED') return
      const { key, zh, en } = e.data
      const newVal = lang === 'zh' ? zh : en
      if (newVal === undefined) return
      // 在 flat 中找旧值
      const oldVal = (flat[key]?.[lang] || '').trim()
      if (!oldVal) return
      // 替换页面中所有匹配旧值的文本节点
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
      let node
      while ((node = walker.nextNode())) {
        if (node.textContent.trim() === oldVal) {
          node.textContent = newVal
        }
      }
    }
    window.addEventListener('message', onMessage)

    return () => {
      document.removeEventListener('mousemove', onMouseMove, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('message', onMessage)
      highlightStyle.remove()
      if (highlighted) {
        highlighted.removeAttribute('data-edit-highlight')
        highlighted.removeAttribute('data-edit-key')
      }
    }
  }, [reverseMap, flat, lang])

  return null
}
