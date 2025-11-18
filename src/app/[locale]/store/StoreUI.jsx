'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { buyItem } from '@/app/store/actions'

export default function StoreUI({ userId, locale, username }) {
  const { updateCurrency } = useCurrency()
  const [loading, setLoading] = useState({})
  const [message, setMessage] = useState(null)
  const router = useRouter()
  const { t } = useLocale()

  const handleBuy = async (itemType, itemName) => {
    setLoading(prev => ({ ...prev, [itemType]: true }))
    setMessage(null)

    const result = await buyItem(itemType, userId)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      setLoading(prev => ({ ...prev, [itemType]: false }))
      return
    }

    if (result.success) {
      // Update global currency context
      updateCurrency(result.newCoins, result.newKeys)
      setMessage({ type: 'success', text: result.message })
      setLoading(prev => ({ ...prev, [itemType]: false }))
    }
  }

  const { coins, keys } = useCurrency()

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-6 text-center text-3xl font-bold text-zinc-50">
              Shop
            </h2>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 rounded-lg p-4 text-center ${
                message.type === 'error'
                  ? 'bg-red-900/20 border border-red-800 text-red-400'
                  : 'bg-green-900/20 border border-green-800 text-green-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Store Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Standard Box */}
              <div className="rounded-xl border-2 border-zinc-700 bg-zinc-800/50 p-6">
                <div className="mb-4 text-center">
                  <div className="mb-2 text-5xl">📦</div>
                  <h3 className="text-xl font-bold text-zinc-50">Standard Box</h3>
                  <p className="text-sm text-zinc-400">70% Common, 30% Rare</p>
                </div>
                <div className="mb-4 text-center">
                  <span className="text-2xl font-bold text-zinc-50">100</span>
                  <span className="ml-2 text-xl">🪙</span>
                </div>
                <button
                  onClick={() => handleBuy('standard_box', 'Standard Box')}
                  disabled={loading.standard_box || coins < 100}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading.standard_box ? 'Purchasing...' : 'Buy'}
                </button>
              </div>

              {/* Pro Box */}
              <div className="rounded-xl border-2 border-zinc-700 bg-zinc-800/50 p-6">
                <div className="mb-4 text-center">
                  <div className="mb-2 text-5xl">📦</div>
                  <h3 className="text-xl font-bold text-zinc-50">Pro Box</h3>
                  <p className="text-sm text-zinc-400">50% Rare, 50% Epic</p>
                </div>
                <div className="mb-4 text-center">
                  <span className="text-2xl font-bold text-zinc-50">500</span>
                  <span className="ml-2 text-xl">🪙</span>
                </div>
                <button
                  onClick={() => handleBuy('pro_box', 'Pro Box')}
                  disabled={loading.pro_box || coins < 500}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading.pro_box ? 'Purchasing...' : 'Buy'}
                </button>
              </div>

              {/* Legendary Box - LOCKED */}
              <div className="rounded-xl border-2 border-yellow-700 bg-yellow-900/20 p-6">
                <div className="mb-4 text-center">
                  <div className="mb-2 text-5xl">🔒</div>
                  <h3 className="text-xl font-bold text-zinc-50">Legendary Box</h3>
                  <p className="mb-2 text-sm font-semibold text-yellow-400">LOCKED</p>
                  <p className="text-xs text-zinc-400">Requires Key to unlock</p>
                  <p className="text-xs text-zinc-400">Guaranteed Legendary</p>
                </div>
                <div className="mb-4 text-center">
                  <span className="text-2xl font-bold text-zinc-50">5,000</span>
                  <span className="ml-2 text-xl">🪙</span>
                </div>
                <button
                  onClick={() => handleBuy('legendary_box', 'Legendary Box')}
                  disabled={loading.legendary_box || coins < 5000}
                  className="w-full rounded-lg bg-yellow-600 px-4 py-3 font-semibold text-white transition-all hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading.legendary_box ? 'Purchasing...' : 'Buy (Locked)'}
                </button>
              </div>

              {/* Key */}
              <div className="rounded-xl border-2 border-yellow-700 bg-yellow-900/20 p-6">
                <div className="mb-4 text-center">
                  <div className="mb-2 text-5xl">🔑</div>
                  <h3 className="text-xl font-bold text-zinc-50">Key</h3>
                  <p className="text-sm text-zinc-400">Unlocks Legendary Boxes</p>
                </div>
                <div className="mb-4 text-center">
                  <span className="text-2xl font-bold text-zinc-50">2,500</span>
                  <span className="ml-2 text-xl">🪙</span>
                </div>
                <button
                  onClick={() => handleBuy('key', 'Key')}
                  disabled={loading.key || coins < 2500}
                  className="w-full rounded-lg bg-yellow-600 px-4 py-3 font-semibold text-white transition-all hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading.key ? 'Purchasing...' : 'Buy'}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="mt-8 rounded-lg bg-zinc-800/50 p-4 text-center text-sm text-zinc-400">
              💡 Complete puzzles to earn coins! Legendary boxes can also drop randomly (1% chance).
            </div>
          </div>
        </div>
      </div>
  )
}

