import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, createTranslator } from '@/lib/translations'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import TradingUI from './TradingUI'

export default async function TradingPage({ params }) {
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
  const { data: profile, error: profileError} = await supabase
    .from('profiles')
    .select('username, coins, keys')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Failed to load profile:', profileError)
    redirect(`/${locale}/dashboard`)
  }

  // Fetch user's trade offers
  const { data: trades } = await supabase
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
    .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .in('status', ['pending', 'completed'])
    .order('created_at', { ascending: false })

  // Fetch user's available cards
  const { data: myCards } = await supabase
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

  return (
    <CurrencyProviderWrapper
      initialCoins={profile.coins || 0}
      initialKeys={profile.keys || 0}
    >
      <div>
        <AppNavBar
          locale={locale}
          username={profile.username}
        />
        <TradingUI
          trades={trades || []}
          myCards={myCards || []}
          userId={user.id}
          username={profile.username}
          locale={locale}
        />
      </div>
    </CurrencyProviderWrapper>
  )
}
