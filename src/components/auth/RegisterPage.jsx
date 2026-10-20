import { useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'

export default function RegisterPage() {
  const { lang } = useIciI18n()
  const zh = lang === 'zh'
  const ja = lang === 'ja'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('') // '' | 'pending' | 'resent'
  const [emailSent, setEmailSent] = useState('')

  const t = {
    title: zh ? '注册账号' : ja ? 'アカウント登録' : 'Create Account',
    subtitle: zh ? '注册后请查收验证邮件' : ja ? '登録後、確認メールをお送りします' : 'Verify your email after signing up',
    name: zh ? '姓名' : ja ? 'お名前' : 'Name',
    email: zh ? '邮箱' : ja ? 'メール' : 'Email',
    password: zh ? '密码（至少 6 位）' : ja ? 'パスワード（6文字以上）' : 'Password (min 6 chars)',
    submit: zh ? '注册' : ja ? '登録' : 'Sign Up',
    submitting: zh ? '注册中...' : ja ? '登録中...' : 'Signing up...',
    resend: zh ? '重新发送验证邮件' : ja ? '確認メールを再送信' : 'Resend verification email',
    resent: zh ? '验证邮件已重新发送！' : ja ? '確認メールを再送信しました！' : 'Verification email resent!',
    hasAccount: zh ? '已有账号？' : ja ? 'アカウントをお持ちですか？' : 'Already have an account?',
    login: zh ? '登录' : ja ? 'ログイン' : 'Sign In',
    checkEmail: zh ? '验证邮件已发送！' : ja ? '確認メールを送信しました！' : 'Verification email sent!',
    checkEmailSub: zh ? '请检查您的邮箱（包括垃圾邮件文件夹），点击邮件中的链接完成验证。' : ja ? 'メール（迷惑メールフォルダも含む）をご確認ください。' : 'Please check your inbox (including spam folder) and click the link in the email.',
    wrongEmail: zh ? '邮箱错了？重新注册' : ja ? 'メールアドレスを変更しますか？' : 'Wrong email? Register again'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setStatus('')
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || (zh ? '注册失败' : ja ? '登録に失敗しました' : 'Registration failed'))
        return
      }
      setStatus('pending')
      setEmailSent(email)
      setForm({ email: '', password: '', name: '' })
    } catch {
      setError(zh ? '网络错误，请稍后重试' : ja ? 'ネットワークエラー' : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!emailSent || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailSent })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || (zh ? '发送失败' : ja ? '送信に失敗しました' : 'Failed to send'))
        return
      }
      setStatus('resent')
      setTimeout(() => setStatus('pending'), 3000)
    } catch {
      setError(zh ? '发送失败，请稍后重试' : ja ? '送信に失敗しました' : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  function setForm(v) {
    setEmail(v.email || '')
    setPassword(v.password || '')
    setName(v.name || '')
  }

  if (status === 'pending' || status === 'resent') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5', padding: 20
      }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: '40px 36px', textAlign: 'center',
          maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,.08)', width: '100%'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#22c55e20', color: '#22c55e',
            fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontWeight: 'bold'
          }}>
            ✉
          </div>
          <h2 style={{ fontSize: 22, margin: '0 0 8px', color: '#1a1a1a' }}>{t.checkEmail}</h2>
          <p style={{ color: '#666', margin: '0 0 4px', fontSize: 15, lineHeight: 1.6 }}>
            {t.checkEmailSub}
          </p>
          <p style={{ color: '#999', margin: '12px 0 0', fontSize: 14 }}>
            <strong>{emailSent}</strong>
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            style={{
              marginTop: 24, background: 'transparent', color: '#1a1a1a',
              padding: '10px 24px', borderRadius: 6, border: '1px solid #ddd',
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: loading ? 0.6 : 1
            }}
          >
            {status === 'resent' ? `✓ ${t.resent}` : t.resend}
          </button>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => navigate('/login')} style={{ color: '#666', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
              ← {t.hasAccount} <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{t.login}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 420,
        boxShadow: '0 4px 24px rgba(0,0,0,.08)'
      }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: 24, color: '#1a1a1a' }}>{t.title}</h2>
        <p style={{ textAlign: 'center', color: '#666', margin: '0 0 28px', fontSize: 14 }}>{t.subtitle}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#333' }}>{t.name}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t.name}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#333' }}>{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder={t.email}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#333' }}>{t.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              placeholder={t.password}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', margin: 0, fontSize: 14 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{
              marginTop: 8, background: '#1a1a1a', color: '#fff', padding: '12px',
              border: 'none', borderRadius: 6, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontWeight: 500
            }}
          >
            {loading ? t.submitting : t.submit}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          {t.hasAccount}{' '}
          <button onClick={() => navigate('/login')} style={{ color: '#1a1a1a', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 }}>
            {t.login}
          </button>
        </p>
      </div>
    </div>
  )
}
