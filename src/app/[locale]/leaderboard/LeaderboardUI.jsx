'use client'

import { useState } from 'react'
import {
  Trophy,
  TrendingUp,
  Coins,
  Zap,
  Crown,
  Medal,
  User,
  UserPlus,
  Clock,
  Calendar,
  Infinity
} from 'lucide-react'

export default function LeaderboardUI({ initialRankings, initialUserRank, userId, onAddFriend, onViewProfile }) {
  const [metric, setMetric] = useState('coins') // 'coins' or 'xp'
  const [timeFilter, setTimeFilter] = useState('all_time') // 'all_time', 'this_week', 'today'
  const [rankings, setRankings] = useState(initialRankings)
  const [userRank, setUserRank] = useState(initialUserRank)
  const [loading, setLoading] = useState(false)

  // Handle metric/filter changes
  const handleFilterChange = async (newMetric, newTimeFilter) => {
    setLoading(true)
    setMetric(newMetric)
    setTimeFilter(newTimeFilter)

    // In a real app, you'd fetch new data here
    // For now, we'll just use the initial data
    // const result = await fetch(`/api/leaderboard?metric=${newMetric}&time=${newTimeFilter}`)
    // const data = await result.json()
    // setRankings(data.rankings)
    // setUserRank(data.userRank)

    setLoading(false)
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-zinc-300" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />
    return null
  }

  const getRankStyle = (rank) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
    }
    if (rank === 2) {
      return 'bg-gradient-to-r from-zinc-400/20 to-zinc-500/20 border-zinc-400/50 shadow-lg shadow-zinc-400/20'
    }
    if (rank === 3) {
      return 'bg-gradient-to-r from-orange-400/20 to-orange-500/20 border-orange-400/50 shadow-lg shadow-orange-400/20'
    }
    return 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700/50'
  }

  const getMetricValue = (user) => {
    return metric === 'coins' ? user.coins : user.xp
  }

  const getMetricIcon = () => {
    return metric === 'coins' ? <Coins className="w-5 h-5 text-yellow-500" /> : <Zap className="w-5 h-5 text-blue-400" />
  }

  const getTimeFilterIcon = () => {
    if (timeFilter === 'today') return <Clock className="w-4 h-4" />
    if (timeFilter === 'this_week') return <Calendar className="w-4 h-4" />
    return <Infinity className="w-4 h-4" />
  }

  return (
    <div>
      {/* Premium Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent mb-2">
                Leaderboard
              </h1>
              <p className="text-zinc-400 text-lg">Compete with players worldwide</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Metric Selection */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Ranking By</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFilterChange('coins', timeFilter)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                      metric === 'coins'
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/20 scale-105'
                        : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                    }`}
                  >
                    <Coins className="w-5 h-5" />
                    <span>Total Coins</span>
                  </button>
                  <button
                    onClick={() => handleFilterChange('xp', timeFilter)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                      metric === 'xp'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                        : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                    <span>XP</span>
                  </button>
                </div>
              </div>

              {/* Time Filter */}
              <div className="lg:w-80">
                <div className="flex items-center gap-2 mb-3">
                  {getTimeFilterIcon()}
                  <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Time Period</span>
                </div>
                <div className="flex gap-2">
                  {['all_time', 'this_week', 'today'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => handleFilterChange(metric, filter)}
                      disabled={loading}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        timeFilter === filter
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
                      }`}
                    >
                      {filter === 'all_time' && 'All Time'}
                      {filter === 'this_week' && 'This Week'}
                      {filter === 'today' && 'Today'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rank Badge - Pinned at top */}
        {userRank > 0 && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 backdrop-blur-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-300 uppercase tracking-wider">Your Rank</p>
                  <p className="text-2xl font-bold text-white">#{userRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                  {metric === 'coins' ? 'Total Coins' : 'Total XP'}
                </p>
                <div className="flex items-center gap-2">
                  {getMetricIcon()}
                  <p className="text-xl font-bold text-white">
                    {rankings.find(r => r.id === userId) ? getMetricValue(rankings.find(r => r.id === userId)).toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rankings List */}
        <div className="space-y-3">
          {rankings.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-16 text-center">
              <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-300 mb-2">No Rankings Yet</h3>
              <p className="text-zinc-500 text-lg">Be the first to climb the leaderboard!</p>
            </div>
          ) : (
            rankings.map((user, index) => {
              const rank = index + 1
              const isCurrentUser = user.id === userId
              const isTopThree = rank <= 3

              return (
                <div
                  key={user.id}
                  className={`group relative rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-300 ${
                    isCurrentUser
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10'
                      : getRankStyle(rank)
                  } ${isTopThree ? 'p-6' : 'p-4'} hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`flex items-center justify-center ${isTopThree ? 'w-16 h-16' : 'w-12 h-12'}`}>
                      {getRankIcon(rank) || (
                        <div className={`${isTopThree ? 'text-3xl' : 'text-xl'} font-bold ${
                          isCurrentUser ? 'text-blue-400' : 'text-zinc-400'
                        }`}>
                          #{rank}
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`${isTopThree ? 'w-14 h-14' : 'w-12 h-12'} rounded-full overflow-hidden ${
                      isTopThree ? 'ring-4 ring-white/20' : 'ring-2 ring-zinc-700'
                    }`}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${
                          rank === 1 ? 'from-yellow-500 to-orange-500' :
                          rank === 2 ? 'from-zinc-400 to-zinc-500' :
                          rank === 3 ? 'from-orange-400 to-orange-500' :
                          'from-blue-500 to-purple-500'
                        } flex items-center justify-center`}>
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Username */}
                    <div className="flex-1">
                      <h3 className={`${isTopThree ? 'text-xl' : 'text-lg'} font-bold ${
                        isCurrentUser ? 'text-blue-400' : 'text-zinc-50'
                      }`}>
                        {user.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-blue-400 font-normal">(You)</span>
                        )}
                      </h3>
                      {isTopThree && (
                        <p className="text-sm text-zinc-400 mt-1">
                          {rank === 1 && '👑 Champion'}
                          {rank === 2 && '🥈 Runner Up'}
                          {rank === 3 && '🥉 Third Place'}
                        </p>
                      )}
                    </div>

                    {/* Metric Value */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        {getMetricIcon()}
                        <p className={`${isTopThree ? 'text-2xl' : 'text-xl'} font-bold ${
                          isCurrentUser ? 'text-blue-400' : 'text-white'
                        }`}>
                          {getMetricValue(user).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">
                        {metric === 'coins' ? 'Coins' : 'XP'}
                      </p>
                    </div>

                    {/* Actions */}
                    {!isCurrentUser && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewProfile && onViewProfile(user.id)}
                          className="p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white transition-all"
                          title="View Profile"
                        >
                          <User className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onAddFriend && onAddFriend(user.id)}
                          className="p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all shadow-lg hover:shadow-blue-500/20"
                          title="Add Friend"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Top 3 Special Glow */}
                  {isTopThree && (
                    <div className={`absolute inset-0 pointer-events-none ${
                      rank === 1 ? 'bg-gradient-to-r from-yellow-500/5 to-orange-500/5' :
                      rank === 2 ? 'bg-gradient-to-r from-zinc-400/5 to-zinc-500/5' :
                      'bg-gradient-to-r from-orange-400/5 to-orange-500/5'
                    }`} />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
