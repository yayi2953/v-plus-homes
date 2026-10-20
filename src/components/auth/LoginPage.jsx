import { useState, useEffect } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'

export default function LoginPage() {
  const { lang } = useIciI18n()
  const zh = lang === 'zh'
  const ja = lang === 'ja'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  // URL 参数 ?verified=1 表示刚完成验证
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === '1') {
      setError('')
    }
  }, [window.location.search])

  const t = {
    title: zh ? '登录' : ja ? 'ログイン' : 'Sign In',
    subtitle: zh ? '登录后管理您的房源和消息' : ja ? '物件やメッセージを管理' : 'Manage your listings and messages',
    email: zh ? '邮箱' : ja ? 'メール' : 'Email',
    password: zh ? '密码' : ja ? 'パスワード' : 'Password',
    submit: zh ? '登录' : ja ? 'ログイン' : 'Sign In',
    submitting: zh ? '登录中...' : ja ? 'ログイン中...' : 'Signing in...',
    noAccount: zh ? '还没有账号？' : ja ? 'アカウントをお持ちでない方' : "Don't have an account?",
    register: zh ? '注册' : ja ? '登録' : 'Sign Up',
    verifyEmail: zh ? '您的邮箱尚未验证。请检查收件箱（包括垃圾邮件），点击邮件中的验证链接。' : ja ? 'メールが未確認です。受信トレイ（迷惑メールを含む）をご確認ください。' : 'Your email is not verified. Please check your inbox (including spam) and click the verification link.',
    resendLink: zh ? '没收到邮件？重新发送' : ja ? 'メールが届かない場合はこちら' : "Didn't receive the email? Resend",
    verifiedSuccess: zh ? '邮箱验证成功！现在可以登录了。' : ja ? 'メール認証が完了しました！ログインできます。' : 'Email verified! You can now sign in.'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNeedsVerification(false)
    setLoading(true)
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setNeedsVerification(true)
          setError(data.error)
        } else {
          setError(data.error || (zh ? '登录失败' : ja ? 'ログインに失敗しました' : 'Login failed'))
        }
        return
      }
      localStorage.setItem('vplus_token', data.token)
      localStorage.setItem('vplus_user', JSON.stringify(data.user))
      navigate('/admin')
    } catch {
      setError(zh ? '网络错误，请稍后重试' : ja ? 'ネットワークエラー' : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email || loading) return
    setLoading(true)
    try {
      const res = await fetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        setError(t.resendLink + ' ✓')
        setNeedsVerification(false)
      } else {
        setError(data.error || (zh ? '发送失败' : ja ? '送信に失敗しました' : 'Failed to send'))
      }
    } catch {
      setError(zh ? '发送失败，请稍后重试' : ja ? '送信に失敗しました' : 'Failed to send')
    } finally {
      setLoading(false)
    }
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#333' }}>{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#333' }}>{t.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>

          {needsVerification && (
            <div style={{
              background: '#fef3c2', border: '1px solid #f59e0b40', borderRadius: 6,
              padding: '12px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5
            }}>
              <p style={{ margin: '0 0 8px' }}>{t.verifyEmail}</p>
              <button type="button" onClick={handleResend}
                style={{
                  background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer',
                  fontSize: 13, textDecoration: 'underline', padding: 0, fontWeight: 500
                }}
              >
                {t.resendLink} →
              </button>
            </div>
          )}

          {error && !needsVerification && (
            <p style={{ color: '#ef4444', margin: 0, fontSize: 14 }}>{error}</p>
          )}

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
          {t.noAccount}{' '}
          <button onClick={() => navigate('/register')} style={{ color: '#1a1a1a', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 }}>
            {t.register}
          </button>
        </p>
      </div>
    </div>
  )
}
