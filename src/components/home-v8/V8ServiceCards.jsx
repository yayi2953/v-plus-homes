import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import SmartImage from '../common/SmartImage.jsx'

/* 服务卡片网格（复刻 DJI 商城「选购理由」布局，无图片版）：
   4 列白色圆角卡片，各列上下卡高度比保持既有比例：
   列1/3 上下各 50%、列2 矮数字卡+高卡(33/67)、列4 高卡+矮卡(67/33)；
   矮卡配简单图形（描边数字框 / 对勾 / 斜体大字），卡内文字垂直居中。 */

export default function V8ServiceCards() {
  const { c } = useIciI18n()
  const t = c.v8?.serviceCards || {}
  return (
    <div className="v8-svc">
      <h3 className="v8-svc__title" data-edit-key="v8.serviceCards.title">{t.title}</h3>
      <div className="v8-svc__grid">
        {/* 列 1：上卡(50) + 矮卡(50)，描边数字框图形 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img v8-svc__card--photog">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c1a">{t.c1a}</span>
            <span className="v8-svc__imgbox"><img src="/images/camera.jpg?v=1" alt="" loading="lazy" /></span>
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c1b">{t.c1b}</span>
            <span className="v8-svc__pct" aria-hidden="true"><b>0</b><i>%</i></span>
          </div>
        </div>

        {/* 列 2：矮数字卡(33) + 高卡(67)，橙色特大数字 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--mini v8-svc__card--num">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c2a">{t.c2a}</span>
            <span className="v8-svc__big" aria-hidden="true">{t.c2big}</span>
          </div>
          <div className="v8-svc__card v8-svc__card--img v8-svc__card--skyline">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c2b">{t.c2b}</span>
            <span className="v8-svc__imgbox"><img src="/images/skyline.jpg" alt="" loading="lazy" /></span>
          </div>
        </div>

        {/* 列 3：上卡(50) 文案置顶+顾问半身照，矮卡(50) 对勾图形 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img v8-svc__card--person">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c3a">{t.c3a}</span>
            <span className="v8-svc__imgbox"><img src="/images/consultant.jpg" alt="" loading="lazy" /></span>
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c3b">{t.c3b}</span>
            <span className="v8-svc__check" aria-hidden="true">✓</span>
          </div>
        </div>

        {/* 列 4：高卡(67) + 矮卡(33)，斜体大字图形 */}
        <div className="v8-svc__col">
          <div className="v8-svc__card v8-svc__card--img v8-svc__card--gift">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c4a">{t.c4a}</span>
            <span className="v8-svc__imgbox"><img src="/images/gift.jpg?v=1" alt="" loading="lazy" /></span>
          </div>
          <div className="v8-svc__card v8-svc__card--mini">
            <span className="v8-svc__card-t" data-edit-key="v8.serviceCards.c4b">{t.c4b}</span>
            <span className="v8-svc__free" aria-hidden="true">{t.c4big}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
