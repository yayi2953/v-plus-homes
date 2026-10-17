import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate, switchLang } from '../../lib/router.mjs'
import './auth.css'

export default function RegisterPage() {
  const { lang } = useIciI18n()
  const zh = lang === 'zh'
  const t = (z, e) => (zh ? z : e)
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
      setError(t('两次密码不一致', 'Passwords do not match'))
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
      <div className="v8-auth__topbar">
        <a className="v8-auth__topbar-logo" href="#" onClick={(e) => { e.preventDefault(); navigate('/') }}>V&nbsp;PLUS</a>
        <button className="v8-auth__topbar-lang" onClick={() => switchLang(zh ? 'en' : 'zh')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18Z" /></svg>
          {zh ? '中文' : 'English'}
        </button>
      </div>

      <div className="v8-auth__main">
        <div className="v8-auth__card">
          <h1 className="v8-auth__title">{t('注册', 'Sign Up')}</h1>
          <form onSubmit={onSubmit} className="v8-auth__form">
            <label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('姓名', 'Name')}
                required
              />
            </label>
            <label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('电子邮箱地址', 'Email address')}
                required
                autoComplete="email"
              />
            </label>
            <label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('密码', 'Password')}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('确认密码', 'Confirm password')}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            {error && <div className="v8-auth__error">{error}</div>}
            <button type="submit" className="v8-auth__btn" disabled={loading}>
              {loading ? t('注册中...', 'Signing up...') : t('注册', 'Sign Up')}
            </button>
          </form>

          <div className="v8-auth__divider"><span>{t('或', 'or')}</span></div>

          <button className="v8-auth__btn v8-auth__btn--outline" onClick={() => navigate('/login')}>
            {t('去登录', 'Sign In')}
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
