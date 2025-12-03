import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, createTranslator } from '@/lib/translations'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import InventoryUI from './InventoryUI'

export default async function InventoryPage({ params }) {
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
  // STEP 2: Fetch user data
  // ==========================================
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, coins, keys, avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Failed to load profile:', profileError)
    redirect(`/${locale}/dashboard`)
  }

  // ==========================================
  // STEP 3: Render the Inventory UI
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
          <InventoryUI 
            userId={user.id}
            locale={locale}
            username={profile.username}
          />
        </main>
      </div>
    </CurrencyProviderWrapper>
  )
}

