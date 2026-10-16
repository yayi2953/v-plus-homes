// 独立版固定使用 v8 首页，无版本切换逻辑
export const HOME_VERSIONS = ['v8']
export const HOME_PREVIEW_KEY = 'v-plus-home-preview'

export function resolveHomeVersion() {
  return 'v8'
}

export function isHomePreview() {
  return false
}

export function setPreviewVersion() {}
