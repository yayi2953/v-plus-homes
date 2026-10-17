import { useState, useEffect, useMemo } from 'react'
import { iciContent } from '../../i18n/iciContent.js'
import { flattenTexts } from '../../i18n/flatten.js'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

/**
 * 文案管理：展示所有可编辑文案（中英双语），支持搜索、编辑、保存。
 * 数据源：默认文案来自 iciContent，覆盖项来自 /api/admin/texts。
 */
export default function TextEditor({ authFetch }) {
  const { lang, reloadTexts } = useIciI18n()
  const zh = lang === 'zh'
  const t = (z, e) => (zh ? z : e)

  // 默认文案（从 iciContent 扁平化）
  const defaults = useMemo(() => flattenTexts(iciContent.zh, iciContent.en), [])

  const [overrides, setOverrides] = useState({})
  const [search, setSearch] = useState('')
  const [editingKey, setEditingKey] = useState(null)
  const [editZh, setEditZh] = useState('')
  const [editEn, setEditEn] = useState('')
  const [saving, setSaving] = useState(false)
  const [onlyOverridden, setOnlyOverridden] = useState(false)

  useEffect(() => { loadOverrides() }, [])

  async function loadOverrides() {
    const res = await authFetch('/api/admin/texts')
    if (res.ok) {
      const d = await res.json()
      setOverrides(d.texts || {})
    }
  }

  // 合并默认文案 + 覆盖项
  const allTexts = useMemo(() => {
    const merged = {}
    for (const [key, val] of Object.entries(defaults)) {
      merged[key] = { ...val }
    }
    for (const [key, val] of Object.entries(overrides)) {
      if (merged[key]) {
        merged[key] = { ...merged[key], ...val }
      } else {
        merged[key] = { zh: val.zh || '', en: val.en || '' }
      }
    }
    return merged
  }, [defaults, overrides])

  // 过滤：搜索 + 只看已覆盖
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return Object.entries(allTexts).filter(([key, val]) => {
      if (onlyOverridden && !overrides[key]) return false
      if (!q) return true
      return key.toLowerCase().includes(q)
        || (val.zh || '').toLowerCase().includes(q)
        || (val.en || '').toLowerCase().includes(q)
    })
  }, [allTexts, search, overrides, onlyOverridden])

  function startEdit(key) {
    const val = allTexts[key]
    setEditingKey(key)
    setEditZh(val.zh || '')
    setEditEn(val.en || '')
  }

  async function saveEdit() {
    if (!editingKey) return
    setSaving(true)
    const res = await authFetch('/api/admin/texts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: editingKey, zh: editZh, en: editEn })
    })
    if (res.ok) {
      setOverrides((prev) => ({ ...prev, [editingKey]: { zh: editZh, en: editEn } }))
      setEditingKey(null)
      // 通知前端刷新文案
      reloadTexts()
    }
    setSaving(false)
  }

  async function resetKey(key) {
    if (!confirm(t('恢复该文案为默认值？', 'Reset this text to default?'))) return
    const res = await authFetch('/api/admin/texts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    })
    if (res.ok) {
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      reloadTexts()
    }
  }

  return (
    <div className="v8-admin__panel">
      <div className="v8-admin__texts-head">
        <h2>{t('文案管理', 'Content Management')} ({filtered.length})</h2>
        <div className="v8-admin__texts-tools">
          <input
            className="v8-admin__search"
            placeholder={t('搜索文案...', 'Search texts...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="v8-admin__check">
            <input type="checkbox" checked={onlyOverridden} onChange={(e) => setOnlyOverridden(e.target.checked)} />
            {t('仅显示已修改', 'Only modified')}
          </label>
        </div>
      </div>

      <div className="v8-admin__texts-table">
        <table className="v8-admin__table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>{t('键名', 'Key')}</th>
              <th style={{ width: '32%' }}>{t('中文', 'Chinese')}</th>
              <th style={{ width: '32%' }}>{t('英文', 'English')}</th>
              <th style={{ width: '6%' }}>{t('操作', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(([key, val]) => {
              const isOverridden = !!overrides[key]
              return (
                <tr key={key} className={isOverridden ? 'is-modified' : ''}>
                  <td className="v8-admin__text-key" title={key}>{key}</td>
                  <td>{val.zh || '-'}</td>
                  <td>{val.en || '-'}</td>
                  <td>
                    <button className="v8-admin__link" onClick={() => startEdit(key)}>{t('编辑', 'Edit')}</button>
                    {isOverridden && (
                      <button className="v8-admin__link v8-admin__link--danger" onClick={() => resetKey(key)}>{t('重置', 'Reset')}</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editingKey && (
        <div className="v8-admin__modal" onClick={() => setEditingKey(null)}>
          <div className="v8-admin__modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t('编辑文案', 'Edit Text')}</h3>
            <p className="v8-admin__text-key-full">{editingKey}</p>
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
              <button className="v8-admin__btn v8-admin__btn--ghost" onClick={() => setEditingKey(null)}>
                {t('取消', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
