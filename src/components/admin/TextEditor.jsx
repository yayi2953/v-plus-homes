import { useState, useEffect, useMemo, useRef } from 'react'
import { iciContent } from '../../i18n/iciContent.js'
import { flattenTexts } from '../../i18n/flatten.js'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

/**
 * 可视化文案编辑器：
 * - iframe 嵌入首页（?edit=1）
 * - 点击页面中的文字 → 弹出编辑框
 * - 点击页面中的图片 → 弹出替换框（URL 或上传文件）
 * - 保存后实时同步到 iframe
 */

// 图片压缩：超过 900KB 的图缩到 maxDim 内并转 JPEG 逐级降质，确保 GitHub Contents API 可提交
async function prepareImageFile(file) {
  const readBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  if (file.size <= 900 * 1024) {
    return { dataBase64: await readBase64(file), name: file.name }
  }
  const bitmap = await createImageBitmap(file)
  const qualities = [0.85, 0.72, 0.6, 0.45]
  for (const q of qualities) {
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', q))
    if (blob.size <= 900 * 1024) {
      const base = file.name.replace(/\.[^.]+$/, '')
      return { dataBase64: await readBase64(blob), name: `${base}.jpg` }
    }
  }
  throw new Error('图片压缩后仍过大，请换一张较小的图片')
}

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
  const [errorMsg, setErrorMsg] = useState('')
  const [imgInfo, setImgInfo] = useState(null) // { imgKey, src }
  const [imgUrl, setImgUrl] = useState('')
  const [imgSaving, setImgSaving] = useState(false)
  const [imgErrorMsg, setImgErrorMsg] = useState('')
  // 图片定位：在预览框内拖动选择展示区域（object-position 百分比）
  // 桌面端与手机端分别设定；手机端未单独设定时沿用桌面端位置
  const [imgDevice, setImgDevice] = useState('desktop') // 'desktop' | 'mobile'
  const [imgPosD, setImgPosD] = useState({ x: 50, y: 50 })
  const [imgPosM, setImgPosM] = useState({ x: 50, y: 50 })
  const [imgFrame, setImgFrame] = useState({ w: 16, h: 9 }) // 桌面显示框宽高比
  const [fileObjUrl, setFileObjUrl] = useState('')
  const [imgDragging, setImgDragging] = useState(false)
  const dragRef = useRef(null)
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
      if (e.data?.type === 'IMG_EDIT') {
        const { imgKey, src, originalSrc, w, h } = e.data
        if (!imgKey) return
        setClickInfo(null)
        // src 为当前实际显示的图（已替换时即上传图），预览以此为准
        setImgInfo({ imgKey, src: src || originalSrc || '', originalSrc: originalSrc || '' })
        setImgUrl('')
        setImgErrorMsg('')
        // 初始定位沿用已保存的覆盖位置，否则居中；手机端未单独保存时沿用桌面端
        const saved = overrides[`img:${imgKey}`] || {}
        const dx = Number.isFinite(Number(saved.posX)) ? Number(saved.posX) : 50
        const dy = Number.isFinite(Number(saved.posY)) ? Number(saved.posY) : 50
        setImgPosD({ x: dx, y: dy })
        setImgPosM({
          x: Number.isFinite(Number(saved.posXm)) ? Number(saved.posXm) : dx,
          y: Number.isFinite(Number(saved.posYm)) ? Number(saved.posYm) : dy
        })
        setImgDevice('desktop')
        setFileObjUrl('')
        setImgFrame(w > 0 && h > 0 ? { w, h } : { w: 16, h: 9 })
        return
      }
      if (e.data?.type !== 'EDIT_TEXT') return
      setImgInfo(null)
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
      setErrorMsg('')
      reloadTexts()
    } else {
      try {
        const d = await res.json()
        setErrorMsg(d.error || '保存失败')
      } catch {
        setErrorMsg('保存失败（HTTP ' + res.status + '）')
      }
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

  const imgOverrideKey = imgInfo ? `img:${imgInfo.imgKey}` : ''
  const imgHasOverride = !!(imgOverrideKey && overrides[imgOverrideKey]?.url)
  // 预览源：优先本选择的文件，其次填写的 URL，最后当前图
  const imgPreviewSrc = fileObjUrl || imgUrl.trim() || imgInfo?.src || ''

  // 预览框拖动：移动图片选择展示区域（按当前设备 Tab 分别记录）
  const imgPos = imgDevice === 'mobile' ? imgPosM : imgPosD
  const setImgPos = imgDevice === 'mobile' ? setImgPosM : setImgPosD
  // 手机端预览用竖屏比例（真实手机展示框因屏幕而异，4:5 为通用近似）
  const frame = imgDevice === 'mobile' ? { w: 4, h: 5 } : imgFrame

  function onFramePointerDown(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: imgPos.x, origY: imgPos.y, rect }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setImgDragging(true)
  }
  function onFramePointerMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    setImgPos({
      x: Math.min(100, Math.max(0, d.origX - (dx * 100) / d.rect.width)),
      y: Math.min(100, Math.max(0, d.origY - (dy * 100) / d.rect.height))
    })
  }
  function onFramePointerUp() {
    dragRef.current = null
    setImgDragging(false)
  }

  function onFilePicked(e) {
    const f = e.target.files?.[0]
    if (fileObjUrl) URL.revokeObjectURL(fileObjUrl)
    setFileObjUrl(f ? URL.createObjectURL(f) : '')
  }

  function closeImgDialog() {
    if (fileObjUrl) URL.revokeObjectURL(fileObjUrl)
    setFileObjUrl('')
    setImgInfo(null)
  }

  // 保存图片替换：优先本地上传的文件，否则用填写的 URL
  async function saveImage() {
    if (!imgInfo) return
    setImgSaving(true)
    setImgErrorMsg('')
    try {
      let url = imgUrl.trim()
      const fileInput = document.getElementById('v8-img-file-input')
      const file = fileInput?.files?.[0]
      if (file) {
        const { dataBase64, name } = await prepareImageFile(file)
        const upRes = await authFetch('/api/admin/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, dataBase64 })
        })
        if (!upRes.ok) {
          let msg = `上传失败（HTTP ${upRes.status}）`
          try { msg = (await upRes.json()).error || msg } catch { /* ignore */ }
          throw new Error(msg)
        }
        const up = await upRes.json()
        // 使用服务端返回的 raw 直链；旧版仅返回 path 时拼接 raw 域名兜底
        url = up.url || (up.path.startsWith('http')
          ? up.path
          : `https://raw.githubusercontent.com/yayi2953/v-plus-homes/main/${up.path}`)
      }
      if (!url) {
        // 未选文件也未填 URL：仅调整位置时沿用当前已保存的图
        const prev = overrides[`img:${imgInfo.imgKey}`]
        if (prev?.url) url = prev.url
      }
      if (!url) throw new Error(t('请选择图片文件或填写图片 URL', 'Choose a file or enter an image URL'))

      const res = await authFetch('/api/admin/texts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `img:${imgInfo.imgKey}`, url,
          posX: imgPosD.x, posY: imgPosD.y,
          posXm: imgPosM.x, posYm: imgPosM.y
        })
      })
      if (!res.ok) {
        let msg = `保存失败（HTTP ${res.status}）`
        try { msg = (await res.json()).error || msg } catch { /* ignore */ }
        throw new Error(msg)
      }
      setOverrides((prev) => ({
        ...prev,
        [`img:${imgInfo.imgKey}`]: { url, posX: imgPosD.x, posY: imgPosD.y, posXm: imgPosM.x, posYm: imgPosM.y }
      }))
      if (fileInput) fileInput.value = ''
      iframeRef.current?.contentWindow?.postMessage({ type: 'IMG_UPDATED' }, '*')
      closeImgDialog()
      reloadTexts()
    } catch (err) {
      setImgErrorMsg(err.message || '保存失败')
    }
    setImgSaving(false)
  }

  // 恢复默认图片
  async function resetImage() {
    if (!imgInfo) return
    if (!confirm(t('恢复该图片为默认值？', 'Reset this image to default?'))) return
    const res = await authFetch('/api/admin/texts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: `img:${imgInfo.imgKey}` })
    })
    if (res.ok) {
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[`img:${imgInfo.imgKey}`]
        return next
      })
      iframeRef.current?.contentWindow?.postMessage({ type: 'IMG_UPDATED' }, '*')
      setImgInfo(null)
      reloadTexts()
    }
  }

  return (
    <div className="v8-admin__panel v8-admin__visual">
      <div className="v8-admin__texts-head">
        <h2>{t('可视化编辑', 'Visual Editor')}</h2>
        <div className="v8-admin__texts-tools">
          <span className="v8-admin__hint">{t('点击文字编辑文案，点击图片替换图片', 'Click text to edit, click an image to replace')}</span>
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
            {errorMsg && (
              <p className="v8-admin__error" style={{ color: '#d93025', margin: '8px 0', fontSize: 13 }}>
                {errorMsg}
              </p>
            )}
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

      {imgInfo && (
        <div className="v8-admin__modal" onClick={closeImgDialog}>
          <div className="v8-admin__modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t('替换图片', 'Replace Image')}</h3>
            <p className="v8-admin__text-key-full">{imgInfo.imgKey}</p>

            {/* 设备切换：桌面端 / 手机端分别拖拽定位 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[
                { id: 'desktop', label: t('桌面端', 'Desktop') },
                { id: 'mobile', label: t('手机端', 'Mobile') }
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setImgDevice(d.id)}
                  style={{
                    padding: '5px 14px',
                    fontSize: 13,
                    borderRadius: 99,
                    border: '1px solid ' + (imgDevice === d.id ? '#3e6ae1' : '#d1d5db'),
                    background: imgDevice === d.id ? '#3e6ae1' : '#fff',
                    color: imgDevice === d.id ? '#fff' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  {d.label}
                </button>
              ))}
              <span style={{ fontSize: 12, color: '#76767d', alignSelf: 'center' }}>
                {imgDevice === 'mobile'
                  ? t('≤768px 屏幕生效', 'Applies to ≤768px screens')
                  : t('>768px 屏幕生效', 'Applies to >768px screens')}
              </span>
            </div>

            {/* 交互预览框：按真实显示比例，拖动图片自定义展示位置 */}
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,.1)',
                background: '#f5f5f6',
                aspectRatio: `${frame.w} / ${frame.h}`,
                cursor: imgDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                marginBottom: 10,
                maxHeight: 420,
                marginInline: 'auto'
              }}
              onPointerDown={onFramePointerDown}
              onPointerMove={onFramePointerMove}
              onPointerUp={onFramePointerUp}
              onPointerCancel={onFramePointerUp}
            >
              {imgPreviewSrc ? (
                <img
                  src={imgPreviewSrc}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${imgPos.x}% ${imgPos.y}%`,
                    userSelect: 'none', pointerEvents: 'none'
                  }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a9aa2', fontSize: 13 }}>
                  {t('暂无图片', 'No image')}
                </div>
              )}
              <span style={{
                position: 'absolute', left: 8, bottom: 8,
                background: 'rgba(0,0,0,.55)', color: '#fff',
                fontSize: 11, padding: '2px 8px', borderRadius: 4,
                pointerEvents: 'none'
              }}>
                {t('拖动图片调整展示位置', 'Drag to adjust image position')}
              </span>
            </div>

            <label>
              {t('上传本地图片（自动压缩，存入网站仓库）', 'Upload a local image (auto-compressed, stored in the site repo)')}
              <input id="v8-img-file-input" type="file" accept="image/*" onChange={onFilePicked} />
            </label>

            <label style={{ marginTop: 10 }}>
              {t('或填写图片 URL', 'Or enter an image URL')}
              <input
                type="text"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="https://... 或 /images/..."
              />
            </label>

            {imgErrorMsg && (
              <p className="v8-admin__error" style={{ color: '#d93025', margin: '8px 0', fontSize: 13 }}>
                {imgErrorMsg}
              </p>
            )}
            <div className="v8-admin__modal-actions">
              <button className="v8-admin__btn" onClick={saveImage} disabled={imgSaving}>
                {imgSaving ? t('保存中...', 'Saving...') : t('保存', 'Save')}
              </button>
              <button
                className="v8-admin__btn v8-admin__btn--ghost"
                onClick={() => setImgPos({ x: 50, y: 50 })}
                title={t('恢复居中显示', 'Center the image')}
              >
                {t('位置居中', 'Center')}
              </button>
              {imgHasOverride && (
                <button className="v8-admin__btn v8-admin__btn--ghost" onClick={resetImage}>
                  {t('恢复默认', 'Reset')}
                </button>
              )}
              <button className="v8-admin__btn v8-admin__btn--ghost" onClick={closeImgDialog}>
                {t('取消', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
