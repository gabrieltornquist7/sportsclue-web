'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const CurrencyContext = createContext({
  coins: 0,
  keys: 0,
  updateCurrency: () => {},
  refetchCurrency: async () => {}
})

export function CurrencyProvider({ children, initialCoins, initialKeys }) {
  const [coins, setCoins] = useState(initialCoins || 0)
  const [keys, setKeys] = useState(initialKeys || 0)

  // Sync with initial props when they change (for server-side updates)
  useEffect(() => {
    if (initialCoins !== undefined) setCoins(initialCoins)
    if (initialKeys !== undefined) setKeys(initialKeys)
  }, [initialCoins, initialKeys])

  const updateCurrency = (newCoins, newKeys) => {
    if (newCoins !== undefined) setCoins(newCoins)
    if (newKeys !== undefined) setKeys(newKeys)
  }

  const refetchCurrency = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins, keys')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCoins(profile.coins || 0)
          setKeys(profile.keys || 0)
        }
      }
    } catch (error) {
      console.error('Failed to refetch currency:', error)
    }
  }

  return (
    <CurrencyContext.Provider value={{ coins, keys, updateCurrency, refetchCurrency }}>
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

