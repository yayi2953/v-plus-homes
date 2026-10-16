import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useIciI18n } from '../../i18n/IciI18nContext.jsx'

/* 找房条件共享状态：一句话找房挂在首屏 Hero、房源网格在精选区，
   两者是兄弟组件，筛选维度统一由本 Provider 持有。
   - district/beds/budget：句中胶囊（句子是独立入口，与导航类型互斥）
   - typeKeys/school：导航/户型卡/学生派单事件
   - items：按全部维度过滤后的房源（{ p, index }，index 为全量序号供 openProperty） */

const FinderCtx = createContext(null)

export const useFinder = () => useContext(FinderCtx)

const ALL_DISTRICTS = 'all'
// 价格/室数文案转数字：'26,800'/'¥26,800'→26800；'3 BR'→3、'三房两厅'→3、'单间'→1
const priceNum = (s) => parseInt(String(s ?? '').replace(/[^\d]/g, ''), 10) || 0
const CN_NUM = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
const bedCount = (br) => {
  const s = String(br ?? '')
  const digit = s.match(/\d+/)
  if (digit) return parseInt(digit[0], 10)
  const cn = s.match(/[一二两三四五六七八九]/)
  if (cn) return CN_NUM[cn[0]]
  return 1 // 单间/开间/studio 等无房数文案按 1 房处理
}

export function FinderProvider({ children }) {
  const { c } = useIciI18n()
  const properties = c.properties || []
  const types = c.discover?.types ?? []
  const schools = c.discover?.schools ?? []
  const districts = c.discover?.tabs ?? []

  // 首屏找房句默认不限房型（三端统一）
  const [typeKeys, setTypeKeys] = useState([])
  const [school, setSchool] = useState(null)
  const [district, setDistrict] = useState(ALL_DISTRICTS)
  // 户型（N 房，4 表示 4 房及以上）与月预算上限（元）
  const [beds, setBeds] = useState(null)
  const [budget, setBudget] = useState(null)

  // 导航/户型卡：切换住宅类型（单标签；区域回到全部），同时清空一句话找房条件
  useEffect(() => {
    const keys = new Set(types.map((x) => x.key))
    const onSwitch = (e) => {
      if (!keys.has(e.detail)) return
      setTypeKeys([e.detail])
      setSchool(null)
      setDistrict(ALL_DISTRICTS)
      setBeds(null)
      setBudget(null)
    }
    window.addEventListener('ici:switch-tab', onSwitch)
    return () => window.removeEventListener('ici:switch-tab', onSwitch)
  }, [types])

  // 学生公寓校区
  useEffect(() => {
    const keys = new Set(schools.map((x) => x.key))
    const onSchool = (e) => {
      if (!keys.has(e.detail)) return
      setSchool(e.detail)
      setTypeKeys(['student'])
      setDistrict(ALL_DISTRICTS)
      setBeds(null)
      setBudget(null)
    }
    window.addEventListener('ici:select-school', onSchool)
    return () => window.removeEventListener('ici:select-school', onSchool)
  }, [schools])

  // 移动弹窗选定「类型 + 区域」
  useEffect(() => {
    const tk = new Set(types.map((x) => x.key))
    const dk = new Set(districts.map((x) => x.key))
    const onTypeDistrict = (e) => {
      const d = e.detail
      if (!d || !tk.has(d.type) || !dk.has(d.district)) return
      setSchool(null)
      setTypeKeys([d.type])
      setDistrict(d.district)
      setBeds(null)
      setBudget(null)
    }
    window.addEventListener('ici:type-district', onTypeDistrict)
    return () => window.removeEventListener('ici:type-district', onTypeDistrict)
  }, [types, districts])

  const activeSchool = schools.find((x) => x.key === school) ?? null
  const filtering = !!typeKeys.length || !!activeSchool || district !== ALL_DISTRICTS || beds != null || budget != null

  const items = useMemo(
    () =>
      properties
        .map((p, index) => ({ p, index }))
        .filter(({ p }) => {
          if (activeSchool) return p.categories?.includes('student') && p.schoolKeys?.includes(activeSchool.key)
          return (
            (district === ALL_DISTRICTS || p.districtKey === district) &&
            (!typeKeys.length || (p.categories || []).some((k) => typeKeys.includes(k))) &&
            (!beds || (beds >= 4 ? bedCount(p.br) >= 4 : bedCount(p.br) === beds)) &&
            (!budget || priceNum(p.price) <= budget)
          )
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [properties, typeKeys, school, district, beds, budget]
  )

  const reset = useCallback(() => {
    setSchool(null)
    setTypeKeys([])
    setDistrict(ALL_DISTRICTS)
    setBeds(null)
    setBudget(null)
  }, [])

  // 一句话找房：房型/区域/户型/预算即选即筛；选择句子条件时退出学生校区模式，
  // 房型已是句内维度，改其他胶囊时保留当前房型
  const patch = useCallback((p0) => {
    setSchool(null)
    if ('type' in p0) setTypeKeys(p0.type ? [p0.type] : [])
    if ('district' in p0) setDistrict(p0.district || ALL_DISTRICTS)
    if ('beds' in p0) setBeds(p0.beds ?? null)
    if ('budget' in p0) setBudget(p0.budget ?? null)
  }, [])

  const value = useMemo(
    () => ({
      // 条件
      district, beds, budget, typeKeys, type: typeKeys[0] ?? null, school: activeSchool, filtering,
      // 派生
      items,
      // 操作
      patch, reset,
      // 条件变化签名（列表用：变化时回到首批）
      filterKey: `${typeKeys.join(',')}|${activeSchool?.key || ''}|${district}|${beds ?? ''}|${budget ?? ''}`
    }),
    [district, beds, budget, typeKeys, activeSchool, filtering, items, patch, reset]
  )

  return <FinderCtx.Provider value={value}>{children}</FinderCtx.Provider>
}
