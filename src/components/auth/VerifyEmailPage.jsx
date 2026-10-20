import { useState, useEffect } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate } from '../../lib/router.mjs'

export default function VerifyEmailPage() {
  const { lang } = useIciI18n()
  const [status, setStatus] = useState('loading') // loading | ok | error | expired
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Parse ?token=xxx from URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setMessage(lang === 'zh' ? '无效的验证链接' : lang === 'ja' ? '無効なリンクです' : 'Invalid verification link')
      return
    }

    fetch('/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setStatus('ok')
          setMessage(lang === 'zh'
            ? '邮箱验证成功！即将跳转到登录页...'
            : lang === 'ja'
              ? 'メール認証が完了しました！ログインページに移動します...'
              : 'Email verified! Redirecting to login...')
          setTimeout(() => navigate('/login?verified=1'), 3000)
        } else {
          setStatus(d.error?.toLowerCase().includes('expired') || d.error?.includes('过期') ? 'expired' : 'error')
          setMessage(d.error || (lang === 'zh' ? '验证失败' : lang === 'ja' ? '認証に失敗しました' : 'Verification failed'))
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage(lang === 'zh' ? '网络错误，请稍后重试' : lang === 'ja' ? 'ネットワークエラー' : 'Network error')
      })
  }, [lang])

  const titles = {
    loading: lang === 'zh' ? '验证中...' : lang === 'ja' ? '認証中...' : 'Verifying...',
    ok: lang === 'zh' ? '验证成功！' : lang === 'ja' ? '認証完了！' : 'Verified!',
    error: lang === 'zh' ? '验证失败' : lang === 'ja' ? '認証失敗' : 'Verification Failed',
    expired: lang === 'zh' ? '链接已过期' : lang === 'ja' ? 'リンクの有効期限が切れています' : 'Link Expired'
  }

  const icons = {
    loading: '⏳',
    ok: '✓',
    error: '✗',
    expired: '⏰'
  }

  const colors = {
    loading: '#f59e0b',
    ok: '#22c55e',
    error: '#ef4444',
    expired: '#ef4444'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '48px 40px', textAlign: 'center',
        maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,.08)'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `${colors[status]}20`, color: colors[status],
          fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontWeight: 'bold'
        }}>
          {icons[status]}
        </div>
        <h1 style={{ fontSize: 22, margin: '0 0 12px', color: '#1a1a1a' }}>{titles[status]}</h1>
        <p style={{ color: '#666', margin: 0, fontSize: 15, lineHeight: 1.6 }}>{message}</p>
        {(status === 'ok' || status === 'loading') && (
          <p style={{ color: '#999', marginTop: 12, fontSize: 13 }}>
            {lang === 'zh' ? '即将自动跳转...' : lang === 'ja' ? '自動的に移動します...' : 'Redirecting automatically...'}
          </p>
        )}
        {(status === 'error' || status === 'expired') && (
          <div style={{ marginTop: 24 }}>
            <button onClick={() => navigate('/login')} style={{
              background: '#1a1a1a', color: '#fff',
              padding: '12px 32px', borderRadius: 6, fontSize: 15, marginRight: 10,
              border: 'none', cursor: 'pointer'
            }}>
              {lang === 'zh' ? '去登录' : lang === 'ja' ? 'ログイン' : 'Go to Login'}
            </button>
            <button onClick={() => navigate('/register')} style={{
              background: 'transparent', color: '#1a1a1a',
              padding: '12px 32px', borderRadius: 6, fontSize: 15,
              border: '1px solid #ddd', cursor: 'pointer'
            }}>
              {lang === 'zh' ? '重新注册' : lang === 'ja' ? '再登録' : 'Register Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
