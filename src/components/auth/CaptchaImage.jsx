import { useEffect, useRef } from 'react'

/**
 * 图片验证码组件 —— 使用 Canvas 绘制带干扰线、噪点、随机旋转的字符，
 * 视觉效果模仿真实图片验证码。
 * props:
 *   code: 要显示的验证码字符串
 *   width, height: canvas 尺寸
 */
export default function CaptchaImage({ code, width = 120, height = 40 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 高 DPI 支持
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 背景
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(0, 0, width, height)

    // 噪点
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${rand(80, 180)}, ${rand(80, 180)}, ${rand(80, 180)}, ${Math.random() * 0.5})`
      ctx.beginPath()
      ctx.arc(rand(0, width), rand(0, height), rand(0.5, 1.5), 0, Math.PI * 2)
      ctx.fill()
    }

    // 干扰线
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${rand(60, 160)}, ${rand(60, 160)}, ${rand(60, 160)}, 0.5)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(rand(0, width), rand(0, height))
      ctx.bezierCurveTo(
        rand(0, width), rand(0, height),
        rand(0, width), rand(0, height),
        rand(0, width), rand(0, height)
      )
      ctx.stroke()
    }

    // 绘制字符：每个字符随机颜色、旋转、位置
    const chars = code.split('')
    const charWidth = width / (chars.length + 1)
    const colors = ['#171a20', '#3e6ae1', '#5c5e62', '#393c41', '#171a20']

    chars.forEach((ch, i) => {
      ctx.save()
      const x = charWidth * (i + 0.5) + charWidth / 2
      const y = height / 2 + rand(-3, 3)
      const angle = (rand(-25, 25) * Math.PI) / 180
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.font = `bold ${rand(20, 24)}px "Courier New", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = colors[rand(0, colors.length - 1)]
      ctx.fillText(ch, 0, 0)
      ctx.restore()
    })
  }, [code, width, height])

  return <canvas ref={canvasRef} className="v8-auth__captcha-img" />
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
