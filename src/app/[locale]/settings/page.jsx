'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { updateProfile, updateAvatar } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { SPORTS, getSportId } from '@/lib/sports'
import AppNavBar from '@/components/AppNavBar'
import CurrencyProviderWrapper from '@/components/CurrencyProviderWrapper'
import AvatarUploader from '@/components/AvatarUploader'

function SettingsContent() {
  const [username, setUsername] = useState('')
  const [favoriteSports, setFavoriteSports] = useState([]) // Stores sport IDs (database values)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(0)
  const [keys, setKeys] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState(null)
  // Avatar upload state - Single Source of Truth
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState(null)
  const [avatarSuccess, setAvatarSuccess] = useState(false)
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()

  const isOnboarding = searchParams.get('onboarding') === 'true'

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        
        // Check auth
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        // Only redirect if we're certain there's no user (not just a network issue)
        if (authError || !authUser) {
          console.error('Auth error in settings:', authError)
          router.push(`/${params.locale}/login`)
          return
        }

        setUser(authUser)

        // Fetch profile - create if doesn't exist
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('username, coins, keys, favorite_sports, avatar_url')
          .eq('id', authUser.id)
          .single()

        // If profile doesn't exist, create it
        if (error && error.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              username: authUser.email?.split('@')[0] || 'user',
              coins: 0,
              favorite_sports: null,
            })
            .select()
            .single()

          profile = newProfile
        }

        if (profile) {
          setUsername(profile.username || authUser.email?.split('@')[0] || '')
          setCoins(profile.coins || 0)
          setKeys(profile.keys || 0)
          setAvatarUrl(profile.avatar_url || null)
          
          // Migrate old display names to database IDs if needed
          let favSports = profile.favorite_sports || []
          if (favSports.length > 0) {
            // Check if migration is needed (if any sport contains spaces or uppercase)
            const needsMigration = favSports.some(sport => 
              sport.includes(' ') || sport !== sport.toLowerCase()
            )
            
            if (needsMigration) {
              // Convert display names to database IDs
              favSports = favSports.map(sport => getSportId(sport))
              
              // Automatically update the profile in the background
              supabase
                .from('profiles')
                .update({ favorite_sports: favSports })
                .eq('id', authUser.id)
                .then(() => console.log('Migrated sports to new format'))
                .catch(err => console.error('Migration failed:', err))
            }
          }
          
          setFavoriteSports(favSports)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading profile:', err)
        setLoading(false)
      }
    }

    loadProfile()
  }, [params.locale, router])

  const toggleSport = (sportId) => {
    setFavoriteSports((prev) =>
      prev.includes(sportId)
        ? prev.filter((s) => s !== sportId)
        : [...prev, sportId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('username', username)
    formData.append('favorite_sports', JSON.stringify(favoriteSports))
    formData.append('locale', params.locale || 'en')

    const result = await updateProfile(formData)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
      setSaving(false)
    } else if (result?.success) {
      setMessage({ type: 'success', text: t('settings.profileUpdated') })
      setSaving(false)
      
      // If this was onboarding, redirect to dashboard after short delay
      if (isOnboarding) {
        setTimeout(() => {
          router.push(`/${params.locale}/dashboard`)
        }, 1500)
      }
    }
  }

  // Avatar upload handlers - All logic in parent (Single Source of Truth)
  const handleFileChange = (file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('File must be an image')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File size must be less than 5MB')
      return
    }

    // Clear previous errors
    setAvatarError(null)
    setAvatarSuccess(false)

    // Store selected file
    setSelectedFile(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadClick = async () => {
    if (!selectedFile) return

    setUploadingAvatar(true)
    setAvatarError(null)
    setAvatarSuccess(false)

    const formData = new FormData()
    formData.append('avatar', selectedFile)
    formData.append('locale', params.locale || 'en')

    const result = await updateAvatar(formData)

    if (result?.error) {
      setAvatarError(result.error)
      setUploadingAvatar(false)
    } else if (result?.success && result.avatarUrl) {
      const newAvatarUrl = result.avatarUrl
      
      // CRITICAL: Update avatarUrl state and clear previewUrl
      // This is the Single Source of Truth - all state in parent
      setAvatarUrl(newAvatarUrl)
      setPreviewUrl(null)
      setSelectedFile(null)
      setAvatarSuccess(true)
      setUploadingAvatar(false)

      // Clear success message after a delay
      setTimeout(() => {
        setAvatarSuccess(false)
      }, 3000)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAvatarError(null)
    setAvatarSuccess(false)
  }

  return (
    <CurrencyProviderWrapper 
      initialCoins={coins}
      initialKeys={keys}
    >
      <AppNavBar 
        locale={params.locale}
        username={username}
      />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-950 p-6 font-sans">
        <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        {isOnboarding && (
          <div className="mb-6 rounded-md bg-blue-900/20 border border-blue-800 p-4">
            <p className="text-center text-blue-300 font-medium">
              {t('settings.onboardingWelcome')}
            </p>
          </div>
        )}

        <h1 className="mb-2 text-3xl font-semibold text-zinc-50">
          {t('settings.title')}
        </h1>
        <p className="mb-8 text-sm text-zinc-400">
          {t('settings.description')}
        </p>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            {/* Loading Skeleton */}
            <div className="space-y-4">
              <div className="h-20 w-20 rounded-full bg-zinc-800"></div>
              <div className="h-10 bg-zinc-800 rounded-md"></div>
            </div>
            <div className="h-10 bg-zinc-800 rounded-md"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-800 rounded-md"></div>
              ))}
            </div>
            <div className="h-12 bg-zinc-800 rounded-md"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section - Dumb Component */}
            <AvatarUploader
              avatarUrl={avatarUrl}
              previewUrl={previewUrl}
              username={username}
              uploading={uploadingAvatar}
              error={avatarError}
              success={avatarSuccess}
              hasFile={!!selectedFile}
              onFileChange={handleFileChange}
              onUploadClick={handleUploadClick}
              onCancel={handleCancel}
            />

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-300">
                {t('settings.usernameLabel')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder={t('settings.usernamePlaceholder')}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Favorite Sports */}
            <div>
              <label className="mb-3 block text-sm font-medium text-zinc-300">
                {t('settings.favoriteSportsLabel')}
              </label>
              <div className="space-y-2">
                {SPORTS.map((sport) => (
                  <label
                    key={sport.id}
                    className="flex items-center space-x-3 cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-4 py-3 transition-colors hover:border-zinc-600"
                  >
                    <input
                      type="checkbox"
                      checked={favoriteSports.includes(sport.id)}
                      onChange={() => toggleSport(sport.id)}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-zinc-200">{sport.name}</span>
                  </label>
                ))}
              </div>
              {favoriteSports.length === 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  {t('settings.selectAtLeastOne')}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || favoriteSports.length === 0}
              className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? t('settings.saving') : t('settings.saveButton')}
            </button>
          </form>
        )}

        {/* Message Display */}
        {message && (
          <div
            className={`mt-4 rounded-md p-3 text-center text-sm ${
              message.type === 'error'
                ? 'bg-red-900/20 text-red-400'
                : 'bg-green-900/20 text-green-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Back to Dashboard Link (only if not onboarding) */}
        {!isOnboarding && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push(`/${params.locale}/dashboard`)}
              className="text-sm text-blue-400 hover:underline"
            >
              {t('settings.backToDashboard')}
            </button>
          </div>
        )}
        </div>
      </div>
    </CurrencyProviderWrapper>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}

