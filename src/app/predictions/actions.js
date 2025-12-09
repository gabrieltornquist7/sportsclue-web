'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/app/leaderboard/actions'

// Constants
const HOUSE_FEE_PERCENT = 0.05 // 5% fee on winnings
const RANK_TIERS = {
  novice: { name: 'Novice', minPredictions: 0, minWinRate: 0, minProfit: 0 },
  amateur: { name: 'Amateur', minPredictions: 20, minWinRate: 0.45, minProfit: 0 },
  semi_pro: { name: 'Semi-Pro', minPredictions: 50, minWinRate: 0.50, minProfit: 0 },
  pro: { name: 'Pro', minPredictions: 100, minWinRate: 0.52, minProfit: 0 },
  expert: { name: 'Expert', minPredictions: 200, minWinRate: 0.55, minProfit: 0 },
  oracle: { name: 'Oracle', minPredictions: 500, minWinRate: 0.58, minProfit: 50000 }
}

const STREAK_BONUSES = {
  3: 1.1,   // 10% bonus
  5: 1.25,  // 25% bonus
  10: 1.5   // 50% bonus
}

/**
 * Get all upcoming matches with odds
 */
export async function getUpcomingMatches(sportId = null, leagueId = null) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    let query = supabase
      .from('matches')
      .select(`
        *,
        league:leagues(id, name, logo_url, country),
        home_team:teams!home_team_id(id, name, logo_url),
        away_team:teams!away_team_id(id, name, logo_url)
      `)
      .in('status', ['scheduled', 'live'])
      .order('match_date', { ascending: true })

    if (leagueId) {
      query = query.eq('league_id', leagueId)
    }

    const { data: matches, error } = await query

    if (error) {
      console.error('Error fetching matches:', error)
      return { error: 'Failed to fetch matches' }
    }

    // Calculate odds for each match
    const matchesWithOdds = (matches || []).map(match => {
      const totalPool = match.total_pool || 0
      const homePool = match.home_pool || 0
      const drawPool = match.draw_pool || 0
      const awayPool = match.away_pool || 0

      // Calculate parimutuel odds (minimum 1.01 to avoid divide by zero)
      const homeOdds = homePool > 0 ? Math.max(totalPool / homePool, 1.01) : 2.0
      const drawOdds = drawPool > 0 ? Math.max(totalPool / drawPool, 1.01) : 3.5
      const awayOdds = awayPool > 0 ? Math.max(totalPool / awayPool, 1.01) : 2.0

      // Calculate percentages
      const homePercent = totalPool > 0 ? Math.round((homePool / totalPool) * 100) : 33
      const drawPercent = totalPool > 0 ? Math.round((drawPool / totalPool) * 100) : 34
      const awayPercent = totalPool > 0 ? Math.round((awayPool / totalPool) * 100) : 33

      return {
        ...match,
        odds: {
          home: parseFloat(homeOdds.toFixed(2)),
          draw: parseFloat(drawOdds.toFixed(2)),
          away: parseFloat(awayOdds.toFixed(2))
        },
        percentages: {
          home: homePercent,
          draw: drawPercent,
          away: awayPercent
        },
        prediction_count: match.prediction_count || 0
      }
    })

    return { success: true, matches: matchesWithOdds }
  } catch (error) {
    console.error('Error in getUpcomingMatches:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get live matches
 */
export async function getLiveMatches() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        league:leagues(id, name, logo_url, country),
        home_team:teams!home_team_id(id, name, logo_url),
        away_team:teams!away_team_id(id, name, logo_url)
      `)
      .eq('status', 'live')
      .order('match_date', { ascending: true })

    if (error) {
      console.error('Error fetching live matches:', error)
      return { error: 'Failed to fetch live matches' }
    }

    return { success: true, matches: matches || [] }
  } catch (error) {
    console.error('Error in getLiveMatches:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's predictions
 */
export async function getMyPredictions(status = 'all') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    let query = supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          *,
          league:leagues(id, name, logo_url),
          home_team:teams!home_team_id(id, name, logo_url),
          away_team:teams!away_team_id(id, name, logo_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status === 'active') {
      query = query.eq('status', 'pending')
    } else if (status === 'settled') {
      query = query.in('status', ['won', 'lost', 'refunded'])
    }

    const { data: predictions, error } = await query

    if (error) {
      console.error('Error fetching predictions:', error)
      return { error: 'Failed to fetch predictions' }
    }

    return { success: true, predictions: predictions || [] }
  } catch (error) {
    console.error('Error in getMyPredictions:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Place a prediction
 */
export async function placePrediction(matchId, prediction, stake) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Validate prediction type
    if (!['home', 'draw', 'away'].includes(prediction)) {
      return { error: 'Invalid prediction type' }
    }

    // Validate stake
    stake = parseInt(stake)
    if (!stake || stake <= 0) {
      return { error: 'Invalid stake amount' }
    }

    // Get user's coins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'Failed to fetch user profile' }
    }

    if (profile.coins < stake) {
      return { error: `Not enough coins! You have ${profile.coins} but need ${stake}` }
    }

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(name),
        away_team:teams!away_team_id(name)
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return { error: 'Match not found' }
    }

    // Check if match is still open for predictions
    if (match.status !== 'scheduled') {
      return { error: 'This match is no longer accepting predictions' }
    }

    // Check if match has already started
    const matchDate = new Date(match.match_date)
    if (matchDate <= new Date()) {
      return { error: 'This match has already started' }
    }

    // Check if user already has a prediction on this match
    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .single()

    if (existingPrediction) {
      return { error: 'You already have a prediction on this match' }
    }

    // Calculate current odds
    const totalPool = (match.total_pool || 0) + stake
    const homePool = (match.home_pool || 0) + (prediction === 'home' ? stake : 0)
    const drawPool = (match.draw_pool || 0) + (prediction === 'draw' ? stake : 0)
    const awayPool = (match.away_pool || 0) + (prediction === 'away' ? stake : 0)

    let currentOdds
    if (prediction === 'home') {
      currentOdds = homePool > 0 ? totalPool / homePool : 2.0
    } else if (prediction === 'draw') {
      currentOdds = drawPool > 0 ? totalPool / drawPool : 3.5
    } else {
      currentOdds = awayPool > 0 ? totalPool / awayPool : 2.0
    }

    const potentialPayout = Math.floor(stake * currentOdds)

    // Start transaction-like operations
    // 1. Deduct coins from user
    const { error: coinsError } = await supabase
      .from('profiles')
      .update({ coins: profile.coins - stake })
      .eq('id', user.id)

    if (coinsError) {
      console.error('Error deducting coins:', coinsError)
      return { error: 'Failed to process prediction' }
    }

    // 2. Update match pools
    const poolUpdate = {
      total_pool: totalPool,
      prediction_count: (match.prediction_count || 0) + 1
    }
    if (prediction === 'home') poolUpdate.home_pool = homePool
    else if (prediction === 'draw') poolUpdate.draw_pool = drawPool
    else poolUpdate.away_pool = awayPool

    const { error: poolError } = await supabase
      .from('matches')
      .update(poolUpdate)
      .eq('id', matchId)

    if (poolError) {
      // Rollback coins
      await supabase
        .from('profiles')
        .update({ coins: profile.coins })
        .eq('id', user.id)
      console.error('Error updating pools:', poolError)
      return { error: 'Failed to process prediction' }
    }

    // 3. Create prediction record
    const { data: newPrediction, error: predictionError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        match_id: matchId,
        prediction: prediction,
        stake: stake,
        odds_at_prediction: parseFloat(currentOdds.toFixed(2)),
        potential_payout: potentialPayout,
        status: 'pending'
      })
      .select()
      .single()

    if (predictionError) {
      // Rollback coins and pools
      await supabase
        .from('profiles')
        .update({ coins: profile.coins })
        .eq('id', user.id)
      await supabase
        .from('matches')
        .update({
          total_pool: match.total_pool || 0,
          home_pool: match.home_pool || 0,
          draw_pool: match.draw_pool || 0,
          away_pool: match.away_pool || 0,
          prediction_count: match.prediction_count || 0
        })
        .eq('id', matchId)
      console.error('Error creating prediction:', predictionError)
      return { error: 'Failed to create prediction' }
    }

    // Log activity
    const predictionLabel = prediction === 'home' ? match.home_team?.name :
                           prediction === 'away' ? match.away_team?.name : 'Draw'
    await logActivity({
      userId: user.id,
      activityType: 'prediction_placed',
      metadata: {
        match: `${match.home_team?.name} vs ${match.away_team?.name}`,
        prediction: predictionLabel,
        stake: stake,
        potential_payout: potentialPayout
      }
    })

    revalidatePath('/predictions')
    return {
      success: true,
      prediction: newPrediction,
      newBalance: profile.coins - stake
    }
  } catch (error) {
    console.error('Error in placePrediction:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's prediction stats
 */
export async function getPredictionStats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get or create prediction stats
    let { data: stats, error } = await supabase
      .from('prediction_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Stats don't exist, create them
      const { data: newStats, error: createError } = await supabase
        .from('prediction_stats')
        .insert({
          user_id: user.id,
          total_predictions: 0,
          wins: 0,
          losses: 0,
          total_staked: 0,
          total_won: 0,
          total_lost: 0,
          net_profit: 0,
          current_streak: 0,
          best_streak: 0,
          rank_tier: 'novice'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating prediction stats:', createError)
        return { error: 'Failed to get prediction stats' }
      }
      stats = newStats
    } else if (error) {
      console.error('Error fetching prediction stats:', error)
      return { error: 'Failed to get prediction stats' }
    }

    // Calculate win rate
    const winRate = stats.total_predictions > 0
      ? (stats.wins / stats.total_predictions * 100).toFixed(1)
      : 0

    return {
      success: true,
      stats: {
        ...stats,
        win_rate: parseFloat(winRate)
      }
    }
  } catch (error) {
    console.error('Error in getPredictionStats:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get prediction leaderboard
 */
export async function getPredictionLeaderboard(sortBy = 'profit', timeFilter = 'all_time', limit = 50) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    let orderColumn = 'net_profit'
    if (sortBy === 'win_rate') {
      orderColumn = 'wins' // We'll calculate win rate client-side
    } else if (sortBy === 'streak') {
      orderColumn = 'current_streak'
    }

    const { data: leaderboard, error } = await supabase
      .from('prediction_stats')
      .select(`
        *,
        profile:profiles!user_id(id, username, avatar_url)
      `)
      .order(orderColumn, { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return { error: 'Failed to fetch leaderboard' }
    }

    // Add win rate and rank
    const leaderboardWithRanks = (leaderboard || []).map((entry, index) => {
      const winRate = entry.total_predictions > 0
        ? (entry.wins / entry.total_predictions * 100)
        : 0
      return {
        ...entry,
        rank: index + 1,
        win_rate: parseFloat(winRate.toFixed(1))
      }
    })

    // If sorting by win rate, re-sort
    if (sortBy === 'win_rate') {
      leaderboardWithRanks.sort((a, b) => b.win_rate - a.win_rate)
      leaderboardWithRanks.forEach((entry, index) => {
        entry.rank = index + 1
      })
    }

    // Find current user's position
    const userRank = leaderboardWithRanks.findIndex(e => e.user_id === user.id) + 1

    return {
      success: true,
      leaderboard: leaderboardWithRanks,
      userRank
    }
  } catch (error) {
    console.error('Error in getPredictionLeaderboard:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get available leagues
 */
export async function getLeagues() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching leagues:', error)
      return { error: 'Failed to fetch leagues' }
    }

    return { success: true, leagues: leagues || [] }
  } catch (error) {
    console.error('Error in getLeagues:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Settle a match and process all predictions
 * This would typically be called by a cron job or admin action
 */
export async function settleMatch(matchId, homeScore, awayScore) {
  try {
    const supabase = await createClient()

    // Determine result
    let result
    if (homeScore > awayScore) result = 'home'
    else if (homeScore < awayScore) result = 'away'
    else result = 'draw'

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return { error: 'Match not found' }
    }

    if (match.is_settled) {
      return { error: 'Match already settled' }
    }

    // Get all predictions for this match
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*, profile:profiles!user_id(username)')
      .eq('match_id', matchId)
      .eq('status', 'pending')

    if (predError) {
      console.error('Error fetching predictions:', predError)
      return { error: 'Failed to fetch predictions' }
    }

    // Calculate final odds
    const totalPool = match.total_pool || 0
    const winningPool = match[`${result}_pool`] || 0
    const finalOdds = winningPool > 0 ? totalPool / winningPool : 1

    // Process each prediction
    for (const prediction of predictions || []) {
      const isWinner = prediction.prediction === result

      if (isWinner) {
        // Calculate payout with house fee
        const grossPayout = Math.floor(prediction.stake * finalOdds)
        const profit = grossPayout - prediction.stake
        const houseFee = Math.floor(profit * HOUSE_FEE_PERCENT)
        const netPayout = grossPayout - houseFee

        // Get user's current streak for bonus
        const { data: stats } = await supabase
          .from('prediction_stats')
          .select('current_streak')
          .eq('user_id', prediction.user_id)
          .single()

        const newStreak = (stats?.current_streak || 0) + 1
        let streakBonus = 1
        for (const [threshold, bonus] of Object.entries(STREAK_BONUSES)) {
          if (newStreak >= parseInt(threshold)) {
            streakBonus = bonus
          }
        }

        const finalPayout = Math.floor(netPayout * streakBonus)

        // Update prediction
        await supabase
          .from('predictions')
          .update({
            status: 'won',
            actual_payout: finalPayout,
            settled_at: new Date().toISOString()
          })
          .eq('id', prediction.id)

        // Credit user
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', prediction.user_id)
          .single()

        await supabase
          .from('profiles')
          .update({ coins: (profile?.coins || 0) + finalPayout })
          .eq('id', prediction.user_id)

        // Update stats
        await updatePredictionStats(supabase, prediction.user_id, true, prediction.stake, finalPayout)

        // Log activity for big wins
        if (finalPayout >= 1000) {
          await logActivity({
            userId: prediction.user_id,
            activityType: 'prediction_big_win',
            metadata: {
              payout: finalPayout,
              match_id: matchId
            }
          })
        }

        // Log hot streak
        if (newStreak === 10) {
          await logActivity({
            userId: prediction.user_id,
            activityType: 'prediction_hot_streak',
            metadata: { streak: newStreak }
          })
        }
      } else {
        // Update prediction as lost
        await supabase
          .from('predictions')
          .update({
            status: 'lost',
            actual_payout: 0,
            settled_at: new Date().toISOString()
          })
          .eq('id', prediction.id)

        // Update stats
        await updatePredictionStats(supabase, prediction.user_id, false, prediction.stake, 0)
      }
    }

    // Update match as settled
    await supabase
      .from('matches')
      .update({
        status: 'finished',
        home_score: homeScore,
        away_score: awayScore,
        result: result,
        is_settled: true,
        settled_at: new Date().toISOString()
      })
      .eq('id', matchId)

    revalidatePath('/predictions')
    return { success: true, result, settledCount: predictions?.length || 0 }
  } catch (error) {
    console.error('Error in settleMatch:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Helper to update prediction stats
 */
async function updatePredictionStats(supabase, userId, isWin, stake, payout) {
  const { data: stats } = await supabase
    .from('prediction_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!stats) {
    // Create new stats
    await supabase
      .from('prediction_stats')
      .insert({
        user_id: userId,
        total_predictions: 1,
        wins: isWin ? 1 : 0,
        losses: isWin ? 0 : 1,
        total_staked: stake,
        total_won: isWin ? payout : 0,
        total_lost: isWin ? 0 : stake,
        net_profit: isWin ? payout - stake : -stake,
        current_streak: isWin ? 1 : 0,
        best_streak: isWin ? 1 : 0,
        rank_tier: 'novice'
      })
    return
  }

  const newStreak = isWin ? stats.current_streak + 1 : 0
  const newBestStreak = Math.max(stats.best_streak, newStreak)
  const newProfit = stats.net_profit + (isWin ? payout - stake : -stake)
  const newTotalPredictions = stats.total_predictions + 1
  const newWins = stats.wins + (isWin ? 1 : 0)
  const winRate = newWins / newTotalPredictions

  // Calculate rank tier
  let rankTier = 'novice'
  for (const [tier, requirements] of Object.entries(RANK_TIERS).reverse()) {
    if (newTotalPredictions >= requirements.minPredictions &&
        winRate >= requirements.minWinRate &&
        newProfit >= requirements.minProfit) {
      rankTier = tier
      break
    }
  }

  await supabase
    .from('prediction_stats')
    .update({
      total_predictions: newTotalPredictions,
      wins: newWins,
      losses: stats.losses + (isWin ? 0 : 1),
      total_staked: stats.total_staked + stake,
      total_won: stats.total_won + (isWin ? payout : 0),
      total_lost: stats.total_lost + (isWin ? 0 : stake),
      net_profit: newProfit,
      current_streak: newStreak,
      best_streak: newBestStreak,
      rank_tier: rankTier
    })
    .eq('user_id', userId)
}

/**
 * Refund all predictions for a cancelled match
 */
export async function refundMatch(matchId) {
  try {
    const supabase = await createClient()

    // Get all pending predictions
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'pending')

    if (predError) {
      console.error('Error fetching predictions:', predError)
      return { error: 'Failed to fetch predictions' }
    }

    // Refund each prediction
    for (const prediction of predictions || []) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', prediction.user_id)
        .single()

      // Refund coins
      await supabase
        .from('profiles')
        .update({ coins: (profile?.coins || 0) + prediction.stake })
        .eq('id', prediction.user_id)

      // Update prediction status
      await supabase
        .from('predictions')
        .update({
          status: 'refunded',
          actual_payout: prediction.stake,
          settled_at: new Date().toISOString()
        })
        .eq('id', prediction.id)
    }

    // Update match
    await supabase
      .from('matches')
      .update({
        status: 'cancelled',
        is_settled: true
      })
      .eq('id', matchId)

    revalidatePath('/predictions')
    return { success: true, refundedCount: predictions?.length || 0 }
  } catch (error) {
    console.error('Error in refundMatch:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get match details with prediction info
 */
export async function getMatchDetails(matchId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        league:leagues(id, name, logo_url, country),
        home_team:teams!home_team_id(id, name, logo_url, short_name),
        away_team:teams!away_team_id(id, name, logo_url, short_name)
      `)
      .eq('id', matchId)
      .single()

    if (error || !match) {
      return { error: 'Match not found' }
    }

    // Get user's prediction if exists
    const { data: userPrediction } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .single()

    // Calculate odds
    const totalPool = match.total_pool || 0
    const homePool = match.home_pool || 0
    const drawPool = match.draw_pool || 0
    const awayPool = match.away_pool || 0

    const homeOdds = homePool > 0 ? Math.max(totalPool / homePool, 1.01) : 2.0
    const drawOdds = drawPool > 0 ? Math.max(totalPool / drawPool, 1.01) : 3.5
    const awayOdds = awayPool > 0 ? Math.max(totalPool / awayPool, 1.01) : 2.0

    return {
      success: true,
      match: {
        ...match,
        odds: {
          home: parseFloat(homeOdds.toFixed(2)),
          draw: parseFloat(drawOdds.toFixed(2)),
          away: parseFloat(awayOdds.toFixed(2))
        },
        percentages: {
          home: totalPool > 0 ? Math.round((homePool / totalPool) * 100) : 33,
          draw: totalPool > 0 ? Math.round((drawPool / totalPool) * 100) : 34,
          away: totalPool > 0 ? Math.round((awayPool / totalPool) * 100) : 33
        }
      },
      userPrediction
    }
  } catch (error) {
    console.error('Error in getMatchDetails:', error)
    return { error: 'An unexpected error occurred' }
  }
}
