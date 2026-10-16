import { useEffect, useState, lazy, Suspense } from 'react'
import { PropertyProvider, useProperty } from './components/ici/propertyContext.jsx'
import { ContactProvider } from './components/ici/contactContext.jsx'
import { useIciI18n } from './i18n/IciI18nContext.jsx'
import { readRoute, syncRouter } from './lib/router.mjs'
import FloatingActions from './components/ici/FloatingActions.jsx'
import PropertyDetail from './components/ici/PropertyDetail.jsx'
import TypePicker from './components/ici/TypePicker.jsx'

// v8 首页与专属导航独立 chunk
const HomeV8 = lazy(() => import('./components/home-v8/HomeV8.jsx'))
const V8Navbar = lazy(() => import('./components/home-v8/V8Navbar.jsx'))
const V8Listings = lazy(() => import('./components/home-v8/V8Listings.jsx'))

function Site() {
  const { c, lang, setLang } = useIciI18n()
  const { active, openProperty } = useProperty()
  const [route, setRoute] = useState(() => readRoute())
  const isListings = route.type === 'listings'

  // History API 路由同步
  useEffect(() => {
    const onPop = () => {
      syncRouter(window.location.pathname)
      const r = readRoute()
      setRoute(r)
      if (r.lang) setLang(r.lang)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [setLang])

  // 房源深链自动打开详情
  useEffect(() => {
    if (route.type !== 'property') return
    const idx = c.properties.findIndex(
      (p) => String(p.code).toLowerCase() === String(route.code).toLowerCase()
    )
    if (idx >= 0 && (!active || active.index !== idx)) openProperty(idx, 'g')
  }, [route, c.properties, active, openProperty])

  // 页面切换回到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.type, route.slug])

  return (
    <div className="ici-page">
      <Suspense fallback={null}>
        <V8Navbar solid={isListings} />
      </Suspense>
      {isListings ? (
        <main>
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} />}>
            <V8Listings />
          </Suspense>
        </main>
      ) : (
        <main>
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fff' }} />}>
            <HomeV8 />
          </Suspense>
        </main>
      )}
      <FloatingActions />
      <PropertyDetail />
      <TypePicker />
    </div>
  )
}

export default function App() {
  return (
    <PropertyProvider>
      <ContactProvider>
        <Site />
      </ContactProvider>
    </PropertyProvider>
  )
}
