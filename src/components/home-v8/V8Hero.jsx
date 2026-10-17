import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useContact } from '../ici/contactContext.jsx'

// 首屏静态背景图
const BG_IMAGE_SRC = '/images/hero-cityscape.jpg'

export default function V8Hero() {
  const { c } = useIciI18n()
  const { openContact } = useContact()

  const t = c.v8?.hero || {}

  return (
    <section className="v8-hero" id="top">
      <div className="v8-hero-canvas">
        {/* 静态背景图 */}
        <div className="v8-hero-videobg" aria-hidden="true">
          <img src={BG_IMAGE_SRC} alt="" />
        </div>
        {/* 图片上的文字层：居中白色，小标题 + 大粗体标题 + 副标题 */}
        <div className="v8-hero-overlay">
          <p className="v8-hero-overlay__eyebrow">{t.eyebrow}</p>
          <h1 className="v8-hero-overlay__title">V&nbsp;PLUS</h1>
          <p className="v8-hero-overlay__sub">{t.lede}</p>
        </div>
      </div>
      <div className="v8-hero-body">
        <div className="v8-hero-cta">
          <button type="button" className="v8-tlink" onClick={openContact}>
            {t.whatsapp}
          </button>
        </div>
      </div>
    </section>
  )
}
