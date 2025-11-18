'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { createClient } from '@/lib/supabase/client'
import { openBox, unlockBox } from '@/app/store/actions'
import { equipCard, unequipCard } from '@/app/auth/actions'
import Card from '@/components/Card'

// Card Details Modal Component - Has its own local state
function CardDetailsModal({ card, locale, onClose, onCardUpdate }) {
  const [modalCard, setModalCard] = useState(card)
  const [equipping, setEquipping] = useState(false)
  const [message, setMessage] = useState(null)
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

  return (
    <div 
      className="fixed inset-0 bg-black/95"
      style={{ 
        position: 'fixed',
        zIndex: 99999
      }}
      onClick={onClose}
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
          onClick={onClose}
          className="absolute -top-12 right-0 z-20 rounded-full bg-black/80 p-2 text-zinc-400 hover:text-white transition-colors backdrop-blur-sm border border-white/20"
        >
          ✕
        </button>

        {/* Card Component */}
        <Card
          card={modalCard}
          mode="vault"
          size="large"
        />

        {/* Message Display for Equip/Unequip */}
        {message && (
          <div className={`mt-4 rounded-lg p-3 text-center text-sm ${
            message.type === 'error'
              ? 'bg-red-900/20 border border-red-800 text-red-400'
              : 'bg-green-900/20 border border-green-800 text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Additional Info Below Card */}
        <div className="mt-6 text-center space-y-4">
          {/* Buff Description */}
          {modalCard.buffDescription && (
            <div className="rounded-lg bg-blue-900/20 border border-blue-800 p-4 max-w-md mx-auto">
              <p className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-1">
                Buff
              </p>
              <p className="text-sm text-blue-200">
                {modalCard.buffDescription}
              </p>
            </div>
          )}

          {/* Full Description */}
          {modalCard.description && (
            <p className="text-zinc-200 leading-relaxed text-sm max-w-md mx-auto">
              {modalCard.description}
            </p>
          )}

          {/* Equip/Unequip Button */}
          <div className="flex justify-center gap-3">
            {modalCard.isEquipped ? (
              <button
                onClick={handleUnequip}
                disabled={equipping}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {equipping ? 'Unequipping...' : 'Unequip'}
              </button>
            ) : (
              <button
                onClick={handleEquip}
                disabled={equipping}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {equipping ? 'Equipping...' : 'Equip'}
              </button>
            )}
          </div>

          {/* Minted On Date */}
          {modalCard.createdAt && (
            <div className="text-xs text-zinc-400">
              <p className="mb-1">Minted On</p>
              <p className="text-zinc-300">
                {new Date(modalCard.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500 mx-auto"></div>
          <p className="text-zinc-400">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-sm">
            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('boxes')}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === 'boxes'
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                My Boxes ({boxes.length})
              </button>
              <button
                onClick={() => setActiveTab('collection')}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === 'collection'
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                My Vault ({cards.length})
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 rounded-lg p-4 text-center ${
                message.type === 'error'
                  ? 'bg-red-900/20 border border-red-800 text-red-400'
                  : 'bg-green-900/20 border border-green-800 text-green-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Opened Card Display */}
            {openedCard && (
              <div className={`mb-6 rounded-xl border-2 p-6 text-center ${getRarityColor(openedCard.rarity)}`}>
                <div className="mb-3 text-5xl">🎉</div>
                <p className="mb-2 text-2xl font-bold">You minted:</p>
                <p className="text-3xl font-bold">{openedCard.name}</p>
                <p className="mt-2 text-lg uppercase">{openedCard.rarity}</p>
                {/* Serial Number - Most Important Visual */}
                <div className="mt-4 rounded-lg bg-zinc-900/50 px-4 py-2">
                  <p className="text-sm text-zinc-400">Serial Number</p>
                  <p className="text-2xl font-bold text-zinc-50">
                    #{openedCard.serialNumber}
                    {openedCard.maxMints !== null ? ` of ${openedCard.maxMints}` : ' of ∞'}
                  </p>
                </div>
                <button
                  onClick={() => setOpenedCard(null)}
                  className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            )}

            {/* My Boxes Tab */}
            {activeTab === 'boxes' && (
              <div>
                {boxes.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <div className="mb-4 text-6xl">📦</div>
                    <p>No boxes yet. Visit the store to buy some!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {boxes.map((box) => {
                      const isLocked = box.box_type === 'legendary_box'
                      return (
                        <div
                          key={box.id}
                          className={`rounded-xl border-2 p-6 text-center ${
                            isLocked
                              ? 'border-yellow-700 bg-yellow-900/20'
                              : 'border-zinc-700 bg-zinc-800/50'
                          }`}
                        >
                          <div className="mb-4 text-5xl">
                            {isLocked ? '🔒' : '📦'}
                          </div>
                          <h3 className="mb-2 font-bold text-zinc-50 capitalize">
                            {box.box_type.replace('_', ' ')}
                          </h3>
                          {isLocked && (
                            <p className="mb-4 text-sm text-yellow-400">Locked</p>
                          )}
                          <button
                            onClick={() => 
                              isLocked 
                                ? handleUnlockBox(box.id)
                                : handleOpenBox(box.id, box.box_type)
                            }
                            disabled={openingBox === box.id}
                            className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition-all disabled:opacity-50 ${
                              isLocked
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {openingBox === box.id
                              ? 'Opening...'
                              : isLocked
                              ? 'Unlock (1 Key)'
                              : 'Open'}
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
                  <div className="py-12 text-center text-zinc-400">
                    <div className="mb-4 text-6xl">🃏</div>
                    <p>Your vault is empty. Open some boxes to start collecting!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
  )
}

