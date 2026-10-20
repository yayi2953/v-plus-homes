import { useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import SmartImage from '../common/SmartImage.jsx'
import TypeHouse from './TypeHouse.jsx'
import V8QuizModal from './V8QuizModal.jsx'

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
  // 快速找房问卷弹窗
  const [quizOpen, setQuizOpen] = useState(false)
  // active：鼠标停留选中的户型（行高亮 + 驱动视频舞台）
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
          <p className="v8-eyebrow" data-edit-key="v8.types.eyebrow">{t.eyebrow}</p>
          <h2 className="v8-h-sec" style={{ marginTop: 12 }} data-edit-key="v8.types.title">{t.title}</h2>
          <p className="v8-lede" data-edit-key="v8.types.desc">{t.desc}</p>
        </div>

        <div className="v8-types v8-rise">
          {/* 索引行：鼠标停留即切换右侧视频舞台（离开后保持最后停留项循环播放，重新停留即切换）；
              点击保留原有展开房源列表行为（触屏无 hover，仍靠点击） */}
          <div className="v8-type-index">
            {types.map((tp, i) => (
              <button
                type="button"
                key={tp.key}
                className={`v8-trow${active === i ? ' is-on' : ''}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
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
                  <span className="v8-trow__name" data-edit-key={`discover.types.${tp.key}.label`}>{tp.label}</span>
                  <span className="v8-trow__desc" data-edit-key={`discover.types.${tp.key}.desc`}>{tp.desc}</span>
                </span>
                <span className="v8-trow__go" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* 视频舞台：随 hover 选中的户型切换（手机端整体隐藏）；下方蓝色文本打开快速找房问卷 */}
          <div className="v8-types-right">
            <div className="v8-type-stage" aria-hidden="true">
              <TypeHouse activeIndex={active} />
            </div>
            {/* 视频下方蓝色文本：打开快速找房问卷 / 免筛选直看全部房源 */}
            <button type="button" className="v8-quiz-cta" onClick={() => setQuizOpen(true)} data-edit-key="v8.finder.quiz.trigger">
              {c.v8?.finder?.quiz?.trigger}
            </button>
            <button
              type="button"
              className="v8-quiz-cta v8-quiz-cta--all"
              onClick={() => window.dispatchEvent(new CustomEvent('v8:show-type', { detail: { type: 'all' } }))}
              data-edit-key="v8.finder.quiz.allHomes"
            >
              {c.v8?.finder?.quiz?.allHomes}
            </button>
          </div>
        </div>
      </div>
      <V8QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} />
    </section>
  )
}
