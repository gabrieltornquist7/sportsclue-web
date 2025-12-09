'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  placePrediction,
  getMyPredictions,
  getPredictionLeaderboard,
  getPredictionStats
} from '@/app/predictions/actions'
import {
  TrendingUp,
  Trophy,
  Target,
  Zap,
  Coins,
  Calendar,
  Clock,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Flame,
  Medal,
  Crown,
  Star,
  Users,
  BarChart3,
  History,
  Radio,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

// Rank tier configurations
const RANK_CONFIG = {
  novice: { name: 'Novice', icon: Star, color: 'text-zinc-400', bg: 'bg-zinc-500/20', border: 'border-zinc-500/30' },
  amateur: { name: 'Amateur', icon: Medal, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  semi_pro: { name: 'Semi-Pro', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  pro: { name: 'Pro', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  expert: { name: 'Expert', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  oracle: { name: 'Oracle', icon: Crown, color: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' }
}

export default function PredictionsUI({
  userId,
  locale,
  username,
  initialMatches,
  initialLeagues,
  initialStats,
  userPredictions
}) {
  const router = useRouter()
  const { coins, updateCurrency } = useCurrency()

  // State
  const [matches, setMatches] = useState(initialMatches)
  const [leagues, setLeagues] = useState(initialLeagues)
  const [stats, setStats] = useState(initialStats)
  const [myPredictions, setMyPredictions] = useState(userPredictions)
  const [leaderboard, setLeaderboard] = useState([])

  // UI State
  const [activeTab, setActiveTab] = useState('matches') // matches, live, my_predictions, leaderboard
  const [selectedLeague, setSelectedLeague] = useState('all')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [predictionModalOpen, setPredictionModalOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState(null)
  const [leaderboardSort, setLeaderboardSort] = useState('profit')

  // Filter matches by league
  const filteredMatches = selectedLeague === 'all'
    ? matches
    : matches.filter(m => m.league_id === selectedLeague)

  // Separate live matches
  const liveMatches = matches.filter(m => m.status === 'live')
  const upcomingMatches = filteredMatches.filter(m => m.status === 'scheduled')

  // User's prediction IDs for highlighting
  const userPredictionMatchIds = myPredictions.map(p => p.match_id)

  // Calculate win rate
  const winRate = stats?.total_predictions > 0
    ? ((stats.wins / stats.total_predictions) * 100).toFixed(1)
    : 0

  // Get rank config
  const rankConfig = RANK_CONFIG[stats?.rank_tier || 'novice']
  const RankIcon = rankConfig.icon

  // Load leaderboard
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard()
    }
  }, [activeTab, leaderboardSort])

  const loadLeaderboard = async () => {
    const result = await getPredictionLeaderboard(leaderboardSort)
    if (result.success) {
      setLeaderboard(result.leaderboard)
    }
  }

  // Open prediction modal
  const openPredictionModal = (match) => {
    if (userPredictionMatchIds.includes(match.id)) {
      setMessage({ type: 'error', text: 'You already have a prediction on this match' })
      return
    }
    if (match.status !== 'scheduled') {
      setMessage({ type: 'error', text: 'This match is no longer accepting predictions' })
      return
    }
    setSelectedMatch(match)
    setSelectedOutcome(null)
    setStakeAmount('')
    setPredictionModalOpen(true)
  }

  // Place prediction
  const handlePlacePrediction = async () => {
    if (!selectedOutcome || !stakeAmount || placing) return

    const stake = parseInt(stakeAmount)
    if (stake <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid stake amount' })
      return
    }
    if (stake > coins) {
      setMessage({ type: 'error', text: `Not enough coins! You have ${coins}` })
      return
    }

    setPlacing(true)
    setMessage(null)

    const result = await placePrediction(selectedMatch.id, selectedOutcome, stake)

    setPlacing(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Prediction placed successfully!' })
      updateCurrency(result.newBalance)
      setPredictionModalOpen(false)

      // Add to user predictions
      setMyPredictions(prev => [...prev, result.prediction])

      // Update match pools locally
      setMatches(prev => prev.map(m => {
        if (m.id === selectedMatch.id) {
          const newTotalPool = (m.total_pool || 0) + stake
          const newHomePool = (m.home_pool || 0) + (selectedOutcome === 'home' ? stake : 0)
          const newDrawPool = (m.draw_pool || 0) + (selectedOutcome === 'draw' ? stake : 0)
          const newAwayPool = (m.away_pool || 0) + (selectedOutcome === 'away' ? stake : 0)

          return {
            ...m,
            total_pool: newTotalPool,
            home_pool: newHomePool,
            draw_pool: newDrawPool,
            away_pool: newAwayPool,
            prediction_count: (m.prediction_count || 0) + 1,
            odds: {
              home: newHomePool > 0 ? parseFloat((newTotalPool / newHomePool).toFixed(2)) : 2.0,
              draw: newDrawPool > 0 ? parseFloat((newTotalPool / newDrawPool).toFixed(2)) : 3.5,
              away: newAwayPool > 0 ? parseFloat((newTotalPool / newAwayPool).toFixed(2)) : 2.0
            },
            percentages: {
              home: newTotalPool > 0 ? Math.round((newHomePool / newTotalPool) * 100) : 33,
              draw: newTotalPool > 0 ? Math.round((newDrawPool / newTotalPool) * 100) : 34,
              away: newTotalPool > 0 ? Math.round((newAwayPool / newTotalPool) * 100) : 33
            }
          }
        }
        return m
      }))

      // Refresh page after short delay
      setTimeout(() => {
        router.refresh()
      }, 1500)
    }
  }

  // Quick stake buttons
  const setQuickStake = (percent) => {
    const amount = Math.floor(coins * percent)
    setStakeAmount(amount.toString())
  }

  // Calculate potential return
  const potentialReturn = selectedMatch && selectedOutcome && stakeAmount
    ? Math.floor(parseInt(stakeAmount || 0) * selectedMatch.odds[selectedOutcome])
    : 0

  // Format date
  const formatMatchDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === now.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Predictions
                </h1>
                <p className="text-zinc-400 text-lg">Bet on match outcomes with your coins</p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {/* Coins */}
              <div className="rounded-xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Balance</p>
                    <p className="text-xl font-bold text-white">{coins?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Rank */}
              <div className="rounded-xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${rankConfig.bg} ${rankConfig.border} border flex items-center justify-center`}>
                    <RankIcon className={`w-5 h-5 ${rankConfig.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Rank</p>
                    <p className={`text-xl font-bold ${rankConfig.color}`}>{rankConfig.name}</p>
                  </div>
                </div>
              </div>

              {/* Win Rate */}
              <div className="rounded-xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Win Rate</p>
                    <p className="text-xl font-bold text-white">{winRate}%</p>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="rounded-xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stats?.current_streak >= 3 ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-zinc-700'} flex items-center justify-center`}>
                    <Flame className={`w-5 h-5 ${stats?.current_streak >= 3 ? 'text-white' : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Streak</p>
                    <p className="text-xl font-bold text-white">{stats?.current_streak || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Profit Banner */}
            {stats?.net_profit !== 0 && (
              <div className={`mt-4 rounded-xl p-4 border ${
                stats.net_profit > 0
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-red-900/20 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stats.net_profit > 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-zinc-400">Net Profit/Loss:</span>
                  </div>
                  <span className={`text-xl font-bold ${
                    stats.net_profit > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stats.net_profit > 0 ? '+' : ''}{stats.net_profit.toLocaleString()} coins
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 rounded-xl p-4 border backdrop-blur-md ${
              message.type === 'error'
                ? 'bg-red-900/20 border-red-500/30 text-red-300'
                : 'bg-green-900/20 border-green-500/30 text-green-300'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'matches', label: 'Matches', icon: Calendar },
              { id: 'live', label: 'Live', icon: Radio, count: liveMatches.length },
              { id: 'my_predictions', label: 'My Predictions', icon: History, count: myPredictions.length },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map(tab => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-zinc-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* League Filter (only on matches tab) */}
          {activeTab === 'matches' && (
            <div className="mb-6 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Filter by League</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedLeague('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedLeague === 'all'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
                  }`}
                >
                  All Leagues
                </button>
                {leagues.map(league => (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeague(league.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedLeague === league.id
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
                    }`}
                  >
                    {league.logo_url && (
                      <img src={league.logo_url} alt="" className="w-5 h-5 object-contain" />
                    )}
                    {league.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {upcomingMatches.length === 0 ? (
                <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-12 text-center">
                  <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-zinc-300 mb-2">No Upcoming Matches</h3>
                  <p className="text-zinc-500 mb-6">Match data needs to be synced from API-Football</p>

                  <div className="max-w-md mx-auto p-4 rounded-xl bg-amber-900/20 border border-amber-500/30 text-left mb-6">
                    <h4 className="font-semibold text-amber-300 mb-2">Setup Required</h4>
                    <ol className="text-sm text-amber-200/80 space-y-2 list-decimal list-inside">
                      <li>Get a free API key from <a href="https://dashboard.api-football.com/register" target="_blank" rel="noopener noreferrer" className="underline text-amber-300">API-Football</a></li>
                      <li>Add <code className="bg-black/30 px-1 rounded">FOOTBALL_API_KEY</code> to your environment variables</li>
                      <li>Go to the admin page to sync matches</li>
                    </ol>
                  </div>

                  <a
                    href={`/${locale}/predictions/admin`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    Sync Match Data
                  </a>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      hasPrediction={userPredictionMatchIds.includes(match.id)}
                      onPredict={() => openPredictionModal(match)}
                      formatDate={formatMatchDate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'live' && (
            <div className="space-y-4">
              {liveMatches.length === 0 ? (
                <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-16 text-center">
                  <Radio className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-zinc-300 mb-2">No Live Matches</h3>
                  <p className="text-zinc-500">Live matches will appear here when in progress</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {liveMatches.map(match => (
                    <LiveMatchCard
                      key={match.id}
                      match={match}
                      userPrediction={myPredictions.find(p => p.match_id === match.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my_predictions' && (
            <MyPredictionsTab
              predictions={myPredictions}
              userId={userId}
              locale={locale}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardTab
              leaderboard={leaderboard}
              userId={userId}
              sortBy={leaderboardSort}
              onSortChange={setLeaderboardSort}
            />
          )}
        </div>
      </div>

      {/* Prediction Modal */}
      {predictionModalOpen && selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setPredictionModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPredictionModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                {selectedMatch.league?.logo_url && (
                  <img src={selectedMatch.league.logo_url} alt="" className="w-6 h-6" />
                )}
                <span className="text-sm text-zinc-400">{selectedMatch.league?.name}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Make Your Prediction</h3>
              <p className="text-sm text-zinc-500">{formatMatchDate(selectedMatch.match_date)}</p>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="text-center flex-1">
                {selectedMatch.home_team?.logo_url && (
                  <img
                    src={selectedMatch.home_team.logo_url}
                    alt=""
                    className="w-16 h-16 mx-auto mb-2 object-contain"
                  />
                )}
                <p className="font-semibold text-white">{selectedMatch.home_team?.name}</p>
              </div>
              <div className="px-4 text-2xl font-bold text-zinc-600">VS</div>
              <div className="text-center flex-1">
                {selectedMatch.away_team?.logo_url && (
                  <img
                    src={selectedMatch.away_team.logo_url}
                    alt=""
                    className="w-16 h-16 mx-auto mb-2 object-contain"
                  />
                )}
                <p className="font-semibold text-white">{selectedMatch.away_team?.name}</p>
              </div>
            </div>

            {/* Outcome Selection */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { key: 'home', label: 'Home', odds: selectedMatch.odds.home, percent: selectedMatch.percentages.home },
                { key: 'draw', label: 'Draw', odds: selectedMatch.odds.draw, percent: selectedMatch.percentages.draw },
                { key: 'away', label: 'Away', odds: selectedMatch.odds.away, percent: selectedMatch.percentages.away }
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => setSelectedOutcome(option.key)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedOutcome === option.key
                      ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }`}
                >
                  <p className={`text-2xl font-bold mb-1 ${
                    selectedOutcome === option.key ? 'text-green-400' : 'text-white'
                  }`}>
                    {option.odds}x
                  </p>
                  <p className="text-sm text-zinc-400">{option.label}</p>
                  <p className="text-xs text-zinc-500">{option.percent}%</p>
                </button>
              ))}
            </div>

            {/* Stake Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Stake Amount</label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500" />
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter stake..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              {/* Quick stake buttons */}
              <div className="flex gap-2 mt-2">
                {[0.1, 0.25, 0.5, 1].map(percent => (
                  <button
                    key={percent}
                    onClick={() => setQuickStake(percent)}
                    className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-medium hover:bg-zinc-700 hover:text-white transition-all"
                  >
                    {percent === 1 ? 'All In' : `${percent * 100}%`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-2">Available: {coins?.toLocaleString()} coins</p>
            </div>

            {/* Potential Return */}
            {selectedOutcome && stakeAmount && parseInt(stakeAmount) > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-green-900/20 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Potential Return:</span>
                  <span className="text-2xl font-bold text-green-300">{potentialReturn.toLocaleString()} coins</span>
                </div>
                <p className="text-xs text-green-400/70 mt-1">
                  (5% house fee applied on winnings only)
                </p>
              </div>
            )}

            {/* Pool Info */}
            <div className="mb-6 p-3 rounded-lg bg-zinc-800/50 text-sm text-zinc-400">
              <div className="flex justify-between">
                <span>Total Pool:</span>
                <span className="text-white font-medium">{(selectedMatch.total_pool || 0).toLocaleString()} coins</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Predictions:</span>
                <span className="text-white font-medium">{selectedMatch.prediction_count || 0}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 p-3 rounded-lg bg-amber-900/20 border border-amber-500/30 text-sm text-amber-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Odds may change as more predictions are placed. Your payout is calculated at current odds.</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePlacePrediction}
              disabled={!selectedOutcome || !stakeAmount || parseInt(stakeAmount) <= 0 || parseInt(stakeAmount) > coins || placing}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-semibold text-lg text-white shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {placing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Prediction...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm Prediction
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Match Card Component
function MatchCard({ match, hasPrediction, onPredict, formatDate }) {
  return (
    <div className={`rounded-2xl border backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] ${
      hasPrediction
        ? 'border-green-500/30 bg-green-900/10'
        : 'border-zinc-800/50 bg-zinc-900/60 hover:border-zinc-700'
    }`}>
      {/* League Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50 bg-zinc-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.league?.logo_url && (
              <img src={match.league.logo_url} alt="" className="w-5 h-5 object-contain" />
            )}
            <span className="text-sm font-medium text-zinc-400">{match.league?.name}</span>
          </div>
          <span className="text-sm text-zinc-500">{formatDate(match.match_date)}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {match.home_team?.logo_url && (
              <img src={match.home_team.logo_url} alt="" className="w-10 h-10 object-contain" />
            )}
            <span className="font-semibold text-white truncate">{match.home_team?.name}</span>
          </div>
          <span className="text-xl font-bold text-zinc-600 px-4">VS</span>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="font-semibold text-white truncate">{match.away_team?.name}</span>
            {match.away_team?.logo_url && (
              <img src={match.away_team.logo_url} alt="" className="w-10 h-10 object-contain" />
            )}
          </div>
        </div>

        {/* Odds */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { key: 'home', label: 'Home', odds: match.odds.home, percent: match.percentages.home },
            { key: 'draw', label: 'Draw', odds: match.odds.draw, percent: match.percentages.draw },
            { key: 'away', label: 'Away', odds: match.odds.away, percent: match.percentages.away }
          ].map(option => (
            <div
              key={option.key}
              className="text-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            >
              <p className="text-lg font-bold text-green-400">{option.odds}x</p>
              <p className="text-xs text-zinc-500">{option.label}</p>
              <p className="text-xs text-zinc-600">{option.percent}%</p>
            </div>
          ))}
        </div>

        {/* Pool Info */}
        <div className="flex items-center justify-between text-sm text-zinc-500 mb-4">
          <span>Pool: {(match.total_pool || 0).toLocaleString()} coins</span>
          <span>{match.prediction_count || 0} predictions</span>
        </div>

        {/* Action Button */}
        {hasPrediction ? (
          <div className="w-full py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-center">
            <span className="text-green-400 font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Prediction Placed
            </span>
          </div>
        ) : (
          <button
            onClick={onPredict}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-semibold text-white shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
          >
            Make Prediction
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Live Match Card Component
function LiveMatchCard({ match, userPrediction }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-zinc-900/60 backdrop-blur-md overflow-hidden">
      {/* Live Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50 bg-red-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.league?.logo_url && (
              <img src={match.league.logo_url} alt="" className="w-5 h-5 object-contain" />
            )}
            <span className="text-sm font-medium text-zinc-400">{match.league?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-400">LIVE {match.minute}'</span>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            {match.home_team?.logo_url && (
              <img src={match.home_team.logo_url} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
            )}
            <p className="font-semibold text-white text-sm">{match.home_team?.name}</p>
          </div>
          <div className="px-6">
            <p className="text-4xl font-bold text-white">
              {match.home_score ?? 0} - {match.away_score ?? 0}
            </p>
          </div>
          <div className="text-center flex-1">
            {match.away_team?.logo_url && (
              <img src={match.away_team.logo_url} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
            )}
            <p className="font-semibold text-white text-sm">{match.away_team?.name}</p>
          </div>
        </div>

        {/* User's Prediction */}
        {userPrediction && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
            <p className="text-sm text-zinc-400 mb-1">Your Prediction:</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white capitalize">{userPrediction.prediction}</span>
              <span className="text-green-400 font-semibold">{userPrediction.stake} coins @ {userPrediction.odds_at_prediction}x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// My Predictions Tab Component
function MyPredictionsTab({ predictions, userId, locale }) {
  const [activeFilter, setActiveFilter] = useState('active')
  const [allPredictions, setAllPredictions] = useState(predictions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPredictions()
  }, [activeFilter])

  const loadPredictions = async () => {
    setLoading(true)
    const result = await getMyPredictions(activeFilter === 'active' ? 'active' : 'settled')
    if (result.success) {
      setAllPredictions(result.predictions)
    }
    setLoading(false)
  }

  const filteredPredictions = activeFilter === 'active'
    ? allPredictions.filter(p => p.status === 'pending')
    : allPredictions.filter(p => ['won', 'lost', 'refunded'].includes(p.status))

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['active', 'history'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              activeFilter === filter
                ? 'bg-green-600 text-white'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-green-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-16 text-center">
          <History className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-300 mb-2">
            {activeFilter === 'active' ? 'No Active Predictions' : 'No Prediction History'}
          </h3>
          <p className="text-zinc-500">
            {activeFilter === 'active'
              ? 'Place predictions on upcoming matches'
              : 'Your settled predictions will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPredictions.map(prediction => (
            <div
              key={prediction.id}
              className={`rounded-xl border backdrop-blur-md p-4 ${
                prediction.status === 'won'
                  ? 'border-green-500/30 bg-green-900/10'
                  : prediction.status === 'lost'
                  ? 'border-red-500/30 bg-red-900/10'
                  : prediction.status === 'refunded'
                  ? 'border-amber-500/30 bg-amber-900/10'
                  : 'border-zinc-800/50 bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">
                  {prediction.match?.home_team?.name} vs {prediction.match?.away_team?.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                  prediction.status === 'won'
                    ? 'bg-green-500/20 text-green-400'
                    : prediction.status === 'lost'
                    ? 'bg-red-500/20 text-red-400'
                    : prediction.status === 'refunded'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {prediction.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold capitalize">{prediction.prediction}</span>
                  <span className="text-zinc-500 mx-2">@</span>
                  <span className="text-green-400">{prediction.odds_at_prediction}x</span>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-sm">Stake: {prediction.stake}</p>
                  {prediction.status === 'won' && (
                    <p className="text-green-400 font-semibold">+{prediction.actual_payout}</p>
                  )}
                  {prediction.status === 'lost' && (
                    <p className="text-red-400 font-semibold">-{prediction.stake}</p>
                  )}
                  {prediction.status === 'refunded' && (
                    <p className="text-amber-400 font-semibold">Refunded</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Leaderboard Tab Component
function LeaderboardTab({ leaderboard, userId, sortBy, onSortChange }) {
  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div className="flex gap-2">
        {[
          { id: 'profit', label: 'Profit' },
          { id: 'win_rate', label: 'Win Rate' },
          { id: 'streak', label: 'Streak' }
        ].map(option => (
          <button
            key={option.id}
            onClick={() => onSortChange(option.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              sortBy === option.id
                ? 'bg-green-600 text-white'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="p-16 text-center">
            <Trophy className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-300 mb-2">No Predictions Yet</h3>
            <p className="text-zinc-500">Be the first to make a prediction!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {leaderboard.map((entry, index) => {
              const rankConfig = RANK_CONFIG[entry.rank_tier || 'novice']
              const RankIcon = rankConfig.icon
              const isCurrentUser = entry.user_id === userId

              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 ${
                    isCurrentUser ? 'bg-green-900/20' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    index === 0
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : index === 1
                      ? 'bg-zinc-400/20 text-zinc-300'
                      : index === 2
                      ? 'bg-amber-600/20 text-amber-500'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {entry.rank}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700">
                      {entry.profile?.avatar_url ? (
                        <img
                          src={entry.profile.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {entry.profile?.username || 'Unknown'}
                        {isCurrentUser && <span className="text-green-400 ml-2">(You)</span>}
                      </p>
                      <div className="flex items-center gap-1">
                        <RankIcon className={`w-3 h-3 ${rankConfig.color}`} />
                        <span className={`text-xs ${rankConfig.color}`}>{rankConfig.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className={`font-bold ${entry.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.net_profit >= 0 ? '+' : ''}{entry.net_profit?.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.wins}W / {entry.losses}L ({entry.win_rate}%)
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
