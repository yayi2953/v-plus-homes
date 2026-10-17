import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate, switchLang } from '../../lib/router.mjs'
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
      <div className="v8-auth__topbar">
        <a className="v8-auth__topbar-logo" href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>V&nbsp;PLUS</a>
        <button className="v8-auth__topbar-lang" onClick={() => switchLang(zh ? 'en' : 'zh')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18Z" /></svg>
          {zh ? 'zh-CN' : 'en-US'}
        </button>
      </div>

      <div className="v8-auth__main">
        <div className="v8-auth__card">
          <h1 className="v8-auth__title">{t('登录', 'Sign In')}</h1>
          <form onSubmit={onSubmit} className="v8-auth__form">
            <label>
              <span className="v8-auth__field-label">
                {t('电子邮箱地址或登录手机号码', 'Email or phone number')}
                <span className="v8-auth__info-icon" aria-label="info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                </span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              <span className="v8-auth__field-label">{t('密码', 'Password')}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            {error && <div className="v8-auth__error">{error}</div>}
            <button type="submit" className="v8-auth__btn" disabled={loading}>
              {loading ? t('登录中...', 'Signing in...') : t('登录', 'Sign In')}
            </button>
          </form>

          <div className="v8-auth__divider"><span>{t('或', 'or')}</span></div>

          <button className="v8-auth__btn v8-auth__btn--outline" onClick={() => navigate('/register')}>
            {t('创建账户', 'Create Account')}
          </button>
        </div>
      </div>

      <div className="v8-auth__footer">
        <span>V PLUS © {new Date().getFullYear()}</span>
        <a href="#">{t('隐私和法律', 'Privacy & Legal')}</a>
        <a href="#">{t('联系我们', 'Contact')}</a>
      </div>
    </div>
  )
}
