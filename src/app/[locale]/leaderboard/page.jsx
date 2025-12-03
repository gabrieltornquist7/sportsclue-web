import { createClient } from '@/lib/supabase/server'
import { getTranslations, createTranslator } from '@/lib/translations'
import { redirect } from 'next/navigation'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import LeaderboardContainer from './LeaderboardContainer'
import { getLeaderboard, getFriends, getFriendRequests, getActivityFeed } from '@/app/leaderboard/actions'

export default async function LeaderboardPage({ params, searchParams }) {
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
    .select('username, coins, keys')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Failed to load profile:', profileError)
    redirect(`/${locale}/dashboard`)
  }

  // Fetch all data in parallel
  const [leaderboardResult, friendsResult, requestsResult, activityResult] = await Promise.all([
    getLeaderboard('coins', 'all_time', 100),
    getFriends(),
    getFriendRequests(),
    getActivityFeed('all', 100)
  ])

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
        <LeaderboardContainer
          initialRankings={leaderboardResult.rankings || []}
          initialUserRank={leaderboardResult.userRank || 0}
          userId={user.id}
          initialFriends={friendsResult.friends || []}
          initialRequests={{
            incoming: requestsResult.incoming || [],
            outgoing: requestsResult.outgoing || []
          }}
          initialActivities={activityResult.activities || []}
        />
      </div>
    </CurrencyProviderWrapper>
  )
}
