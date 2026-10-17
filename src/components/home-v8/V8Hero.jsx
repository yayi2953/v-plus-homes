import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useContact } from '../ici/contactContext.jsx'

// 首屏静态背景图
const BG_IMAGE_SRC = '/images/listing-family.jpg'

export default function V8Hero() {
  const { c } = useIciI18n()
  const { openContact } = useContact()

  const t = c.v8?.hero || {}

  return (
    <section className="v8-hero" id="top">
      <div className="v8-hero-canvas">
        {/* 静态背景图 + 灰色毛玻璃 + 四周白色渐变羽化揉进页面背景 */}
        <div className="v8-hero-videobg" aria-hidden="true">
          <img src={BG_IMAGE_SRC} alt="" />
        </div>
      </div>
      <div className="v8-hero-body">
        <p className="v8-eyebrow">{t.eyebrow}</p>
        <p className="v8-lede">{t.lede}</p>
        <div className="v8-hero-cta">
          <button type="button" className="v8-tlink" onClick={openContact}>
            {t.whatsapp}
          </button>
        </div>
      </div>
    </section>
  )
}
