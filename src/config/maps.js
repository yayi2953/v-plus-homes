// Google Maps Embed API 配置
// 该 Key 仅用于浏览器端 iframe 嵌入（Maps Embed API），属公开可见密钥，
// 务必在 Google Cloud 控制台为其设置「HTTP 来源」限制（如 https://here-ici.vercel.app/*）。
// 生产环境可用 Vercel 环境变量 VITE_GOOGLE_MAPS_KEY 覆盖，无需改代码。
export const MAPS_EMBED_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyBBI8RgsqeiX98wSG5X12Oh6INVAxEIhos'

// 地图找房页使用 WebGL 矢量底图，需要一个 Map ID：
// Google Cloud 控制台 → 地图管理 → 创建地图 ID（地图类型选「JavaScript」，免费），
// 然后在 Vercel 配置环境变量 VITE_GOOGLE_MAP_ID。未配置时仅本地用 DEMO_MAP_ID 调试，
// 该 DEMO ID 有频控与水印，不可用于正式环境。
export const MAPS_JS_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'

// 官方嵌入端点（place 模式）：q 支持「纬度,经度」或地址文本
export function mapsEmbedSrc(query, { zoom = 16, lang = 'zh-CN' } = {}) {
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_EMBED_KEY}` +
    `&q=${encodeURIComponent(query)}&zoom=${zoom}&language=${lang}`
}
