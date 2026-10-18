import { useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import SmartImage from '../common/SmartImage.jsx'
import TypeHouse from './TypeHouse.jsx'

// 数据模型无户型图：映射到本地已有房源图，手机端行首缩略图使用
const TYPE_IMG = {
  luxury: '/images/listing-penthouse.jpg',
  standard: '/images/listing-family.jpg',
  student: '/images/listing-student1.jpg',
  city: '/images/listing-urban1.jpg'
}

export default function V8Types() {
  const { c } = useIciI18n()
  const types = c.discover?.types || []
  const t = c.v8?.types || {}
  // active：点击选中的户型（行高亮 + 驱动视频舞台）
  const [active, setActive] = useState(0)
  if (!types.length) return null

  const pick = (key, i) => {
    setActive(i)
    // 不再跳转 /listings：通知首页内嵌展示区（V8TypeResults）展开该类型房源并滚动到位
    window.dispatchEvent(new CustomEvent('v8:show-type', { detail: { type: key } }))
  }

  return (
    <section className="v8-section" id="types">
      <div className="v8-wrap">
        <div className="v8-sec-head v8-rise">
          <p className="v8-eyebrow">{t.eyebrow}</p>
          <h2 className="v8-h-sec" style={{ marginTop: 12 }}>{t.title}</h2>
          <p className="v8-lede">{t.desc}</p>
        </div>

        <div className="v8-types v8-rise">
          {/* 索引行：点击切换右侧视频舞台；点击执行原有筛选 */}
          <div className="v8-type-index">
            {types.map((tp, i) => (
              <button
                type="button"
                key={tp.key}
                className={`v8-trow${active === i ? ' is-on' : ''}`}
                onClick={() => pick(tp.key, i)}
                aria-label={`${tp.label}, ${t.view}`}
              >
                {/* 手机端行首缩略图（桌面隐藏，不加载） */}
                <span className="v8-trow__thumb">
                  <SmartImage src={TYPE_IMG[tp.key] || TYPE_IMG.city} alt="" ariaHidden />
                </span>
                <span className="v8-trow__no" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="v8-trow__main">
                  <span className="v8-trow__name">{tp.label}</span>
                  <span className="v8-trow__desc">{tp.desc}</span>
                </span>
                <span className="v8-trow__go" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* 视频舞台：随点击选中的户型切换（手机端整体隐藏） */}
          <div className="v8-type-stage" aria-hidden="true">
            <TypeHouse activeIndex={active} />
          </div>
        </div>
      </div>
    </section>
  )
}
