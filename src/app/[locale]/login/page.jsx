'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { signInWithMagicLink, signInWithPassword, signUp } from '@/app/auth/actions'

export default function LoginPage() {
  const [mode, setMode] = useState('signin') // 'signin', 'signup', or 'magiclink'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'error' | 'success', text: string }
  const params = useParams()
  const { t } = useLocale()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('locale', params.locale || 'en')

    let result

    try {
      if (mode === 'magiclink') {
        result = await signInWithMagicLink(formData)
      } else if (mode === 'signup') {
        formData.append('password', password)
        result = await signUp(formData)
      } else {
        formData.append('password', password)
        result = await signInWithPassword(formData)
      }

      // If we get here, it means no redirect happened (only for magic link)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
        setLoading(false)
      } else if (result?.success) {
        setMessage({ type: 'success', text: result.message })
        // Clear form on success for magic link
        setEmail('')
        setPassword('')
        setLoading(false)
      }
    } catch (error) {
      // Ignore NEXT_REDIRECT errors (they're expected for sign in/sign up)
      if (error.message && error.message.includes('NEXT_REDIRECT')) {
        // Keep loading state - redirect is happening
        return
      }
      setMessage({ type: 'error', text: error.message || 'An unexpected error occurred' })
      setLoading(false)
    }
  }

  const toggleMode = (newMode) => {
    setMode(newMode)
    setMessage(null)
    setPassword('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        {/* Header */}
        <h1 className="mb-2 text-center text-2xl font-semibold text-zinc-50">
          {mode === 'signup' ? t('login.signUpTitle') : t('login.title')}
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-400">
          {mode === 'magiclink' 
            ? t('login.magicLinkDescription')
            : mode === 'signup'
            ? t('login.signUpDescription')
            : t('login.passwordDescription')}
        </p>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
              {t('common.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('login.emailPlaceholder')}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Password Field (hidden for magic link) */}
          {mode !== 'magiclink' && (
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                {t('login.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('login.passwordPlaceholder')}
                minLength={6}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading 
              ? t('login.sending')
              : mode === 'magiclink'
              ? t('login.sendMagicLink')
              : mode === 'signup'
              ? t('login.signUpButton')
              : t('login.signInButton')}
          </button>
        </form>

        {/* Success/Error Message */}
        {message && (
          <div className={`mt-4 rounded-md p-3 text-sm ${
            message.type === 'error' 
              ? 'bg-red-900/20 border border-red-800 text-red-400' 
              : 'bg-green-900/20 border border-green-800 text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Mode Toggles */}
        <div className="mt-6 space-y-3 border-t border-zinc-800 pt-6">
          {/* Sign In / Sign Up Toggle */}
          {mode === 'signin' && (
            <p className="text-center text-sm text-zinc-400">
              {t('login.noAccount')}{' '}
              <button
                type="button"
                onClick={() => toggleMode('signup')}
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                {t('login.signUpLink')}
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-center text-sm text-zinc-400">
              {t('login.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                {t('login.signInLink')}
              </button>
            </p>
          )}

          {/* Magic Link Toggle */}
          {mode === 'magiclink' ? (
            <p className="text-center text-sm text-zinc-400">
              <button
                type="button"
                onClick={() => toggleMode('signin')}
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                ← {t('login.backToSignIn')}
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              {t('login.orMagicLink')}{' '}
              <button
                type="button"
                onClick={() => toggleMode('magiclink')}
                className="text-zinc-400 hover:text-zinc-300 hover:underline"
              >
                {t('login.useMagicLink')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
