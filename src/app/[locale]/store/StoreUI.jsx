'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { buyItem } from '@/app/store/actions'
import { Store, Package, Key, Crown, Star, Lock, Coins, Sparkles, X, ChevronRight, Zap, Gift } from 'lucide-react'

export default function StoreUI({ userId, locale, username }) {
  const { updateCurrency } = useCurrency()
  const [loading, setLoading] = useState({})
  const [message, setMessage] = useState(null)
  const [detailsModal, setDetailsModal] = useState(null)
  const router = useRouter()
  const { t } = useLocale()
  const { coins, keys } = useCurrency()

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
      updateCurrency(result.newCoins, result.newKeys)
      setMessage({ type: 'success', text: result.message })
      setLoading(prev => ({ ...prev, [itemType]: false }))
    }
  }

  // Box configuration with drop rates
  const boxConfig = {
    standard_box: {
      title: 'Standard Box',
      description: 'Perfect for beginners',
      icon: Package,
      price: 100,
      gradient: 'from-blue-600 to-cyan-500',
      glow: 'shadow-blue-500/20',
      hoverGlow: 'group-hover:shadow-blue-500/40',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-400/60',
      buttonGradient: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600',
      iconBg: 'bg-blue-500/20',
      rates: [
        { rarity: 'Common', percent: 80, color: 'bg-zinc-500' },
        { rarity: 'Rare', percent: 20, color: 'bg-blue-500' }
      ]
    },
    pro_box: {
      title: 'Pro Box',
      description: 'Better odds, better cards',
      icon: Zap,
      price: 500,
      gradient: 'from-purple-600 to-pink-500',
      glow: 'shadow-purple-500/20',
      hoverGlow: 'group-hover:shadow-purple-500/40',
      borderColor: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-400/60',
      buttonGradient: 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600',
      iconBg: 'bg-purple-500/20',
      rates: [
        { rarity: 'Rare', percent: 60, color: 'bg-blue-500' },
        { rarity: 'Epic', percent: 34.9, color: 'bg-purple-500' },
        { rarity: 'Legendary', percent: 5, color: 'bg-yellow-500' },
        { rarity: 'Mythic', percent: 0.1, color: 'bg-gradient-to-r from-amber-400 to-pink-500' }
      ]
    },
    legendary_box: {
      title: 'Legendary Box',
      description: 'Premium collection items',
      icon: Crown,
      price: 5000,
      requiresKey: true,
      gradient: 'from-amber-500 to-yellow-400',
      glow: 'shadow-amber-500/30',
      hoverGlow: 'group-hover:shadow-amber-500/50',
      borderColor: 'border-amber-500/40',
      hoverBorder: 'hover:border-amber-400/70',
      buttonGradient: 'from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400',
      iconBg: 'bg-amber-500/20',
      featured: true,
      rates: [
        { rarity: 'Epic', percent: 60, color: 'bg-purple-500' },
        { rarity: 'Legendary', percent: 39.5, color: 'bg-yellow-500' },
        { rarity: 'Mythic', percent: 0.5, color: 'bg-gradient-to-r from-amber-400 to-pink-500' }
      ]
    },
    key: {
      title: 'Legendary Key',
      description: 'Unlocks Legendary Boxes',
      icon: Key,
      price: 2500,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/20',
      hoverGlow: 'group-hover:shadow-amber-500/40',
      borderColor: 'border-amber-500/30',
      hoverBorder: 'hover:border-amber-400/60',
      buttonGradient: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400',
      iconBg: 'bg-amber-500/20',
      isKey: true
    }
  }

  // Box Card Component
  const BoxCard = ({ boxType, config }) => {
    const IconComponent = config.icon
    const canAfford = coins >= config.price
    const isLoading = loading[boxType]

    return (
      <div className={`group relative rounded-2xl border ${config.borderColor} ${config.hoverBorder} bg-zinc-900/60 backdrop-blur-md overflow-hidden transition-all duration-300 ${config.glow} ${config.hoverGlow} hover:scale-[1.02]`}>
        {/* Gradient accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

        {/* Content */}
        <div className="p-6 flex flex-col h-full">
          {/* Icon & Title */}
          <div className="text-center mb-5">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${config.iconBg} mb-4`}>
              <IconComponent className={`w-8 h-8 bg-gradient-to-r ${config.gradient} bg-clip-text`} style={{ stroke: 'url(#iconGradient)' }} />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{config.title}</h3>
            <p className="text-sm text-zinc-400">{config.description}</p>
          </div>

          {/* Key requirement badge */}
          {config.requiresKey && (
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">REQUIRES KEY</span>
              </div>
            </div>
          )}

          {/* View Drop Rates */}
          {config.rates && (
            <div className="flex justify-center mb-5">
              <button
                onClick={() => setDetailsModal(boxType)}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors group/link"
              >
                <Sparkles className="w-4 h-4" />
                <span className="underline decoration-dotted underline-offset-4">View Drop Rates</span>
                <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
              </button>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price & Button */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black/40 border border-white/5">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-2xl font-bold text-white">{config.price.toLocaleString()}</span>
            </div>

            <button
              onClick={() => handleBuy(boxType, config.title)}
              disabled={isLoading || !canAfford}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${config.buttonGradient} font-semibold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Buy Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 mb-6">
              <Store className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Card Store
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Expand your collection with premium boxes and unlock rare cards
            </p>

            {/* Stats bar */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/60 border border-zinc-700/50 backdrop-blur-sm">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-semibold text-white">{coins?.toLocaleString() || 0}</span>
                <span className="text-sm text-zinc-500">coins</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/60 border border-zinc-700/50 backdrop-blur-sm">
                <Key className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-semibold text-white">{keys || 0}</span>
                <span className="text-sm text-zinc-500">keys</span>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-8 max-w-2xl mx-auto rounded-xl border-2 p-4 text-center font-medium backdrop-blur-sm ${
              message.type === 'error'
                ? 'bg-red-900/30 border-red-500/50 text-red-300'
                : 'bg-green-900/30 border-green-500/50 text-green-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Featured Legendary Box */}
          <div className="mb-10">
            <div className="relative rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-zinc-900/80 to-amber-950/40 p-8 overflow-hidden backdrop-blur-md shadow-2xl shadow-amber-500/10">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 rounded-3xl opacity-50 rainbow-border-card pointer-events-none" />

              {/* Shimmer effect */}
              <div className="absolute inset-0 shimmer-effect-card opacity-20 pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                {/* Left: Icon & Badge */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-500/50 flex items-center justify-center">
                      <Crown className="w-16 h-16 text-amber-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-xs font-bold text-amber-950">
                      PREMIUM
                    </div>
                  </div>
                </div>

                {/* Middle: Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-amber-100 mb-2">Legendary Box</h2>
                  <p className="text-amber-200/70 mb-4">The ultimate collection experience with guaranteed Epic+ cards</p>

                  {/* Quick stats */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40">
                      <span className="text-sm font-semibold text-purple-300">60% Epic</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40">
                      <span className="text-sm font-semibold text-yellow-300">39.5% Legendary</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/40">
                      <span className="text-sm font-semibold text-amber-300">0.5% Mythic</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-300">Requires Key</span>
                  </div>
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/40 border border-amber-500/30">
                    <Coins className="w-6 h-6 text-amber-400" />
                    <span className="text-3xl font-bold text-white">5,000</span>
                  </div>
                  <button
                    onClick={() => handleBuy('legendary_box', 'Legendary Box')}
                    disabled={loading.legendary_box || coins < 5000}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading.legendary_box ? (
                      <>
                        <div className="w-5 h-5 border-2 border-amber-950/30 border-t-amber-950 rounded-full animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        Buy Legendary Box
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setDetailsModal('legendary_box')}
                    className="text-sm text-amber-400 hover:text-amber-300 underline decoration-dotted underline-offset-4"
                  >
                    View all drop rates
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Other Boxes Grid */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Package className="w-6 h-6 text-zinc-400" />
              Card Boxes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BoxCard boxType="standard_box" config={boxConfig.standard_box} />
              <BoxCard boxType="pro_box" config={boxConfig.pro_box} />
              <BoxCard boxType="key" config={boxConfig.key} />
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-2xl border border-zinc-700/50 bg-zinc-800/40 backdrop-blur-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Earn More Coins</h3>
                <p className="text-zinc-400">
                  Complete daily puzzles to earn coins. Legendary boxes and keys can also drop randomly from gameplay rewards!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModal && boxConfig[detailsModal]?.rates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setDetailsModal(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setDetailsModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${boxConfig[detailsModal].iconBg} mb-4`}>
                {(() => {
                  const IconComp = boxConfig[detailsModal].icon
                  return <IconComp className="w-10 h-10 text-white" />
                })()}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {boxConfig[detailsModal].title}
              </h3>
              <p className="text-zinc-400">Drop Rate Breakdown</p>
            </div>

            {/* Key requirement */}
            {boxConfig[detailsModal].requiresKey && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">Requires Key to Unlock</span>
                </div>
              </div>
            )}

            {/* Drop Rates with Progress Bars */}
            <div className="space-y-4">
              {boxConfig[detailsModal].rates.map((rate, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rate.rarity}</span>
                    <span className="text-zinc-400">{rate.percent}%</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${rate.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(rate.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setDetailsModal(null)}
              className="mt-8 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
