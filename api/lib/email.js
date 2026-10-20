import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// 发送验证邮件
export async function sendVerificationEmail(to, token, name = '') {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.PUBLIC_URL || 'http://localhost:3000'

  const verifyUrl = `${baseUrl}/verify-email?token=${token}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email - V PLUS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .content { background: #f9f9f9; border-radius: 8px; padding: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
    .link { color: #666; word-break: break-all; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">V PLUS</div>
  </div>
  <div class="content">
    <h2>Welcome${name ? ', ' + name : ''}!</h2>
    <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
    <p style="text-align: center;">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p class="link">${verifyUrl}</p>
    <p><small>This link will expire in 24 hours.</small></p>
  </div>
  <div class="footer">
    <p>If you didn't create this account, you can safely ignore this email.</p>
    <p>© V PLUS Homes. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || 'V PLUS <no-reply@v-plus.house>',
    to,
    subject: 'Verify your email address - V PLUS',
    html
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(error.message || 'Failed to send email')
  }

  return data
}

// 发送密码重置邮件
export async function sendPasswordResetEmail(to, token, name = '') {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.PUBLIC_URL || 'http://localhost:3000'

  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password - V PLUS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1a1a1a; }
    .content { background: #f9f9f9; border-radius: 8px; padding: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
    .link { color: #666; word-break: break-all; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">V PLUS</div>
  </div>
  <div class="content">
    <h2>Password Reset Request</h2>
    <p>Hi${name ? ' ' + name : ''},</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p class="link">${resetUrl}</p>
    <p><small>This link will expire in 1 hour.</small></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
  <div class="footer">
    <p>© V PLUS Homes. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || 'V PLUS <no-reply@v-plus.house>',
    to,
    subject: 'Reset your password - V PLUS',
    html
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(error.message || 'Failed to send email')
  }

  return data
}
