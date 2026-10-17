// 将嵌套的翻译对象扁平化为 key -> { zh, en } 的映射
// key 用点号连接，数组索引用数字，如 nav.menus.0.label
// 只保留字符串值（跳过图片 URL、数字等非文案字段）

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isEditableString(v) {
  return typeof v === 'string' && v.length > 0
}

// 递归遍历，收集所有字符串值的路径
function collectPaths(obj, prefix, out) {
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectPaths(item, `${prefix}.${i}`, out))
  } else if (isPlainObject(obj)) {
    for (const key of Object.keys(obj)) {
      collectPaths(obj[key], prefix ? `${prefix}.${key}` : key, out)
    }
  } else if (isEditableString(obj)) {
    out.push(prefix)
  }
}

// 将扁平化的 key 设置回嵌套对象
export function setByPath(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] === undefined) {
      cur[p] = /^\d+$/.test(parts[i + 1]) ? [] : {}
    }
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
  return obj
}

// 扁平化翻译对象，返回 { key: { zh, en } }
export function flattenTexts(zhObj, enObj) {
  const paths = []
  collectPaths(zhObj, '', paths)
  const result = {}
  for (const p of paths) {
    const zhVal = getByPath(zhObj, p)
    const enVal = getByPath(enObj, p)
    if (zhVal !== undefined || enVal !== undefined) {
      result[p] = { zh: zhVal ?? '', en: enVal ?? '' }
    }
  }
  return result
}

function getByPath(obj, path) {
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

// 将覆盖项应用到翻译对象
export function applyOverrides(target, overrides) {
  for (const [key, val] of Object.entries(overrides)) {
    if (val && typeof val === 'object') {
      // val 可能是 { zh, en }，根据目标语言选择
    } else {
      setByPath(target, key, val)
    }
  }
  return target
}
