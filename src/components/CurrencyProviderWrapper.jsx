'use client'

import { CurrencyProvider } from '@/contexts/CurrencyContext'

export default function CurrencyProviderWrapper({ children, initialCoins, initialKeys }) {
  return (
    <CurrencyProvider initialCoins={initialCoins} initialKeys={initialKeys}>
      {children}
    </CurrencyProvider>
  )
}

