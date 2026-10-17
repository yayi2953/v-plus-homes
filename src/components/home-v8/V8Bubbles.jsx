import { useEffect, useRef } from 'react'

// 多语言虚拟留言池（英 / 法 / 日 / 韩 / 印地 / 泰）
const MESSAGES = [
  // English
  "Great service, found my apartment in 3 days!",
  "The team helped me with everything from visa to moving.",
  "Clean, modern place exactly as advertised. Love it!",
  "Bilingual support made everything so smooth.",
  "Best relocation experience I've ever had.",
  "The video tour saved me so much time before flying in.",
  "Furnished apartment was move-in ready, perfect!",
  "Responsive consultants, highly recommended.",
  "They handled all the paperwork for me.",
  "Affordable rent in a great neighborhood.",
  "The cleaning service is top-notch.",
  "Felt at home from day one. Thank you V PLUS!",
  // French
  "Service impeccable, appartement trouvé en 3 jours !",
  "L'équipe m'a aidé pour le visa et le déménagement.",
  "Logement propre et moderne, comme annoncé.",
  "Le support bilingue a tout simplifié.",
  "Meilleure expérience de relocation que j'ai eue.",
  "La visite vidéo m'a fait gagner beaucoup de temps.",
  "Appartement meublé prêt à vivre, parfait !",
  "Conseillers réactifs, je recommande vivement.",
  "Ils ont géré toute la paperasse pour moi.",
  "Loyer abordable dans un excellent quartier.",
  // Japanese
  "素晴らしいサービス、3日でアパートが見つかりました！",
  "ビザから引っ越しまで全てサポートしてくれました。",
  "広告通りの綺麗でモダンな物件です。",
  "バイリンガル対応でスムーズでした。",
  "今までで最高の引っ越し体験です。",
  "ビデオツアーで渡航前の時間を節約できました。",
  "家具付きで即入居可能、完璧です！",
  "レスポンスの良いコンサルタント、おすすめです。",
  "書類手続きを全て代行してくれました。",
  "良い立地で手頃な家賃です。",
  // Korean
  "최고의 서비스, 3일 만에 아파트를 구했어요!",
  "비자부터 이사까지 모든 걸 도와줬어요.",
  "광고처럼 깨끗하고 모던한 집이에요.",
  "이중언어 지원이 정말 편리했어요.",
  "지금까지 최고의 이주 경험이에요.",
  "영상 투어로 시간을 정말 아꼈어요.",
  "풀옵션으로 바로 입주 가능, 완벽해요!",
  "응답이 빠른 컨설턴트, 강력 추천해요.",
  "서류 절차를 전부 대신해줬어요.",
  "좋은 동네에 저렴한 월세예요.",
  // Hindi
  "बढ़िया सेवा, 3 दिनों में मकान मिल गया!",
  "टीम ने वीज़ा से लेकर शिफ्टिंग तक सब कुछ मदद किया।",
  "साफ, आधुनिक जगह बिल्कुल वैसी ही जैसा दिखाया गया।",
  "द्विभाषी सहायता से सब कुछ आसान हो गया।",
  "मेरा सबसे अच्छा रिलोकेशन अनुभव रहा।",
  "वीडियो टूर से आने से पहले बहुत समय बचा।",
  "फर्निश्ड अपार्टमेंट तुरंत रहने लायक, बढ़िया!",
  "जवाबदेह सलाहकार, जरूर सुझाऊंगा।",
  "उन्होंने सारा कागज़ी काम मेरे लिए कर दिया।",
  "अच्छे इलाके में सस्ता किराया।",
  // Thai
  "บริการดีมาก หาเจอใน 3 วัน!",
  "ทีมช่วยตั้งแต่วีซ่าถึงย้ายบ้านหมดเลย",
  "บ้านสะอาด ทันสมัย ตามโฆษณาเลย",
  "ทีมสองภาษาช่วยให้ทุกอย่างราบรื่น",
  "ประสบการณ์ย้ายที่ดีที่สุดเท่าที่เคยมีมา",
  "วิดีโอทัวร์ช่วยประหยัดเวลาเป็นอย่างมาก",
  "แอปาร์ตเมนต์เฟอร์นิเจอร์พร้อมเข้าอยู่ สมบูรณ์แบบ!",
  "ที่ปรึกษาตอบกลับรวดเร็ว แนะนำอย่างยิ่ง",
  "พวกเขาจัดการเอกสารทั้งหมดให้แล้ว",
  "ค่าเช่าถูกในย่านดี"
]

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

function makeBubble(w, h, messages) {
  const radius = 28 + Math.random() * 52
  const text = messages[Math.floor(Math.random() * messages.length)]
  return {
    x: radius + Math.random() * (w - radius * 2),
    y: h + radius,
    vy: 0.4 + Math.random() * 0.9,
    vx: (Math.random() - 0.5) * 0.4,
    r: radius,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.01 + Math.random() * 0.02,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    text,
    textLen: text.length,
    popping: false,
    popScale: 1,
    alpha: 0,
    fadeIn: true
  }
}

export default function V8Bubbles() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2)
    const bubbles = []
    const MAX_ON_SCREEN = 60

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // 初始填充
    for (let i = 0; i < 18; i++) {
      const b = makeBubble(w, h, MESSAGES)
      b.y = Math.random() * h
      b.alpha = 1
      b.fadeIn = false
      bubbles.push(b)
    }

    let spawnTimer = 0
    let raf

    const drawBubble = (b) => {
      ctx.save()
      ctx.globalAlpha = b.alpha * (b.popping ? Math.max(0, 1 - (b.popScale - 1) * 1.5) : 1)
      const scale = b.popping ? b.popScale : 1
      ctx.translate(b.x, b.y)
      ctx.scale(scale, scale)

      // 不规则气泡形状
      ctx.beginPath()
      const points = 14
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        const wobble = Math.sin(b.wobble + angle * 3) * b.r * 0.08
        const rr = b.r + wobble
        const px = Math.cos(angle) * rr
        const py = Math.sin(angle) * rr
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()

      // 渐变填充
      const grad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, b.r * 0.1, 0, 0, b.r)
      grad.addColorStop(0, b.color + 'cc')
      grad.addColorStop(0.7, b.color + '88')
      grad.addColorStop(1, b.color + '55')
      ctx.fillStyle = grad
      ctx.fill()

      // 高光
      ctx.beginPath()
      ctx.ellipse(-b.r * 0.35, -b.r * 0.4, b.r * 0.25, b.r * 0.15, -0.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fill()

      // 文字
      ctx.fillStyle = '#fff'
      ctx.font = `500 ${Math.max(10, Math.min(14, b.r * 0.22))}px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const maxChars = Math.floor(b.r * 0.9)
      let display = b.text
      if (b.textLen > maxChars) display = b.text.slice(0, maxChars) + '…'
      ctx.fillText(display, 0, 0)

      ctx.restore()
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h)

      spawnTimer++
      if (spawnTimer > 14 && bubbles.length < MAX_ON_SCREEN) {
        bubbles.push(makeBubble(w, h, MESSAGES))
        spawnTimer = 0
      }

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]
        b.wobble += b.wobbleSpeed
        if (b.fadeIn) {
          b.alpha = Math.min(1, b.alpha + 0.04)
          if (b.alpha >= 1) b.fadeIn = false
        }

        if (b.popping) {
          b.popScale += 0.06
          if (b.popScale > 2.2) {
            bubbles.splice(i, 1)
            continue
          }
        } else {
          b.y -= b.vy
          b.x += Math.sin(b.wobble) * b.vx
          if (b.y - b.r < 20) {
            b.popping = true
          }
        }

        drawBubble(b)
      }

      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="v8-section" id="messages">
      <div className="v8-wrap">
        <div className="v8-sec-head v8-rise">
          <p className="v8-eyebrow">CUSTOMER VOICES</p>
          <h2 className="v8-h-sec" style={{ marginTop: 12 }}>来自全球客户的真实留言</h2>
          <p className="v8-lede">1,000+ 条来自不同国家客户的反馈，汇聚成向上的温度。</p>
        </div>
        <div ref={wrapRef} className="v8-bubbles__wrap v8-rise">
          <canvas ref={canvasRef} className="v8-bubbles__canvas" />
        </div>
      </div>
    </section>
  )
}
