import { useEffect, useRef } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useProperty } from '../ici/propertyContext.jsx'
import V8RegionBoard from './V8RegionBoard.jsx'
import V8FeaturedStrip from './V8FeaturedStrip.jsx'
import V8ServiceCards from './V8ServiceCards.jsx'

/* 首页内嵌房源展示区：点击导航类型菜单 / 首页四大类 / 问卷答完后就地展开（无独立列表页）。
   受控组件：sel 状态由 HomeV8 持有并同步隐藏其它首页区块；onClear 清除筛选并恢复。
   sel = { type, school, quiz } | null；type 为 'all' 或空时展示全部房源；
   quiz = { district, beds, budget } 为快速找房问卷条件，与 type 叠加过滤。 */

const priceNum = (s) => parseInt(String(s ?? '').replace(/[^\d]/g, ''), 10) || 0
const CN_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
const bedCount = (br) => {
  const s = String(br ?? '')
  const digit = s.match(/\d+/)
  if (digit) return parseInt(digit[0], 10)
  const cn = s.match(/[一二两三四五六七八九]/)
  if (cn) return CN_NUM[cn[0]]
  return 1
}

function fmt(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''))
}

export default function V8TypeResults({ sel, onClear }) {
  const { c, lang } = useIciI18n()
  const { openProperty } = useProperty()
  const properties = c.properties || []
  const types = c.discover?.types ?? []
  const ft = c.v8?.finder || {}
  const lt = c.v8?.listings || {}
  const sectionRef = useRef(null)

  // 展开/切换后平滑滚动到本区块（延迟避开 App 的「回到顶部」effect 与布局切换）
  useEffect(() => {
    if (!sel) return undefined
    const id = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 220)
    return () => window.clearTimeout(id)
  }, [sel])

  if (!sel) return null

  const { type, school, quiz } = sel
  const activeSchool = school ? (c.discover?.schools ?? []).find((x) => x.key === school) ?? null : null

  const items = properties
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => {
      if (activeSchool) return p.categories?.includes('student') && p.schoolKeys?.includes(activeSchool.key)
      if (type && type !== 'all' && !(p.categories || []).includes(type)) return false
      if (quiz) {
        if (quiz.district && p.districtKey !== quiz.district) return false
        if (quiz.beds && (Number(quiz.beds) >= 4 ? bedCount(p.br) >= 4 : bedCount(p.br) !== Number(quiz.beds))) return false
        // 预算：区间 { min, max }（问卷双把手滑杆），落在区间内才保留
        if (quiz.budget) {
          const price = priceNum(p.price)
          if (quiz.budget.min && price < Number(quiz.budget.min)) return false
          if (quiz.budget.max && price > Number(quiz.budget.max)) return false
        }
      }
      return true
    })

  const typeLabel = types.find((x) => x.key === type)?.label
  const title = typeLabel || activeSchool?.label || lt.title || (lang === 'zh' ? '为你找到的房源' : 'Homes for you')

  return (
    <section className="v8-section v8-typeres" id="type-results" ref={sectionRef}>
      {/* Hero 下方：DJI 式精选房源卡片条 */}
      <V8FeaturedStrip
        items={properties.map((p, index) => ({ p, index })).slice(0, 4)}
        onOpen={(index) => openProperty(index, 'g')}
        viewText={lang === 'zh' ? '查看详情' : lang === 'ja' ? '詳細を見る' : 'View'}
      />
      {/* 精选条下方：服务卡片网格 */}
      <V8ServiceCards lang={lang} />
      <div className="v8-wrap">
        <div className="v8-typeres__head v8-rise">
          <div className="v8-typeres__meta">
            <h2 className="v8-typeres__title" data-edit-key="v8.listings.title">{title}</h2>
            <p className="v8-typeres__count" data-edit-key="v8.finder.count">
              {fmt(ft.count || '{n} homes found', { n: items.length })}
            </p>
          </div>
          <button type="button" className="v8-typeres__clear" onClick={onClear} data-edit-key="v8.finder.clear">
            {ft.clear || (lang === 'zh' ? '清除' : 'Clear')}
          </button>
        </div>

        {items.length > 0 ? (
          <V8RegionBoard
            items={items}
            onOpen={(index) => openProperty(index, 'g')}
          />
        ) : (
          <p className="v8-featured-empty" data-edit-key="v8.finder.empty">
            {lang === 'zh'
              ? '暂无该类型的房源，看看其它类型吧'
              : lang === 'ja'
                ? 'このタイプの物件はまだありません。他のタイプもご覧ください。'
                : 'No homes of this type yet — explore the others.'}
          </p>
        )}
      </div>
    </section>
  )
}
