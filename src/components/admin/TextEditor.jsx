import { useState, useEffect, useMemo, useRef } from 'react'
import { iciContent } from '../../i18n/iciContent.js'
import { flattenTexts } from '../../i18n/flatten.js'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

/**
 * 可视化文案编辑器：
 * - iframe 嵌入首页（?edit=1）
 * - 点击页面中的文字 → 弹出编辑框
 * - 保存后实时同步到 iframe
 */
export default function TextEditor({ authFetch }) {
  const { lang, reloadTexts } = useIciI18n()
  const zh = lang === 'zh'
  const t = (z, e) => (zh ? z : e)

  const defaults = useMemo(() => flattenTexts(iciContent.zh, iciContent.en), [])
  const [overrides, setOverrides] = useState({})
  const [clickInfo, setClickInfo] = useState(null) // { text, keys }
  const [selectedKey, setSelectedKey] = useState('')
  const [editZh, setEditZh] = useState('')
  const [editEn, setEditEn] = useState('')
  const [saving, setSaving] = useState(false)
  const iframeRef = useRef(null)

  // 合并默认 + 覆盖
  const allTexts = useMemo(() => {
    const merged = { ...defaults }
    for (const [key, val] of Object.entries(overrides)) {
      merged[key] = { ...(merged[key] || {}), ...val }
    }
    return merged
  }, [defaults, overrides])

  useEffect(() => { loadOverrides() }, [])

  async function loadOverrides() {
    const res = await authFetch('/api/admin/texts')
    if (res.ok) {
      const d = await res.json()
      setOverrides(d.texts || {})
    }
  }

  // 监听 iframe 的 postMessage
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type !== 'EDIT_TEXT') return
      const { text, keys } = e.data
      if (!keys || keys.length === 0) return
      setClickInfo({ text, keys })
      // 默认选第一个 key
      const key = keys[0]
      setSelectedKey(key)
      const val = allTexts[key] || {}
      setEditZh(val.zh || '')
      setEditEn(val.en || '')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [allTexts])

  function switchKey(key) {
    setSelectedKey(key)
    const val = allTexts[key] || {}
    setEditZh(val.zh || '')
    setEditEn(val.en || '')
  }

  async function saveEdit() {
    if (!selectedKey) return
    setSaving(true)
    const res = await authFetch('/api/admin/texts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: selectedKey, zh: editZh, en: editEn })
    })
    if (res.ok) {
      setOverrides((prev) => ({ ...prev, [selectedKey]: { zh: editZh, en: editEn } }))
      // 通知 iframe 更新 DOM
      iframeRef.current?.contentWindow?.postMessage({
        type: 'TEXT_UPDATED',
        key: selectedKey,
        zh: editZh,
        en: editEn
      }, '*')
      setClickInfo(null)
      reloadTexts()
    }
    setSaving(false)
  }

  async function resetKey() {
    if (!selectedKey) return
    if (!confirm(t('恢复该文案为默认值？', 'Reset this text to default?'))) return
    const res = await authFetch('/api/admin/texts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: selectedKey })
    })
    if (res.ok) {
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[selectedKey]
        return next
      })
      // 恢复默认值到 iframe
      const val = defaults[selectedKey] || {}
      iframeRef.current?.contentWindow?.postMessage({
        type: 'TEXT_UPDATED',
        key: selectedKey,
        zh: val.zh || '',
        en: val.en || ''
      }, '*')
      setClickInfo(null)
      reloadTexts()
    }
  }

  return (
    <div className="v8-admin__panel v8-admin__visual">
      <div className="v8-admin__texts-head">
        <h2>{t('可视化编辑', 'Visual Editor')}</h2>
        <div className="v8-admin__texts-tools">
          <span className="v8-admin__hint">{t('点击页面中的文字即可编辑', 'Click any text on the page to edit')}</span>
        </div>
      </div>

      <div className="v8-admin__iframe-wrap">
        <iframe
          ref={iframeRef}
          src="/?edit=1"
          className="v8-admin__iframe"
          title="preview"
        />
      </div>

      {clickInfo && (
        <div className="v8-admin__modal" onClick={() => setClickInfo(null)}>
          <div className="v8-admin__modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t('编辑文案', 'Edit Text')}</h3>
            <p className="v8-admin__text-clicked">
              {t('选中文字：', 'Selected: ')}<strong>{clickInfo.text}</strong>
            </p>

            {clickInfo.keys.length > 1 && (
              <label>
                {t('该文字出现在多个位置，请选择要编辑的项：', 'This text appears in multiple places, select which to edit:')}
                <select value={selectedKey} onChange={(e) => switchKey(e.target.value)}>
                  {clickInfo.keys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </label>
            )}

            <p className="v8-admin__text-key-full">{selectedKey}</p>

            <label>
              {t('中文', 'Chinese')}
              <textarea value={editZh} onChange={(e) => setEditZh(e.target.value)} rows={3} />
            </label>
            <label>
              {t('英文', 'English')}
              <textarea value={editEn} onChange={(e) => setEditEn(e.target.value)} rows={3} />
            </label>
            <div className="v8-admin__modal-actions">
              <button className="v8-admin__btn" onClick={saveEdit} disabled={saving}>
                {saving ? t('保存中...', 'Saving...') : t('保存', 'Save')}
              </button>
              {overrides[selectedKey] && (
                <button className="v8-admin__btn v8-admin__btn--ghost" onClick={resetKey}>
                  {t('恢复默认', 'Reset')}
                </button>
              )}
              <button className="v8-admin__btn v8-admin__btn--ghost" onClick={() => setClickInfo(null)}>
                {t('取消', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
