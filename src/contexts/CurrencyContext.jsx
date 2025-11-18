'use client'

import { createContext, useContext, useState } from 'react'

const CurrencyContext = createContext({
  coins: 0,
  keys: 0,
  updateCurrency: () => {}
})

export function CurrencyProvider({ children, initialCoins, initialKeys }) {
  const [coins, setCoins] = useState(initialCoins || 0)
  const [keys, setKeys] = useState(initialKeys || 0)

  const updateCurrency = (newCoins, newKeys) => {
    if (newCoins !== undefined) setCoins(newCoins)
    if (newKeys !== undefined) setKeys(newKeys)
  }

  return (
    <CurrencyContext.Provider value={{ coins, keys, updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}

