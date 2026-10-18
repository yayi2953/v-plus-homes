import { useEffect, useRef, useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useProperty } from '../ici/propertyContext.jsx'
import SmartImage from '../common/SmartImage.jsx'

/* 首页内嵌房源展示区：点击导航类型菜单 / 首页四大类后不再跳转 /listings，
   而是就地在本区块展开该类型的房源卡片网格并平滑滚动过来。
   触发契约：window 派发 v8:show-type 事件，detail = { type, school }。
   type 为 'all' 或空时展示全部房源；school 为学生公寓校区 key（可选）。 */

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

export default function V8TypeResults() {
  const { c, lang } = useIciI18n()
  const { openProperty } = useProperty()
  const properties = c.properties || []
  const types = c.discover?.types ?? []
  const ft = c.v8?.finder || {}
  const featured = c.v8?.featured || {}
  const lt = c.v8?.listings || {}
  const [sel, setSel] = useState(null) // { type, school } | null
  const sectionRef = useRef(null)

  // 导航/类型区块点击：展开对应类型并滚动过来
  useEffect(() => {
    const onShow = (e) => {
      setSel({ type: e.detail?.type || 'all', school: e.detail?.school || null })
    }
    window.addEventListener('v8:show-type', onShow)
    return () => window.removeEventListener('v8:show-type', onShow)
  }, [])

  // 从其他页面带 ?type=&school= 回首页时自动展开（navigate 在 pathname 相同时不派发事件，
  // 跨页返回首页走本入口）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    if (type) setSel({ type, school: params.get('school') || null })
  }, [])

  // 展开/切换后平滑滚动到本区块（延迟避开 App 的「回到顶部」effect 与入场布局）
  useEffect(() => {
    if (!sel) return undefined
    const id = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
    return () => window.clearTimeout(id)
  }, [sel])

  if (!sel) return null

  const { type, school } = sel
  const activeSchool = school ? (c.discover?.schools ?? []).find((x) => x.key === school) ?? null : null

  const items = properties
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => {
      if (activeSchool) return p.categories?.includes('student') && p.schoolKeys?.includes(activeSchool.key)
      if (!type || type === 'all') return true
      return (p.categories || []).includes(type)
    })

  const typeLabel = types.find((x) => x.key === type)?.label
  const title = typeLabel || activeSchool?.label || lt.title || (lang === 'zh' ? '为你找到的房源' : 'Homes for you')

  const clear = () => setSel(null)

  const renderCard = ({ p, index }, seq) => (
    <button
      type="button"
      key={`${p.code}-${index}`}
      className="v8-fcard"
      onClick={() => openProperty(index, 'g')}
    >
      <span className="v8-fcard__media">
        <SmartImage src={p.img} alt="" />
      </span>
      <span className="v8-fcard__body">
        <span className="v8-fcard__top">
          <span className="v8-fcard__no">NO.{String(seq).padStart(2, '0')}</span>
          <span className="v8-fcard__price">
            {p.price}
            <small>{featured.perMonth}</small>
          </span>
        </span>
        <span className="v8-fcard__name">{p.district}</span>
        <span className="v8-fcard__sub">
          <i aria-hidden="true" />
          <span className="v8-fcard__sub-t">
            {[p.br, p.metro].filter(Boolean).join(' · ')}
          </span>
        </span>
      </span>
      <span className="v8-fcard__go" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </button>
  )

  return (
    <section className="v8-section v8-typeres" id="type-results" ref={sectionRef}>
      <div className="v8-wrap">
        <div className="v8-typeres__head v8-rise">
          <div className="v8-typeres__meta">
            <h2 className="v8-typeres__title">{title}</h2>
            <p className="v8-typeres__count">
              {fmt(ft.count || '{n} homes found', { n: items.length })}
            </p>
          </div>
          <button type="button" className="v8-typeres__clear" onClick={clear}>
            {ft.clear || (lang === 'zh' ? '清除' : 'Clear')}
          </button>
        </div>

        {items.length > 0 ? (
          <div className="v8-listings__grid">
            {items.map((it, seq) => renderCard(it, seq + 1))}
          </div>
        ) : (
          <p className="v8-featured-empty">
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
