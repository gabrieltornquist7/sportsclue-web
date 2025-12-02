'use client'

import { useState } from 'react'
import { createTradeOffer, respondToTrade, searchUserCards } from '@/app/trading/actions'

export default function TradingUI({ trades, myCards, userId, username, locale }) {
  const [showPropose, setShowPropose] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [selectedMyCard, setSelectedMyCard] = useState(null)
  const [selectedTheirCard, setSelectedTheirCard] = useState(null)
  const [message, setMessage] = useState(null)
  const [responding, setResponding] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchUsername.trim()) return

    setSearching(true)
    setMessage(null)

    const result = await searchUserCards(searchUsername.trim())

    setSearching(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      setSearchResults(null)
    } else {
      setSearchResults(result)
      setMessage(null)
    }
  }

  const handleProposeTrade = async () => {
    if (!selectedMyCard || !selectedTheirCard || !searchResults) {
      setMessage({ type: 'error', text: 'Please select both cards' })
      return
    }

    setProposing(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('myCardId', selectedMyCard)
    formData.append('recipientUsername', searchResults.user.username)
    formData.append('recipientCardId', selectedTheirCard)

    const result = await createTradeOffer(formData)

    setProposing(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Trade offer sent!' })
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  const handleRespondToTrade = async (tradeId, accept) => {
    setResponding(tradeId)
    setMessage(null)

    const result = await respondToTrade(tradeId, accept)

    setResponding(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message })
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'border-yellow-300 bg-gradient-to-br from-yellow-900/40 to-orange-900/40'
      case 'legendary': return 'border-yellow-500 bg-yellow-900/30'
      case 'epic': return 'border-purple-500 bg-purple-900/30'
      case 'rare': return 'border-blue-500 bg-blue-900/30'
      case 'common': return 'border-zinc-500 bg-zinc-900/30'
      default: return 'border-zinc-500 bg-zinc-900/30'
    }
  }

  const CardDisplay = ({ card, selected, onSelect }) => {
    const template = card.template
    return (
      <div
        onClick={() => onSelect(card.id)}
        className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
          selected === card.id
            ? 'border-blue-500 bg-blue-900/30 scale-105'
            : getRarityColor(template.rarity)
        } hover:scale-105`}
      >
        <div className="aspect-[2/3] mb-2 rounded-md overflow-hidden bg-zinc-900">
          {card.final_image_url ? (
            <img src={card.final_image_url} alt={template.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Image</div>
          )}
        </div>
        <h4 className="font-semibold text-zinc-50 text-sm truncate">{template.name}</h4>
        <p className="text-xs text-zinc-400">#{card.serial_number} / {template.max_mints || '∞'}</p>
        <p className="text-xs text-zinc-500 capitalize">{template.rarity}</p>
      </div>
    )
  }

  const pendingTrades = trades.filter(t => t.status === 'pending')
  const completedTrades = trades.filter(t => t.status === 'completed')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-zinc-50">🤝 Trading</h1>
        <p className="text-zinc-400">Trade cards directly with other players</p>
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

      {/* Propose Trade Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowPropose(!showPropose)}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          {showPropose ? 'Cancel' : '+ Propose Trade'}
        </button>
      </div>

      {/* Propose Trade Section */}
      {showPropose && (
        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-zinc-50 mb-4">Propose a Trade</h2>

          {/* Search User */}
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Search for user
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter username..."
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-zinc-700"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Your Cards */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-50 mb-4">Your Cards</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {myCards.map(card => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      selected={selectedMyCard}
                      onSelect={setSelectedMyCard}
                    />
                  ))}
                </div>
              </div>

              {/* Their Cards */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-50 mb-4">
                  {searchResults.user.username}'s Cards
                </h3>
                {searchResults.cards.length === 0 ? (
                  <p className="text-zinc-500">This user has no cards</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {searchResults.cards.map(card => (
                      <CardDisplay
                        key={card.id}
                        card={card}
                        selected={selectedTheirCard}
                        onSelect={setSelectedTheirCard}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Propose Button */}
          {searchResults && (
            <div className="mt-6 text-center">
              <button
                onClick={handleProposeTrade}
                disabled={!selectedMyCard || !selectedTheirCard || proposing}
                className="px-8 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed"
              >
                {proposing ? 'Proposing...' : 'Propose Trade'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Trades */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-50 mb-4">Pending Trades ({pendingTrades.length})</h2>
        {pendingTrades.length === 0 ? (
          <p className="text-zinc-500">No pending trades</p>
        ) : (
          <div className="grid gap-4">
            {pendingTrades.map(trade => {
              const isInitiator = trade.initiator.id === userId
              const otherUser = isInitiator ? trade.recipient : trade.initiator
              const myCard = isInitiator ? trade.initiator_card : trade.recipient_card
              const theirCard = isInitiator ? trade.recipient_card : trade.initiator_card
              const iConfirmed = isInitiator ? trade.initiator_confirmed : trade.recipient_confirmed
              const theyConfirmed = isInitiator ? trade.recipient_confirmed : trade.initiator_confirmed

              return (
                <div key={trade.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-zinc-50">
                      Trade with {otherUser.username}
                    </h3>
                    <div className="flex gap-2">
                      {iConfirmed && <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">You Confirmed</span>}
                      {theyConfirmed && <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">They Confirmed</span>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 items-center">
                    {/* Your Card */}
                    <div className={`border-2 rounded-lg p-3 ${getRarityColor(myCard.template.rarity)}`}>
                      <p className="text-xs text-zinc-400 mb-2">You give</p>
                      <div className="aspect-[2/3] mb-2 rounded-md overflow-hidden bg-zinc-900">
                        {myCard.final_image_url && (
                          <img src={myCard.final_image_url} alt={myCard.template.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <h4 className="font-semibold text-zinc-50 text-sm">{myCard.template.name}</h4>
                      <p className="text-xs text-zinc-400">#{myCard.serial_number}</p>
                    </div>

                    {/* Arrow */}
                    <div className="text-center text-3xl text-zinc-600">↔</div>

                    {/* Their Card */}
                    <div className={`border-2 rounded-lg p-3 ${getRarityColor(theirCard.template.rarity)}`}>
                      <p className="text-xs text-zinc-400 mb-2">You get</p>
                      <div className="aspect-[2/3] mb-2 rounded-md overflow-hidden bg-zinc-900">
                        {theirCard.final_image_url && (
                          <img src={theirCard.final_image_url} alt={theirCard.template.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <h4 className="font-semibold text-zinc-50 text-sm">{theirCard.template.name}</h4>
                      <p className="text-xs text-zinc-400">#{theirCard.serial_number}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 justify-end">
                    {!iConfirmed && (
                      <>
                        <button
                          onClick={() => handleRespondToTrade(trade.id, true)}
                          disabled={responding === trade.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-zinc-700"
                        >
                          {responding === trade.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRespondToTrade(trade.id, false)}
                          disabled={responding === trade.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:bg-zinc-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {iConfirmed && !theyConfirmed && (
                      <p className="text-zinc-400 text-sm">Waiting for {otherUser.username} to confirm...</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed Trades */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-50 mb-4">Trade History ({completedTrades.length})</h2>
        {completedTrades.length === 0 ? (
          <p className="text-zinc-500">No completed trades yet</p>
        ) : (
          <div className="grid gap-4">
            {completedTrades.slice(0, 5).map(trade => {
              const isInitiator = trade.initiator.id === userId
              const otherUser = isInitiator ? trade.recipient : trade.initiator

              return (
                <div key={trade.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-300">
                      Traded with <span className="font-semibold">{otherUser.username}</span>
                    </p>
                    <span className="text-xs text-zinc-500">{new Date(trade.created_at).toLocaleDateString()}</span>
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
