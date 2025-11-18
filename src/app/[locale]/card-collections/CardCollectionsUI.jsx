'use client'

import { useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import Card from '@/components/Card'

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
    <div className="min-h-screen py-12 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-zinc-50">
            🎴 Card Collections
          </h1>
          <p className="text-xl text-zinc-400">
            Browse all available card templates
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
          )
        })}

        {/* Card Details Modal - Larger Card Component */}
        {selectedCard && (
          <div 
            className="fixed inset-0 bg-black/95"
            style={{ 
              position: 'fixed',
              zIndex: 99999
            }}
            onClick={() => setSelectedCard(null)}
          >
            <div 
              className="relative"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '90vw',
                maxHeight: '90vh',
                padding: '1.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute -top-12 right-0 z-20 rounded-full bg-black/80 p-2 text-zinc-400 hover:text-white transition-colors backdrop-blur-sm border border-white/20"
              >
                ✕
              </button>

              {/* Card Component */}
              <Card
                card={selectedCard}
                mode="collection"
                size="large"
              />

              {/* Additional Info Below Card */}
              <div className="mt-6 text-center max-w-md">
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
        )}
      </div>
    </div>
  )
}

