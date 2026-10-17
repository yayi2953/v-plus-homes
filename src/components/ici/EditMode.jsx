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
  const { lang, c } = useIciI18n()

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
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `
    document.head.appendChild(highlightStyle)

    // 获取元素的可见文本（规范化空白）
    function getElText(el) {
      return norm(el.textContent || '')
    }

    function findEditableAncestor(target) {
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
      if (newVal === undefined || newVal === null) return
      // 用当前显示值（来自 c，含覆盖项）作为旧值来匹配 DOM
      const oldVal = norm(getByPath(c, key))
      if (!oldVal) return
      // 替换页面中所有匹配旧值的文本节点（按规范化后的值比较）
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
      let node
      while ((node = walker.nextNode())) {
        if (norm(node.textContent) === oldVal) {
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
  }, [reverseMap, c, lang])

  return null
}
