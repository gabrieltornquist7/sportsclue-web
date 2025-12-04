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
import { Settings, User, Heart, Save, ArrowLeft, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react'

function SettingsContent() {
  const [username, setUsername] = useState('')
  const [favoriteSports, setFavoriteSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(0)
  const [keys, setKeys] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState(null)
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

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          console.error('Auth error in settings:', authError)
          router.push(`/${params.locale}/login`)
          return
        }

        setUser(authUser)

        let { data: profile, error } = await supabase
          .from('profiles')
          .select('username, coins, keys, favorite_sports, avatar_url')
          .eq('id', authUser.id)
          .single()

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

          let favSports = profile.favorite_sports || []
          if (favSports.length > 0) {
            const needsMigration = favSports.some(sport =>
              sport.includes(' ') || sport !== sport.toLowerCase()
            )

            if (needsMigration) {
              favSports = favSports.map(sport => getSportId(sport))

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

      if (isOnboarding) {
        setTimeout(() => {
          router.push(`/${params.locale}/dashboard`)
        }, 1500)
      }
    }
  }

  const handleFileChange = (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('File must be an image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File size must be less than 5MB')
      return
    }

    setAvatarError(null)
    setAvatarSuccess(false)
    setSelectedFile(file)

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

      setAvatarUrl(newAvatarUrl)
      setPreviewUrl(null)
      setSelectedFile(null)
      setAvatarSuccess(true)
      setUploadingAvatar(false)

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

  // Sport emoji mapping
  const sportEmojis = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    cricket: '🏏',
    baseball: '⚾',
    hockey: '🏒',
    golf: '⛳',
    rugby: '🏉',
    boxing: '🥊',
    mma: '🥋',
    formula1: '🏎️',
    olympics: '🏅',
  }

  return (
    <>
      {loading ? (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-zinc-400">Loading...</p>
          </div>
        </div>
      ) : (
        <CurrencyProviderWrapper
          initialCoins={coins}
          initialKeys={keys}
        >
          <AppNavBar
            locale={params.locale}
            username={username}
            avatarUrl={avatarUrl}
          />
          <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 sm:px-6">
              <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
                    <Settings className="w-10 h-10 text-blue-400" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    {t('settings.title')}
                  </h1>
                  <p className="text-zinc-400">
                    {t('settings.description')}
                  </p>
                </div>

                {/* Onboarding Welcome */}
                {isOnboarding && (
                  <div className="mb-8 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-3">
                      <Sparkles className="w-6 h-6 text-blue-400" />
                      <p className="text-blue-300 font-semibold">
                        {t('settings.onboardingWelcome')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Settings Card */}
                <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-2xl">
                  <form onSubmit={handleSubmit}>

                    {/* Profile Picture Section */}
                    <div className="p-6 border-b border-zinc-800/50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">Profile Picture</h2>
                          <p className="text-sm text-zinc-400">Customize your avatar</p>
                        </div>
                      </div>

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
                    </div>

                    {/* Username Section */}
                    <div className="p-6 border-b border-zinc-800/50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">{t('settings.usernameLabel')}</h2>
                          <p className="text-sm text-zinc-400">Your display name</p>
                        </div>
                      </div>

                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        placeholder={t('settings.usernamePlaceholder')}
                        className="w-full rounded-xl border-2 border-zinc-700/50 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>

                    {/* Favorite Sports Section */}
                    <div className="p-6 border-b border-zinc-800/50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">{t('settings.favoriteSportsLabel')}</h2>
                          <p className="text-sm text-zinc-400">Select the sports you love</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SPORTS.map((sport) => {
                          const isSelected = favoriteSports.includes(sport.id)
                          const emoji = sportEmojis[sport.id] || '🏆'

                          return (
                            <button
                              key={sport.id}
                              type="button"
                              onClick={() => toggleSport(sport.id)}
                              className={`group flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/10'
                                  : 'border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600 hover:bg-zinc-800/60'
                              }`}
                            >
                              <span className="text-2xl">{emoji}</span>
                              <span className={`font-medium flex-1 text-left ${
                                isSelected ? 'text-blue-200' : 'text-zinc-300'
                              }`}>
                                {sport.name}
                              </span>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-500 scale-100'
                                  : 'bg-zinc-700 scale-90 group-hover:scale-100'
                              }`}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {favoriteSports.length === 0 && (
                        <div className="mt-4 flex items-center gap-2 text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-sm">{t('settings.selectAtLeastOne')}</p>
                        </div>
                      )}
                    </div>

                    {/* Submit Section */}
                    <div className="p-6">
                      <button
                        type="submit"
                        disabled={saving || favoriteSports.length === 0}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 font-semibold text-lg text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('settings.saving')}
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            {t('settings.saveButton')}
                          </>
                        )}
                      </button>

                      {/* Message Display */}
                      {message && (
                        <div className={`mt-4 rounded-xl border-2 p-4 text-center backdrop-blur-sm ${
                          message.type === 'error'
                            ? 'border-red-500/50 bg-red-900/30 text-red-300'
                            : 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300'
                        }`}>
                          <div className="flex items-center justify-center gap-2">
                            {message.type === 'error' ? (
                              <AlertCircle className="w-5 h-5" />
                            ) : (
                              <Check className="w-5 h-5" />
                            )}
                            {message.text}
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* Back to Dashboard Link */}
                {!isOnboarding && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => router.push(`/${params.locale}/dashboard`)}
                      className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      {t('settings.backToDashboard')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CurrencyProviderWrapper>
      )}
    </>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
