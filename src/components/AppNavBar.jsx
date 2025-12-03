'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  Coins,
  Key,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Gamepad2,
  Trophy,
  Package,
  LayoutGrid,
  FolderOpen,
  Store,
  ArrowRightLeft
} from 'lucide-react'

export default function AppNavBar({ locale, username, avatarUrl }) {
  const { coins, keys } = useCurrency()
  const [signingOut, setSigningOut] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [collectionsMenuOpen, setCollectionsMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef(null)
  const collectionsMenuRef = useRef(null)

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

  const isCollectionsActive = () => {
    return isActive('/store') || isActive('/inventory') || isActive('/card-collections') || isActive('/marketplace') || isActive('/trading')
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      if (collectionsMenuRef.current && !collectionsMenuRef.current.contains(event.target)) {
        setCollectionsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Premium Navbar with Glassmorphic Effect */}
      <nav className="border-b border-zinc-800/50 bg-gradient-to-r from-zinc-950 via-zinc-900 to-slate-900 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
        {/* Subtle top glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-12">
              {/* Logo with subtle glow */}
              <a
                href={`/${locale}/dashboard`}
                className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent hover:from-blue-300 hover:via-cyan-300 hover:to-blue-400 transition-all duration-200 tracking-tight"
              >
                SportsClue
              </a>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-2">
                {/* Play Link */}
                <a
                  href={`/${locale}/play`}
                  className={`group relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive('/play')
                      ? 'text-blue-400'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    <span className="tracking-wide">Play</span>
                  </div>
                  {isActive('/play') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50" />
                  )}
                  {!isActive('/play') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </a>

                {/* Collections Dropdown */}
                <div className="relative" ref={collectionsMenuRef}>
                  <button
                    onClick={() => setCollectionsMenuOpen(!collectionsMenuOpen)}
                    className={`group relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isCollectionsActive()
                        ? 'text-blue-400'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      <span className="tracking-wide">Collections</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${collectionsMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isCollectionsActive() && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50" />
                    )}
                    {!isCollectionsActive() && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </button>

                  {/* Collections Dropdown Menu */}
                  {collectionsMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-zinc-800/50 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 space-y-1">
                        <a
                          href={`/${locale}/store`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                        >
                          <Package className="w-4 h-4" />
                          <span>Store</span>
                        </a>
                        <a
                          href={`/${locale}/marketplace`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                        >
                          <Store className="w-4 h-4" />
                          <span>Marketplace</span>
                        </a>
                        <a
                          href={`/${locale}/trading`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          <span>Trading</span>
                        </a>
                        <a
                          href={`/${locale}/inventory`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span>Inventory</span>
                        </a>
                        <a
                          href={`/${locale}/card-collections`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span>Card Collections</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Leaderboard Link */}
                <a
                  href={`/${locale}/leaderboard`}
                  className={`group relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive('/leaderboard')
                      ? 'text-blue-400'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span className="tracking-wide">Leaderboard</span>
                  </div>
                  {isActive('/leaderboard') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50" />
                  )}
                  {!isActive('/leaderboard') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </a>
              </div>
            </div>

            {/* Right: Currency + User Menu */}
            <div className="flex items-center gap-4">
              {/* Coins - Glass Badge */}
              <div className="hidden sm:flex items-center gap-2.5 rounded-full bg-zinc-800/40 backdrop-blur-md border border-zinc-700/30 px-4 py-2 hover:bg-zinc-800/60 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-200 cursor-default">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-zinc-50 tracking-wide">{coins.toLocaleString()}</span>
              </div>

              {/* Keys - Glass Badge */}
              <div className="hidden sm:flex items-center gap-2.5 rounded-full bg-zinc-800/40 backdrop-blur-md border border-zinc-700/30 px-4 py-2 hover:bg-zinc-800/60 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-default">
                <Key className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-zinc-50 tracking-wide">{keys.toLocaleString()}</span>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* User Menu Dropdown */}
              <div className="hidden lg:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500/30">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="max-w-[100px] truncate tracking-wide">{username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-zinc-800/50 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 space-y-1">
                      <a
                        href={`/${locale}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </a>
                      <div className="h-px bg-zinc-800 my-1" />
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Premium Mobile Menu - Slide-out Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-80 bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900 border-r border-zinc-800/50 z-50 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Menu
              </h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex flex-col h-[calc(100%-73px)] overflow-y-auto">
              {/* Currency Section */}
              <div className="p-6 space-y-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-3 rounded-lg bg-zinc-800/40 backdrop-blur-md border border-zinc-700/30 px-4 py-3">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-zinc-50">{coins.toLocaleString()}</span>
                  <span className="text-xs text-zinc-400 ml-auto">Coins</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-zinc-800/40 backdrop-blur-md border border-zinc-700/30 px-4 py-3">
                  <Key className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-zinc-50">{keys.toLocaleString()}</span>
                  <span className="text-xs text-zinc-400 ml-auto">Keys</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-4 space-y-1 flex-1">
                <a
                  href={`/${locale}/play`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/play')
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>Play</span>
                </a>

                {/* Collections Group */}
                <div className="pt-2 pb-1">
                  <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Collections
                  </div>
                  <div className="space-y-1">
                    <a
                      href={`/${locale}/store`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive('/store')
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                      <span>Store</span>
                    </a>
                    <a
                      href={`/${locale}/marketplace`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive('/marketplace')
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <Store className="w-5 h-5" />
                      <span>Marketplace</span>
                    </a>
                    <a
                      href={`/${locale}/trading`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive('/trading')
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                      <span>Trading</span>
                    </a>
                    <a
                      href={`/${locale}/inventory`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive('/inventory')
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <FolderOpen className="w-5 h-5" />
                      <span>Inventory</span>
                    </a>
                    <a
                      href={`/${locale}/card-collections`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive('/card-collections')
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                      <span>Card Collections</span>
                    </a>
                  </div>
                </div>

                <a
                  href={`/${locale}/leaderboard`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/leaderboard')
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  <span>Leaderboard</span>
                </a>
              </div>

              {/* User Section */}
              <div className="p-4 border-t border-zinc-800/50 space-y-1">
                <div className="px-4 py-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/30">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{username}</p>
                      <p className="text-xs text-zinc-400">Account</p>
                    </div>
                  </div>
                </div>

                <a
                  href={`/${locale}/settings`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </a>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

