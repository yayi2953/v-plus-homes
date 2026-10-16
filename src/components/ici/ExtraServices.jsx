import { motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { Sparkle, ArrowUpRight } from './Icons.jsx'
import SmartImage from '../common/SmartImage.jsx'

// 服务场景图（按后台 icon key 绑定；定制服务摄影，见 public/images/extras）
const EXTRA_IMG = {
  video: '/images/extras/video.jpg',
  plane: '/images/extras/plane.jpg',
  passport: '/images/extras/passport.jpg',
  broom: '/images/extras/broom.jpg',
  truck: '/images/extras/truck.jpg',
  briefcase: '/images/extras/briefcase.jpg',
  house: '/images/extras/house.jpg'
}
const CARD_CTA = { zh: '咨询此项', en: 'Enquire' }

export default function ExtraServices() {
  const { c, lang } = useIciI18n()
  const s = c.extraServices
  const cards = (s.cards || []).filter((x) => x && x.title)

  const goContact = () => {
    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const onCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      goContact()
    }
  }

  return (
    <section className="extras" id="extra-services">
      <div className="container">
        <span className="eyebrow-pill eyebrow-pill--dark">
          <Sparkle size={12} /> {s.eyebrow}
        </span>
        <h2 className="section-title extras__title">
          {s.titleA}
          <span className="text-coral">{s.titleAccent}</span>
        </h2>

        <div className="extras__grid">
          {cards.map((card, i) => {
            const img = EXTRA_IMG[card.icon] || '/images/feature-atrium.jpg'
            return (
              <motion.article
                className="extras-card"
                key={`${card.title}-${i}`}
                role="button"
                tabIndex={0}
                onClick={goContact}
                onKeyDown={onCardKey}
                aria-label={card.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.06 }}
              >
                <div className="extras-card__media">
                  <SmartImage src={img} alt={card.title} />
                </div>
                <div className="extras-card__veil" />
                <div className="extras-card__body">
                  <h4>{card.title}</h4>
                  <span className="extras-card__pill">
                    {CARD_CTA[lang] || CARD_CTA.zh}
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </motion.article>
            )
          })}

          {/* 第 8 格：深色礼宾 CTA，补位 4×2 网格并承接「一站式」叙事 */}
          <motion.button
            type="button"
            className="extras-card extras-card--more"
            onClick={goContact}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          >
            <span className="extras-card__more-inner">
              <span className="extras-card__more-title">{s.moreTitle}</span>
              <span className="extras-card__more-desc">{s.moreDesc}</span>
              <span className="extras-card__pill extras-card__pill--solid">
                {s.moreCta}
                <ArrowUpRight size={14} />
              </span>
            </span>
          </motion.button>
        </div>

        <p className="extras__footnote">{s.footnote}</p>
      </div>
    </section>
  )
}
