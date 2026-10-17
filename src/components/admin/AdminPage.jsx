import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { navigate } from '../../lib/router.mjs'
import './admin.css'

const TABS = ['listings', 'messages', 'users']

const EMPTY_LISTING = {
  title: '', type: 'luxury', price: '', city: '', bedrooms: '', bathrooms: '',
  area: '', address: '', description: '', image: '', published: true
}

export default function AdminPage() {
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
    if (!confirm('确定删除该房源？')) return
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
    if (!confirm('确定删除该留言？')) return
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
          <h1>无权限</h1>
          <p>仅管理员可访问后台。</p>
          <button className="v8-admin__btn" onClick={() => navigate('/login')}>去登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="v8-admin">
      <div className="v8-admin__header">
        <h1>管理后台</h1>
        <div className="v8-admin__user">
          <span>{user?.name}（{user?.role}）</span>
          <button className="v8-admin__btn v8-admin__btn--ghost" onClick={() => { logout(); navigate('/') }}>退出登录</button>
        </div>
      </div>

      <div className="v8-admin__tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`v8-admin__tab${tab === t ? ' is-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'listings' ? '房源管理' : t === 'messages' ? '客户留言' : '注册用户'}
          </button>
        ))}
      </div>

      {tab === 'listings' && (
        <div className="v8-admin__content">
          <div className="v8-admin__panel">
            <h2>{editing ? '编辑房源' : '新增房源'}</h2>
            <div className="v8-admin__form">
              <div className="v8-admin__row">
                <label>标题<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                <label>类型
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="luxury">豪华住宅</option>
                    <option value="standard">普通住宅</option>
                    <option value="student">学生公寓</option>
                    <option value="city">城市公寓</option>
                  </select>
                </label>
              </div>
              <div className="v8-admin__row">
                <label>价格 (元/月)<input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
                <label>城市<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
                <label>地址<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
              </div>
              <div className="v8-admin__row">
                <label>卧室<input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></label>
                <label>卫生间<input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></label>
                <label>面积 (㎡)<input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></label>
              </div>
              <label>描述<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
              <label>图片 URL<input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
              <label className="v8-admin__check">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                发布（前端可见）
              </label>
              <div className="v8-admin__actions">
                <button className="v8-admin__btn" onClick={saveListing} disabled={saving}>
                  {saving ? '保存中...' : editing ? '更新' : '创建'}
                </button>
                {editing && (
                  <button className="v8-admin__btn v8-admin__btn--ghost" onClick={() => { setEditing(null); setForm({ ...EMPTY_LISTING }) }}>取消</button>
                )}
              </div>
            </div>
          </div>

          <div className="v8-admin__panel">
            <h2>房源列表 ({listings.length})</h2>
            <table className="v8-admin__table">
              <thead>
                <tr><th>标题</th><th>类型</th><th>价格</th><th>城市</th><th>状态</th><th>操作</th></tr>
              </thead>
              <tbody>
                {listings.length === 0 && (
                  <tr><td colSpan={6} className="v8-admin__empty">暂无房源</td></tr>
                )}
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td>{l.title}</td>
                    <td>{l.type}</td>
                    <td>¥{l.price}</td>
                    <td>{l.city}</td>
                    <td>{l.published === false ? '未发布' : '已发布'}</td>
                    <td>
                      <button className="v8-admin__link" onClick={() => { setEditing(l); setForm({ ...EMPTY_LISTING, ...l }); window.scrollTo(0, 0) }}>编辑</button>
                      <button className="v8-admin__link v8-admin__link--danger" onClick={() => removeListing(l.id)}>删除</button>
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
          <h2>客户留言 ({messages.length})</h2>
          <table className="v8-admin__table">
            <thead>
              <tr><th>姓名</th><th>邮箱</th><th>电话</th><th>留言</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {messages.length === 0 && (
                <tr><td colSpan={6} className="v8-admin__empty">暂无留言</td></tr>
              )}
              {messages.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone || '-'}</td>
                  <td className="v8-admin__msg">{m.message}</td>
                  <td>{m.read ? '已读' : <span className="v8-admin__badge">未读</span>}</td>
                  <td>
                    {!m.read && <button className="v8-admin__link" onClick={() => markRead(m.id)}>标已读</button>}
                    <button className="v8-admin__link v8-admin__link--danger" onClick={() => removeMessage(m.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="v8-admin__panel">
          <h2>注册用户 ({users.length})</h2>
          <table className="v8-admin__table">
            <thead>
              <tr><th>姓名</th><th>邮箱</th><th>角色</th><th>注册时间</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role === 'admin' ? '管理员' : '普通用户'}</td>
                  <td>{new Date(u.createdAt).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
