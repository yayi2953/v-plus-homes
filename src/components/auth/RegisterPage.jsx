import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { navigate } from '../../lib/router.mjs'
import './auth.css'

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }
    const r = await register(email, password, name)
    if (!r.ok) {
      setError(r.error)
      return
    }
    navigate('/')
  }

  return (
    <div className="v8-auth">
      <div className="v8-auth__card">
        <h1 className="v8-auth__title">注册</h1>
        <p className="v8-auth__sub">创建您的 V PLUS 账户</p>
        <form onSubmit={onSubmit} className="v8-auth__form">
          <label>
            <span>姓名</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="您的姓名"
              required
            />
          </label>
          <label>
            <span>邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label>
            <span>确认密码</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次输入密码"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {error && <div className="v8-auth__error">{error}</div>}
          <button type="submit" className="v8-auth__btn" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="v8-auth__foot">
          已有账户？
          <a href="#login" onClick={(e) => { e.preventDefault(); navigate('/login') }}>去登录</a>
        </p>
      </div>
    </div>
  )
}
