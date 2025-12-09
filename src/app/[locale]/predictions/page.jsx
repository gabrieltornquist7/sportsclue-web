import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, createTranslator } from '@/lib/translations'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import PredictionsUI from './PredictionsUI'

export default async function PredictionsPage({ params }) {
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

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, coins, keys, avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Failed to load profile:', profileError)
    redirect(`/${locale}/dashboard`)
  }

  // Fetch leagues
  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('is_active', true)
    .order('name')

  // Fetch upcoming matches with team and league info
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      league:leagues(id, name, logo_url, country),
      home_team:teams!home_team_id(id, name, logo_url, short_name),
      away_team:teams!away_team_id(id, name, logo_url, short_name)
    `)
    .in('status', ['scheduled', 'live'])
    .order('match_date', { ascending: true })
    .limit(50)

  // Fetch user's active predictions
  const { data: userPredictions } = await supabase
    .from('predictions')
    .select(`
      *,
      match:matches(
        id,
        home_team:teams!home_team_id(name),
        away_team:teams!away_team_id(name)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  // Fetch user's prediction stats
  let { data: stats } = await supabase
    .from('prediction_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Create default stats if none exist
  if (!stats) {
    const { data: newStats } = await supabase
      .from('prediction_stats')
      .insert({
        user_id: user.id,
        total_predictions: 0,
        wins: 0,
        losses: 0,
        total_staked: 0,
        total_won: 0,
        total_lost: 0,
        net_profit: 0,
        current_streak: 0,
        best_streak: 0,
        rank_tier: 'novice'
      })
      .select()
      .single()
    stats = newStats
  }

  // Calculate odds for each match
  const matchesWithOdds = (matches || []).map(match => {
    const totalPool = match.total_pool || 0
    const homePool = match.home_pool || 0
    const drawPool = match.draw_pool || 0
    const awayPool = match.away_pool || 0

    // Calculate parimutuel odds
    const homeOdds = homePool > 0 ? Math.max(totalPool / homePool, 1.01) : 2.0
    const drawOdds = drawPool > 0 ? Math.max(totalPool / drawPool, 1.01) : 3.5
    const awayOdds = awayPool > 0 ? Math.max(totalPool / awayPool, 1.01) : 2.0

    // Calculate percentages
    const homePercent = totalPool > 0 ? Math.round((homePool / totalPool) * 100) : 33
    const drawPercent = totalPool > 0 ? Math.round((drawPool / totalPool) * 100) : 34
    const awayPercent = totalPool > 0 ? Math.round((awayPool / totalPool) * 100) : 33

    return {
      ...match,
      odds: {
        home: parseFloat(homeOdds.toFixed(2)),
        draw: parseFloat(drawOdds.toFixed(2)),
        away: parseFloat(awayOdds.toFixed(2))
      },
      percentages: {
        home: homePercent,
        draw: drawPercent,
        away: awayPercent
      }
    }
  })

  return (
    <CurrencyProviderWrapper
      initialCoins={profile.coins || 0}
      initialKeys={profile.keys || 0}
    >
      <AppNavBar
        locale={locale}
        username={profile.username}
        avatarUrl={profile.avatar_url}
      />
      <PredictionsUI
        userId={user.id}
        locale={locale}
        username={profile.username}
        initialMatches={matchesWithOdds}
        initialLeagues={leagues || []}
        initialStats={stats}
        userPredictions={userPredictions || []}
      />
    </CurrencyProviderWrapper>
  )
}
