'use client'

import { useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'

export default function HallOfFameUI({ templates, mythicOwners, locale }) {
  const [selectedCard, setSelectedCard] = useState(null)
  const { t } = useLocale()

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

  const getRarityTextColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'text-yellow-300'
      case 'legendary': return 'text-yellow-400'
      case 'epic': return 'text-purple-400'
      case 'rare': return 'text-blue-400'
      case 'common': return 'text-zinc-400'
      default: return 'text-zinc-400'
    }
  }

  const getRarityLabel = (rarity) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1)
  }

  const getScarcityInfo = (template) => {
    const currentMints = template.current_mints || 0
    if (template.rarity === 'common') {
      return `Mint Status: ${currentMints}`
    } else if (template.rarity === 'mythic') {
      return `Mint Status: ${currentMints} / 1`
    } else {
      return `Mint Status: ${currentMints} / ${template.max_mints || '∞'}`
    }
  }

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
    <div className="min-h-screen py-12 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-zinc-50">
            🏆 Card Collections
          </h1>
          <p className="text-xl text-zinc-400">
            The complete collection showcase
          </p>
        </div>

        {/* Gallery by Series */}
        {seriesNames.map(seriesName => {
          const seriesTemplates = groupedBySeries[seriesName]
          if (!seriesTemplates || seriesTemplates.length === 0) {
            return null
          }

          return (
            <div key={seriesName} className="mb-16">
              <h2 className="mb-8 text-4xl font-bold text-zinc-50">
                {seriesName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {seriesTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedCard(template)}
                    className={`group relative rounded-xl border-4 overflow-hidden transition-all hover:scale-105 hover:shadow-2xl ${getRarityColor(template.rarity)} ${template.rarity === 'mythic' ? 'animate-pulse' : ''}`}
                  >
                    {/* Card Art Background */}
                    {template.base_image_url && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity"
                        style={{ backgroundImage: `url(${template.base_image_url})` }}
                      />
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/90" />
                    
                    {/* Card Content */}
                    <div className="relative z-10 p-6 min-h-[300px] flex flex-col justify-between">
                      {/* Top Section */}
                      <div className="flex justify-between items-start">
                        {/* Series Name - Foil Stamp */}
                        {template.series_name && (
                          <div className="text-xs font-bold text-yellow-300/80 bg-yellow-900/30 px-2 py-1 rounded border border-yellow-400/50 transform -rotate-12 shadow-lg">
                            {template.series_name}
                          </div>
                        )}
                        {/* Spacer if no series */}
                        {!template.series_name && <div />}
                      </div>
                      
                      {/* Top-Right: Mint Status Badge */}
                      <div className="absolute top-3 right-3 z-20">
                        <div className="rounded-lg bg-black/90 px-3 py-1.5 border-2 border-white/30 backdrop-blur-sm">
                          <p className="text-xs text-zinc-400 mb-0.5">MINT STATUS</p>
                          <p className="text-sm font-bold text-white">{getScarcityInfo(template)}</p>
                        </div>
                      </div>
                      
                      {/* Center: Empty space for art */}
                      <div className="flex-1" />
                      
                      {/* Bottom: Name and Rarity Badge */}
                      <div className="text-center">
                        <h3 className="mb-3 text-lg font-bold text-white drop-shadow-lg">{template.name}</h3>
                        {/* Rarity Badge - Colored Pill */}
                        <div className={`inline-block px-3 py-1 rounded-full border-2 ${getRarityTextColor(template.rarity)} ${template.rarity === 'mythic' ? 'bg-yellow-900/40 border-yellow-300' : template.rarity === 'legendary' ? 'bg-yellow-900/30 border-yellow-500' : template.rarity === 'epic' ? 'bg-purple-900/30 border-purple-500' : template.rarity === 'rare' ? 'bg-blue-900/30 border-blue-500' : 'bg-zinc-900/30 border-zinc-500'}`}>
                          <p className={`text-xs font-bold uppercase tracking-wider ${getRarityTextColor(template.rarity)}`}>
                            {getRarityLabel(template.rarity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Card Details Modal - Larger Card Component */}
        {selectedCard && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6"
            onClick={() => setSelectedCard(null)}
          >
            <div 
              className={`relative w-full max-w-md aspect-[2/3] rounded-xl border-4 overflow-hidden transition-all ${getRarityColor(selectedCard.rarity)} ${selectedCard.rarity === 'mythic' ? 'animate-pulse' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card Art Background */}
              {selectedCard.base_image_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-60"
                  style={{ backgroundImage: `url(${selectedCard.base_image_url})` }}
                />
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/90" />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute right-3 top-3 z-20 rounded-full bg-black/80 p-2 text-zinc-400 hover:text-white transition-colors backdrop-blur-sm border border-white/20"
              >
                ✕
              </button>

              {/* Card Content - Same Layout as Card Component */}
              <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                {/* Top Section */}
                <div className="flex justify-between items-start">
                  {/* Series Name - Foil Stamp */}
                  {selectedCard.series_name && (
                    <div className="text-xs font-bold text-yellow-300/90 bg-yellow-900/40 px-3 py-1.5 rounded border-2 border-yellow-400/60 transform -rotate-12 shadow-xl">
                      {selectedCard.series_name}
                    </div>
                  )}
                  {/* Spacer if no series */}
                  {!selectedCard.series_name && <div />}
                </div>
                
                {/* Top-Right: Mint Status Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="rounded-xl bg-black/90 px-4 py-2 border-2 border-white/40 backdrop-blur-md shadow-2xl">
                    <p className="text-xs text-zinc-400 mb-1 tracking-wider">MINT STATUS</p>
                    <p className="text-lg font-bold text-white">
                      {selectedCard.rarity === 'common' ? (
                        <>Mint Status: {selectedCard.current_mints || 0}</>
                      ) : selectedCard.rarity === 'mythic' ? (
                        <>Mint Status: {selectedCard.current_mints || 0} / 1</>
                      ) : (
                        <>Mint Status: {selectedCard.current_mints || 0} / {selectedCard.max_mints || '∞'}</>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Center: Empty space for art */}
                <div className="flex-1" />
                
                {/* Bottom: Name, Rarity Badge, Description */}
                <div className="text-center">
                  <h2 className="mb-3 text-3xl font-bold text-white drop-shadow-lg">{selectedCard.name}</h2>
                  
                  {/* Rarity Badge - Colored Pill */}
                  <div className={`inline-block px-5 py-2 rounded-full border-2 mb-4 ${getRarityTextColor(selectedCard.rarity)} ${selectedCard.rarity === 'mythic' ? 'bg-yellow-900/40 border-yellow-300' : selectedCard.rarity === 'legendary' ? 'bg-yellow-900/30 border-yellow-500' : selectedCard.rarity === 'epic' ? 'bg-purple-900/30 border-purple-500' : selectedCard.rarity === 'rare' ? 'bg-blue-900/30 border-blue-500' : 'bg-zinc-900/30 border-zinc-500'}`}>
                    <p className={`text-sm font-bold uppercase tracking-wider ${getRarityTextColor(selectedCard.rarity)}`}>
                      {getRarityLabel(selectedCard.rarity)}
                    </p>
                  </div>

                  {/* Description */}
                  {selectedCard.description && (
                    <p className="mb-4 text-zinc-200 leading-relaxed text-sm">
                      {selectedCard.description}
                    </p>
                  )}

                  {/* Mythic Owner Info */}
                  {selectedCard.rarity === 'mythic' && (
                    <div className="mt-4">
                      {mythicOwners[selectedCard.id] ? (
                        <div>
                          <p className="text-xs text-zinc-400 mb-1">Owner</p>
                          <p className="text-lg font-bold text-yellow-300">
                            @{mythicOwners[selectedCard.id]}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">
                          Not yet minted
                        </p>
                      )}
                    </div>
                  )}

                  {/* Remaining Info for Capped Cards */}
                  {selectedCard.rarity !== 'common' && selectedCard.rarity !== 'mythic' && selectedCard.max_mints && (
                    <div className="text-xs text-zinc-400 mt-4">
                      {selectedCard.max_mints - (selectedCard.current_mints || 0)} remaining
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

