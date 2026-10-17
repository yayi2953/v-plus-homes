import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'
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
      <div className="v8-auth__card">
        <div className="v8-auth__logo">
          <svg viewBox="0 0 342 35" xmlns="http://www.w3.org/2000/svg" aria-label="V PLUS">
            <text x="0" y="28" fontFamily="Arial, Helvetica, sans-serif" fontSize="28" fontWeight="700" letterSpacing="2" fill="#171a20">V&nbsp;PLUS</text>
          </svg>
        </div>
        <h1 className="v8-auth__title">{t('注册', 'Sign Up')}</h1>
        <p className="v8-auth__sub">{t('创建您的 V PLUS 账户', 'Create your V PLUS account')}</p>
        <form onSubmit={onSubmit} className="v8-auth__form">
          <label>
            <span>{t('姓名', 'Name')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('您的姓名', 'Your name')}
              required
            />
          </label>
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
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label>
            <span>{t('确认密码', 'Confirm Password')}</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('再次输入密码', 'Re-enter password')}
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
        <p className="v8-auth__foot">
          {t('已有账户？', 'Already have an account?')}
          <a href="#login" onClick={(e) => { e.preventDefault(); navigate('/login') }}>{t('去登录', 'Sign in')}</a>
        </p>
      </div>
    </div>
  )
}
