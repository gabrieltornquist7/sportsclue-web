import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, createTranslator } from '@/lib/translations'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import PuzzleUI from './PuzzleUI'

export default async function PlayPage({ params }) {
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
    .select('username, coins, keys, favorite_sports, avatar_url')
    .eq('id', user.id)
    .single()

  // Handle profile errors
  if (profileError) {
    console.error('Failed to load profile:', profileError)
    redirect(`/${locale}/dashboard`)
  }

  // ==========================================
  // STEP 3: ONBOARDING GATE
  // ==========================================
  // If no favorite sports, redirect to settings
  const needsOnboarding = !profile?.favorite_sports || 
                          (Array.isArray(profile.favorite_sports) && profile.favorite_sports.length === 0)
  
  if (needsOnboarding) {
    redirect(`/${locale}/settings?onboarding=true`)
  }

  // ==========================================
  // STEP 4: Render the Puzzle UI
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
      <div className="flex min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 font-sans">
        <main className="w-full">
          {/* Puzzle Game */}
          <PuzzleUI 
            userId={user.id} 
            locale={locale} 
            username={profile.username}
          />
        </main>
      </div>
    </CurrencyProviderWrapper>
  )
}

