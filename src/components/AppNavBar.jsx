'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import { useCurrency } from '@/contexts/CurrencyContext'

export default function AppNavBar({ locale, username }) {
  const { coins, keys } = useCurrency()
  const [signingOut, setSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    setSigningOut(true)
    const formData = new FormData()
    formData.append('locale', locale)
    await signOut(formData)
    router.push(`/${locale}/login`)
  }

  const isActive = (path) => {
    return pathname === `/${locale}${path}` || pathname === `/${locale}${path}/`
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo/Home */}
          <div className="flex items-center gap-8">
            <a
              href={`/${locale}/dashboard`}
              className="text-xl font-bold text-zinc-50 hover:text-blue-400 transition-colors"
            >
              SportsClue
            </a>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <a
                href={`/${locale}/dashboard`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Home
              </a>
              <a
                href={`/${locale}/play`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/play')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Play
              </a>
              <a
                href={`/${locale}/store`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/store')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Store
              </a>
              <a
                href={`/${locale}/inventory`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/inventory')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Inventory
              </a>
              <a
                href={`/${locale}/card-collections`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/card-collections')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Card Collections
              </a>
              <a
                href={`/${locale}/settings`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Settings
              </a>
            </div>
          </div>

          {/* Right: Currency + User */}
          <div className="flex items-center gap-4">
            {/* Coins */}
            <div className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2">
              <span className="text-xl">🪙</span>
              <span className="font-semibold text-zinc-50">{coins}</span>
            </div>

            {/* Keys */}
            <div className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2">
              <span className="text-xl">🔑</span>
              <span className="font-semibold text-zinc-50">{keys}</span>
            </div>

            {/* Username */}
            <div className="hidden sm:block text-sm text-zinc-400">
              {username}
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden border-t border-zinc-800">
        <div className="px-2 py-2 space-y-1">
          <a
            href={`/${locale}/dashboard`}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/dashboard')
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Home
          </a>
          <a
            href={`/${locale}/play`}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/play')
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Play
          </a>
          <a
            href={`/${locale}/store`}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/store')
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Store
          </a>
          <a
            href={`/${locale}/inventory`}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/inventory')
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Inventory
          </a>
          <a
            href={`/${locale}/card-collections`}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/card-collections')
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Card Collections
          </a>
          <a
            href={`/${locale}/settings`}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/settings')
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Settings
          </a>
        </div>
      </div>
    </nav>
  )
}

