import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { navigate, switchLang } from '../../lib/router.mjs'
import './auth.css'

const STEPS = 3

// 生成 5 位随机验证码（字母+数字，排除易混淆字符）
function genCaptcha() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function RegisterPage() {
  const { lang } = useIciI18n()
  const zh = lang === 'zh'
  const t = (z, e) => (zh ? z : e)
  const { register, loading } = useAuth()

  const [step, setStep] = useState(1)
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [captcha, setCaptcha] = useState(genCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [error, setError] = useState('')

  // 每次进入第 1 步重新生成验证码
  useEffect(() => {
    if (step === 1) {
      setCaptcha(genCaptcha())
      setCaptchaInput('')
    }
  }, [step])

  const fullName = `${lastName}${lastName && firstName ? ' ' : ''}${firstName}`.trim() || firstName

  function refreshCaptcha() {
    setCaptcha(genCaptcha())
    setCaptchaInput('')
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      if (!lastName.trim() || !firstName.trim()) { setError(t('请填写姓名', 'Please enter your name')); return }
      if (!captchaInput.trim()) { setError(t('请输入验证码', 'Please enter the verification code')); return }
      if (captchaInput.trim().toLowerCase() !== captcha.toLowerCase()) {
        setError(t('验证码错误', 'Verification code incorrect'))
        refreshCaptcha()
        return
      }
      if (!agreed) { setError(t('请同意服务条款', 'Please agree to the terms')); return }
      setStep(2)
    } else if (step === 2) {
      if (!email.trim()) { setError(t('请输入邮箱', 'Please enter email')); return }
      if (password.length < 6) { setError(t('密码至少 6 位', 'Password must be at least 6 characters')); return }
      if (password !== confirm) { setError(t('两次密码不一致', 'Passwords do not match')); return }
      setStep(3)
    } else if (step === 3) {
      if (!phone.trim()) { setError(t('请输入电话号码', 'Please enter phone number')); return }
      // 直接提交注册（验证码步骤为视觉还原，实际由后端创建账户）
      doRegister()
    }
  }

  function prevStep() {
    setError('')
    if (step > 1) setStep(step - 1)
  }

  async function doRegister() {
    const r = await register(email, password, fullName)
    if (!r.ok) { setError(r.error); return }
    navigate('/')
  }

  const stepLabel = t(`第 ${step} 步（共 ${STEPS} 步）`, `Step ${step} of ${STEPS}`)
  const title = step === 1 ? t('创建账户', 'Create Account')
    : step === 2 ? t('创建账户', 'Create Account')
    : t('添加登录手机号码', 'Add Login Phone Number')

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
          <p className="v8-auth__step">{stepLabel}</p>
          <h1 className="v8-auth__title">{title}</h1>

          {/* Step 1: 姓名 + 条款 */}
          {step === 1 && (
            <form className="v8-auth__form" onSubmit={(e) => { e.preventDefault(); nextStep() }}>
              <label>
                <span className="v8-auth__field-label">{t('姓', 'Last name')}</span>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </label>
              <label>
                <span className="v8-auth__field-label">{t('名', 'First name')}</span>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </label>

              {/* 验证码 */}
              <label>
                <span className="v8-auth__field-label">{t('验证码', 'Verification code')}</span>
                <div className="v8-auth__captcha">
                  <span className="v8-auth__captcha-text">{captcha}</span>
                  <button type="button" className="v8-auth__captcha-refresh" aria-label="refresh" onClick={refreshCaptcha}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
                  </button>
                </div>
              </label>
              <label>
                <span className="v8-auth__field-label">{t('请输入图片中的字符', 'Enter the characters above')}</span>
                <input type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} autoComplete="off" />
              </label>

              <label className="v8-auth__check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>{t('继续创建账户即表示我了解并同意 V PLUS 客户隐私声明和使用条款', 'By continuing, I agree to the V PLUS Privacy Statement and Terms of Use')}</span>
              </label>

              {error && <div className="v8-auth__error">{error}</div>}
              <button type="submit" className="v8-auth__btn" disabled={loading}>
                {t('下一步', 'Next')}
              </button>
            </form>
          )}

          {/* Step 2: 邮箱 + 密码 */}
          {step === 2 && (
            <form className="v8-auth__form" onSubmit={(e) => { e.preventDefault(); nextStep() }}>
              <label>
                <span className="v8-auth__field-label">{t('邮箱', 'Email')}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </label>
              <label className="v8-auth__pwd">
                <span className="v8-auth__field-label">{t('密码', 'Password')}</span>
                <span className="v8-auth__input-wrap">
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                  <button type="button" className="v8-auth__eye" onClick={() => setShowPwd(!showPwd)} aria-label="toggle password">
                    {showPwd
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /><path d="m2 2 20 20" /></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </span>
              </label>
              <label className="v8-auth__pwd">
                <span className="v8-auth__field-label">{t('确认密码', 'Confirm password')}</span>
                <span className="v8-auth__input-wrap">
                  <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} autoComplete="new-password" />
                  <button type="button" className="v8-auth__eye" onClick={() => setShowConfirm(!showConfirm)} aria-label="toggle confirm password">
                    {showConfirm
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /><path d="m2 2 20 20" /></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </span>
              </label>

              {error && <div className="v8-auth__error">{error}</div>}
              <button type="submit" className="v8-auth__btn" disabled={loading}>
                {t('下一步', 'Next')}
              </button>
              <button type="button" className="v8-auth__back" onClick={prevStep}>{t('返回', 'Back')}</button>
            </form>
          )}

          {/* Step 3: 电话号码 + 验证码 */}
          {step === 3 && (
            <form className="v8-auth__form" onSubmit={(e) => { e.preventDefault(); nextStep() }}>
              <p className="v8-auth__desc">{t('添加一个手机号码用于账户登录', 'Add a phone number for account login')}</p>
              <label>
                <span className="v8-auth__label">{t('电话号码', 'Phone number')}</span>
                <div className="v8-auth__phone">
                  <span className="v8-auth__phone-prefix">CN +86</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="" />
                </div>
              </label>

              {error && <div className="v8-auth__error">{error}</div>}
              <button type="submit" className="v8-auth__btn" disabled={loading}>
                {loading ? t('注册中...', 'Signing up...') : t('下一步', 'Next')}
              </button>
              <button type="button" className="v8-auth__back" onClick={prevStep}>{t('返回', 'Back')}</button>
            </form>
          )}

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
