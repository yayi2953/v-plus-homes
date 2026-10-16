import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import ExtraServices from '../ici/ExtraServices.jsx'
import './home-v8.css'
import { useRise } from './useRise.mjs'
import V8Hero from './V8Hero.jsx'
import V8Stats from './V8Stats.jsx'
import V8Types from './V8Types.jsx'
import V8Process from './V8Process.jsx'
import V8CTA from './V8CTA.jsx'
import V8Footer from './V8Footer.jsx'
import PreviewBadge from './PreviewBadge.jsx'
import { FinderProvider } from './finderContext.jsx'

export default function HomeV8() {
  const { c } = useIciI18n()
  const sections = c.sections || {}
  // 淡入元素由 useRise 内部的 MutationObserver 终身接管（语言切换/内容更新
  // 重建出的新节点也能自动观察），无需外部依赖触发重扫
  const rootRef = useRise()

  return (
    <FinderProvider>
      <div className="home-v8" ref={rootRef}>
        {sections.hero !== false && <V8Hero />}
        <V8Stats />
        {sections.types !== false && <V8Types />}
        {sections.why !== false && <V8Process />}
        {sections.extras !== false && <ExtraServices />}
        {sections.getstarted !== false && <V8CTA />}
        <V8Footer />
        <PreviewBadge />
      </div>
    </FinderProvider>
  )
}
