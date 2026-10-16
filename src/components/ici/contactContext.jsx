import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ContactPicker from './ContactPicker.jsx'

const ContactContext = createContext(null)

// 全局咨询弹窗：整个前台只挂载一个 ContactPicker，
// 任何位置（Hero / GetStarted / 悬浮按钮 / 房源详情卡 / 团队卡）都通过 openContact 唤起同一个弹窗。
export function ContactProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openContact = useCallback(() => setOpen(true), [])
  const closeContact = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ open, openContact, closeContact }),
    [open, openContact, closeContact]
  )

  return (
    <ContactContext.Provider value={value}>
      {children}
      <ContactPicker open={open} onClose={closeContact} />
    </ContactContext.Provider>
  )
}

export function useContact() {
  const ctx = useContext(ContactContext)
  if (!ctx) throw new Error('useContact must be used within <ContactProvider>')
  return ctx
}
