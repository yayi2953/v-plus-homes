import { useRef, useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { useProperty } from '../ici/propertyContext.jsx'
import { useContact } from '../ici/contactContext.jsx'
import SmartImage from '../common/SmartImage.jsx'

/* 区域找房板（参考电商分区频道式样）：
   每个区域一组 —— 上：区域大图卡片（宽幅 banner：左下区域名 / 副标题 / 「¥xx 起」/ 查看房源按钮）；
   下：该区域房源小卡片横排（小图 + 灰字规格 + 加粗名称 + 价格），横向滑动触底才懒加载更多。
   仅复用参考样式，图片与文案均来自站内房源数据。 */

const priceNum = (s) => parseInt(String(s ?? '').replace(/[^\d]/g, ''), 10) || 0

function buildGroups(items, tabs) {
  const map = new Map()
  items.forEach((it) => {
    const p = it.p
    const key = p.districtKey || (p.city ? `city-${p.city}` : 'other')
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(it)
  })
  return [...map.entries()].map(([key, list]) => {
    const tab = tabs.find((t) => t.key === key)
    return {
      key,
      label: tab?.label || list[0].p.city || list[0].p.district || key,
      desc: tab?.desc || '',
      items: list
    }
  })
}

export default function V8RegionBoard({ items, onOpen }) {
  const { c, lang } = useIciI18n()
  const { openProperty } = useProperty()
  const { openContact } = useContact()
  const tabs = c.discover?.tabs ?? []
  const featured = c.v8?.featured || {}
  const groups = buildGroups(items, tabs)

  const label = (zh, en, ja) => (lang === 'zh' ? zh : lang === 'ja' ? ja : en)
  const fromText = label(' 起', ' from', '〜')

  if (!groups.length) return null

  return (
    <div className="v8-regionboard">
      {groups.map((g) => (
        <RegionGroup key={g.key} group={g} lang={lang} label={label} fromText={fromText} perMonth={featured.perMonth} onOpen={onOpen || ((index) => openProperty(index, 'g'))} openContact={openContact} />
      ))}
    </div>
  )
}

/* ---------- 单个区域组：大图 banner + 房源小卡片行 ---------- */

const ROW_STEP = 2 // 横滑触底每次追加的房源小卡片数

function RegionGroup({ group, lang, label, fromText, perMonth, onOpen, openContact }) {
  const rowRef = useRef(null)
  const fullRef = useRef(null)
  const [visible, setVisible] = useState(4)
  const [expanded, setExpanded] = useState(false)
  const items = group.items

  const minPrice = Math.min(...items.map((x) => priceNum(x.p.price)).filter(Boolean))

  // 横滑触底 → 追加渲染后续房源小卡片
  const onRowScroll = () => {
    const el = rowRef.current
    if (!el) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 14) {
      setVisible((v) => (v < items.length ? Math.min(v + ROW_STEP, items.length) : v))
    }
  }

  // 查看房源 → 在区域组下方展开/收起该区域全部符合条件的房源网格
  const toggleFull = () => {
    setExpanded((v) => {
      const next = !v
      if (next) {
        // 等网格渲染后平滑滚动到位
        window.setTimeout(() => {
          fullRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 60)
      }
      return next
    })
  }

  return (
    <section className="v8-region" key={group.key}>
      {/* 区域大图卡片（图一式样：区域名 / 副标题 / ¥xx 起 / 查看房源按钮） */}
      <div className="v8-region__banner">
        <SmartImage src={items[0].p.img} alt="" />
        <span className="v8-region__shade" aria-hidden="true" />
        <div className="v8-region__content">
          <h3 className="v8-region__title">{group.label}</h3>
          <p className="v8-region__sub">{group.desc || label('精选房源', 'Curated homes', '厳選物件')}</p>
          <p className="v8-region__price">
            {`¥${minPrice.toLocaleString()}`}
            <small>{fromText}</small>
          </p>
          <button type="button" className="v8-region__btn" onClick={toggleFull} aria-expanded={expanded}>
            {expanded ? label('收起', 'Collapse', '閉じる') : label('查看房源', 'View homes', '物件を見る')}
          </button>
        </div>
      </div>

      {/* 房源小卡片行（图二式样）+ 行尾预约引导卡 */}
      <div className="v8-region__row" ref={rowRef} onScroll={onRowScroll}>
        {items.slice(0, visible).map(({ p, index }, i) => (
          <button
            type="button"
            key={`${p.code}-${index}`}
            className="v8-mcard"
            onClick={() => onOpen(index)}
            aria-label={p.district}
          >
            <span className="v8-mcard__media">
              <SmartImage src={p.img} alt="" />
            </span>
            <span className="v8-mcard__sub">{[p.br, p.baths ? `${p.baths} ${label('卫浴', 'Baths', 'バス')}` : ''].filter(Boolean).join(' · ')}</span>
            <span className="v8-mcard__name">{p.district}</span>
            <span className="v8-mcard__price">
              {p.price}
              <small>{perMonth}</small>
            </span>
          </button>
        ))}
        {/* 行尾引导卡（图二右一式样） */}
        <div className="v8-mcard v8-mcard--cta">
          <span className="v8-mcard__cta-k">{label('帮你找房', 'Let us help', 'お探しします')}</span>
          <span className="v8-mcard__cta-q">
            {label('哪套房源适合你？', 'Which home suits you?', 'どの物件が合う？')}
          </span>
          <button type="button" className="v8-mcard__cta-btn" onClick={openContact}>
            {label('预约看房', 'Book a viewing', '内見予約')}
          </button>
        </div>
      </div>

      {/* 展开区：该区域全部符合条件的房源网格（点击「查看房源」向下展开） */}
      {expanded && (
        <div className="v8-region__full" ref={fullRef}>
          <p className="v8-region__full-count">
            {label(
              `${group.label} · 共 ${items.length} 套符合条件的房源`,
              `${group.label} · ${items.length} homes match`,
              `${group.label} · ${items.length}件が一致`
            )}
          </p>
          <div className="v8-region__full-grid">
            {items.map(({ p, index }) => (
              <button
                type="button"
                key={`full-${p.code}-${index}`}
                className="v8-mcard"
                onClick={() => onOpen(index)}
                aria-label={p.district}
              >
                <span className="v8-mcard__media">
                  <SmartImage src={p.img} alt="" />
                </span>
                <span className="v8-mcard__sub">{[p.br, p.baths ? `${p.baths} ${label('卫浴', 'Baths', 'バス')}` : ''].filter(Boolean).join(' · ')}</span>
                <span className="v8-mcard__name">{p.district}</span>
                <span className="v8-mcard__price">
                  {p.price}
                  <small>{perMonth}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
