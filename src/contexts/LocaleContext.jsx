'use client'

import { createContext, useContext } from 'react'

const LocaleContext = createContext({
  locale: 'en',
  messages: {},
  t: (key) => key
})

export function LocaleProvider({ children, locale, messages }) {
  const t = (key) => {
    const keys = key.split('.')
    let value = messages
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  return (
    <LocaleContext.Provider value={{ locale, messages, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}

