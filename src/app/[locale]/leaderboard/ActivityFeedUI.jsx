'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  Sparkles,
  ShoppingCart,
  Store,
  ArrowRightLeft,
  TrendingUp,
  Award,
  Crown,
  Sword,
  Map,
  UserPlus,
  RefreshCw,
  Users,
  User as UserIcon,
  Globe
} from 'lucide-react'
import { getActivityFeed } from '@/app/leaderboard/actions'

export default function ActivityFeedUI({ initialActivities, userId }) {
  const [filter, setFilter] = useState('all') // 'all', 'friends_only', 'my_activity'
  const [activities, setActivities] = useState(initialActivities)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Refresh activity feed
  const refreshFeed = async () => {
    setLoading(true)
    const result = await getActivityFeed(filter, 100)
    setLoading(false)

    if (result.success) {
      setActivities(result.activities || [])
    }
  }

  // Handle filter change
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter)
    setLoading(true)
    const result = await getActivityFeed(newFilter, 100)
    setLoading(false)

    if (result.success) {
      setActivities(result.activities || [])
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshFeed()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, filter])

  // Get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'card_obtained':
        return <Sparkles className="w-5 h-5" />
      case 'card_sold':
        return <ShoppingCart className="w-5 h-5" />
      case 'card_purchased':
        return <ShoppingCart className="w-5 h-5" />
      case 'card_listed':
        return <Store className="w-5 h-5" />
      case 'level_up':
        return <TrendingUp className="w-5 h-5" />
      case 'badge_earned':
        return <Award className="w-5 h-5" />
      case 'title_unlocked':
        return <Crown className="w-5 h-5" />
      case 'trade_completed':
        return <ArrowRightLeft className="w-5 h-5" />
      case 'friend_added':
        return <UserPlus className="w-5 h-5" />
      case 'battle_won':
        return <Sword className="w-5 h-5" />
      case 'expedition_completed':
        return <Map className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  // Get activity color
  const getActivityColor = (type, rarity) => {
    // Special handling for rare cards
    if ((type === 'card_obtained' || type === 'card_purchased') && rarity) {
      if (rarity === 'mythic') return 'from-yellow-500 to-orange-500'
      if (rarity === 'legendary') return 'from-yellow-600 to-orange-600'
      if (rarity === 'epic') return 'from-purple-500 to-pink-500'
    }

    switch (type) {
      case 'card_obtained':
        return 'from-green-500 to-emerald-500'
      case 'card_sold':
        return 'from-yellow-500 to-orange-500'
      case 'card_purchased':
        return 'from-blue-500 to-cyan-500'
      case 'card_listed':
        return 'from-green-500 to-teal-500'
      case 'level_up':
        return 'from-purple-500 to-pink-500'
      case 'badge_earned':
        return 'from-orange-500 to-red-500'
      case 'title_unlocked':
        return 'from-yellow-500 to-amber-500'
      case 'trade_completed':
        return 'from-blue-500 to-purple-500'
      case 'friend_added':
        return 'from-pink-500 to-rose-500'
      case 'battle_won':
        return 'from-red-500 to-orange-500'
      case 'expedition_completed':
        return 'from-teal-500 to-cyan-500'
      default:
        return 'from-zinc-500 to-zinc-600'
    }
  }

  // Get activity text
  const getActivityText = (activity) => {
    const { activity_type, metadata, profile } = activity
    const username = profile?.username || 'Someone'

    switch (activity_type) {
      case 'card_obtained':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> obtained </span>
            <span className={`font-bold ${getRarityTextColor(metadata.rarity)}`}>
              {metadata.card_name}
            </span>
          </>
        )
      case 'card_sold':
        return (
          <>
            <span className="font-semibold text-zinc-50">{metadata.card_name}</span>
            <span className="text-zinc-400"> was sold for </span>
            <span className="font-bold text-yellow-400">{metadata.price} coins</span>
          </>
        )
      case 'card_purchased':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> purchased </span>
            <span className={`font-bold ${getRarityTextColor(metadata.rarity)}`}>
              {metadata.card_name}
            </span>
            <span className="text-zinc-400"> for </span>
            <span className="font-bold text-yellow-400">{metadata.price} coins</span>
          </>
        )
      case 'card_listed':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> listed </span>
            <span className="font-bold text-zinc-200">{metadata.card_name}</span>
            <span className="text-zinc-400"> for </span>
            <span className="font-bold text-yellow-400">{metadata.price} coins</span>
          </>
        )
      case 'level_up':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> reached </span>
            <span className="font-bold text-purple-400">Level {metadata.level}</span>
          </>
        )
      case 'badge_earned':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> earned the </span>
            <span className="font-bold text-orange-400">{metadata.badge_name}</span>
            <span className="text-zinc-400"> badge</span>
          </>
        )
      case 'title_unlocked':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> unlocked the </span>
            <span className="font-bold text-yellow-400">"{metadata.title_name}"</span>
            <span className="text-zinc-400"> title</span>
          </>
        )
      case 'trade_completed':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> completed a trade</span>
          </>
        )
      case 'friend_added':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> added </span>
            <span className="font-semibold text-zinc-50">{metadata.friend_username}</span>
            <span className="text-zinc-400"> as a friend</span>
          </>
        )
      case 'battle_won':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> won a battle against </span>
            <span className="font-semibold text-zinc-50">{metadata.opponent_name}</span>
          </>
        )
      case 'expedition_completed':
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> completed </span>
            <span className="font-bold text-teal-400">{metadata.expedition_name}</span>
          </>
        )
      default:
        return (
          <>
            <span className="font-semibold text-zinc-50">{username}</span>
            <span className="text-zinc-400"> performed an action</span>
          </>
        )
    }
  }

  const getRarityTextColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return 'text-yellow-300'
      case 'legendary': return 'text-yellow-400'
      case 'epic': return 'text-purple-400'
      case 'rare': return 'text-blue-400'
      case 'common': return 'text-zinc-400'
      default: return 'text-zinc-400'
    }
  }

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffInSeconds = Math.floor((now - then) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return then.toLocaleDateString()
  }

  // Check if activity is high-value
  const isHighValue = (activity) => {
    const { activity_type, metadata } = activity
    if (activity_type === 'card_obtained' || activity_type === 'card_purchased') {
      return metadata.rarity === 'mythic' || metadata.rarity === 'legendary' || metadata.rarity === 'epic'
    }
    if (activity_type === 'card_sold' && metadata.price > 1000) return true
    return false
  }

  return (
    <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800/50">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-50">Activity Feed</h2>
              <p className="text-sm text-zinc-400">Live updates from the community</p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshFeed}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-6 pb-4">
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>All Activity</span>
          </button>
          <button
            onClick={() => handleFilterChange('friends_only')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'friends_only'
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends Only</span>
          </button>
          <button
            onClick={() => handleFilterChange('my_activity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'my_activity'
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Activity</span>
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="p-6 max-h-[600px] overflow-y-auto space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-lg">No activity yet</p>
            <p className="text-zinc-600 text-sm mt-2">Be the first to make some moves!</p>
          </div>
        ) : (
          activities.map((activity) => {
            const isSpecial = isHighValue(activity)
            const color = getActivityColor(activity.activity_type, activity.metadata?.rarity)

            return (
              <div
                key={activity.id}
                className={`group relative flex items-start gap-3 p-4 rounded-xl transition-all ${
                  isSpecial
                    ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                    : 'bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 ${
                  isSpecial ? 'ring-2 ring-yellow-500/50 shadow-lg' : ''
                }`}>
                  {getActivityIcon(activity.activity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>

                {/* Special Badge for Rare Cards */}
                {isSpecial && (
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Auto-refresh Toggle */}
      <div className="border-t border-zinc-800/50 p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-zinc-400">Auto-refresh every 30 seconds</span>
        </label>
      </div>
    </div>
  )
}
