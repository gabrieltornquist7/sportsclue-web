'use client'

export default function Card({
  card,
  mode = 'collection', // 'collection' for Card Collections, 'vault' for My Vault
  onClick,
  size = 'normal' // 'normal' for grid cards, 'large' for modal
}) {
  // Get rarity
  const rarity = card.rarity || 'common'

  // Rarity configuration with distinct visual styles
  const rarityConfig = {
    mythic: {
      border: 'border-amber-300',
      borderGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.5),0_0_40px_rgba(251,191,36,0.3),inset_0_0_20px_rgba(251,191,36,0.1)]',
      hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(251,191,36,0.7),0_0_60px_rgba(251,191,36,0.4),inset_0_0_30px_rgba(251,191,36,0.2)]',
      headerBg: 'bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30',
      headerBorder: 'border-amber-400/60',
      footerBg: 'bg-gradient-to-t from-amber-950/95 via-amber-900/80 to-transparent',
      badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      badgeText: 'text-amber-950',
      nameText: 'text-amber-100',
      accentText: 'text-amber-300',
      shimmer: true,
    },
    legendary: {
      border: 'border-yellow-500',
      borderGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.4),0_0_30px_rgba(234,179,8,0.2)]',
      hoverGlow: 'group-hover:shadow-[0_0_25px_rgba(234,179,8,0.6),0_0_50px_rgba(234,179,8,0.3)]',
      headerBg: 'bg-gradient-to-r from-yellow-600/25 via-amber-500/30 to-yellow-600/25',
      headerBorder: 'border-yellow-500/50',
      footerBg: 'bg-gradient-to-t from-yellow-950/95 via-yellow-900/70 to-transparent',
      badgeBg: 'bg-gradient-to-r from-yellow-500 to-amber-400',
      badgeText: 'text-yellow-950',
      nameText: 'text-yellow-100',
      accentText: 'text-yellow-400',
      shimmer: true,
    },
    epic: {
      border: 'border-purple-500',
      borderGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.4),0_0_30px_rgba(168,85,247,0.2)]',
      hoverGlow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6),0_0_50px_rgba(168,85,247,0.3)]',
      headerBg: 'bg-gradient-to-r from-purple-600/25 via-violet-500/30 to-purple-600/25',
      headerBorder: 'border-purple-500/50',
      footerBg: 'bg-gradient-to-t from-purple-950/95 via-purple-900/70 to-transparent',
      badgeBg: 'bg-gradient-to-r from-purple-500 to-violet-400',
      badgeText: 'text-purple-950',
      nameText: 'text-purple-100',
      accentText: 'text-purple-400',
      shimmer: false,
    },
    rare: {
      border: 'border-blue-500',
      borderGlow: 'shadow-[0_0_12px_rgba(59,130,246,0.3),0_0_24px_rgba(59,130,246,0.15)]',
      hoverGlow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.25)]',
      headerBg: 'bg-gradient-to-r from-blue-600/20 via-cyan-500/25 to-blue-600/20',
      headerBorder: 'border-blue-500/40',
      footerBg: 'bg-gradient-to-t from-blue-950/95 via-blue-900/70 to-transparent',
      badgeBg: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      badgeText: 'text-blue-950',
      nameText: 'text-blue-100',
      accentText: 'text-blue-400',
      shimmer: false,
    },
    common: {
      border: 'border-zinc-500',
      borderGlow: 'shadow-[0_0_8px_rgba(161,161,170,0.2)]',
      hoverGlow: 'group-hover:shadow-[0_0_15px_rgba(161,161,170,0.35)]',
      headerBg: 'bg-gradient-to-r from-zinc-700/30 via-slate-600/35 to-zinc-700/30',
      headerBorder: 'border-zinc-500/40',
      footerBg: 'bg-gradient-to-t from-zinc-950/95 via-zinc-900/70 to-transparent',
      badgeBg: 'bg-gradient-to-r from-zinc-500 to-slate-400',
      badgeText: 'text-zinc-900',
      nameText: 'text-zinc-100',
      accentText: 'text-zinc-400',
      shimmer: false,
    },
  }

  const config = rarityConfig[rarity] || rarityConfig.common

  // Get the image URL based on mode
  const imageUrl = mode === 'vault'
    ? (card.finalImageUrl || card.final_image_url || '')
    : (card.base_image_url || card.baseImageUrl || '')

  // Get series name
  const seriesName = card.series_name || card.seriesName || ''

  // Get name
  const name = card.name || 'Unknown Card'

  // Get rarity label
  const rarityLabel = rarity.charAt(0).toUpperCase() + rarity.slice(1)

  // Get badge content based on mode
  const getBadgeContent = () => {
    if (mode === 'vault') {
      const serialNumber = card.serialNumber || card.serial_number || 0
      const maxMints = card.maxMints !== undefined ? card.maxMints : (card.max_mints !== undefined ? card.max_mints : null)
      return {
        label: 'SERIAL',
        value: `#${serialNumber}`,
        subValue: maxMints !== null ? `of ${maxMints}` : 'of ∞'
      }
    } else {
      const currentMints = card.current_mints !== undefined ? card.current_mints : (card.currentMints || 0)
      const maxMints = card.max_mints !== undefined ? card.max_mints : (card.maxMints !== undefined ? card.maxMints : null)

      if (rarity === 'mythic') {
        return {
          label: 'MINTED',
          value: `${currentMints}`,
          subValue: 'of 1'
        }
      } else if (rarity === 'common') {
        return {
          label: 'MINTED',
          value: `${currentMints}`,
          subValue: 'total'
        }
      } else {
        return {
          label: 'MINTED',
          value: `${currentMints}`,
          subValue: `of ${maxMints || '∞'}`
        }
      }
    }
  }

  const badge = getBadgeContent()

  // Size-based classes
  const isLarge = size === 'large'

  const CardWrapper = onClick ? 'button' : 'div'

  return (
    <CardWrapper
      onClick={onClick}
      className={`group relative w-full aspect-[2.5/3.5] rounded-xl overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.03]' : ''}`}
    >
      {/* Outer glow container */}
      <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${config.borderGlow} ${config.hoverGlow}`} />

      {/* Card frame */}
      <div className={`relative h-full rounded-xl border-2 ${config.border} overflow-hidden bg-zinc-900`}>

        {/* Inner border highlight */}
        <div className="absolute inset-[2px] rounded-lg border border-white/10 pointer-events-none z-20" />

        {/* === TOP SECTION: Series Banner === */}
        <div className={`relative z-10 ${config.headerBg} border-b ${config.headerBorder} backdrop-blur-sm`}>
          <div className={`${isLarge ? 'px-4 py-2.5' : 'px-3 py-1.5'} flex items-center justify-center`}>
            {seriesName ? (
              <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-bold uppercase tracking-widest ${config.accentText} truncate max-w-full`}>
                {seriesName}
              </span>
            ) : (
              <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-medium uppercase tracking-widest text-zinc-500`}>
                Collection
              </span>
            )}
          </div>
        </div>

        {/* === MIDDLE SECTION: Image Area === */}
        <div className="relative flex-1" style={{ height: 'calc(100% - 120px)' }}>
          {/* Background image */}
          {imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ) : (
            /* Placeholder pattern when no image */
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-850 to-zinc-900">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
              {/* Centered placeholder icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`${isLarge ? 'w-20 h-20' : 'w-12 h-12'} rounded-full bg-zinc-700/50 flex items-center justify-center`}>
                  <svg className={`${isLarge ? 'w-10 h-10' : 'w-6 h-6'} text-zinc-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Subtle vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
        </div>

        {/* === BOTTOM SECTION: Card Info === */}
        <div className={`absolute bottom-0 left-0 right-0 ${config.footerBg} backdrop-blur-sm`}>
          <div className={`${isLarge ? 'px-5 pt-4 pb-4' : 'px-3 pt-3 pb-3'}`}>

            {/* Card Name */}
            <h3 className={`${isLarge ? 'text-xl' : 'text-sm'} font-bold ${config.nameText} truncate mb-2 text-center leading-tight`}>
              {name}
            </h3>

            {/* Bottom row: Rarity Badge + Serial/Mint */}
            <div className="flex items-center justify-between gap-2">

              {/* Rarity Badge */}
              <div className={`${config.badgeBg} ${isLarge ? 'px-3 py-1' : 'px-2 py-0.5'} rounded-full shadow-lg`}>
                <span className={`${isLarge ? 'text-xs' : 'text-[10px]'} font-black uppercase tracking-wide ${config.badgeText}`}>
                  {rarityLabel}
                </span>
              </div>

              {/* Serial / Mint Status Badge */}
              <div className={`flex items-baseline gap-1 ${isLarge ? 'px-3 py-1' : 'px-2 py-0.5'} rounded-full bg-black/60 border border-white/20`}>
                <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-bold text-white`}>
                  {badge.value}
                </span>
                <span className={`${isLarge ? 'text-xs' : 'text-[10px]'} text-zinc-400`}>
                  {badge.subValue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* === SHIMMER EFFECT for Mythic & Legendary === */}
        {config.shimmer && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-30">
            <div
              className="absolute inset-0 opacity-30 shimmer-effect-card"
            />
          </div>
        )}

        {/* === MYTHIC SPECIAL: Rainbow border animation === */}
        {rarity === 'mythic' && (
          <div className="absolute inset-0 rounded-xl pointer-events-none z-10 opacity-50 rainbow-border-card" />
        )}
      </div>
    </CardWrapper>
  )
}

