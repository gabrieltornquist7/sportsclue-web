import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, createTranslator } from '@/lib/translations'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import MarketplaceUI from './MarketplaceUI'

export default async function MarketplacePage({ params }) {
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

  // Fetch active marketplace listings
  const { data: listings } = await supabase
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

  return (
    <CurrencyProviderWrapper
      initialCoins={profile.coins || 0}
      initialKeys={profile.keys || 0}
    >
      <div>
        <AppNavBar
          locale={locale}
          username={profile.username}
          avatarUrl={profile.avatar_url}
        />
        <MarketplaceUI
          listings={listings || []}
          userId={user.id}
          userCoins={profile.coins || 0}
          locale={locale}
        />
      </div>
    </CurrencyProviderWrapper>
  )
}
