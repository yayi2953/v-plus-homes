import { useIciI18n } from '../../i18n/IciI18nContext.jsx'
import { isHomePreview, setPreviewVersion } from '../../lib/homeVersion.mjs'

// 仅本浏览器通过 ?home= 或 localStorage 覆盖、与线上版本不一致时出现
export default function PreviewBadge() {
  const { c } = useIciI18n()
  if (!isHomePreview(c)) return null

  const exit = () => {
    setPreviewVersion(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('home')
    window.location.replace(url.toString())
  }

  return (
    <div className="v8-preview-badge">
      <span>{c.homeVersion === 'v8' ? '经典版预览（线上为 v8）' : 'v8 新版预览（仅本浏览器可见）'}</span>
      <button type="button" onClick={exit}>退出预览</button>
    </div>
  )
}
