'use client'

import { useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import Card from '@/components/Card'
import { LayoutGrid, Search, Filter } from 'lucide-react'

export default function CardCollectionsUI({ templates, mythicOwners, locale }) {
  const [selectedCard, setSelectedCard] = useState(null)
  const { t } = useLocale()

  // Group templates by series_name
  const groupedBySeries = templates.reduce((acc, template) => {
    const seriesName = template.series_name || 'Uncategorized'
    if (!acc[seriesName]) {
      acc[seriesName] = []
    }
    acc[seriesName].push(template)
    return acc
  }, {})

  // Sort series names
  const seriesNames = Object.keys(groupedBySeries).sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900 px-6 py-12">
      <div className="container mx-auto max-w-7xl">
        {/* Premium Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <LayoutGrid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                Card Collections
              </h1>
              <p className="text-zinc-400 text-lg">Browse all available card templates</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Total Templates</p>
                  <p className="text-2xl font-bold text-zinc-50">{templates.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Series</p>
                  <p className="text-2xl font-bold text-zinc-50">{seriesNames.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Search className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Status</p>
                  <p className="text-2xl font-bold text-zinc-50">Browse Mode</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery by Series */}
        <div className="space-y-12">
          {seriesNames.map(seriesName => {
            const seriesTemplates = groupedBySeries[seriesName]
            if (!seriesTemplates || seriesTemplates.length === 0) {
              return null
            }

            return (
              <div key={seriesName} className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 overflow-hidden">
                {/* Series Header */}
                <div className="border-b border-zinc-800/50 bg-zinc-900/20 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-zinc-50 mb-1">
                        {seriesName}
                      </h2>
                      <p className="text-sm text-zinc-400">
                        {seriesTemplates.length} {seriesTemplates.length === 1 ? 'card' : 'cards'} in this series
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                      <LayoutGrid className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {seriesTemplates.map(template => (
                      <Card
                        key={template.id}
                        card={template}
                        mode="collection"
                        size="normal"
                        onClick={() => setSelectedCard(template)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Card Details Modal */}
        {selectedCard && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            style={{
              zIndex: 99999
            }}
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="relative bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute -top-3 -right-3 z-20 rounded-full bg-zinc-800/90 p-2.5 text-zinc-400 hover:text-white transition-all backdrop-blur-md border border-zinc-700/50 hover:border-zinc-600 shadow-lg hover:bg-zinc-700/90"
              >
                ✕
              </button>

              {/* Modal Content */}
              <div className="p-6">
                {/* Card Component - Scaled Down */}
                <div className="flex justify-center mb-4" style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}>
                  <Card
                    card={selectedCard}
                    mode="collection"
                    size="normal"
                  />
                </div>

                {/* Card Info Section */}
                <div className="space-y-4">
                  {/* Description */}
                  {selectedCard.description && (
                    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Description
                      </p>
                      <p className="text-zinc-200 leading-relaxed text-sm">
                        {selectedCard.description}
                      </p>
                    </div>
                  )}

                  {/* Mythic Owner Info */}
                  {selectedCard.rarity === 'mythic' && (
                    <div className="rounded-xl bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 p-6 text-center">
                      {mythicOwners[selectedCard.id] ? (
                        <div>
                          <p className="text-xs text-yellow-400 mb-2 uppercase tracking-wider font-semibold">Current Owner</p>
                          <p className="text-xl font-bold text-yellow-300">
                            @{mythicOwners[selectedCard.id]}
                          </p>
                          <p className="text-xs text-yellow-400/70 mt-2">This is a 1-of-1 card</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-yellow-400 font-semibold mb-1">Not Yet Minted</p>
                          <p className="text-xs text-yellow-400/70 italic">
                            Be the first to own this mythic card!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remaining Info for Capped Cards */}
                  {selectedCard.rarity !== 'common' && selectedCard.rarity !== 'mythic' && selectedCard.max_mints && (
                    <div className="rounded-xl bg-blue-900/20 border border-blue-500/30 p-4 text-center">
                      <p className="text-xs text-blue-400 mb-2 uppercase tracking-wider font-semibold">Availability</p>
                      <p className="text-lg text-blue-300">
                        <span className="font-bold text-2xl">{selectedCard.max_mints - (selectedCard.current_mints || 0)}</span>
                        <span className="text-sm ml-2">of {selectedCard.max_mints} remaining</span>
                      </p>
                    </div>
                  )}

                  {/* Series Info */}
                  {selectedCard.series_name && (
                    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 text-center">
                      <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">Series</p>
                      <p className="text-sm font-medium text-zinc-200">{selectedCard.series_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

