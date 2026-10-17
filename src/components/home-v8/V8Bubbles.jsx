import { useEffect, useRef, useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

// 多语言虚拟留言池（英 / 法 / 日 / 韩 / 印地 / 泰）
// 80% 负面抱怨（为什么没有房子租）、20% 期待（希望能开启租房）
const MESSAGES = [
  // ===== 英语 =====
  "Why is there no house to rent here?",
  "I've been checking for weeks — still no available units.",
  "No listings at all? What kind of rental site is this?",
  "I called, they said everything is taken. No houses left to rent.",
  "Why can't I find any apartment to rent? Everything is gone.",
  "This site shows no available rentals. Very frustrating.",
  "I need a place to rent but there's literally nothing here.",
  "Why are there no houses for rent? The listings are all empty.",
  "Tried to book, but no units available for rent. Disappointed.",
  "How come there's not a single house to rent on this whole site?",
  "I keep refreshing, still no rentals available.",
  "Why is every listing unavailable? I just want to rent a place.",
  "No rentals, no response, nothing. What's the point?",
  "I really need to rent a house but there's nothing here.",
  "Called three times — they said no houses for rent right now.",
  "Why are there no apartments to rent? The site looks empty.",
  "It's been a month and still no house I can rent.",
  "Every listing says unavailable. Why even show them?",
  "I can't find a single place to rent. This is impossible.",
  "Why is there zero availability for rentals?",
  "Hope they can start renting out units soon.",
  "Really hoping rentals become available next month.",
  "Wish they'd open up more apartments for rent.",
  "Fingers crossed they start renting some places soon.",
  "Hope new rental listings come online shortly.",
  "Would love to rent from them once they have units.",

  // ===== 法语 =====
  "Pourquoi n'y a-t-il aucun logement à louer ?",
  "Je cherche depuis des semaines, rien n'est disponible.",
  "Aucune annonce ? Quel genre de site de location est-ce ?",
  "J'ai appelé, tout est pris. Plus rien à louer.",
  "Pourquoi je ne trouve aucun appartement à louer ?",
  "Ce site n'affiche aucune location disponible. Frustrant.",
  "J'ai besoin d'un logement mais il n'y a rien ici.",
  "Pourquoi n'y a-t-il aucune maison à louer ?",
  "J'ai essayé de réserver, mais aucune unité disponible.",
  "Comment se fait-il qu'il n'y ait rien à louer ?",
  "Je rafraîchis sans cesse, toujours aucune location.",
  "Toutes les annonces sont indisponibles. Pourquoi les afficher ?",
  "Aucune réponse, aucune location. À quoi ça sert ?",
  "J'ai vraiment besoin de louer mais il n'y a rien.",
  "Appelé trois fois — plus aucune maison à louer.",
  "Pourquoi n'y a-t-il aucune disponibilité ?",
  "Ça fait un mois et toujours rien à louer.",
  "Chaque annonce indique indisponible. Pourquoi ?",
  "Je ne trouve aucun endroit à louer. Impossible.",
  "Pourquoi y a-t-il zéro disponibilité ?",
  "J'espère qu'ils vont commencer à louer bientôt.",
  "Espérons que des locations arrivent le mois prochain.",
  "J'aimerais qu'ils ouvrent plus d'appartements à la location.",
  "En espérant qu'ils proposent des logements à louer vite.",
  "J'espère que de nouvelles annonces de location arrivent.",

  // ===== 日语 =====
  "なぜ賃貸物件が一つもないのですか？",
  "何週間も探していますが、空き物件がありません。",
  "物件が全然ない。これは賃貸サイトなのか？",
  "電話したら全部埋まっていると言われた。",
  "なぜアパートが見つからないの？全部なくなった。",
  "このサイト、空き物件が一つもなくてイライラする。",
  "住む場所が必要なのに、ここには何もない。",
  "なぜ賃貸できる家がないの？リストが空っぽ。",
  "予約しようとしたけど、空き物件なし。残念。",
  "どうして一軒も借りられる家がないの？",
  "何度も更新してるけど、空き物件が出てこない。",
  "全部「空きなし」になってる。表示する意味ある？",
  "物件もない、返事もない、何もない。",
  "本当に家を借りたいのに、ここには何もない。",
  "三度電話したけど、今は賃貸物件なしだって。",
  "なぜ空き物件がゼロなの？",
  "一ヶ月経つけど、まだ借りられる家がない。",
  "全部「利用不可」になってる。なぜ掲載するの？",
  "一軒も借りられる場所が見つからない。無理だ。",
  "なぜ空きが全然ないの？",
  "早く賃貸物件が出てほしい。",
  "来月には空きが出るといいな。",
  "もっとアパートを貸し出してほしい。",
  "早く物件を貸し始めてくれると嬉しい。",
  "新しい賃貸物件がすぐ出るといいな。",

  // ===== 韩语 =====
  "왜 여기엔 빌릴 집이 하나도 없나요?",
  "몇 주째 보고 있는데 빈 매물이 없어요.",
  "매물이 전혀 없네요. 무슨 렌탈 사이트예요?",
  "전화했더니 다 계약됐다고 해요. 빌릴 집 없음.",
  "왜 아파트를 못 찾죠? 다 없어졌어요.",
  "이 사이트 빈 매물이 하나도 없어서 답답해요.",
  "살 곳이 필요한데 여기엔 아무것도 없네요.",
  "왜 빌릴 집이 없죠? 목록이 텅 비었어요.",
  "예약하려 했는데 빈 매물 없음. 실망이에요.",
  "어떻게 빌릴 곳이 하나도 없을 수 있죠?",
  "계속 새로고침하는데 아직 매물 없어요.",
  "다 '이용 불가'네요. 왜 보여주는 거죠?",
  "매물도 없고 답장도 없고 아무것도 없네요.",
  "정말 집 빌리고 싶은데 여기엔 없어요.",
  "세 번 전화했는데 지금은 매물 없다고요.",
  "왜 빈 매물이 0개인가요?",
  "한 달이 됐는데 아직 빌릴 집이 없어요.",
  "모두 '이용 불가'예요. 왜 올린 거죠?",
  "빌릴 곳을 하나도 못 찾겠어요. 불가능해요.",
  "왜 매물이 전혀 없나요?",
  "얼른 렌탈 매물이 나왔으면 좋겠어요.",
  "다음 달엔 매물이 나오길 바래요.",
  "아파트를 더 많이 내놨으면 좋겠어요.",
  "얼른 집을 빌려줬으면 좋겠어요.",
  "새 매물이 곧 나왔으면 좋겠어요.",

  // ===== 印地语 =====
  "यहाँ किराए के लिए कोई मकान क्यों नहीं है?",
  "हफ्तों से देख रहा हूँ, कोई खाली मकान नहीं।",
  "कोई सूची नहीं? यह कैसी किराया साइट है?",
  "फोन किया, सब बुक हैं। किराए के लिए कुछ नहीं।",
  "कोई अपार्टमेंट क्यों नहीं मिल रहा? सब चले गए।",
  "इस साइट पर कोई किराया उपलब्ध नहीं। निराशाजनक।",
  "मुझे रहने की जगह चाहिए पर यहाँ कुछ नहीं।",
  "किराए के लिए मकान क्यों नहीं है? सूची खाली है।",
  "बुक करने की कोशिश की, पर कोई यूनिट नहीं।",
  "एक भी मकान किराए पर क्यों नहीं है?",
  "बार-बार रिफ्रेश कर रहा हूँ, फिर भी कुछ नहीं।",
  "सब 'उपलब्ध नहीं' दिखा रहे हैं। क्यों दिखाते हो?",
  "कुछ नहीं, कोई जवाब नहीं, बेकार।",
  "मुझे सच में मकान किराए पर चाहिए पर यहाँ कुछ नहीं।",
  "तीन बार फोन किया — अभी कोई मकान किराए पर नहीं।",
  "कोई उपलब्धता क्यों नहीं है?",
  "एक महीना हो गया, फिर भी किराए के लिए कुछ नहीं।",
  "हर सूची में 'उपलब्ध नहीं'। क्यों?",
  "एक भी जगह किराए पर नहीं मिल रही। नामुमकिन।",
  "क्यों शून्य उपलब्धता है?",
  "उम्मीद है जल्द मकान किराए पर देना शुरू करें।",
  "आशा है अगले महीने किराया उपलब्ध हो।",
  "चाहिए कि वे और अपार्टमेंट किराए पर दें।",
  "उम्मीद है जल्द किराया के मकान उपलब्ध हों।",

  // ===== 泰语 =====
  "ทำไมที่นี่ไม่มีบ้านให้เช่าล่ะ?",
  "มาดูหลายสัปดาห์แล้ว ยังไม่มีห้องว่าง",
  "ไม่มีรายการเลยนะ นี่เว็บเช่าบ้านหรือเปล่า",
  "โทรไปแล้ว บอกว่าหมดแล้ว ไม่มีบ้านให้เช่า",
  "ทำไมหาอพาร์ทเมนต์ไม่เจอ? หมดหมดเลย",
  "เว็บนี้ไม่มีห้องว่างเลย รำคาญมาก",
  "ต้องการที่อยู่ แต่ที่นี่ไม่มีอะไรเลย",
  "ทำไมไม่มีบ้านให้เช่า? รายการว่างเปล่า",
  "ลองจองแล้ว ไม่มีห้องว่าง ผิดหวัง",
  "ทำไมไม่มีบ้านหลังเดียวให้เช่าล่ะ?",
  "รีเฟรชไปเรื่อย ยังไม่มีห้องเช่า",
  "ทุกรายการบอกว่าไม่พร้อม เอาไปแสดงทำไม",
  "ไม่มีอะไรเลย ไม่ตอบเลย ไม่มีประโยชน์",
  "อยากเช่าบ้านจริงๆ แต่ที่นี่ไม่มี",
  "โทรสามครั้งแล้ว บอกว่าไม่มีบ้านให้เช่าตอนนี้",
  "ทำไมไม่มีห้องว่างเลย?",
  "เป็นเดือนแล้วยังไม่มีบ้านให้เช่า",
  "ทุกรายการไม่พร้อมใช้ ทำไมต้องโชว์",
  "หาที่เช่าไม่เจอเลย เป็นไปไม่ได้",
  "ทำไมห้องว่างเป็นศูนย์ล่ะ?",
  "หวังว่าเราจะมีบ้านให้เช่าเร็วๆ นี้",
  "หวังว่าหน้าจะมีห้องเช่าให้",
  "อยากให้เปิดอพาร์ทเมนต์ให้เช่ามากขึ้น",
  "หวังว่าจะมีบ้านให้เช่าเร็วๆ นี้"
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
  return { y: lane.y, text: `${name}: ${text}`, color, speed, fontSize, real: false }
}

// 真实留言：绿色 + 「真实」标签，速度稍慢便于阅读
function makeRealMessage(w, lanes, realMsg) {
  const lane = lanes[Math.floor(Math.random() * lanes.length)]
  const name = realMsg.name || '匿名'
  const text = realMsg.message || ''
  const speed = 0.9 + Math.random() * 0.6
  const fontSize = 15
  return { y: lane.y, text: `${name}: ${text}`, color: '#0f766e', speed, fontSize, real: true }
}

export default function V8Bubbles() {
  const { lang } = useIciI18n()
  const zh = lang === 'zh'
  const t = (zhStr, enStr) => (zh ? zhStr : enStr)
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'ok'|'err', text }
  const realMessagesRef = useRef([])

  async function submitMessage(e) {
    e.preventDefault()
    if (submitting) return
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFeedback({ type: 'err', text: t('请填写姓名、邮箱和留言内容', 'Please fill in name, email and message') })
      return
    }
    setSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          type: 'message-board'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('提交失败', 'Submission failed'))
      setFeedback({ type: 'ok', text: t('留言已提交，感谢您的反馈！', 'Message submitted, thanks for your feedback!') })
      setForm({ name: '', email: '', phone: '', message: '' })
      // 重新拉取真实留言，让弹幕尽快展示新提交的内容
      fetch('/api/messages')
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d.messages)) realMessagesRef.current = d.messages })
        .catch(() => {})
    } catch (err) {
      setFeedback({ type: 'err', text: err.message || t('提交失败，请稍后重试', 'Submission failed, please try again later') })
    } finally {
      setSubmitting(false)
    }
  }

  // 拉取真实留言
  useEffect(() => {
    let cancelled = false
    fetch('/api/messages')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.messages)) {
          realMessagesRef.current = d.messages
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

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
      const reals = realMessagesRef.current
      // 30% 概率使用真实留言（如果有）
      const useReal = reals.length > 0 && Math.random() < 0.3
      const m = useReal
        ? makeRealMessage(w, lanes, rand(reals))
        : makeMessage(w, lanes)
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
            <p className="v8-eyebrow">{t('客户声音', 'CUSTOMER VOICES')}</p>
            <h2 className="v8-h-sec" style={{ marginTop: 12 }}>{t('来自全球客户的真实留言', 'Real Messages from Customers Worldwide')}</h2>
          </div>
          <div ref={wrapRef} className="v8-bubbles__wrap">
            <canvas ref={canvasRef} className="v8-bubbles__canvas" />
          </div>

          <div className="v8-msgform">
            <div className="v8-msgform__head">
              <p className="v8-eyebrow">{t('留下您的留言', 'LEAVE A MESSAGE')}</p>
              <h3 className="v8-msgform__title">{t('我要留言', 'Leave a Message')}</h3>
              <p className="v8-msgform__sub">{t('告诉我们您的需求或疑问，我们会尽快与您联系。', 'Tell us your needs or questions, and we\'ll get back to you soon.')}</p>
            </div>
            <form className="v8-msgform__body" onSubmit={submitMessage}>
              <div className="v8-msgform__row">
                <label className="v8-msgform__field">
                  <span>{t('姓名 *', 'Name *')}</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('您的姓名', 'Your name')}
                    required
                  />
                </label>
                <label className="v8-msgform__field">
                  <span>{t('邮箱 *', 'Email *')}</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className="v8-msgform__field">
                  <span>{t('电话', 'Phone')}</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder={t('选填', 'Optional')}
                  />
                </label>
              </div>
              <label className="v8-msgform__field">
                <span>{t('留言内容 *', 'Message *')}</span>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t('请输入您想说的话...', 'Type your message...')}
                  rows={4}
                  required
                />
              </label>
              {feedback && (
                <div className={`v8-msgform__feedback v8-msgform__feedback--${feedback.type}`}>
                  {feedback.text}
                </div>
              )}
              <button type="submit" className="v8-btn v8-btn--dark" disabled={submitting}>
                {submitting ? t('提交中...', 'Submitting...') : t('提交留言', 'Submit')}
              </button>
            </form>
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
