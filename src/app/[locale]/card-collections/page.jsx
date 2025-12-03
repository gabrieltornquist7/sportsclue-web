import { createClient } from '@/lib/supabase/server'
import { getTranslations, createTranslator } from '@/lib/translations'
import { redirect } from 'next/navigation'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import CardCollectionsUI from './CardCollectionsUI'

export default async function CardCollectionsPage({ params }) {
  const { locale } = await params
  const messages = await getTranslations(locale)
  const t = createTranslator(messages)
  
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/login`)
  }

  // Fetch user profile for nav bar
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, coins, keys, avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Failed to load profile:', profileError)
    redirect(`/${locale}/dashboard`)
  }

  // Fetch all card templates
  const { data: templates, error: templatesError } = await supabase
    .from('card_templates')
    .select('id, name, description, rarity, max_mints, current_mints, base_image_url, series_name')
    .order('series_name', { ascending: true })
    .order('rarity', { ascending: false })
    .order('name', { ascending: true })

  if (templatesError) {
    console.error('Error fetching card templates:', templatesError)
  }

  // For Mythic cards, fetch owner info
  const mythicTemplates = (templates || []).filter(t => t.rarity === 'mythic')
  const mythicTemplateIds = mythicTemplates.map(t => t.id)
  
  let mythicOwners = {}
    if (mythicTemplateIds.length > 0) {
      // Fetch minted mythic cards with owner info
      const { data: mintedMythics } = await supabase
        .from('minted_cards')
        .select('template_id, user_id')
        .in('template_id', mythicTemplateIds)

      if (mintedMythics && mintedMythics.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(mintedMythics.map(m => m.user_id))]
        
        // Fetch usernames for owners
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds)

        // Create a map of user_id to username
        const userMap = {}
        if (profiles) {
          profiles.forEach(profile => {
            userMap[profile.id] = profile.username
          })
        }

        // Map template_id to username
        mintedMythics.forEach(minted => {
          mythicOwners[minted.template_id] = userMap[minted.user_id] || 'Unknown'
        })
      }
    }

  return (
    <CurrencyProviderWrapper
      initialCoins={profile.coins || 0}
      initialKeys={profile.keys || 0}
    >
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <AppNavBar
          locale={locale}
          username={profile.username}
          avatarUrl={profile.avatar_url}
        />
        <CardCollectionsUI
          templates={templates || []}
          mythicOwners={mythicOwners}
          locale={locale}
        />
      </div>
    </CurrencyProviderWrapper>
  )
}

