import { useEffect, useRef } from 'react'

// 多语言虚拟留言池（英 / 法 / 日 / 韩 / 印地 / 泰）
const MESSAGES = [
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

const COLORS = ['#1e40af', '#0f766e', '#b91c1c', '#6d28d9', '#0369a1', '#9f1239']
const LANE_HEIGHT = 42

// 各文化名 + 姓组合，生成 1000 个不重复全名
const NAME_POOLS = {
  en: {
    given: ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna'],
    sur: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris']
  },
  fr: {
    given: ['Jean', 'Marie', 'Pierre', 'Anne', 'Michel', 'Isabelle', 'Philippe', 'Nathalie', 'François', 'Catherine', 'Nicolas', 'Sophie', 'Luc', 'Julie', 'Marc', 'Camille', 'David', 'Charlotte', 'Thomas', 'Émilie', 'Antoine', 'Laura', 'Alexandre', 'Manon', 'Julien', 'Clara', 'Maxime', 'Léa', 'Quentin', 'Chloé', 'Romain', 'Sarah', 'Kevin', 'Océane', 'Mathieu', 'Inès', 'Arthur', 'Lola', 'Théo', 'Zoe'],
    sur: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefevre', 'Mercier', 'Dupont']
  },
  ja: {
    given: ['Haruto', 'Yui', 'Sota', 'Hina', 'Ren', 'Mio', 'Yuto', 'Mei', 'Hiroto', 'Sakura', 'Aoi', 'Yuna', 'Riku', 'Himari', 'Sora', 'Rin', 'Yuki', 'Amane', 'Daichi', 'Koharu', 'Kaito', 'Misaki', 'Haruki', 'Nanami', 'Ryusei', 'Tsumugi', 'Sosuke', 'Wakana', 'Haru', 'Kokona', 'Yusei', 'Riko', 'Koki', 'Sae', 'Tatsuki', 'Kotone', 'Hayato', 'Mao', 'Ruki', 'Suzuka'],
    sur: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishii']
  },
  ko: {
    given: ['Min-jun', 'Seo-yeon', 'Ji-ho', 'Ha-eun', 'Seo-jun', 'Ji-woo', 'Do-yun', 'Seo-hyun', 'Joon-woo', 'Min-seo', 'Ju-won', 'Yoon-seo', 'Ha-joon', 'Chae-won', 'Ji-hoon', 'Da-eun', 'Seung-woo', 'Yoo-na', 'Ji-hyun', 'So-hee', 'Jin-woo', 'Hae-won', 'Min-kyu', 'Ji-min', 'Seung-min', 'Eun-ji', 'Hyung-woo', 'Seo-ah', 'Jae-won', 'Ye-jin', 'Sung-jun', 'Su-bin', 'Tae-woo', 'Na-yeon', 'Jung-woo', 'Mi-rae', 'Kyung-joon', 'Yu-na', 'Dong-hyun', 'Si-eun'],
    sur: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Oh', 'Seo', 'Shin', 'Kwon', 'Han', 'Sohn', 'Cho', 'Hwang', 'Ahn', 'Song', 'Ryu', 'Hong', 'Jeon', 'Ko', 'Joo']
  },
  hi: {
    given: ['Aarav', 'Priya', 'Vihaan', 'Ananya', 'Arjun', 'Diya', 'Reyansh', 'Saanvi', 'Krishna', 'Ishita', 'Ishaan', 'Myra', 'Shaurya', 'Aadhya', 'Atharv', 'Anika', 'Advik', 'Sara', 'Dhruv', 'Kavya', 'Kabir', 'Anjali', 'Rohan', 'Neha', 'Karan', 'Pooja', 'Aryan', 'Riya', 'Vivaan', 'Sneha', 'Aditya', 'Divya', 'Arnav', 'Nisha', 'Karthik', 'Meera', 'Raghav', 'Tanvi', 'Manav', 'Kriti'],
    sur: ['Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Rao', 'Chopra', 'Mehta', 'Joshi', 'Nair', 'Agarwal', 'Desai', 'Kapoor', 'Bose', 'Pandey', 'Rastogi', 'Shah', 'Malhotra', 'Bhat', 'Iyer', 'Menon', 'Thakur', 'Chauhan']
  },
  th: {
    given: ['Somchai', 'Niran', 'Kanya', 'Anan', 'Somsak', 'Malee', 'Somboon', 'Pim', 'Chai', 'Nok', 'Prasert', 'Dao', 'Wichai', 'Bua', 'Amnat', 'Fah', 'Somdet', 'Kwan', 'Thongchai', 'Ploy', 'Manop', 'Namtarn', 'Charn', 'Kae', 'Sakchai', 'Mint', 'Phong', 'Pang', 'Tawatchai', 'Ning', 'Veraphol', 'Aom', 'Sathien', 'Pimchanok', 'Niphon', 'Nattha', 'Wirot', 'Bussakorn', 'Kriengkrai', 'Jittranee'],
    sur: ['Srisawat', 'Phueng', 'Charoen', 'Saetang', 'Wong', 'Sukhum', 'Sinthawan', 'Lao', 'Boonmee', 'Nanthachai', 'Panya', 'Suksawat', 'Chaiyo', 'Khambai', 'Yothi', 'Phat', 'Phon', 'Sri', 'Thanom', 'Kham', 'Sang', 'Nok', 'Peng', 'Chaem', 'Saelim']
  }
}

// 生成 1000 个不重复全名（按文化均分）
function generateNames() {
  const names = []
  const cultures = Object.keys(NAME_POOLS)
  const perCulture = Math.ceil(1000 / cultures.length)
  for (const c of cultures) {
    const { given, sur } = NAME_POOLS[c]
    const pool = new Set()
    let guard = 0
    while (pool.size < perCulture && guard < 50000) {
      const g = given[Math.floor(Math.random() * given.length)]
      const s = sur[Math.floor(Math.random() * sur.length)]
      pool.add(`${g} ${s}`)
      guard++
    }
    for (const n of pool) names.push(n)
  }
  // 打乱
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[names[i], names[j]] = [names[j], names[i]]
  }
  return names
}

const NAMES = generateNames()

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function makeMessage(w, lanes) {
  const lane = lanes[Math.floor(Math.random() * lanes.length)]
  const text = rand(MESSAGES)
  const name = rand(NAMES)
  const color = rand(COLORS)
  const speed = 1.2 + Math.random() * 1.4
  const fontSize = 14 + Math.floor(Math.random() * 4)
  return { y: lane.y, text: `${name}: ${text}`, color, speed, fontSize }
}

export default function V8Bubbles() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const lanes = []
    const messages = []
    let spawnTimer = 0
    let raf

    const measure = () => {
      const rect = wrap.getBoundingClientRect()
      w = rect.width
      h = rect.height
      if (w > 0 && h > 0) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        lanes.length = 0
        const laneCount = Math.max(4, Math.floor(h / LANE_HEIGHT))
        for (let i = 0; i < laneCount; i++) {
          lanes.push({ y: 28 + i * LANE_HEIGHT })
        }
        // 预填充
        if (messages.length === 0) {
          for (let i = 0; i < 14; i++) {
            const m = makeMessage(w, lanes)
            ctx.font = `500 ${m.fontSize}px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
            const textWidth = ctx.measureText(m.text).width
            messages.push({ ...m, x: Math.random() * w, width: textWidth })
          }
        }
      }
    }

    const spawn = () => {
      if (lanes.length === 0 || w <= 0) return
      const m = makeMessage(w, lanes)
      ctx.font = `500 ${m.fontSize}px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
      const textWidth = ctx.measureText(m.text).width
      messages.push({ ...m, x: w + 20, width: textWidth })
    }

    const tick = () => {
      if (w <= 0 || h <= 0) {
        measure()
      } else {
        ctx.clearRect(0, 0, w, h)
        spawnTimer++
        if (spawnTimer > 25) {
          spawn()
          spawnTimer = 0
        }

        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i]
          m.x -= m.speed

          ctx.font = `500 ${m.fontSize}px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
          const padX = 10, padY = 5
          const bx = m.x - padX
          const by = m.y - m.fontSize * 0.75
          const bw = m.width + padX * 2
          const bh = m.fontSize + padY * 2
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
          roundRect(ctx, bx, by, bw, bh, bh / 2)
          ctx.fill()

          ctx.fillStyle = m.color
          ctx.textBaseline = 'middle'
          ctx.fillText(m.text, m.x, m.y)

          if (m.x + m.width < -40) {
            messages.splice(i, 1)
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }

    measure()
    tick()

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => measure())
      : null
    if (ro) ro.observe(wrap)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      if (ro) ro.disconnect()
    }
  }, [])

  return (
    <section className="v8-section" id="messages">
      <div className="v8-wrap">
        <div className="v8-bubbles v8-rise">
          <div className="v8-bubbles__head">
            <p className="v8-eyebrow">CUSTOMER VOICES</p>
            <h2 className="v8-h-sec" style={{ marginTop: 12 }}>来自全球客户的真实留言</h2>
          </div>
          <div ref={wrapRef} className="v8-bubbles__wrap">
            <canvas ref={canvasRef} className="v8-bubbles__canvas" />
          </div>
        </div>
      </div>
    </section>
  )
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
