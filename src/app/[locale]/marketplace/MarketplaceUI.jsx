'use client'

import { useState } from 'react'
import { purchaseListing } from '@/app/marketplace/actions'
import Card from '@/components/Card'
import {
  Store,
  Coins,
  ShoppingCart,
  Filter,
  Sparkles,
  TrendingUp
} from 'lucide-react'

export default function MarketplaceUI({ listings, userId, userCoins, locale }) {
  const [purchasing, setPurchasing] = useState(null)
  const [message, setMessage] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent') // recent, price_low, price_high

  const handlePurchase = async (listingId, price) => {
    if (userCoins < price) {
      setMessage({ type: 'error', text: `Not enough coins! You need ${price} coins but only have ${userCoins}.` })
      return
    }

    if (!confirm(`Purchase this card for ${price} coins?`)) {
      return
    }

    setPurchasing(listingId)
    setMessage(null)

    const result = await purchaseListing(listingId)

    setPurchasing(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Card purchased successfully!' })
      // Reload page to update listings
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'border-yellow-300 from-yellow-900/40 to-orange-900/40'
      case 'legendary': return 'border-yellow-500 from-yellow-900/30 to-yellow-800/30'
      case 'epic': return 'border-purple-500 from-purple-900/30 to-purple-800/30'
      case 'rare': return 'border-blue-500 from-blue-900/30 to-blue-800/30'
      case 'common': return 'border-zinc-500 from-zinc-900/30 to-zinc-800/30'
      default: return 'border-zinc-500 from-zinc-900/30 to-zinc-800/30'
    }
  }

  // Filter out any broken listings (missing card or template data)
  const validListings = listings.filter(listing => listing.card && listing.card.template)

  // Filter and sort listings
  let filteredListings = filter === 'all'
    ? validListings
    : validListings.filter(listing => listing.card?.template?.rarity === filter)

  // Apply sorting
  filteredListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price
    if (sortBy === 'price_high') return b.price - a.price
    return new Date(b.created_at) - new Date(a.created_at) // recent (default)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Premium Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Marketplace
              </h1>
              <p className="text-zinc-400 text-lg">Discover and collect cards from other players</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex gap-4 mt-6">
            <div className="flex-1 rounded-xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Available</p>
                  <p className="text-2xl font-bold text-zinc-50">{filteredListings.length}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Your Balance</p>
                  <p className="text-2xl font-bold text-zinc-50">{userCoins.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-8 rounded-xl p-5 text-center backdrop-blur-md border ${
              message.type === 'error'
                ? 'bg-red-900/20 text-red-300 border-red-800/50'
                : 'bg-green-900/20 text-green-300 border-green-800/50'
            }`}
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Filters & Sort - Premium Design */}
        <div className="mb-8 rounded-xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Rarity Filter */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Rarity</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'mythic', 'legendary', 'epic', 'rare', 'common'].map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => setFilter(rarity)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      filter === rarity
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                        : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                    }`}
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="lg:w-64">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Sort By</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700/50 px-4 py-2 text-zinc-100 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="recent">Recent First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-16 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center mx-auto mb-6">
              <Store className="w-12 h-12 text-zinc-500" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-300 mb-2">No Listings Available</h3>
            <p className="text-zinc-500 text-lg mb-6">Check back later or list your own cards from your inventory!</p>
            <a
              href={`/${locale}/inventory`}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg hover:shadow-blue-500/20"
            >
              Go to Inventory
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map(listing => {
              const card = listing.card
              const template = card?.template
              if (!card || !template) return null // Skip broken listings
              const isOwn = listing.seller?.id === userId
              const canAfford = userCoins >= listing.price

              return (
                <div
                  key={listing.id}
                  className={`group relative rounded-xl border-2 backdrop-blur-md overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    isOwn
                      ? 'border-blue-500/30 bg-blue-900/10'
                      : 'border-zinc-800/50 bg-zinc-900/40 hover:border-zinc-700/50'
                  }`}
                >
                  {/* Rarity Glow Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${getRarityColor(template.rarity)}`} />

                  {/* Card Image */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                    {card.final_image_url ? (
                      <img
                        src={card.final_image_url}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <Store className="w-16 h-16" />
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                      template.rarity === 'mythic' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                      template.rarity === 'legendary' ? 'bg-yellow-600/20 border-yellow-600/50 text-yellow-400' :
                      template.rarity === 'epic' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
                      template.rarity === 'rare' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                      'bg-zinc-500/20 border-zinc-500/50 text-zinc-400'
                    }`}>
                      {template.rarity}
                    </div>

                    {isOwn && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 border border-blue-500/50 text-blue-300 backdrop-blur-md">
                        Your Listing
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="relative p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-zinc-50 text-lg truncate mb-1">{template.name}</h3>
                      <p className="text-sm text-zinc-400">
                        #{card.serial_number} <span className="text-zinc-600">/</span> {template.max_mints || '∞'}
                      </p>
                    </div>

                    {/* Seller Info */}
                    {!isOwn && listing.seller?.username && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center">
                          <span className="text-zinc-300 font-bold">{listing.seller.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-zinc-400">{listing.seller.username}</span>
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-400 font-bold text-xl">{listing.price.toLocaleString()}</span>
                      </div>

                      {!isOwn && (
                        <button
                          onClick={() => handlePurchase(listing.id, listing.price)}
                          disabled={purchasing === listing.id || !canAfford}
                          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                            !canAfford
                              ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                              : purchasing === listing.id
                              ? 'bg-zinc-700 text-zinc-400'
                              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/20'
                          }`}
                        >
                          {purchasing === listing.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Buying...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span>Buy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
