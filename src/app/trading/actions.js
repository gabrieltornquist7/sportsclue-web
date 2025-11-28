'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a trade offer
 */
export async function createTradeOffer(formData) {
  try {
    const myCardId = formData.get('myCardId')
    const recipientUsername = formData.get('recipientUsername')
    const recipientCardId = formData.get('recipientCardId')

    if (!myCardId || !recipientUsername || !recipientCardId) {
      return { error: 'Missing required fields' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get recipient user ID by username
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', recipientUsername)
      .single()

    if (recipientError || !recipient) {
      return { error: 'User not found' }
    }

    // Prevent trading with yourself
    if (recipient.id === user.id) {
      return { error: 'Cannot trade with yourself' }
    }

    // Verify initiator owns their card
    const { data: myCard, error: myCardError } = await supabase
      .from('minted_cards')
      .select('id, user_id')
      .eq('id', myCardId)
      .eq('user_id', user.id)
      .single()

    if (myCardError || !myCard) {
      return { error: 'You do not own this card' }
    }

    // Verify recipient owns their card
    const { data: theirCard, error: theirCardError } = await supabase
      .from('minted_cards')
      .select('id, user_id')
      .eq('id', recipientCardId)
      .eq('user_id', recipient.id)
      .single()

    if (theirCardError || !theirCard) {
      return { error: 'Recipient does not own the specified card' }
    }

    // Create trade offer
    const { data, error } = await supabase
      .from('trade_offers')
      .insert({
        initiator_id: user.id,
        initiator_card_id: myCardId,
        recipient_id: recipient.id,
        recipient_card_id: recipientCardId,
        initiator_confirmed: true // Initiator auto-confirms
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trade offer:', error)
      return { error: 'Failed to create trade offer' }
    }

    revalidatePath('/trading')
    return { success: true, trade: data }
  } catch (error) {
    console.error('Error in createTradeOffer:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Respond to a trade offer (accept/reject)
 */
export async function respondToTrade(tradeId, accept) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Use atomic RPC function
    const { data, error } = await supabase
      .rpc('execute_trade', {
        p_trade_id: tradeId,
        p_user_id: user.id,
        p_confirm: accept
      })

    if (error) {
      console.error('Error responding to trade:', error)
      return { error: error.message || 'Failed to process trade' }
    }

    const result = data[0]
    if (!result.success) {
      return { error: result.error_message }
    }

    revalidatePath('/trading')
    revalidatePath('/inventory')

    return {
      success: true,
      completed: result.trade_completed,
      message: result.trade_completed
        ? 'Trade completed successfully!'
        : accept
        ? 'Trade confirmed! Waiting for other party.'
        : 'Trade cancelled.'
    }
  } catch (error) {
    console.error('Error in respondToTrade:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel a trade offer
 */
export async function cancelTradeOffer(tradeId) {
  return respondToTrade(tradeId, false)
}

/**
 * Get user's trade offers (sent and received)
 */
export async function getMyTrades(userId) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('trade_offers')
      .select(`
        id,
        status,
        initiator_confirmed,
        recipient_confirmed,
        created_at,
        initiator:profiles!initiator_id(id, username),
        recipient:profiles!recipient_id(id, username),
        initiator_card:minted_cards!initiator_card_id(
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
        ),
        recipient_card:minted_cards!recipient_card_id(
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
      .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
      .in('status', ['pending', 'completed'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trades:', error)
      return { error: 'Failed to fetch trades' }
    }

    return { success: true, trades: data || [] }
  } catch (error) {
    console.error('Error in getMyTrades:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's cards available for trading (not currently listed or in pending trades)
 */
export async function getAvailableCards(userId) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('minted_cards')
      .select(`
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
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching available cards:', error)
      return { error: 'Failed to fetch cards' }
    }

    return { success: true, cards: data || [] }
  } catch (error) {
    console.error('Error in getAvailableCards:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Search for a user's cards by username
 */
export async function searchUserCards(username) {
  try {
    const supabase = await createClient()

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return { error: 'User not found' }
    }

    // Get their cards
    const { data, error } = await supabase
      .from('minted_cards')
      .select(`
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
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching user cards:', error)
      return { error: 'Failed to fetch user cards' }
    }

    return { success: true, user: user, cards: data || [] }
  } catch (error) {
    console.error('Error in searchUserCards:', error)
    return { error: 'An unexpected error occurred' }
  }
}
