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
  const [detailsModal, setDetailsModal] = useState(null) // 'standard_box' | 'pro_box' | 'legendary_box' | 'key' | null
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

  // Box details data
  const boxDetails = {
    standard_box: {
      title: 'Standard Box',
      icon: '📦',
      details: [
        { text: '80% Common', color: 'text-zinc-300' },
        { text: '20% Rare', color: 'text-blue-400' }
      ]
    },
    pro_box: {
      title: 'Pro Box',
      icon: '📦',
      details: [
        { text: '60% Rare', color: 'text-blue-400' },
        { text: '34.9% Epic', color: 'text-purple-400' },
        { text: '5% Legendary', color: 'text-yellow-400' },
        { text: '0.1% Mythic', color: 'text-pink-400' }
      ]
    },
    legendary_box: {
      title: 'Legendary Box',
      icon: '🔒',
      details: [
        { text: 'Requires Key to unlock', color: 'text-yellow-300', badge: true },
        { text: '60% Epic', color: 'text-purple-400' },
        { text: '39.5% Legendary', color: 'text-yellow-300' },
        { text: '0.5% Mythic', color: 'text-pink-400' }
      ]
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-2 text-center text-3xl font-bold text-zinc-50">
              Store
            </h2>
            <p className="mb-8 text-center text-sm text-zinc-400">
              Purchase boxes and keys to expand your collection
            </p>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 rounded-xl border-2 p-4 text-center font-medium ${
                message.type === 'error'
                  ? 'bg-red-900/20 border-red-600/50 text-red-300'
                  : 'bg-green-900/20 border-green-600/50 text-green-300'
              }`}>
                {message.text}
              </div>
            )}

            {/* Store Items Grid - Strict Vertical Rhythm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Standard Box */}
              <div className="group rounded-xl border-2 border-zinc-700/60 bg-gradient-to-br from-zinc-800/60 via-zinc-800/40 to-zinc-800/60 p-6 shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all backdrop-blur-sm flex flex-col">
                {/* Icon & Title - Fixed Top */}
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">📦</div>
                  <h3 className="text-xl font-bold text-zinc-50">Standard Box</h3>
                </div>

                {/* Content Area */}
                <div className="flex items-center justify-center mb-6">
                  <button
                    onClick={() => setDetailsModal('standard_box')}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium underline decoration-dotted underline-offset-4 transition-colors"
                  >
                    View Drop Rates
                  </button>
                </div>

                {/* Bottom Section - Pinned with mt-auto */}
                <div className="mt-auto space-y-4">
                  <div className="text-center py-3 rounded-lg bg-zinc-900/50">
                    <span className="text-2xl font-bold text-zinc-50">100</span>
                    <span className="ml-2 text-xl">🪙</span>
                  </div>
                  <button
                    onClick={() => handleBuy('standard_box', 'Standard Box')}
                    disabled={loading.standard_box || coins < 100}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                  >
                    {loading.standard_box ? 'Purchasing...' : 'Buy'}
                  </button>
                </div>
              </div>

              {/* Pro Box */}
              <div className="group rounded-xl border-2 border-zinc-700/60 bg-gradient-to-br from-zinc-800/60 via-zinc-800/40 to-zinc-800/60 p-6 shadow-lg hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all backdrop-blur-sm flex flex-col">
                {/* Icon & Title - Fixed Top */}
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">📦</div>
                  <h3 className="text-xl font-bold text-zinc-50">Pro Box</h3>
                </div>

                {/* Content Area */}
                <div className="flex items-center justify-center mb-6">
                  <button
                    onClick={() => setDetailsModal('pro_box')}
                    className="text-sm text-purple-400 hover:text-purple-300 font-medium underline decoration-dotted underline-offset-4 transition-colors"
                  >
                    View Drop Rates
                  </button>
                </div>

                {/* Bottom Section - Pinned with mt-auto */}
                <div className="mt-auto space-y-4">
                  <div className="text-center py-3 rounded-lg bg-zinc-900/50">
                    <span className="text-2xl font-bold text-zinc-50">500</span>
                    <span className="ml-2 text-xl">🪙</span>
                  </div>
                  <button
                    onClick={() => handleBuy('pro_box', 'Pro Box')}
                    disabled={loading.pro_box || coins < 500}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                  >
                    {loading.pro_box ? 'Purchasing...' : 'Buy'}
                  </button>
                </div>
              </div>

              {/* Legendary Box - LOCKED */}
              <div className="group rounded-xl border-2 border-yellow-500/60 bg-gradient-to-br from-yellow-900/40 via-yellow-800/30 to-amber-900/40 p-6 shadow-lg shadow-yellow-500/20 hover:border-yellow-400/80 hover:shadow-yellow-500/30 transition-all backdrop-blur-sm flex flex-col">
                {/* Icon & Title - Fixed Top */}
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🔒</div>
                  <h3 className="text-xl font-bold text-yellow-200">Legendary Box</h3>
                </div>

                {/* Content Area */}
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="inline-block px-3 py-1.5 rounded-full bg-yellow-600/30 border border-yellow-500/50">
                    <p className="text-xs font-bold text-yellow-300">REQUIRES KEY</p>
                  </div>
                  <button
                    onClick={() => setDetailsModal('legendary_box')}
                    className="text-sm text-yellow-400 hover:text-yellow-300 font-medium underline decoration-dotted underline-offset-4 transition-colors"
                  >
                    View Drop Rates
                  </button>
                </div>

                {/* Bottom Section - Pinned with mt-auto */}
                <div className="mt-auto space-y-4">
                  <div className="text-center py-3 rounded-lg bg-yellow-950/50 border border-yellow-600/30">
                    <span className="text-2xl font-bold text-yellow-200">5,000</span>
                    <span className="ml-2 text-xl">🪙</span>
                  </div>
                  <button
                    onClick={() => handleBuy('legendary_box', 'Legendary Box')}
                    disabled={loading.legendary_box || coins < 5000}
                    className="w-full rounded-lg bg-gradient-to-r from-yellow-600 to-amber-600 px-4 py-3 font-semibold text-white transition-all hover:from-yellow-700 hover:to-amber-700 hover:shadow-lg hover:shadow-yellow-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                  >
                    {loading.legendary_box ? 'Purchasing...' : 'Buy'}
                  </button>
                </div>
              </div>

              {/* Key */}
              <div className="group rounded-xl border-2 border-yellow-500/60 bg-gradient-to-br from-yellow-900/40 via-yellow-800/30 to-amber-900/40 p-6 shadow-lg shadow-yellow-500/20 hover:border-yellow-400/80 hover:shadow-yellow-500/30 transition-all backdrop-blur-sm flex flex-col">
                {/* Icon & Title - Fixed Top */}
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🔑</div>
                  <h3 className="text-xl font-bold text-yellow-200">Legendary Key</h3>
                </div>

                {/* Content Area */}
                <div className="flex items-center justify-center mb-6">
                  <p className="text-sm text-yellow-300/90 text-center">
                    Unlocks Legendary Boxes
                  </p>
                </div>

                {/* Bottom Section - Pinned with mt-auto */}
                <div className="mt-auto space-y-4">
                  <div className="text-center py-3 rounded-lg bg-yellow-950/50 border border-yellow-600/30">
                    <span className="text-2xl font-bold text-yellow-200">2,500</span>
                    <span className="ml-2 text-xl">🪙</span>
                  </div>
                  <button
                    onClick={() => handleBuy('key', 'Key')}
                    disabled={loading.key || coins < 2500}
                    className="w-full rounded-lg bg-gradient-to-r from-yellow-600 to-amber-600 px-4 py-3 font-semibold text-white transition-all hover:from-yellow-700 hover:to-amber-700 hover:shadow-lg hover:shadow-yellow-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                  >
                    {loading.key ? 'Purchasing...' : 'Buy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-center backdrop-blur-sm">
              <p className="text-sm text-zinc-400">
                💡 <span className="font-medium text-zinc-300">Earn coins</span> by completing puzzles. Legendary boxes and keys can also drop randomly from gameplay!
              </p>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {detailsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() => setDetailsModal(null)}
          >
            <div
              className="relative w-full max-w-md rounded-2xl border-2 border-zinc-700/60 bg-gradient-to-br from-zinc-900/95 via-zinc-900/95 to-zinc-800/95 p-8 shadow-2xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setDetailsModal(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Icon & Title */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{boxDetails[detailsModal].icon}</div>
                <h3 className="text-2xl font-bold text-zinc-50 mb-2">
                  {boxDetails[detailsModal].title}
                </h3>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
              </div>

              {/* Details List */}
              <div className="space-y-3">
                {boxDetails[detailsModal].details.map((detail, index) => (
                  <div key={index}>
                    {detail.badge ? (
                      <div className="text-center mb-4">
                        <div className="inline-block px-4 py-2 rounded-full bg-yellow-600/30 border border-yellow-500/50">
                          <p className={`text-sm font-bold ${detail.color}`}>{detail.text}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                        <span className={`font-semibold ${detail.color}`}>{detail.text}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setDetailsModal(null)}
                className="mt-6 w-full rounded-lg bg-gradient-to-r from-zinc-700 to-zinc-600 px-6 py-3 font-semibold text-white transition-all hover:from-zinc-600 hover:to-zinc-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
  )
}

