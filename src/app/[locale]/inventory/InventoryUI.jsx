'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { createClient } from '@/lib/supabase/client'
import { openBox, unlockBox } from '@/app/store/actions'
import { equipCard, unequipCard } from '@/app/auth/actions'
import { createListing } from '@/app/marketplace/actions'
import Card from '@/components/Card'
import { Store, Coins, Package, FolderOpen, Sparkles } from 'lucide-react'

// Card Details Modal Component - Has its own local state
function CardDetailsModal({ card, locale, onClose, onCardUpdate }) {
  const [modalCard, setModalCard] = useState(card)
  const [equipping, setEquipping] = useState(false)
  const [message, setMessage] = useState(null)
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingPrice, setListingPrice] = useState('')
  const [listing, setListing] = useState(false)
  const [isListed, setIsListed] = useState(false)
  // Track if we just updated internally to prevent useEffect from overwriting
  const justUpdatedRef = useRef(false)

  // Update local state when prop changes, but only if we didn't just update internally
  useEffect(() => {
    // If we just updated internally, skip this sync
    if (justUpdatedRef.current) {
      justUpdatedRef.current = false
      return
    }
    // Sync with prop when it changes from parent
    // Only update if the prop actually has different values
    if (card && (
      !modalCard ||
      card.id !== modalCard.id ||
      card.isEquipped !== modalCard.isEquipped
    )) {
      setModalCard(card)
    }
  }, [card, modalCard])

  // Check if card is already listed
  useEffect(() => {
    const checkListing = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select('id')
          .eq('card_id', modalCard.id)
          .eq('status', 'active')
          .single()

        if (!error && data) {
          setIsListed(true)
        } else {
          setIsListed(false)
        }
      } catch (err) {
        setIsListed(false)
      }
    }

    if (modalCard?.id) {
      checkListing()
    }
  }, [modalCard?.id])

  const handleEquip = async () => {
    const formData = new FormData()
    formData.append('cardId', modalCard.id)
    formData.append('locale', locale)
    
    setEquipping(true)
    setMessage(null)
    
    const result = await equipCard(formData)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
      setEquipping(false)
    } else if (result?.success && result.updatedCard) {
      setMessage({ type: 'success', text: 'Card equipped successfully!' })
      
      // CRITICAL: Mark that we're updating internally
      justUpdatedRef.current = true
      
      // CRITICAL: Update local state IMMEDIATELY - this shows "Unequip" button instantly
      setModalCard(result.updatedCard)
      
      // CRITICAL: Notify parent component to update its state
      if (onCardUpdate) {
        onCardUpdate(result.updatedCard)
      }
      
      setEquipping(false)
    } else {
      setEquipping(false)
    }
  }

  const handleUnequip = async () => {
    const formData = new FormData()
    formData.append('cardId', modalCard.id)
    formData.append('locale', locale)

    setEquipping(true)
    setMessage(null)

    const result = await unequipCard(formData)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
      setEquipping(false)
    } else if (result?.success && result.updatedCard) {
      setMessage({ type: 'success', text: 'Card unequipped successfully!' })

      // CRITICAL: Mark that we're updating internally
      justUpdatedRef.current = true

      // CRITICAL: Update local state IMMEDIATELY - this shows "Equip" button instantly
      setModalCard(result.updatedCard)

      // CRITICAL: Notify parent component to update its state
      if (onCardUpdate) {
        onCardUpdate(result.updatedCard)
      }

      setEquipping(false)
    } else {
      setEquipping(false)
    }
  }

  const handleListOnMarketplace = async () => {
    if (!listingPrice || parseInt(listingPrice) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid price' })
      return
    }

    setListing(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('cardId', modalCard.id)
    formData.append('price', listingPrice)

    const result = await createListing(formData)

    setListing(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Card listed successfully!' })
      setIsListed(true)
      setShowListingForm(false)
      setListingPrice('')
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-8"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/90 rounded-2xl p-6 max-w-md w-full mx-4 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card wrapper - constrain the card size */}
        <div className="w-48 h-auto">
          <Card
            card={modalCard}
            mode="vault"
            size="normal"
          />
        </div>

        {/* Message Display */}
        {message && (
          <div className={`w-full rounded-xl p-3 text-center text-sm font-medium ${
            message.type === 'error'
              ? 'bg-red-900/20 border border-red-800 text-red-400'
              : 'bg-green-900/20 border border-green-800 text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Card Info */}
        {modalCard.buffDescription && (
          <div className="w-full rounded-xl bg-blue-900/20 border border-blue-800 p-3">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Buff</p>
            <p className="text-xs text-blue-200">{modalCard.buffDescription}</p>
          </div>
        )}

        {modalCard.description && (
          <div className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 p-3">
            <p className="text-xs text-zinc-200">{modalCard.description}</p>
          </div>
        )}

        {/* Action buttons - always visible below card */}
        <div className="flex flex-col gap-3 w-full">
          {/* Equip/Unequip Button */}
          {modalCard.isEquipped ? (
            <button
              onClick={handleUnequip}
              disabled={equipping}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-700 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {equipping ? 'Unequipping...' : 'Unequip Card'}
            </button>
          ) : (
            <button
              onClick={handleEquip}
              disabled={equipping}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {equipping ? 'Equipping...' : 'Equip Card'}
            </button>
          )}

          {/* List on Marketplace */}
          {!isListed && !showListingForm && (
            <button
              onClick={() => setShowListingForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700"
            >
              <Store className="w-4 h-4" />
              List on Marketplace
            </button>
          )}

          {isListed && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-400">
              <Store className="w-4 h-4" />
              <span>Already listed on marketplace</span>
            </div>
          )}

          {/* Listing Form */}
          {showListingForm && (
            <div className="w-full space-y-3 rounded-xl bg-zinc-800/70 border border-zinc-700 p-4">
              <div className="flex items-center gap-2 text-zinc-300">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold">Set Your Price</span>
              </div>
              <input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="Enter price in coins..."
                min="1"
                className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleListOnMarketplace}
                  disabled={listing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {listing ? 'Listing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowListingForm(false)
                    setListingPrice('')
                    setMessage(null)
                  }}
                  disabled={listing}
                  className="px-4 py-2.5 rounded-xl bg-zinc-700 text-sm font-semibold text-white transition-all hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryUI({ userId, locale, username }) {
  const { keys, updateCurrency } = useCurrency()
  const [activeTab, setActiveTab] = useState('boxes')
  const [boxes, setBoxes] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [openingBox, setOpeningBox] = useState(null)
  const [openedCard, setOpenedCard] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [message, setMessage] = useState(null)
  const params = useParams()
  const router = useRouter()
  const { t } = useLocale()

  // Fetch boxes
  const fetchBoxes = async () => {
    try {
      const supabase = createClient()
      
      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('User not authenticated:', authError)
        setBoxes([])
        return
      }

      const { data, error } = await supabase
        .from('user_box_inventory')
        .select('id, box_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching boxes:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        setBoxes([])
        return
      }
      
      setBoxes(data || [])
    } catch (err) {
      console.error('Error fetching boxes:', {
        message: err?.message || 'Unknown error',
        stack: err?.stack,
        error: err
      })
      setBoxes([])
    }
  }

  // Fetch minted cards (Vault)
  const fetchCards = async () => {
    try {
      const supabase = createClient()
      
      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('User not authenticated:', authError)
        setCards([])
        return
      }

      // Fetch minted cards for this user (including equip status)
      const { data: mintedCards, error: mintedError } = await supabase
        .from('minted_cards')
        .select('id, template_id, serial_number, created_at, final_image_url, is_equipped')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (mintedError) {
        console.error('Supabase error fetching minted cards:', {
          message: mintedError.message,
          details: mintedError.details,
          hint: mintedError.hint,
          code: mintedError.code,
          fullError: JSON.stringify(mintedError, null, 2)
        })
        setCards([])
        return
      }

      if (!mintedCards || mintedCards.length === 0) {
        setCards([])
        return
      }

      // Get unique template IDs
      const templateIds = [...new Set(mintedCards.map(card => card.template_id))]

      // Fetch card templates (including buff_description)
      const { data: templates, error: templatesError } = await supabase
        .from('card_templates')
        .select('id, name, rarity, description, max_mints, current_mints, series_name, buff_description')
        .in('id', templateIds)

      if (templatesError) {
        console.error('Supabase error fetching card templates:', {
          message: templatesError.message,
          details: templatesError.details,
          hint: templatesError.hint,
          code: templatesError.code
        })
        setCards([])
        return
      }

      // Create a map of template_id to template
      const templateMap = {}
      if (templates) {
        templates.forEach(template => {
          templateMap[template.id] = template
        })
      }

      // Transform data to include template info
      const transformedCards = mintedCards.map(mintedCard => {
        const template = templateMap[mintedCard.template_id]
        return {
          id: mintedCard.id,
          serialNumber: mintedCard.serial_number,
          maxMints: template?.max_mints || null,
          currentMints: template?.current_mints || 0,
          name: template?.name || 'Unknown Card',
          rarity: template?.rarity || 'common',
          description: template?.description || '',
          buffDescription: template?.buff_description || null,
          finalImageUrl: mintedCard.final_image_url || '',
          seriesName: template?.series_name || '',
          createdAt: mintedCard.created_at,
          isEquipped: mintedCard.is_equipped || false
        }
      })
      
      setCards(transformedCards)
    } catch (err) {
      console.error('Error fetching cards:', {
        message: err?.message || 'Unknown error',
        stack: err?.stack,
        error: err
      })
      setCards([])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchBoxes(), fetchCards()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleOpenBox = async (boxId, boxType) => {
    setOpeningBox(boxId)
    setMessage(null)
    setOpenedCard(null)

    const result = await openBox(boxId, boxType, userId)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      setOpeningBox(null)
      return
    }

    if (result.success) {
      setOpenedCard(result.card)
      await fetchBoxes() // Refresh boxes list
      await fetchCards() // Refresh vault to show new card instantly
      setOpeningBox(null)
    }
  }

  const handleUnlockBox = async (boxId) => {
    setOpeningBox(boxId)
    setMessage(null)
    setOpenedCard(null)

    const result = await unlockBox(boxId, userId)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      setOpeningBox(null)
      return
    }

    if (result.success) {
      setOpenedCard(result.card)
      await fetchBoxes() // Refresh boxes list
      await fetchCards() // Refresh vault to show new card instantly
      
      // Update currency context if keys changed
      if (result.newKeys !== undefined) {
        updateCurrency(result.newCoins, result.newKeys)
      }
      
      setOpeningBox(null)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500 mx-auto"></div>
          <p className="text-zinc-400 text-lg">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900 px-6 py-12">
      <div className="container mx-auto max-w-6xl">
        {/* Premium Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent mb-2">
                Inventory
              </h1>
              <p className="text-zinc-400 text-lg">Manage your boxes and collection</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-zinc-800/50 bg-zinc-900/20">
            <div className="flex gap-2 p-2">
              <button
                onClick={() => setActiveTab('boxes')}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'boxes'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package className="w-5 h-5" />
                  <span>My Boxes</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                    {boxes.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('collection')}
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'collection'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  <span>My Vault</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                    {cards.length}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Content Area with Padding */}
          <div className="p-8">
            {/* Message Display */}
            {message && (
              <div className={`mb-6 rounded-xl p-4 text-center font-medium ${
                message.type === 'error'
                  ? 'bg-red-900/20 border border-red-800 text-red-400'
                  : 'bg-green-900/20 border border-green-800 text-green-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Opened Card Display */}
            {openedCard && (
              <div className={`mb-6 rounded-2xl border-2 p-8 text-center backdrop-blur-sm ${getRarityColor(openedCard.rarity)}`}>
                <div className="mb-4">
                  <Sparkles className="w-16 h-16 mx-auto text-yellow-400 animate-pulse" />
                </div>
                <p className="mb-3 text-3xl font-bold text-zinc-50">You minted:</p>
                <p className={`text-4xl font-bold mb-2 ${getRarityTextColor(openedCard.rarity)}`}>
                  {openedCard.name}
                </p>
                <p className="mt-2 text-xl font-semibold uppercase tracking-wider">{openedCard.rarity}</p>
                {/* Serial Number - Most Important Visual */}
                <div className="mt-6 rounded-xl bg-zinc-900/70 backdrop-blur-sm px-6 py-4">
                  <p className="text-sm text-zinc-400 mb-1">Serial Number</p>
                  <p className="text-3xl font-bold text-zinc-50">
                    #{openedCard.serialNumber}
                    {openedCard.maxMints !== null ? ` of ${openedCard.maxMints}` : ' of ∞'}
                  </p>
                </div>
                <button
                  onClick={() => setOpenedCard(null)}
                  className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-blue-500/20"
                >
                  Close
                </button>
              </div>
            )}

            {/* My Boxes Tab */}
            {activeTab === 'boxes' && (
              <div>
                {boxes.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                      <Package className="w-12 h-12 text-zinc-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-300 mb-2">No Boxes Yet</h3>
                    <p className="text-zinc-500 text-lg mb-6">Visit the store to buy some boxes!</p>
                    <a
                      href={`/${locale}/store`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/20"
                    >
                      <Store className="w-5 h-5" />
                      Visit Store
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boxes.map((box) => {
                      const isLocked = box.box_type === 'legendary_box'
                      return (
                        <div
                          key={box.id}
                          className={`group rounded-2xl border-2 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                            isLocked
                              ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 hover:border-yellow-500/80 hover:shadow-lg hover:shadow-yellow-500/20'
                              : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600/80 hover:shadow-lg hover:shadow-blue-500/10'
                          }`}
                        >
                          <div className="mb-6 text-6xl transition-transform duration-300 group-hover:scale-110">
                            {isLocked ? '🔒' : '📦'}
                          </div>
                          <h3 className="mb-2 text-xl font-bold text-zinc-50 capitalize">
                            {box.box_type.replace('_', ' ')}
                          </h3>
                          {isLocked && (
                            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                              <span className="text-sm font-medium text-yellow-400">Locked</span>
                            </div>
                          )}
                          <button
                            onClick={() =>
                              isLocked
                                ? handleUnlockBox(box.id)
                                : handleOpenBox(box.id, box.box_type)
                            }
                            disabled={openingBox === box.id}
                            className={`w-full mt-4 rounded-xl px-6 py-3 font-semibold text-white transition-all disabled:opacity-50 shadow-lg ${
                              isLocked
                                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 hover:shadow-yellow-500/20'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-blue-500/20'
                            }`}
                          >
                            {openingBox === box.id
                              ? 'Opening...'
                              : isLocked
                              ? 'Unlock (1 Key)'
                              : 'Open Box'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Collection Tab (Vault) */}
            {activeTab === 'collection' && (
              <div>
                {cards.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                      <FolderOpen className="w-12 h-12 text-zinc-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-300 mb-2">Vault Empty</h3>
                    <p className="text-zinc-500 text-lg">Open some boxes to start collecting!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cards.map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        mode="vault"
                        size="normal"
                        onClick={() => {
                          // Always get the latest card from the cards array
                          const latestCard = cards.find(c => c.id === card.id) || card
                          setSelectedCard(latestCard)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Card Details Modal - Larger Card Component */}
        {selectedCard && (
          <CardDetailsModal
            card={selectedCard}
            locale={locale}
            onClose={() => {
              setSelectedCard(null)
              setMessage(null)
            }}
            onCardUpdate={(updatedCard) => {
              // Update parent's card list with the new card object
              setCards(prevCards =>
                prevCards.map(card =>
                  card.id === updatedCard.id ? updatedCard : card
                )
              )
              // Update selectedCard to reflect new status
              setSelectedCard(updatedCard)
            }}
          />
        )}
      </div>
    </div>
  )
}

