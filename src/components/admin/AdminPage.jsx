import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'
import TextEditor from './TextEditor.jsx'
import './admin.css'

const TABS = ['listings', 'messages', 'users', 'texts']

const EMPTY_LISTING = {
  title: '', type: 'luxury', price: '', city: '', bedrooms: '', bathrooms: '',
  area: '', address: '', description: '', image: '', images: [], published: true
}

export default function AdminPage() {
  const { lang } = useIciI18n()
  const zh = lang === 'zh'
  const t = (z, e) => (zh ? z : e)
  const { user, authFetch, logout } = useAuth()
  const [tab, setTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_LISTING })
  const [saving, setSaving] = useState(false)
  // 房源图片本地上传（多选批量）
  const [imgUploading, setImgUploading] = useState(false)
  const [imgError, setImgError] = useState('')
  const [uploadDone, setUploadDone] = useState(0)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [urlDraft, setUrlDraft] = useState('')
  const imgFileRef = useRef(null)
  const dragIdx = useRef(null)

  const isAdmin = user?.role === 'admin'

  // 选本地图片 → 压缩（>900KB 时缩到 1920 宽、JPEG 82% 质量推 GitHub
  // → 返回 raw 直链填入图片 URL
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result).split(',')[1])
      r.onerror = () => reject(new Error(t('读取文件失败', 'Failed to read file')))
      r.readAsDataURL(file)
    })
  }

  async function fileToUploadBase64(file) {
    if (file.size <= 900 * 1024) return fileToBase64(file)
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => reject(new Error(t('读取文件失败', 'Failed to read file')))
      r.readAsDataURL(file)
    })
    const img = await new Promise((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error(t('图片解析失败', 'Failed to decode image')))
      im.src = dataUrl
    })
    const scale = Math.min(1, 1920 / img.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.82).split(',')[1]
  }

  async function handleListingImageUpload(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setImgError('')
    setImgUploading(true)
    setUploadTotal(files.length)
    setUploadDone(0)
    try {
      const urls = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const dataBase64 = await fileToUploadBase64(file)
        const res = await authFetch('/api/admin/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, dataBase64 })
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`)
        urls.push(d.url)
        setUploadDone((n) => n + 1)
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }))
    } catch (err) {
      setImgError(err.message || t('上传失败', 'Upload failed'))
    } finally {
      setImgUploading(false)
    }
  }

  // 图片列表操作：拖拽排序 / 删除 / URL 添加；第一张即封面（存 image 字段兼容旧展示）
  function reorderImages(toIdx) {
    const from = dragIdx.current
    dragIdx.current = null
    if (from == null || from === toIdx) return
    setForm((f) => {
      const arr = [...f.images]
      const [moved] = arr.splice(from, 1)
      arr.splice(toIdx, 0, moved)
      return { ...f, images: arr }
    })
  }

  function removeImage(idx) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  function addImageUrl() {
    const u = urlDraft.trim()
    if (!u) return
    setForm((f) => (f.images.includes(u) ? f : { ...f, images: [...f.images, u] }))
    setUrlDraft('')
  }

  useEffect(() => {
    if (!isAdmin) return
    if (tab === 'listings') loadListings()
    if (tab === 'messages') loadMessages()
    if (tab === 'users') loadUsers()
  }, [tab, isAdmin])

  async function loadListings() {
    const res = await authFetch('/api/admin/listings')
    if (res.ok) {
      const d = await res.json()
      setListings(d.listings || [])
    }
  }

  async function loadMessages() {
    const res = await authFetch('/api/admin/messages')
    if (res.ok) {
      const d = await res.json()
      setMessages(d.messages || [])
    }
  }

  async function loadUsers() {
    const res = await authFetch('/api/admin/users')
    if (res.ok) {
      const d = await res.json()
      setUsers(d.users || [])
    }
  }

  async function saveListing() {
    setSaving(true)
    // images 数组为主数据，首图同步到 image 字段兼容旧展示
    const payload = { ...form, image: form.images[0] || form.image || '' }
    const body = editing ? { id: editing.id, ...payload } : payload
    const res = await authFetch('/api/admin/listings', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      setEditing(null)
      setForm({ ...EMPTY_LISTING })
      loadListings()
    }
    setSaving(false)
  }

  async function removeListing(id) {
    if (!confirm(t('确定删除该房源？', 'Delete this listing?'))) return
    const res = await authFetch('/api/admin/listings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) loadListings()
  }

  async function markRead(id) {
    const res = await authFetch('/api/admin/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'read' })
    })
    if (res.ok) loadMessages()
  }

  async function removeMessage(id) {
    if (!confirm(t('确定删除该留言？', 'Delete this message?'))) return
    const res = await authFetch('/api/admin/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) loadMessages()
  }

  if (!isAdmin) {
    return (
      <div className="v8-admin">
        <div className="v8-admin__card">
          <h1>{t('无权限', 'No Access')}</h1>
          <p>{t('仅管理员可访问后台。', 'Only administrators can access the dashboard.')}</p>
          <button className="v8-admin__btn" onClick={() => navigate('/login')}>{t('去登录', 'Sign In')}</button>
        </div>
      </div>
    )
  }

  const typeLabels = {
    luxury: t('豪华住宅', 'Luxury Home'),
    standard: t('普通住宅', 'Standard Home'),
    student: t('学生公寓', 'Student Apartment'),
    city: t('城市公寓', 'City Apartment')
  }

  return (
    <div className="v8-admin">
      <div className="v8-admin__header">
        <h1>{t('管理后台', 'Admin Dashboard')}</h1>
        <div className="v8-admin__user">
          <span>{user?.name}（{user?.role === 'admin' ? t('管理员', 'Admin') : t('用户', 'User')}）</span>
          <button className="v8-admin__btn v8-admin__btn--ghost" onClick={() => { logout(); navigate('/') }}>{t('退出登录', 'Sign Out')}</button>
        </div>
      </div>

      <div className="v8-admin__tabs">
        {TABS.map((tb) => (
          <button
            key={tb}
            className={`v8-admin__tab${tab === tb ? ' is-active' : ''}`}
            onClick={() => setTab(tb)}
          >
            {tb === 'listings' ? t('房源管理', 'Listings') : tb === 'messages' ? t('客户留言', 'Messages') : tb === 'users' ? t('注册用户', 'Users') : t('文案管理', 'Content')}
          </button>
        ))}
      </div>

      {tab === 'listings' && (
        <div className="v8-admin__content">
          <div className="v8-admin__panel">
            <h2>{editing ? t('编辑房源', 'Edit Listing') : t('新增房源', 'New Listing')}</h2>
            <div className="v8-admin__form">
              <div className="v8-admin__row">
                <label>{t('标题', 'Title')}<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                <label>{t('类型', 'Type')}
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="luxury">{t('豪华住宅', 'Luxury Home')}</option>
                    <option value="standard">{t('普通住宅', 'Standard Home')}</option>
                    <option value="student">{t('学生公寓', 'Student Apartment')}</option>
                    <option value="city">{t('城市公寓', 'City Apartment')}</option>
                  </select>
                </label>
              </div>
              <div className="v8-admin__row">
                <label>{t('价格 (元/月)', 'Price (¥/mo)')}<input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
                <label>{t('城市', 'City')}<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
                <label>{t('地址', 'Address')}<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
              </div>
              <div className="v8-admin__row">
                <label>{t('卧室', 'Bedrooms')}<input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></label>
                <label>{t('卫生间', 'Bathrooms')}<input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></label>
                <label>{t('面积 (㎡)', 'Area (㎡)')}<input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></label>
              </div>
              <label>{t('描述', 'Description')}<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
              {/* 房源图片：多张管理，支持批量上传 / URL 添加 / 拖拽排序，第一张为封面 */}
              <div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.images.map((src, i) => (
                    <div
                      key={src + '#' + i}
                      draggable
                      onDragStart={() => { dragIdx.current = i }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => reorderImages(i)}
                      title={t('拖拽调整顺序', 'Drag to reorder')}
                      style={{
                        position: 'relative', width: 86, height: 64,
                        borderRadius: 4, overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,.14)',
                        cursor: 'grab', background: '#f5f5f6'
                      }}
                    >
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', display: 'block' }} />
                      {i === 0 && (
                        <span style={{
                          position: 'absolute', left: 0, top: 0,
                          background: 'rgba(22,22,26,.78)', color: '#fff',
                          fontSize: 10, padding: '1px 5px', borderRadius: '0 0 4px 0'
                        }}>{t('封面', 'Cover')}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label={t('删除图片', 'Remove image')}
                        style={{
                          position: 'absolute', right: 2, top: 2,
                          width: 18, height: 18, lineHeight: '16px',
                          borderRadius: 99, border: 'none',
                          background: 'rgba(22,22,26,.72)', color: '#fff',
                          fontSize: 12, cursor: 'pointer', padding: 0
                        }}
                      >×</button>
                    </div>
                  ))}
                  {form.images.length === 0 && (
                    <span style={{ fontSize: 13, color: '#76767d' }}>
                      {t('暂无图片：可批量上传本地图片或粘贴 URL 添加，第一张为封面', 'No images yet — batch upload or add URLs; the first one is the cover')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="v8-admin__btn v8-admin__btn--ghost"
                    disabled={imgUploading}
                    onClick={() => imgFileRef.current?.click()}
                  >
                    {imgUploading
                      ? t(`上传中 ${uploadDone}/${uploadTotal}...`, `Uploading ${uploadDone}/${uploadTotal}...`)
                      : t('批量上传本地图片', 'Upload Images (multi)')}
                  </button>
                  <input
                    ref={imgFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleListingImageUpload}
                  />
                  <input
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl() } }}
                    placeholder={t('粘贴图片 URL，回车添加', 'Paste an image URL and press Enter')}
                    style={{ flex: 1, minWidth: 200, padding: '8px 10px', border: '1px solid rgba(0,0,0,.16)', borderRadius: 4, fontSize: 14 }}
                  />
                  <button type="button" className="v8-admin__btn v8-admin__btn--ghost" onClick={addImageUrl}>
                    {t('添加', 'Add')}
                  </button>
                </div>
                {imgError && <p style={{ color: '#c0392b', fontSize: 13, margin: '6px 0 0' }}>{imgError}</p>}
              </div>
              <label className="v8-admin__check">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                {t('发布（前端可见）', 'Published (visible on site)')}
              </label>
              <div className="v8-admin__actions">
                <button className="v8-admin__btn" onClick={saveListing} disabled={saving}>
                  {saving ? t('保存中...', 'Saving...') : editing ? t('更新', 'Update') : t('创建', 'Create')}
                </button>
                {editing && (
                  <button className="v8-admin__btn v8-admin__btn--ghost" onClick={() => { setEditing(null); setForm({ ...EMPTY_LISTING }) }}>{t('取消', 'Cancel')}</button>
                )}
              </div>
            </div>
          </div>

          <div className="v8-admin__panel">
            <h2>{t('房源列表', 'Listing List')} ({listings.length})</h2>
            <table className="v8-admin__table">
              <thead>
                <tr><th>{t('标题', 'Title')}</th><th>{t('类型', 'Type')}</th><th>{t('价格', 'Price')}</th><th>{t('城市', 'City')}</th><th>{t('状态', 'Status')}</th><th>{t('操作', 'Actions')}</th></tr>
              </thead>
              <tbody>
                {listings.length === 0 && (
                  <tr><td colSpan={6} className="v8-admin__empty">{t('暂无房源', 'No listings yet')}</td></tr>
                )}
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.title}
                      {(Array.isArray(l.images) ? l.images.length : (l.image ? 1 : 0)) > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 12, color: '#76767d' }}>
                          {t('图', 'img')}×{Array.isArray(l.images) ? l.images.length : (l.image ? 1 : 0)}
                        </span>
                      )}
                    </td>
                    <td>{typeLabels[l.type] || l.type}</td>
                    <td>¥{l.price}</td>
                    <td>{l.city}</td>
                    <td>{l.published === false ? t('未发布', 'Unpublished') : t('已发布', 'Published')}</td>
                    <td>
                      <button className="v8-admin__link" onClick={() => {
                        const imgs = Array.isArray(l.images) && l.images.length ? l.images.filter(Boolean) : (l.image ? [l.image] : [])
                        setEditing(l); setForm({ ...EMPTY_LISTING, ...l, images: imgs }); window.scrollTo(0, 0)
                      }}>{t('编辑', 'Edit')}</button>
                      <button className="v8-admin__link v8-admin__link--danger" onClick={() => removeListing(l.id)}>{t('删除', 'Delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="v8-admin__panel">
          <h2>{t('客户留言', 'Messages')} ({messages.length})</h2>
          <table className="v8-admin__table">
            <thead>
              <tr><th>{t('姓名', 'Name')}</th><th>{t('邮箱', 'Email')}</th><th>{t('电话', 'Phone')}</th><th>{t('留言', 'Message')}</th><th>{t('状态', 'Status')}</th><th>{t('操作', 'Actions')}</th></tr>
            </thead>
            <tbody>
              {messages.length === 0 && (
                <tr><td colSpan={6} className="v8-admin__empty">{t('暂无留言', 'No messages yet')}</td></tr>
              )}
              {messages.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone || '-'}</td>
                  <td className="v8-admin__msg">{m.message}</td>
                  <td>{m.read ? t('已读', 'Read') : <span className="v8-admin__badge">{t('未读', 'Unread')}</span>}</td>
                  <td>
                    {!m.read && <button className="v8-admin__link" onClick={() => markRead(m.id)}>{t('标已读', 'Mark Read')}</button>}
                    <button className="v8-admin__link v8-admin__link--danger" onClick={() => removeMessage(m.id)}>{t('删除', 'Delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="v8-admin__panel">
          <h2>{t('注册用户', 'Registered Users')} ({users.length})</h2>
          <table className="v8-admin__table">
            <thead>
              <tr><th>{t('姓名', 'Name')}</th><th>{t('邮箱', 'Email')}</th><th>{t('角色', 'Role')}</th><th>{t('注册时间', 'Registered')}</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role === 'admin' ? t('管理员', 'Admin') : t('普通用户', 'User')}</td>
                  <td>{new Date(u.createdAt).toLocaleString(zh ? 'zh-CN' : 'en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'texts' && <TextEditor authFetch={authFetch} />}
    </div>
  )
}
