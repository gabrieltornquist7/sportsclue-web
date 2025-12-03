'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/app/leaderboard/actions'

/**
 * Create a marketplace listing
 */
export async function createListing(formData) {
  try {
    const cardId = formData.get('cardId')
    const price = parseInt(formData.get('price'))

    if (!cardId || !price || price <= 0) {
      return { error: 'Invalid card or price' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify user owns the card and get card details
    const { data: card, error: cardError } = await supabase
      .from('minted_cards')
      .select('id, user_id, card_templates(name, rarity)')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single()

    if (cardError || !card) {
      return { error: 'Card not found or you do not own this card' }
    }

    // Check if card is already listed
    const { data: existingListing } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('card_id', cardId)
      .eq('status', 'active')
      .single()

    if (existingListing) {
      return { error: 'Card is already listed on the marketplace' }
    }

    // Create listing
    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert({
        card_id: cardId,
        seller_id: user.id,
        price: price
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating listing:', error)
      return { error: 'Failed to create listing' }
    }

    // Log activity
    const template = Array.isArray(card.card_templates) ? card.card_templates[0] : card.card_templates
    await logActivity({
      userId: user.id,
      activityType: 'card_listed',
      metadata: {
        card_name: template?.name || 'Unknown Card',
        rarity: template?.rarity || 'common',
        price: price
      }
    })

    revalidatePath('/marketplace')
    revalidatePath('/inventory')
    return { success: true, listing: data }
  } catch (error) {
    console.error('Error in createListing:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel a marketplace listing
 */
export async function cancelListing(listingId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('marketplace_listings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .eq('seller_id', user.id)
      .eq('status', 'active')

    if (error) {
      console.error('Error cancelling listing:', error)
      return { error: 'Failed to cancel listing' }
    }

    revalidatePath('/marketplace')
    revalidatePath('/inventory')
    return { success: true }
  } catch (error) {
    console.error('Error in cancelListing:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Purchase a marketplace listing
 */
export async function purchaseListing(listingId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get listing details before purchase for activity logging
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select(`
        id,
        price,
        seller_id,
        card:minted_cards!card_id(
          id,
          template:card_templates(name, rarity)
        )
      `)
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return { error: 'Listing not found' }
    }

    // Use atomic RPC function
    const { data, error } = await supabase
      .rpc('purchase_marketplace_listing', {
        p_listing_id: listingId,
        p_buyer_id: user.id
      })

    if (error) {
      console.error('Error purchasing listing:', error)
      return { error: error.message || 'Failed to purchase listing' }
    }

    const result = data[0]
    if (!result.success) {
      return { error: result.error_message }
    }

    // Log activity for buyer (card purchased)
    const card = Array.isArray(listing.card) ? listing.card[0] : listing.card
    const template = card?.template
      ? (Array.isArray(card.template) ? card.template[0] : card.template)
      : null

    await logActivity({
      userId: user.id,
      activityType: 'card_purchased',
      metadata: {
        card_name: template?.name || 'Unknown Card',
        rarity: template?.rarity || 'common',
        price: listing.price
      }
    })

    // Log activity for seller (card sold)
    await logActivity({
      userId: listing.seller_id,
      activityType: 'card_sold',
      metadata: {
        card_name: template?.name || 'Unknown Card',
        rarity: template?.rarity || 'common',
        price: listing.price
      }
    })

    revalidatePath('/marketplace')
    revalidatePath('/inventory')
    return { success: true, cardId: result.card_id }
  } catch (error) {
    console.error('Error in purchaseListing:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all active marketplace listings
 */
export async function getMarketplaceListings() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        id,
        price,
        created_at,
        seller:profiles!seller_id(id, username),
        card:minted_cards!card_id(
          id,
          serial_number,
          final_image_url,
          template:card_templates(
            id,
            name,
            description,
            rarity,
            max_mints,
            series_name
          )
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
      return { error: 'Failed to fetch listings' }
    }

    return { success: true, listings: data || [] }
  } catch (error) {
    console.error('Error in getMarketplaceListings:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's own listings
 */
export async function getMyListings(userId) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select(`
        id,
        price,
        status,
        created_at,
        sold_at,
        card:minted_cards!card_id(
          id,
          serial_number,
          final_image_url,
          template:card_templates(
            id,
            name,
            description,
            rarity,
            max_mints,
            series_name
          )
        )
      `)
      .eq('seller_id', userId)
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user listings:', error)
      return { error: 'Failed to fetch your listings' }
    }

    return { success: true, listings: data || [] }
  } catch (error) {
    console.error('Error in getMyListings:', error)
    return { error: 'An unexpected error occurred' }
  }
}
