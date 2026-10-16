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
  // active：最近交互的户型（行高亮 + 手机无关）；hovered：指针/键盘正悬停的户型（驱动 3D 舞台），离开为 null
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(null)
  if (!types.length) return null

  const pick = (key) => {
    // 与 Navbar 同一事件契约：Discover 监听后切到该户型
    window.dispatchEvent(new CustomEvent('ici:switch-tab', { detail: key }))
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })
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
          {/* 索引行：整行即按钮，悬停/聚焦驱动右侧 3D 舞台；点击执行原有筛选 */}
          <div className="v8-type-index">
            {types.map((tp, i) => (
              <button
                type="button"
                key={tp.key}
                className={`v8-trow${active === i ? ' is-on' : ''}`}
                onMouseEnter={() => { setActive(i); setHovered(i) }}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => { setActive(i); setHovered(i) }}
                onBlur={() => setHovered(null)}
                onClick={() => pick(tp.key)}
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

          {/* 3D 建筑沙盘舞台：纯装饰，随索引联动转向（手机端整体隐藏） */}
          <div className="v8-type-stage" aria-hidden="true">
            <TypeHouse activeIndex={hovered} />
          </div>
        </div>
      </div>
    </section>
  )
}
