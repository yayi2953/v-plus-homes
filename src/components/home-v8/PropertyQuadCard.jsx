import { useRef, useState } from 'react'
import SmartImage from '../common/SmartImage.jsx'

/* 一四式房源卡：顶部一张大图（房源/周边风景），下方一排数据信息小卡片。
   初始只渲染 4 个小卡片（第 4 个露出大部分、暗示可滑）；用户向右滑动触底时
   才懒加载后续小卡片（地铁 / 设施 / 编号），每次追加 2 个直到全部展示。
   点击整卡打开房源详情。三语文案内置（房源数据字段非后台文案编辑项）。 */

const AMENITY = {
  zh: { furnished: '带家具', wifi: 'WiFi', ac: '空调', heating: '暖气', kitchen: '厨房', washer: '洗衣机', elevator: '电梯', tv: '电视', workspace: '工作区', gym: '健身房', balcony: '阳台', metro: '近地铁' },
  en: { furnished: 'Furnished', wifi: 'WiFi', ac: 'A/C', heating: 'Heating', kitchen: 'Kitchen', washer: 'Washer', elevator: 'Elevator', tv: 'TV', workspace: 'Workspace', gym: 'Gym', balcony: 'Balcony', metro: 'Metro' },
  ja: { furnished: '家具付', wifi: 'WiFi', ac: 'エアコン', heating: '暖房', kitchen: 'キッチン', washer: '洗濯機', elevator: 'エレベーター', tv: 'TV', workspace: 'ワークスペース', gym: 'ジム', balcony: 'バルコニー', metro: '駅近' }
}

const STEP = 2 // 每次触底追加的小卡片数

export default function PropertyQuadCard({ p, seq, lang, onOpen }) {
  const railRef = useRef(null)
  const [visible, setVisible] = useState(4)

  const amenityLabels = AMENITY[lang] || AMENITY.en
  const label = (zh, en, ja) => (lang === 'zh' ? zh : lang === 'ja' ? ja : en)

  const chips = [
    { k: label('卧室', 'Bedrooms', '寝室'), v: p.br },
    { k: label('卫浴', 'Baths', 'バスルーム'), v: p.baths },
    { k: label('面积', 'Area', '面積'), v: p.area ? `${p.area} ㎡` : '' },
    { k: label('月租', 'Rent', '家賃'), v: p.price },
    { k: label('地铁', 'Metro', '地下鉄'), v: p.metro },
    ...(p.amenities || []).map((a) => ({ k: label('设施', 'Amenity', '設備'), v: amenityLabels[a] || a })),
    { k: label('编号', 'Code', '番号'), v: p.code ? `NO.${p.code}` : '' }
  ].filter((x) => x.v != null && String(x.v).trim() !== '')

  const shown = chips.slice(0, visible)

  // 向右滑动触底 → 追加后续小卡片（已全部展示则不再 setState）
  const onRailScroll = () => {
    const el = railRef.current
    if (!el) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 14) {
      setVisible((v) => (v < chips.length ? Math.min(v + STEP, chips.length) : v))
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <article
      className="v8-fcard v8-fcard--quad"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      aria-label={p.district}
    >
      <span className="v8-fcard__hero">
        <SmartImage src={p.img} alt="" />
        <span className="v8-fcard__go" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </span>
      <span className="v8-fcard__body">
        <span className="v8-fcard__top">
          <span className="v8-fcard__name">{p.district}</span>
          <span className="v8-fcard__no">NO.{String(seq).padStart(2, '0')}</span>
        </span>
        <span className="v8-fcard__rail" ref={railRef} onScroll={onRailScroll}>
          {shown.map((chip, i) => (
            <span className="v8-fcard__chip" key={`${chip.k}-${i}`}>
              <span className="v8-fcard__chip-k">{chip.k}</span>
              <span className="v8-fcard__chip-v">{chip.v}</span>
            </span>
          ))}
        </span>
      </span>
    </article>
  )
}
