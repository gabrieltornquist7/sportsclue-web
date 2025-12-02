'use client'

import { useState } from 'react'
import { purchaseListing } from '@/app/marketplace/actions'
import Card from '@/components/Card'

export default function MarketplaceUI({ listings, userId, userCoins, locale }) {
  const [purchasing, setPurchasing] = useState(null)
  const [message, setMessage] = useState(null)
  const [filter, setFilter] = useState('all')

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

  const filteredListings = filter === 'all'
    ? listings
    : listings.filter(listing => listing.card.template.rarity === filter)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-zinc-50">🏪 Marketplace</h1>
        <p className="text-zinc-400">Buy cards from other players using coins</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 rounded-md p-4 text-center ${
            message.type === 'error'
              ? 'bg-red-900/20 text-red-400 border border-red-800'
              : 'bg-green-900/20 text-green-400 border border-green-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'mythic', 'legendary', 'epic', 'rare', 'common'].map(rarity => (
          <button
            key={rarity}
            onClick={() => setFilter(rarity)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === rarity
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-lg">No listings found</p>
          <p className="text-zinc-500 text-sm mt-2">Check back later or list your own cards!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map(listing => {
            const card = listing.card
            const template = card.template
            const isOwn = listing.seller.id === userId

            return (
              <div
                key={listing.id}
                className={`bg-gradient-to-br ${getRarityColor(template.rarity)} border-2 rounded-lg p-4 transition-transform hover:scale-105`}
              >
                {/* Card Image */}
                <div className="aspect-[2/3] mb-3 rounded-md overflow-hidden bg-zinc-900">
                  {card.final_image_url ? (
                    <img
                      src={card.final_image_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      No Image
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="space-y-2">
                  <h3 className="font-bold text-zinc-50 truncate">{template.name}</h3>
                  <p className="text-sm text-zinc-400">#{card.serial_number} / {template.max_mints || '∞'}</p>
                  <p className="text-xs text-zinc-500 capitalize">{template.rarity}</p>

                  {/* Seller */}
                  <p className="text-xs text-zinc-400">
                    Seller: <span className="text-zinc-300">{listing.seller.username}</span>
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                    <span className="text-yellow-500 font-bold text-lg">💰 {listing.price}</span>
                    {isOwn ? (
                      <span className="text-xs text-zinc-500">Your listing</span>
                    ) : (
                      <button
                        onClick={() => handlePurchase(listing.id, listing.price)}
                        disabled={purchasing === listing.id || userCoins < listing.price}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          userCoins < listing.price
                            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-700'
                        }`}
                      >
                        {purchasing === listing.id ? 'Buying...' : 'Buy'}
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
  )
}
