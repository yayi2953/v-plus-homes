import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'
import './admin.css'

const TABS = ['listings', 'messages', 'users']

const EMPTY_LISTING = {
  title: '', type: 'luxury', price: '', city: '', bedrooms: '', bathrooms: '',
  area: '', address: '', description: '', image: '', published: true
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

  const isAdmin = user?.role === 'admin'

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
    const body = editing ? { id: editing.id, ...form } : form
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
            {tb === 'listings' ? t('房源管理', 'Listings') : tb === 'messages' ? t('客户留言', 'Messages') : t('注册用户', 'Users')}
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
              <label>{t('图片 URL', 'Image URL')}<input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
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
                    <td>{l.title}</td>
                    <td>{typeLabels[l.type] || l.type}</td>
                    <td>¥{l.price}</td>
                    <td>{l.city}</td>
                    <td>{l.published === false ? t('未发布', 'Unpublished') : t('已发布', 'Published')}</td>
                    <td>
                      <button className="v8-admin__link" onClick={() => { setEditing(l); setForm({ ...EMPTY_LISTING, ...l }); window.scrollTo(0, 0) }}>{t('编辑', 'Edit')}</button>
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
    </div>
  )
}
