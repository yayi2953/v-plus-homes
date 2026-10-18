import { useEffect, useRef } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useProperty } from '../ici/propertyContext.jsx'
import PropertyQuadCard from './PropertyQuadCard.jsx'

/* 首页内嵌房源展示区：点击导航类型菜单 / 首页四大类后就地展开（不跳转 /listings）。
   受控组件：sel 状态由 HomeV8 持有并同步隐藏其它首页区块；onClear 清除筛选并恢复。
   sel = { type, school } | null；type 为 'all' 或空时展示全部房源。 */

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
          <button type="button" className="v8-typeres__clear" onClick={onClear}>
            {ft.clear || (lang === 'zh' ? '清除' : 'Clear')}
          </button>
        </div>

        {items.length > 0 ? (
          <div className="v8-listings__grid">
            {items.map((it, seq) => (
              <PropertyQuadCard
                key={`${it.p.code}-${it.index}`}
                p={it.p}
                seq={seq + 1}
                lang={lang}
                onOpen={() => openProperty(it.index, 'g')}
              />
            ))}
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
