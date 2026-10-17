import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'
import './auth.css'

export default function LoginPage() {
  const { lang } = useIciI18n()
  const zh = lang === 'zh'
  const t = (z, e) => (zh ? z : e)
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
        <h1 className="v8-auth__title">{t('登录', 'Sign In')}</h1>
        <p className="v8-auth__sub">{t('欢迎回来，请登录您的账户', 'Welcome back, please sign in to your account')}</p>
        <form onSubmit={onSubmit} className="v8-auth__form">
          <label>
            <span>{t('邮箱', 'Email')}</span>
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
            <span>{t('密码', 'Password')}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('至少 6 位', 'At least 6 characters')}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <div className="v8-auth__error">{error}</div>}
          <button type="submit" className="v8-auth__btn" disabled={loading}>
            {loading ? t('登录中...', 'Signing in...') : t('登录', 'Sign In')}
          </button>
        </form>
        <p className="v8-auth__foot">
          {t('还没有账户？', "Don't have an account?")}
          <a href="#register" onClick={(e) => { e.preventDefault(); navigate('/register') }}>{t('立即注册', 'Sign up')}</a>
        </p>
        <p className="v8-auth__hint">
          {t('演示管理员：admin@v-plus.house / admin123', 'Demo admin: admin@v-plus.house / admin123')}
        </p>
      </div>
    </div>
  )
}
