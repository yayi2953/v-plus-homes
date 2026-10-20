import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import SmartImage from '../common/SmartImage.jsx'

/* 精选房源卡片条（DJI「热卖爆款」式样）：
   浅灰底整宽区块 + 横排竖版卡片 —— 图片贴满整卡，文字白字叠加在图片
   下部渐变上（名称 / 小字描述 / 价格），右下角白底微圆角按钮。
   仅采用参考样式，图片与文案均来自站内房源数据。 */

export default function V8FeaturedStrip({ items, onOpen, viewText }) {
  const { lang } = useIciI18n()
  if (!items?.length) return null
  return (
    <div className="v8-fstrip">
      <h3 className="v8-fstrip__title" data-edit-key="v8.featured.title">{lang === 'zh' ? '精选房源' : lang === 'ja' ? '注目物件' : 'Featured Homes'}</h3>
      <div className="v8-fstrip__row">
        {items.slice(0, 4).map(({ p, index }) => (
          <button
            type="button"
            key={`${p.code}-${index}`}
            className="v8-fscard"
            onClick={() => onOpen(index)}
            aria-label={p.district}
          >
            <SmartImage src={p.img} alt="" />
            <span className="v8-fscard__shade" aria-hidden="true" />
            <span className="v8-fscard__info">
              <span className="v8-fscard__name">{p.district}</span>
              <span className="v8-fscard__sub">{[p.br, p.metro].filter(Boolean).join(' · ')}</span>
              <span className="v8-fscard__meta">
                <span className="v8-fscard__price">{p.price}</span>
                <span className="v8-fscard__btn">{viewText || (lang === 'zh' ? '查看详情' : lang === 'ja' ? '詳細を見る' : 'View')}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
