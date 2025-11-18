'use client'

export default function Card({ 
  card, 
  mode = 'collection', // 'collection' for Card Collections, 'vault' for My Vault
  onClick,
  size = 'normal' // 'normal' for grid cards, 'large' for modal
}) {
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

  // Get the image URL based on mode
  const imageUrl = mode === 'vault' 
    ? (card.finalImageUrl || card.final_image_url || '')
    : (card.base_image_url || card.baseImageUrl || '')

  // Get rarity
  const rarity = card.rarity || 'common'

  // Get series name
  const seriesName = card.series_name || card.seriesName || ''

  // Get name
  const name = card.name || 'Unknown Card'

  // Get flex badge content based on mode
  const getFlexBadgeContent = () => {
    if (mode === 'vault') {
      // Show Serial Number for Vault
      const serialNumber = card.serialNumber || card.serial_number || 0
      const maxMints = card.maxMints !== undefined ? card.maxMints : (card.max_mints !== undefined ? card.max_mints : null)
      return {
        label: 'SERIAL NUMBER',
        value: `#${serialNumber}${maxMints !== null ? ` / ${maxMints}` : ' / ∞'}`
      }
    } else {
      // Show Mint Status for Collections
      const currentMints = card.current_mints !== undefined ? card.current_mints : (card.currentMints || 0)
      const maxMints = card.max_mints !== undefined ? card.max_mints : (card.maxMints !== undefined ? card.maxMints : null)
      
      if (rarity === 'common') {
        return {
          label: 'MINT STATUS',
          value: `${currentMints}`
        }
      } else if (rarity === 'mythic') {
        return {
          label: 'MINT STATUS',
          value: `${currentMints} / 1`
        }
      } else {
        return {
          label: 'MINT STATUS',
          value: `${currentMints} / ${maxMints || '∞'}`
        }
      }
    }
  }

  const flexBadge = getFlexBadgeContent()

  // Size-based classes - FIXED: Proper aspect ratio for vertical rectangles
  const cardClasses = size === 'large' 
    ? 'w-full max-w-md aspect-[2.5/3.5]'
    : 'w-full aspect-[2.5/3.5]'
  
  const paddingClasses = size === 'large' ? 'p-8' : 'p-6'
  const nameSizeClasses = size === 'large' ? 'text-3xl' : 'text-lg'
  const badgeSizeClasses = size === 'large' ? 'px-5 py-2 text-sm' : 'px-3 py-1 text-xs'
  const flexBadgeSizeClasses = size === 'large' 
    ? 'px-4 py-2' 
    : 'px-3 py-1.5'
  const flexBadgeLabelSizeClasses = size === 'large' ? 'text-xs mb-1' : 'text-xs mb-0.5'
  const flexBadgeValueSizeClasses = size === 'large' ? 'text-lg' : 'text-sm'
  const seriesBadgeSizeClasses = size === 'large' 
    ? 'text-xs px-3 py-1.5' 
    : 'text-xs px-2 py-1'
  const seriesBadgePositionClasses = size === 'large' ? 'top-4 left-4' : 'top-3 left-3'
  const flexBadgePositionClasses = size === 'large' ? 'top-4 right-4' : 'top-3 right-3'

  const CardWrapper = onClick ? 'button' : 'div'

  return (
    <CardWrapper
      onClick={onClick}
      className={`group relative rounded-xl border-4 overflow-hidden transition-all ${getRarityColor(rarity)} ${rarity === 'mythic' ? 'animate-pulse' : ''} ${onClick ? 'hover:scale-105 hover:shadow-2xl cursor-pointer' : ''} ${cardClasses}`}
    >
      {/* Card Art Background */}
      {imageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/90" />
      
      {/* Card Content - FIXED: Proper layout with absolute positioning for badges, no overlap */}
      <div className={`relative z-10 ${paddingClasses} h-full flex flex-col`}>
        {/* Top-Left: Series Name - Foil Stamp - Absolutely positioned, won't overlap */}
        {seriesName && (
          <div className={`absolute ${seriesBadgePositionClasses} z-30 max-w-[40%]`}>
            <div className={`${seriesBadgeSizeClasses} font-bold text-yellow-300/80 bg-yellow-900/30 rounded border border-yellow-400/50 transform -rotate-12 shadow-lg whitespace-nowrap overflow-hidden text-ellipsis ${size === 'large' ? 'border-2 border-yellow-400/60 text-yellow-300/90 bg-yellow-900/40 shadow-xl' : ''}`}>
              {seriesName}
            </div>
          </div>
        )}
        
        {/* Top-Right: Flex Badge (Serial Number or Mint Status) - Absolutely positioned, won't overlap */}
        <div className={`absolute ${flexBadgePositionClasses} z-30 max-w-[45%]`}>
          <div className={`rounded-lg bg-black/90 ${flexBadgeSizeClasses} border-2 border-white/30 backdrop-blur-sm ${size === 'large' ? 'rounded-xl border-white/40 backdrop-blur-md shadow-2xl' : ''}`}>
            <p className={`${flexBadgeLabelSizeClasses} text-zinc-400 tracking-wider whitespace-nowrap`}>{flexBadge.label}</p>
            <p className={`font-bold text-white ${flexBadgeValueSizeClasses} whitespace-nowrap`}>{flexBadge.value}</p>
          </div>
        </div>
        
        {/* Center: Empty space for art - FIXED: Takes remaining space, badges float above */}
        <div className="flex-1 min-h-0" />
        
        {/* Bottom Section - Name and Rarity Badge - FIXED: Proper bottom positioning, centered */}
        <div className="flex-shrink-0 text-center">
          <h3 className={`mb-3 ${nameSizeClasses} font-bold text-white drop-shadow-lg`}>{name}</h3>
          
          {/* Rarity Badge - Colored Pill - Bottom Center */}
          <div className={`inline-block ${badgeSizeClasses} rounded-full border-2 ${getRarityTextColor(rarity)} ${rarity === 'mythic' ? 'bg-yellow-900/40 border-yellow-300' : rarity === 'legendary' ? 'bg-yellow-900/30 border-yellow-500' : rarity === 'epic' ? 'bg-purple-900/30 border-purple-500' : rarity === 'rare' ? 'bg-blue-900/30 border-blue-500' : 'bg-zinc-900/30 border-zinc-500'}`}>
            <p className={`font-bold uppercase tracking-wider ${getRarityTextColor(rarity)}`}>
              {getRarityLabel(rarity)}
            </p>
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}

