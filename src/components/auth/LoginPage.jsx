import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { navigate } from '../../lib/router.mjs'
import './auth.css'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const r = await login(email, password)
    if (!r.ok) {
      setError(r.error)
      return
    }
    if (r.user.role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="v8-auth">
      <div className="v8-auth__card">
        <h1 className="v8-auth__title">登录</h1>
        <p className="v8-auth__sub">欢迎回来，请登录您的账户</p>
        <form onSubmit={onSubmit} className="v8-auth__form">
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
              autoComplete="current-password"
            />
          </label>
          {error && <div className="v8-auth__error">{error}</div>}
          <button type="submit" className="v8-auth__btn" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="v8-auth__foot">
          还没有账户？
          <a href="#register" onClick={(e) => { e.preventDefault(); navigate('/register') }}>立即注册</a>
        </p>
        <p className="v8-auth__hint">
          演示管理员：admin@v-plus.house / admin123
        </p>
      </div>
    </div>
  )
}
