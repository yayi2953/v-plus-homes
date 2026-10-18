import { useEffect, useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import './home-v8.css'
import { useRise } from './useRise.mjs'
import V8Hero from './V8Hero.jsx'
import V8Stats from './V8Stats.jsx'
import V8Types from './V8Types.jsx'
import V8TypeResults from './V8TypeResults.jsx'
import V8Process from './V8Process.jsx'
import V8Bubbles from './V8Bubbles.jsx'
import V8CTA from './V8CTA.jsx'
import PreviewBadge from './PreviewBadge.jsx'
import { FinderProvider } from './finderContext.jsx'

export default function HomeV8() {
  const { c } = useIciI18n()
  const sections = c.sections || {}
  // 淡入元素由 useRise 内部的 MutationObserver 终身接管（语言切换/内容更新
  // 重建出的新节点也能自动观察），无需外部依赖触发重扫
  const rootRef = useRise()

  // 类型房源展示状态：非空时隐藏其它首页区块（Hero/统计/类型/流程/弹幕/CTA），
  // 只留内嵌房源展示区，进入沉浸式浏览；清除后恢复
  const [typeSel, setTypeSel] = useState(null)

  // 导航/类型区块点击事件契约：v8:show-type { type, school }
  useEffect(() => {
    const onShow = (e) => {
      setTypeSel({ type: e.detail?.type || 'all', school: e.detail?.school || null })
    }
    window.addEventListener('v8:show-type', onShow)
    return () => window.removeEventListener('v8:show-type', onShow)
  }, [])

  // 从其他页面带 ?type=（&school=）回首页时自动展开
  // （navigate 在 pathname 相同时不派发事件，跨页返回首页走本入口）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    if (type) setTypeSel({ type, school: params.get('school') || null })
  }, [])

  // 清除筛选：恢复其它区块并滚回类型区块（后台关闭类型区块时滚回顶部）
  const clearTypeSel = () => {
    setTypeSel(null)
    window.setTimeout(() => {
      const el = document.getElementById('types')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 80)
  }

  const hidden = typeSel != null

  return (
    <FinderProvider>
      <div className="home-v8" ref={rootRef}>
        {sections.hero !== false && !hidden && <V8Hero />}
        {!hidden && <V8Stats />}
        {sections.types !== false && !hidden && <V8Types />}
        {/* 点击类型后就地展开的房源展示区（不跳转 /listings） */}
        <V8TypeResults sel={typeSel} onClear={clearTypeSel} />
        {sections.why !== false && !hidden && <V8Process />}
        {sections.bubbles !== false && !hidden && <V8Bubbles />}
        {sections.getstarted !== false && !hidden && <V8CTA />}
        <PreviewBadge />
      </div>
    </FinderProvider>
  )
}
