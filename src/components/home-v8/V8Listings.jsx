import { useMemo } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useProperty } from '../ici/propertyContext.jsx'
import { navigate } from '../../lib/router.mjs'
import SmartImage from '../common/SmartImage.jsx'
import V8Bubbles from './V8Bubbles.jsx'

/* 房源结果页：根据 URL 查询参数（district/beds/budget/type/school）
   过滤并展示真实房源。延续 v8 极简编辑档案卡风格，无模板感。 */

const ALL_DISTRICTS = 'all'
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

export default function V8Listings() {
  const { c, lang } = useIciI18n()
  const { openProperty } = useProperty()
  const properties = c.properties || []
  const districts = c.discover?.tabs ?? []
  const types = c.discover?.types ?? []
  const schools = c.discover?.schools ?? []
  const t = c.v8?.listings || {}
  const ft = c.v8?.finder || {}

  // 从 URL 读取筛选条件
  const params = new URLSearchParams(window.location.search)
  const district = params.get('district') || ALL_DISTRICTS
  const beds = params.get('beds') ? Number(params.get('beds')) : null
  const budget = params.get('budget') ? Number(params.get('budget')) : null
  const type = params.get('type') || null
  const schoolKey = params.get('school') || null

  const activeSchool = schools.find((x) => x.key === schoolKey) ?? null

  const items = useMemo(
    () =>
      properties
        .map((p, index) => ({ p, index }))
        .filter(({ p }) => {
          if (activeSchool) return p.categories?.includes('student') && p.schoolKeys?.includes(activeSchool.key)
          return (
            (district === ALL_DISTRICTS || p.districtKey === district) &&
            (!type || (p.categories || []).includes(type)) &&
            (!beds || (beds >= 4 ? bedCount(p.br) >= 4 : bedCount(p.br) === beds)) &&
            (!budget || priceNum(p.price) <= budget)
          )
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [properties, district, beds, budget, type, schoolKey]
  )

  // 筛选条件可读标签
  const districtLabel = districts.find((x) => x.key === district)?.label
  const typeLabel = types.find((x) => x.key === type)?.label
  const bedLabel = ft.beds?.find((x) => x.v === beds)?.label
  const budgetLabel = ft.budgets?.find((x) => x.v === budget)?.label

  const chips = [
    district !== ALL_DISTRICTS && districtLabel ? districtLabel : null,
    bedLabel ? bedLabel : null,
    budgetLabel ? budgetLabel : null,
    typeLabel ? typeLabel : null,
    activeSchool ? activeSchool.label : null
  ].filter(Boolean)

  const featured = c.v8?.featured || {}

  const renderCard = ({ p, index }, seq) => (
    <button
      type="button"
      key={`${p.code}-${index}`}
      className="v8-fcard"
      onClick={() => openProperty(index, 'v8')}
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
    <div className="home-v8 v8-listings-page">
      <div className="v8-listings">
        {/* 页头：返回 + 标题 + 筛选条件摘要 */}
        <div className="v8-listings__head">
          <button type="button" className="v8-listings__back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            {t.back || (lang === 'zh' ? '返回首页' : 'Back to home')}
          </button>
          <h1 className="v8-listings__title">
            {t.title || (lang === 'zh' ? '为你找到的房源' : 'Homes for you')}
          </h1>
          {chips.length > 0 && (
            <div className="v8-listings__chips">
              {chips.map((label, i) => (
                <span key={i} className="v8-listings__chip">{label}</span>
              ))}
              <button type="button" className="v8-listings__clear" onClick={() => navigate('/listings')}>
                {ft.clear || (lang === 'zh' ? '清除' : 'Clear')}
              </button>
            </div>
          )}
          <p className="v8-listings__count">
            {fmt(ft.count || '{n} homes found', { n: items.length })}
          </p>
        </div>

        {/* 房源卡片网格：虚拟房源 + 后台真实房源（置于弹幕上方，进页即见） */}
        {items.length > 0 ? (
          <div className="v8-listings__grid">
            {items.map((it, seq) => renderCard(it, seq + 1))}
          </div>
        ) : (
          <p className="v8-featured-empty">
            {lang === 'zh' ? '暂无符合条件的房源，请调整筛选条件' : lang === 'ja' ? '条件に合う物件はまだありません。絞り込み条件をご調整ください。' : 'No homes match your filters yet — try adjusting them.'}
          </p>
        )}

        {/* 客户留言弹幕 */}
        <V8Bubbles />
      </div>
    </div>
  )
}
