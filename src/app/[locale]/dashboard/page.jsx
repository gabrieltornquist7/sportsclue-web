import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, createTranslator } from '@/lib/translations'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'

export default async function DashboardPage({ params }) {
  const { locale } = await params
  const messages = await getTranslations(locale)
  const t = createTranslator(messages)
  
  const supabase = await createClient()

  // ==========================================
  // STEP 1: Check if user is authenticated
  // ==========================================
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/login`)
  }

  // ==========================================
  // STEP 2: Fetch user profile
  // ==========================================
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, coins, keys, favorite_sports, avatar_url, created_at, membership_tier, member_id, equip_slots')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, redirect to login (database trigger should have created it)
  if (profileError || !profile) {
    console.error('Profile not found for user:', user.id, profileError)
    redirect(`/${locale}/login?error=profile_not_found`)
  }

  // ==========================================
  // STEP 3: ONBOARDING GATE
  // ==========================================
  // Check if favorite_sports is null, undefined, or empty array
  const needsOnboarding = !profile?.favorite_sports || 
                          (Array.isArray(profile.favorite_sports) && profile.favorite_sports.length === 0)
  
  if (needsOnboarding) {
    redirect(`/${locale}/settings?onboarding=true`)
  }

  // ==========================================
  // STEP 4: Fetch vault statistics
  // ==========================================
  // Get count of minted cards for this user
  const { count: mintedCount } = await supabase
    .from('minted_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get total count of card templates
  const { count: totalTemplatesCount } = await supabase
    .from('card_templates')
    .select('*', { count: 'exact', head: true })

  const vaultCount = mintedCount || 0
  const totalCards = totalTemplatesCount || 0

  // ==========================================
  // STEP 4.5: Fetch active buffs (equipped cards)
  // ==========================================
  const { data: equippedCards, error: equippedError } = await supabase
    .from('minted_cards')
    .select(`
      id,
      template_id,
      card_templates(
        buff_description
      )
    `)
    .eq('user_id', user.id)
    .eq('is_equipped', true)

  // Extract buff descriptions from equipped cards
  const activeBuffs = equippedCards
    ?.map(card => {
      const template = Array.isArray(card.card_templates) 
        ? card.card_templates[0] 
        : card.card_templates
      return template?.buff_description
    })
    .filter(Boolean) || []

  // Format member since date
  const memberSinceDate = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown'

  // Format Member ID with commas
  const memberId = profile.member_id || 0
  const formattedMemberId = memberId.toLocaleString('en-US')

  // Get membership tier (default to 'standard' if not set)
  const membershipTier = profile.membership_tier || 'standard'

  // Tier-based styling - Premium dark-gray brushed metal look
  const getTierStyles = (tier) => {
    switch (tier) {
      case 'premium':
        return {
          background: 'bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-800',
          border: 'border-amber-500/40',
          text: 'text-amber-50',
          textLight: 'text-amber-200',
          accent: 'text-amber-300',
          metalEffect: 'bg-gradient-to-br from-amber-800/20 via-amber-600/10 to-amber-900/20'
        }
      case 'standard':
      default:
        return {
          background: 'bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-800',
          border: 'border-zinc-500/30',
          text: 'text-zinc-50',
          textLight: 'text-zinc-300',
          accent: 'text-zinc-400',
          metalEffect: 'bg-gradient-to-br from-zinc-800/20 via-zinc-600/10 to-zinc-900/20'
        }
    }
  }

  const tierStyles = getTierStyles(membershipTier)

  // ==========================================
  // STEP 5: Show the dashboard
  // ==========================================
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6">
        <main className="w-full max-w-xl">
          {/* SportsClub Membership Card - Premium Bank Card Style */}
          <div className={`relative overflow-hidden rounded-2xl ${tierStyles.background} shadow-2xl border ${tierStyles.border} aspect-[16/10]`} style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px)'
          }}>
            {/* Shimmer/Glint Effect */}
            <div className="shimmer-effect" />
            
            {/* Card Content - Premium Bank Card Layout */}
            <div className="relative h-full p-8 z-10 flex flex-col justify-between">
              {/* Top Section */}
              <div className="flex items-start justify-between">
                {/* Top-Left: Bank Name */}
                <div className={`text-2xl font-bold ${tierStyles.text} tracking-tight`}>
                  SportsClue
                </div>
                
                {/* Top-Right: Card Type */}
                <div className={`text-xs font-semibold ${tierStyles.textLight} uppercase tracking-[0.2em]`}>
                  MEMBER
                </div>
              </div>

              {/* Middle Section - Member ID (16-digit card number style) */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full mb-4">
                  <p className={`text-xs font-medium ${tierStyles.textLight} uppercase tracking-wider mb-2`}>
                    Member ID
                  </p>
                  <p className={`text-2xl font-mono font-bold ${tierStyles.text} tracking-widest`} style={{ letterSpacing: '0.15em' }}>
                    {String(memberId).padStart(16, '0').match(/.{1,4}/g)?.join(' ') || '0000 0000 0000 0000'}
                  </p>
                </div>
                
                {/* Active Buffs - Live Query List */}
                <div className="w-full">
                  <p className={`text-xs font-medium ${tierStyles.textLight} uppercase tracking-wider mb-1`}>
                    Active Buffs
                  </p>
                  <div className={`text-sm ${tierStyles.accent}`}>
                    {activeBuffs.length > 0 ? (
                      <ul className="space-y-1">
                        {activeBuffs.map((buff, index) => (
                          <li key={index}>{buff}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No active buffs</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex items-end justify-between">
                {/* Bottom-Left: Avatar + Username */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username || 'Profile'}
                        className="h-16 w-16 rounded-full border-2 border-white/30 object-cover shadow-lg"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg">
                        {(profile.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Username */}
                  <h1 className={`text-xl font-bold ${tierStyles.text}`}>
                    {profile.username || t('common.noUsername')}
                  </h1>
                </div>

                {/* Bottom-Right: Member Since */}
                <div className="text-right">
                  <p className={`text-xs font-medium ${tierStyles.textLight} uppercase tracking-wider mb-1`}>
                    Member Since
                  </p>
                  <p className={`text-sm font-semibold ${tierStyles.text}`}>
                    {memberSinceDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <div className="mt-6">
            <a
              href={`/${locale}/play`}
              className="block w-full rounded-xl bg-blue-600 px-6 py-4 text-center text-lg font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02]"
            >
              Play
            </a>
          </div>
        </main>
      </div>
    </CurrencyProviderWrapper>
  )
}

