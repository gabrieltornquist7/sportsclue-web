'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Buys an item from the store
 * @param {string} itemType - 'standard_box', 'pro_box', 'legendary_box', or 'key'
 * @param {string} userId - User's ID
 * @returns {Object} Result with success/error
 */
export async function buyItem(itemType, userId) {
  try {
    const supabase = await createClient()

    // Get user's current coins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, keys')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return { error: 'Failed to load profile' }
    }

    // Define item costs
    const itemCosts = {
      standard_box: 100,
      pro_box: 500,
      legendary_box: 5000,
      key: 2500
    }

    const cost = itemCosts[itemType]
    if (!cost) {
      return { error: 'Invalid item type' }
    }

    // Check if user has enough coins
    if (profile.coins < cost) {
      return { error: `Not enough coins. You need ${cost} coins.` }
    }

    // Deduct coins
    const newCoins = profile.coins - cost
    const updateData = { coins: newCoins }

    // If buying a key, also increment keys
    if (itemType === 'key') {
      updateData.keys = (profile.keys || 0) + 1
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      return { error: 'Failed to update profile' }
    }

    // Add item to inventory (except keys which are stored in profiles)
    if (itemType !== 'key') {
      const { error: inventoryError } = await supabase
        .from('user_box_inventory')
        .insert({
          user_id: userId,
          box_type: itemType
        })

      if (inventoryError) {
        console.error('Failed to add box to inventory:', inventoryError)
        // Don't fail the purchase, but log the error
      }
    }

    return {
      success: true,
      message: itemType === 'key' 
        ? 'Key purchased successfully!' 
        : 'Box purchased successfully!',
      newCoins: newCoins,
      newKeys: updateData.keys || profile.keys
    }
  } catch (error) {
    console.error('Error in buyItem:', error)
    return { error: 'Failed to purchase item' }
  }
}

/**
 * Checks if a legendary box should drop and adds it if successful
 * Calculates drop rate based on equipped card buffs
 * @param {string} userId - User's ID
 * @returns {Object} Result with success/error and drop status
 */
export async function addLegendaryBoxDrop(userId) {
  try {
    const supabase = await createClient()

    // AIRTIGHT: Base drop rate is 1% (0.01)
    let baseDropRate = 0.01

    // AIRTIGHT: Fetch equipped cards and calculate key drop rate buffs
    const { data: equippedCards, error: equippedError } = await supabase
      .from('minted_cards')
      .select(`
        id,
        card_templates(
          buff_type,
          buff_value
        )
      `)
      .eq('user_id', userId)
      .eq('is_equipped', true)

    if (!equippedError && equippedCards) {
      let globalKeyDropRateBonus = 0
      let keyDropRateBonus = 0

      // Loop through equipped cards and calculate buffs
      for (const card of equippedCards) {
        const template = Array.isArray(card.card_templates)
          ? card.card_templates[0]
          : card.card_templates

        if (!template) continue

        const buffType = template.buff_type
        const buffValue = template.buff_value || 0

        // Apply GLOBAL_KEY_DROP_RATE (affects all key drop rates)
        if (buffType === 'GLOBAL_KEY_DROP_RATE') {
          globalKeyDropRateBonus += buffValue
        }

        // Apply KEY_DROP_RATE (general key drop rate buff)
        if (buffType === 'KEY_DROP_RATE') {
          keyDropRateBonus += buffValue
        }
      }

      // Calculate final drop rate by adding buff percentages to base rate
      const totalBonus = globalKeyDropRateBonus + keyDropRateBonus
      baseDropRate = baseDropRate + (totalBonus / 100) // buff_value is percentage points
      
      // Cap drop rate at 100% (1.0)
      if (baseDropRate > 1.0) {
        baseDropRate = 1.0
      }
    }

    // Roll for drop using buffed drop rate
    const shouldDrop = Math.random() < baseDropRate

    if (!shouldDrop) {
      // No drop this time
      return {
        success: true,
        dropped: false,
        message: null
      }
    }

    // Drop succeeded! Add legendary box to inventory
    const { error: inventoryError } = await supabase
      .from('user_box_inventory')
      .insert({
        user_id: userId,
        box_type: 'legendary_box'
      })

    if (inventoryError) {
      console.error('Failed to add legendary box drop:', inventoryError)
      return { error: 'Failed to add box to inventory' }
    }

    return {
      success: true,
      dropped: true,
      message: '🎉 Legendary Box dropped!'
    }
  } catch (error) {
    console.error('Error in addLegendaryBoxDrop:', error)
    return { error: 'Failed to check drop' }
  }
}

/**
 * Mints a card from a template (minting engine)
 * @param {string} templateId - Card template ID
 * @param {string} userId - User's ID
 * @returns {Object} Result with minted card or error
 */
async function mintCard(templateId, userId) {
  const supabase = await createClient()

  // Get template with current mint count
  const { data: template, error: templateError } = await supabase
    .from('card_templates')
    .select('id, name, rarity, description, max_mints, current_mints, base_image_url')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    return { error: 'Card template not found' }
  }

  // Check if minting is allowed
  if (template.max_mints !== null && template.current_mints >= template.max_mints) {
    return { error: 'Card template has reached maximum mints' }
  }

  // Calculate serial number
  const serialNumber = (template.current_mints || 0) + 1

  // Determine final_image_url based on rarity
  let finalImageUrl = ''
  if (template.rarity === 'mythic') {
    // Mythic cards get unique pre-generated images
    const mythicImages = [
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
      'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800',
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800'
    ]
    // Use serial number to pick image (since mythic is 1-of-1, serial will always be 1)
    finalImageUrl = mythicImages[(serialNumber - 1) % mythicImages.length]
  } else {
    // Common-Legendary: copy base_image_url from template
    finalImageUrl = template.base_image_url || ''
  }

  // Insert minted card
  const { data: mintedCard, error: mintError } = await supabase
    .from('minted_cards')
    .insert({
      template_id: templateId,
      user_id: userId,
      serial_number: serialNumber,
      final_image_url: finalImageUrl
    })
    .select()
    .single()

  if (mintError) {
    console.error('Error minting card:', {
      message: mintError.message,
      details: mintError.details,
      hint: mintError.hint,
      code: mintError.code,
      fullError: JSON.stringify(mintError, null, 2)
    })
    return { error: `Failed to mint card: ${mintError.message || 'Unknown error'}` }
  }

  // Update template's current_mints count
  const { error: updateError } = await supabase
    .from('card_templates')
    .update({ current_mints: serialNumber })
    .eq('id', templateId)

  if (updateError) {
    console.error('Error updating template mint count:', updateError)
    // Card was minted but count wasn't updated - this is a data consistency issue
    // In production, you'd want to use a database transaction or RPC function
  }

  return {
    success: true,
    card: {
      id: mintedCard.id,
      name: template.name,
      rarity: template.rarity,
      description: template.description,
      serialNumber: serialNumber,
      maxMints: template.max_mints,
      finalImageUrl: finalImageUrl
    }
  }
}

/**
 * Opens an unlocked box and mints a card
 * @param {string} boxId - Box inventory ID
 * @param {string} boxType - 'standard_box' or 'pro_box'
 * @param {string} userId - User's ID
 * @returns {Object} Result with minted card
 */
export async function openBox(boxId, boxType, userId) {
  try {
    const supabase = await createClient()

    // Verify box belongs to user
    const { data: box, error: boxError } = await supabase
      .from('user_box_inventory')
      .select('id, box_type')
      .eq('id', boxId)
      .eq('user_id', userId)
      .single()

    if (boxError || !box) {
      return { error: 'Box not found' }
    }

    // Check if box is locked (legendary boxes are locked)
    if (box.box_type === 'legendary_box') {
      return { error: 'Box is locked. Use unlockBox to unlock it.' }
    }

    // Determine rarity probabilities based on box type
    let targetRarity = ''
    if (boxType === 'standard_box') {
      // Standard: 80% Common, 20% Rare
      targetRarity = Math.random() < 0.8 ? 'common' : 'rare'
    } else if (boxType === 'pro_box') {
      // Pro: 60% Rare, 34.9% Epic, 5% Legendary, 0.1% Mythic
      const roll = Math.random()
      if (roll < 0.6) {
        targetRarity = 'rare'
      } else if (roll < 0.949) { // 0.6 + 0.349 = 0.949
        targetRarity = 'epic'
      } else if (roll < 0.999) { // 0.949 + 0.05 = 0.999
        targetRarity = 'legendary'
      } else {
        targetRarity = 'mythic'
      }
    } else {
      return { error: 'Invalid box type' }
    }

    // Fetch available card templates for this rarity
    // Get all templates of this rarity, then filter in code for available ones
    const { data: allTemplates, error: templatesError } = await supabase
      .from('card_templates')
      .select('id, name, rarity, max_mints, current_mints')
      .eq('rarity', targetRarity)

    if (templatesError) {
      return { error: `Failed to fetch ${targetRarity} card templates` }
    }

    // Filter for available templates (max_mints is null OR current_mints < max_mints)
    const templates = (allTemplates || []).filter(template => 
      template.max_mints === null || (template.current_mints || 0) < template.max_mints
    )

    if (!templates || templates.length === 0) {
      return { error: `No available ${targetRarity} card templates` }
    }

    // Randomly select a template
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]

    // Mint the card
    const mintResult = await mintCard(randomTemplate.id, userId)
    if (mintResult.error) {
      return mintResult
    }

    // Delete the box
    await supabase
      .from('user_box_inventory')
      .delete()
      .eq('id', boxId)

    return {
      success: true,
      card: mintResult.card
    }
  } catch (error) {
    console.error('Error in openBox:', error)
    return { error: 'Failed to open box' }
  }
}

/**
 * Unlocks a locked legendary box and mints a card
 * @param {string} boxId - Box inventory ID
 * @param {string} userId - User's ID
 * @returns {Object} Result with minted card
 */
export async function unlockBox(boxId, userId) {
  try {
    const supabase = await createClient()

    // Verify box belongs to user and is locked
    const { data: box, error: boxError } = await supabase
      .from('user_box_inventory')
      .select('id, box_type')
      .eq('id', boxId)
      .eq('user_id', userId)
      .single()

    if (boxError || !box) {
      return { error: 'Box not found' }
    }

    // Verify box is locked (only legendary boxes are locked)
    if (box.box_type !== 'legendary_box') {
      return { error: 'Box is not locked' }
    }

    // Check if user has a key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('keys, coins')
      .eq('id', userId)
      .single()

    if (profileError || !profile || (profile.keys || 0) < 1) {
      return { error: 'You need a Key to unlock this box' }
    }

    // Consume 1 key
    const newKeys = (profile.keys || 0) - 1
    await supabase
      .from('profiles')
      .update({ keys: newKeys })
      .eq('id', userId)

    // Roll for card: 60% Epic, 39.5% Legendary, 0.5% Mythic
    const roll = Math.random()
    let targetRarity = ''
    if (roll < 0.6) {
      targetRarity = 'epic'
    } else if (roll < 0.995) { // 0.6 + 0.395 = 0.995
      targetRarity = 'legendary'
    } else {
      targetRarity = 'mythic'
    }

    // Fetch available card templates for this rarity
    // Get all templates of this rarity, then filter in code for available ones
    const { data: allTemplates, error: templatesError } = await supabase
      .from('card_templates')
      .select('id, name, rarity, max_mints, current_mints')
      .eq('rarity', targetRarity)

    if (templatesError) {
      return { error: `Failed to fetch ${targetRarity} card templates` }
    }

    // Filter for available templates (max_mints is null OR current_mints < max_mints)
    const templates = (allTemplates || []).filter(template => 
      template.max_mints === null || (template.current_mints || 0) < template.max_mints
    )

    if (!templates || templates.length === 0) {
      return { error: `No available ${targetRarity} card templates` }
    }

    // Randomly select a template
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]

    // Mint the card
    const mintResult = await mintCard(randomTemplate.id, userId)
    if (mintResult.error) {
      return mintResult
    }

    // Delete the box
    await supabase
      .from('user_box_inventory')
      .delete()
      .eq('id', boxId)

    return {
      success: true,
      card: mintResult.card,
      newKeys: newKeys,
      newCoins: profile.coins || 0
    }
  } catch (error) {
    console.error('Error in unlockBox:', error)
    return { error: 'Failed to unlock box' }
  }
}

