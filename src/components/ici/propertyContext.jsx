import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// active = { index: number, source: 'g' | 'h' } | null
// source 决定详情主视觉融化回哪一组卡片（g=Discover 网格 / h=Hero 横滑条）
const PropertyContext = createContext(null)

export function PropertyProvider({ children }) {
  const [active, setActive] = useState(null)

  const openProperty = useCallback((index, source = 'g') => {
    setActive({ index, source })
  }, [])
  const closeProperty = useCallback(() => setActive(null), [])

  // 详情打开时锁定背景滚动
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])

  return (
    <PropertyContext.Provider value={{ active, openProperty, closeProperty }}>
      {children}
    </PropertyContext.Provider>
  )
}

export function useProperty() {
  const ctx = useContext(PropertyContext)
  if (!ctx) throw new Error('useProperty must be used within PropertyProvider')
  return ctx
}
