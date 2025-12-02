'use client'

import { useState } from 'react'
import { createTradeOffer, respondToTrade, searchUserCards } from '@/app/trading/actions'
import {
  ArrowRightLeft,
  Search,
  User,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Sparkles
} from 'lucide-react'

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
        className={`group cursor-pointer border-2 rounded-xl overflow-hidden backdrop-blur-md transition-all duration-300 ${
          selected === card.id
            ? 'border-purple-500 bg-purple-900/20 scale-105 shadow-lg shadow-purple-500/20'
            : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600 hover:scale-105'
        }`}
      >
        <div className="aspect-[2/3] overflow-hidden bg-zinc-950">
          {card.final_image_url ? (
            <img
              src={card.final_image_url}
              alt={template.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700">
              <User className="w-12 h-12" />
            </div>
          )}
        </div>
        <div className="p-3 space-y-1">
          <h4 className="font-semibold text-zinc-50 text-sm truncate">{template.name}</h4>
          <p className="text-xs text-zinc-400">#{card.serial_number} / {template.max_mints || '∞'}</p>
          <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            template.rarity === 'mythic' ? 'bg-yellow-500/20 text-yellow-300' :
            template.rarity === 'legendary' ? 'bg-yellow-600/20 text-yellow-400' :
            template.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
            template.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
            'bg-zinc-500/20 text-zinc-400'
          }`}>
            {template.rarity}
          </div>
        </div>
        {selected === card.id && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    )
  }

  const pendingTrades = trades.filter(t => t.status === 'pending')
  const completedTrades = trades.filter(t => t.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Premium Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ArrowRightLeft className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Trading
              </h1>
              <p className="text-zinc-400 text-lg">Exchange cards directly with other players</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex gap-4 mt-6">
            <div className="flex-1 rounded-xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-bold text-zinc-50">{pendingTrades.length}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Your Cards</p>
                  <p className="text-2xl font-bold text-zinc-50">{myCards.length}</p>
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

        {/* Propose Trade Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowPropose(!showPropose)}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
              showPropose
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/20'
            }`}
          >
            {showPropose ? (
              <>
                <XCircle className="w-5 h-5" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                <span>Propose Trade</span>
              </>
            )}
          </button>
        </div>

        {/* Propose Trade Section */}
        {showPropose && (
          <div className="mb-8 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-8">
            <h2 className="text-3xl font-bold text-zinc-50 mb-6 flex items-center gap-3">
              <ArrowRightLeft className="w-8 h-8 text-purple-400" />
              Propose a Trade
            </h2>

            {/* Search User */}
            <form onSubmit={handleSearch} className="mb-8">
              <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Find Trading Partner</span>
                </div>
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-700 disabled:to-zinc-700 transition-all"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Your Cards */}
                <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-50">Your Cards</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
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
                <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-50">
                      {searchResults.user.username}'s Cards
                    </h3>
                  </div>
                  {searchResults.cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                        <User className="w-8 h-8 text-zinc-600" />
                      </div>
                      <p className="text-zinc-500">This user has no cards available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
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
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleProposeTrade}
                  disabled={!selectedMyCard || !selectedTheirCard || proposing}
                  className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/20"
                >
                  {proposing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Proposing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" />
                      <span>Propose Trade</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pending Trades */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-7 h-7 text-orange-400" />
            <h2 className="text-3xl font-bold text-zinc-50">Pending Trades</h2>
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-300 text-sm font-bold">
              {pendingTrades.length}
            </span>
          </div>
          {pendingTrades.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-lg">No pending trades at the moment</p>
            </div>
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
                <div key={trade.id} className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-6 hover:border-zinc-700/50 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-50">
                          Trade with {otherUser.username}
                        </h3>
                        <p className="text-xs text-zinc-500">Pending confirmation</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {iConfirmed && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/50 text-green-300 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          You Confirmed
                        </span>
                      )}
                      {theyConfirmed && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          They Confirmed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center">
                    {/* Your Card */}
                    <div className="rounded-xl border-2 border-zinc-700/50 bg-zinc-800/30 backdrop-blur-md overflow-hidden">
                      <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-700/50">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">You Give</p>
                      </div>
                      <div className="p-3">
                        <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-zinc-950">
                          {myCard.final_image_url && (
                            <img src={myCard.final_image_url} alt={myCard.template.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <h4 className="font-semibold text-zinc-50 text-sm mb-1">{myCard.template.name}</h4>
                        <p className="text-xs text-zinc-400">#{myCard.serial_number}</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <ArrowRightLeft className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Their Card */}
                    <div className="rounded-xl border-2 border-zinc-700/50 bg-zinc-800/30 backdrop-blur-md overflow-hidden">
                      <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-700/50">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">You Get</p>
                      </div>
                      <div className="p-3">
                        <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-zinc-950">
                          {theirCard.final_image_url && (
                            <img src={theirCard.final_image_url} alt={theirCard.template.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <h4 className="font-semibold text-zinc-50 text-sm mb-1">{theirCard.template.name}</h4>
                        <p className="text-xs text-zinc-400">#{theirCard.serial_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3 justify-end items-center">
                    {!iConfirmed ? (
                      <>
                        <button
                          onClick={() => handleRespondToTrade(trade.id, true)}
                          disabled={responding === trade.id}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-zinc-700 disabled:to-zinc-700 transition-all"
                        >
                          {responding === trade.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Accept</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRespondToTrade(trade.id, false)}
                          disabled={responding === trade.id}
                          className="flex items-center gap-2 px-6 py-2.5 bg-red-600/20 border border-red-500/50 text-red-300 rounded-lg font-semibold hover:bg-red-600/30 disabled:opacity-50 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="w-4 h-4" />
                        <p className="text-sm">Waiting for {otherUser.username} to confirm...</p>
                      </div>
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
          <div className="flex items-center gap-3 mb-6">
            <History className="w-7 h-7 text-blue-400" />
            <h2 className="text-3xl font-bold text-zinc-50">Trade History</h2>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-sm font-bold">
              {completedTrades.length}
            </span>
          </div>
          {completedTrades.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <History className="w-10 h-10 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-lg">No completed trades yet</p>
              <p className="text-zinc-600 text-sm mt-2">Your trading history will appear here</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {completedTrades.slice(0, 5).map(trade => {
                const isInitiator = trade.initiator.id === userId
                const otherUser = isInitiator ? trade.recipient : trade.initiator

                return (
                  <div key={trade.id} className="rounded-xl bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 p-4 hover:border-zinc-700/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-zinc-300">
                          Traded with <span className="font-semibold text-zinc-50">{otherUser.username}</span>
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500">{new Date(trade.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
