'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signInWithPassword(formData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const locale = formData.get('locale') || 'en'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/dashboard`)
}

export async function signUp(formData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const locale = formData.get('locale') || 'en'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  const supabase = await createClient()

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // User is automatically signed in after signup
  revalidatePath('/', 'layout')
  redirect(`/${locale}/dashboard`)
}

export async function signInWithMagicLink(formData) {
  const email = formData.get('email')
  const locale = formData.get('locale') || 'en'

  if (!email) {
    return { error: 'Email is required' }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${locale}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { 
      success: true, 
      message: '✓ Magic link sent! Check your email and click the link to sign in.' 
    }
  } catch (error) {
    return { error: error.message || 'An unexpected error occurred' }
  }
}

export async function signOut(formData) {
  let locale = 'en'
  if (formData instanceof FormData) {
    locale = formData.get('locale') || 'en'
  }
  
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/login`)
}

export async function updateProfile(formData) {
  const username = formData.get('username')
  const favoriteSportsRaw = formData.get('favorite_sports')
  const locale = formData.get('locale') || 'en'

  if (!username || username.trim().length < 3) {
    return { error: 'Username must be at least 3 characters long' }
  }

  if (!favoriteSportsRaw) {
    return { error: 'Please select at least one favorite sport' }
  }

  // Parse favorite sports (comes as JSON string from client)
  let favoriteSports
  try {
    favoriteSports = JSON.parse(favoriteSportsRaw)
    if (!Array.isArray(favoriteSports) || favoriteSports.length === 0) {
      return { error: 'Please select at least one favorite sport' }
    }
  } catch (e) {
    return { error: 'Invalid favorite sports data' }
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if username is already taken (by another user)
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .neq('id', user.id)
    .single()

  if (existingUser) {
    return { error: 'Username is already taken' }
  }

  // Update the profile
  const { error } = await supabase
    .from('profiles')
    .update({
      username: username.trim(),
      favorite_sports: favoriteSports,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateAvatar(formData) {
  const file = formData.get('avatar')
  const locale = formData.get('locale') || 'en'

  if (!file || !(file instanceof File)) {
    return { error: 'No file provided' }
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size must be less than 5MB' }
  }

  const supabase = await createClient()

  // SECURELY get authenticated user FIRST - this is critical for RLS policy
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Check for authentication errors
  if (authError) {
    console.error('Auth error in updateAvatar:', authError)
    return { error: 'Authentication failed. Please sign in again.' }
  }

  // Validate user exists and has an ID
  if (!user || !user.id) {
    return { error: 'Not authenticated' }
  }

  // Validate user ID is a valid UUID format (Supabase uses UUIDs)
  const userId = user.id.trim()
  if (!userId || userId.length === 0) {
    return { error: 'Invalid user ID' }
  }

  // Validate file extension
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp']
  if (!fileExt || !validExtensions.includes(fileExt)) {
    return { error: 'File must be a JPG, PNG, or WebP image' }
  }

  // Upload to Supabase Storage
  // File path MUST be: [user_id]/avatar.png (matches storage policy exactly)
  // The RLS policy checks that the path starts with the authenticated user's ID
  const filePath = `${userId}/avatar.png`

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer()

  // AIRTIGHT: Upload with proper error handling and cache control
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/png', // Always use PNG content type to match avatar.png filename
        upsert: true, // Force overwrite of existing file
        cacheControl: '0', // Force Supabase to not cache the old file
      })

    // CRITICAL: Check for upload error immediately - do not continue if upload fails
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Upload failed! RLS error.' }
    }

    // Verify upload succeeded
    if (!uploadData) {
      return { error: 'Upload failed! No data returned.' }
    }
  } catch (error) {
    console.error('Upload exception:', error)
    return { error: 'Upload failed! RLS error.' }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  if (!urlData?.publicUrl) {
    return { error: 'Failed to get public URL for uploaded image' }
  }

  // AIRTIGHT: Cache busting - add unique timestamp to URL
  const timestamp = Date.now()
  const cacheBustedUrl = `${urlData.publicUrl}?t=${timestamp}`

  // Update profile with cache-busted avatar_url
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: cacheBustedUrl })
    .eq('id', userId)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: `Failed to update profile: ${updateError.message}` }
  }

  revalidatePath('/', 'layout')
  return { success: true, avatarUrl: cacheBustedUrl }
}

export async function equipCard(formData) {
  const cardId = formData.get('cardId')
  const locale = formData.get('locale') || 'en'

  if (!cardId) {
    return { error: 'No card ID provided' }
  }

  const supabase = await createClient()

  // SECURELY get authenticated user FIRST
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in equipCard:', authError)
    return { error: 'Authentication failed. Please sign in again.' }
  }

  if (!user || !user.id) {
    return { error: 'Not authenticated' }
  }

  const userId = user.id.trim()

  // Get user's equip_slots from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('equip_slots')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return { error: 'Failed to load profile' }
  }

  const equipSlots = profile.equip_slots || 0

  // Count how many cards are already equipped
  const { count: equippedCount, error: countError } = await supabase
    .from('minted_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_equipped', true)

  if (countError) {
    console.error('Count error:', countError)
    return { error: 'Failed to check equipped cards' }
  }

  // Check if slots are full
  if (equippedCount >= equipSlots) {
    return { error: 'Slots are full' }
  }

  // Verify the card belongs to the user
  const { data: card, error: cardError } = await supabase
    .from('minted_cards')
    .select('id, user_id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single()

  if (cardError || !card) {
    return { error: 'Card not found or does not belong to you' }
  }

  // AIRTIGHT: Equip the card with proper error handling
  try {
    const { error: updateError } = await supabase
      .from('minted_cards')
      .update({ is_equipped: true })
      .eq('id', cardId)
      .eq('user_id', userId)

    // CRITICAL: Check for error immediately after UPDATE
    if (updateError) {
      console.error('Update error:', updateError)
      return { error: 'Equip failed!' }
    }
  } catch (error) {
    console.error('Equip exception:', error)
    return { error: 'Equip failed!' }
  }

  // Fetch the updated card with template info
  const { data: updatedCard, error: fetchError } = await supabase
    .from('minted_cards')
    .select(`
      id,
      template_id,
      serial_number,
      created_at,
      final_image_url,
      is_equipped,
      card_templates(
        id,
        name,
        rarity,
        description,
        max_mints,
        current_mints,
        series_name,
        buff_description
      )
    `)
    .eq('id', cardId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !updatedCard) {
    console.error('Fetch error:', fetchError)
    revalidatePath('/', 'layout')
    return { success: true } // Still return success even if fetch fails
  }

  // Transform to match the format expected by the UI
  const template = Array.isArray(updatedCard.card_templates) 
    ? updatedCard.card_templates[0] 
    : updatedCard.card_templates

  const transformedCard = {
    id: updatedCard.id,
    serialNumber: updatedCard.serial_number,
    maxMints: template?.max_mints || null,
    currentMints: template?.current_mints || 0,
    name: template?.name || 'Unknown Card',
    rarity: template?.rarity || 'common',
    description: template?.description || '',
    buffDescription: template?.buff_description || null,
    finalImageUrl: updatedCard.final_image_url || '',
    seriesName: template?.series_name || '',
    createdAt: updatedCard.created_at,
    isEquipped: updatedCard.is_equipped || false
  }

  revalidatePath('/', 'layout')
  return { success: true, updatedCard: transformedCard }
}

export async function unequipCard(formData) {
  const cardId = formData.get('cardId')
  const locale = formData.get('locale') || 'en'

  if (!cardId) {
    return { error: 'No card ID provided' }
  }

  const supabase = await createClient()

  // SECURELY get authenticated user FIRST
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in unequipCard:', authError)
    return { error: 'Authentication failed. Please sign in again.' }
  }

  if (!user || !user.id) {
    return { error: 'Not authenticated' }
  }

  const userId = user.id.trim()

  // Verify the card belongs to the user
  const { data: card, error: cardError } = await supabase
    .from('minted_cards')
    .select('id, user_id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single()

  if (cardError || !card) {
    return { error: 'Card not found or does not belong to you' }
  }

  // AIRTIGHT: Unequip the card with proper error handling
  try {
    const { error: updateError } = await supabase
      .from('minted_cards')
      .update({ is_equipped: false })
      .eq('id', cardId)
      .eq('user_id', userId)

    // CRITICAL: Check for error immediately after UPDATE
    if (updateError) {
      console.error('Update error:', updateError)
      return { error: 'Unequip failed!' }
    }
  } catch (error) {
    console.error('Unequip exception:', error)
    return { error: 'Unequip failed!' }
  }

  // Fetch the updated card with template info
  const { data: updatedCard, error: fetchError } = await supabase
    .from('minted_cards')
    .select(`
      id,
      template_id,
      serial_number,
      created_at,
      final_image_url,
      is_equipped,
      card_templates(
        id,
        name,
        rarity,
        description,
        max_mints,
        current_mints,
        series_name,
        buff_description
      )
    `)
    .eq('id', cardId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !updatedCard) {
    console.error('Fetch error:', fetchError)
    revalidatePath('/', 'layout')
    return { success: true } // Still return success even if fetch fails
  }

  // Transform to match the format expected by the UI
  const template = Array.isArray(updatedCard.card_templates) 
    ? updatedCard.card_templates[0] 
    : updatedCard.card_templates

  const transformedCard = {
    id: updatedCard.id,
    serialNumber: updatedCard.serial_number,
    maxMints: template?.max_mints || null,
    currentMints: template?.current_mints || 0,
    name: template?.name || 'Unknown Card',
    rarity: template?.rarity || 'common',
    description: template?.description || '',
    buffDescription: template?.buff_description || null,
    finalImageUrl: updatedCard.final_image_url || '',
    seriesName: template?.series_name || '',
    createdAt: updatedCard.created_at,
    isEquipped: updatedCard.is_equipped || false
  }

  revalidatePath('/', 'layout')
  return { success: true, updatedCard: transformedCard }
}