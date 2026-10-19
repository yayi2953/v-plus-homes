import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { Close } from '../ici/Icons.jsx'

// 户型详情弹窗：导航「房源」下拉点击类型名触发。
// 大疆式紧凑无图弹窗：标题 + 关闭同行，一句简介，特色勾选列表，蓝色文字链接跳转。
// 弹窗外壳复用 legal-overlay / legal-modal 样式体系，内容为 v8-tmodal 专属类。

const FEATS = {
  luxury: {
    zh: ['顶层套房与稀缺大平层，坐拥城市天际线', '高端社区配套：健身房、恒温泳池、会所', '全屋品牌家电与智能家居系统'],
    en: ['Penthouses and rare large flats with skyline views', 'Premium amenities: gym, pool, clubhouse', 'Branded appliances and smart-home system'],
    ja: ['スカイラインを望むペントハウス・大型物件', 'ジム・プール・クラブハウス等の充実設備', 'ブランド家電とスマートホーム設備']
  },
  standard: {
    zh: ['成熟社区，超市餐饮一应俱全', '整租与合租灵活可选', '近地铁，通勤便利'],
    en: ['Established communities with daily conveniences', 'Flexible whole-unit or flat-share options', 'Close to metro for easy commuting'],
    ja: ['生活便利な成熟エリア', '丸ごと賃借・シェアも柔軟に選択可能', '地下鉄近く、通勤に便利']
  },
  student: {
    zh: ['近高校校区，步行或地铁直达', '单间到多人套间多种选择', '水电网费透明，支持月付'],
    en: ['Near campuses, walkable or direct metro', 'Studios to shared suites for every budget', 'Transparent utilities, monthly payment'],
    ja: ['キャンパス近く、徒歩または地下鉄で直通', 'シングルからシェアまで多様な間取り', '水道光熱費透明、月払い対応']
  },
  city: {
    zh: ['核心地段服务式公寓与 LOFT', '拎包入住，可选每周保洁', '短租长租均可'],
    en: ['Serviced apartments and LOFTs in the core', 'Move-in ready, weekly cleaning optional', 'Short and long stays welcome'],
    ja: ['一等地のサービスアパートとLOFT', '即入居可、週次清掃も選択可', '短期・長期ともに対応']
  }
}

export default function TypeModal({ typeKey, onClose, onBrowse }) {
  const { c, lang } = useIciI18n()
  const type = (c.discover?.types || []).find((t) => t.key === typeKey)
  const feats = FEATS[typeKey]?.[lang] || FEATS[typeKey]?.zh || []
  const browseLabel = lang === 'zh' ? '查看该类型房源' : lang === 'ja' ? 'このタイプの物件を見る' : 'Browse this type'

  useEffect(() => {
    if (!typeKey) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [typeKey, onClose])

  return createPortal(
    <AnimatePresence>
      {typeKey && type ? (
        <motion.div
          className="legal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose?.()}
        >
          <motion.div
            className="legal-modal v8-tmodal"
            role="dialog"
            aria-modal="true"
            aria-label={type.label}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="v8-tmodal__head">
              <h3 className="v8-tmodal__title">{type.label}</h3>
              <button type="button" className="legal-modal__close" onClick={() => onClose?.()} aria-label={lang === 'zh' ? '关闭' : 'Close'}>
                <Close size={16} />
              </button>
            </header>
            <div className="v8-tmodal__body">
              <p className="v8-tmodal__desc">{type.desc}</p>
              <ul className="v8-tmodal__feats">
                {feats.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button type="button" className="v8-tmodal__link" onClick={() => onBrowse(typeKey)}>
                {browseLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
