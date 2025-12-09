import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY
const API_FOOTBALL_HOST = 'v3.football.api-sports.io'

// League IDs from API-Football
const LEAGUE_IDS = {
  premier_league: 39,
  la_liga: 140,
  bundesliga: 78,
  serie_a: 135,
  ligue_1: 61,
  champions_league: 2
}

/**
 * Fetch data from API-Football
 */
async function fetchFromAPI(endpoint, params = {}) {
  const url = new URL(`https://${API_FOOTBALL_HOST}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const response = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': API_FOOTBALL_KEY,
      'x-rapidapi-host': API_FOOTBALL_HOST
    },
    next: { revalidate: 300 } // Cache for 5 minutes
  })

  if (!response.ok) {
    throw new Error(`API Football error: ${response.status}`)
  }

  const data = await response.json()
  return data.response
}

/**
 * GET handler - Sync data from API-Football
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!API_FOOTBALL_KEY) {
      return NextResponse.json(
        { error: 'API Football key not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    switch (action) {
      case 'sync-fixtures':
        return await syncFixtures(supabase, searchParams)
      case 'sync-live':
        return await syncLiveMatches(supabase)
      case 'sync-results':
        return await syncResults(supabase)
      case 'sync-teams':
        return await syncTeams(supabase, searchParams)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: sync-fixtures, sync-live, sync-results, sync-teams' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('API Football error:', error)
    return NextResponse.json(
      { error: 'Failed to sync data from API Football' },
      { status: 500 }
    )
  }
}

/**
 * Sync upcoming fixtures for all active leagues
 */
async function syncFixtures(supabase, searchParams) {
  const leagueId = searchParams.get('league')
  const season = searchParams.get('season') || new Date().getFullYear()

  // Get leagues to sync
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, api_football_id')
    .eq('is_active', true)

  if (!leagues || leagues.length === 0) {
    return NextResponse.json({ message: 'No active leagues found' })
  }

  const leaguesToSync = leagueId
    ? leagues.filter(l => l.id === leagueId)
    : leagues

  let totalSynced = 0
  const errors = []

  for (const league of leaguesToSync) {
    if (!league.api_football_id) continue

    try {
      // Fetch upcoming fixtures (next 7 days)
      const fixtures = await fetchFromAPI('/fixtures', {
        league: league.api_football_id,
        season: season,
        next: 20 // Get next 20 fixtures
      })

      for (const fixture of fixtures || []) {
        // Get or create teams
        const homeTeamId = await getOrCreateTeam(supabase, fixture.teams.home, league.id)
        const awayTeamId = await getOrCreateTeam(supabase, fixture.teams.away, league.id)

        if (!homeTeamId || !awayTeamId) continue

        // Upsert match
        const matchData = {
          api_football_id: fixture.fixture.id,
          league_id: league.id,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          match_date: fixture.fixture.date,
          venue: fixture.fixture.venue?.name || null,
          status: mapFixtureStatus(fixture.fixture.status.short),
          home_score: fixture.goals.home,
          away_score: fixture.goals.away,
          minute: fixture.fixture.status.elapsed
        }

        const { error } = await supabase
          .from('matches')
          .upsert(matchData, { onConflict: 'api_football_id' })

        if (!error) totalSynced++
      }
    } catch (error) {
      errors.push({ league: league.id, error: error.message })
    }
  }

  return NextResponse.json({
    success: true,
    synced: totalSynced,
    errors: errors.length > 0 ? errors : undefined
  })
}

/**
 * Sync live match updates
 */
async function syncLiveMatches(supabase) {
  // Get all leagues
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, api_football_id')
    .eq('is_active', true)

  if (!leagues) {
    return NextResponse.json({ message: 'No leagues found' })
  }

  let totalUpdated = 0

  for (const league of leagues) {
    if (!league.api_football_id) continue

    try {
      // Fetch live fixtures
      const fixtures = await fetchFromAPI('/fixtures', {
        league: league.api_football_id,
        live: 'all'
      })

      for (const fixture of fixtures || []) {
        const { error } = await supabase
          .from('matches')
          .update({
            status: 'live',
            home_score: fixture.goals.home,
            away_score: fixture.goals.away,
            minute: fixture.fixture.status.elapsed
          })
          .eq('api_football_id', fixture.fixture.id)

        if (!error) totalUpdated++
      }
    } catch (error) {
      console.error(`Error syncing live matches for league ${league.id}:`, error)
    }
  }

  return NextResponse.json({
    success: true,
    updated: totalUpdated
  })
}

/**
 * Sync finished match results and settle predictions
 */
async function syncResults(supabase) {
  // Get matches that are live or might have just finished
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('id, api_football_id')
    .eq('status', 'live')
    .eq('is_settled', false)

  if (!pendingMatches || pendingMatches.length === 0) {
    return NextResponse.json({ message: 'No pending matches to check' })
  }

  let settled = 0
  const errors = []

  for (const match of pendingMatches) {
    try {
      // Fetch fixture details
      const fixtures = await fetchFromAPI('/fixtures', {
        id: match.api_football_id
      })

      const fixture = fixtures?.[0]
      if (!fixture) continue

      // Check if match is finished
      if (fixture.fixture.status.short === 'FT' || fixture.fixture.status.short === 'AET' || fixture.fixture.status.short === 'PEN') {
        // Import settleMatch dynamically to avoid circular dependency
        const { settleMatch } = await import('@/app/predictions/actions')

        const result = await settleMatch(
          match.id,
          fixture.goals.home,
          fixture.goals.away
        )

        if (result.success) {
          settled++
        } else {
          errors.push({ matchId: match.id, error: result.error })
        }
      } else if (fixture.fixture.status.short === 'PST' || fixture.fixture.status.short === 'CANC') {
        // Match postponed or cancelled - refund
        const { refundMatch } = await import('@/app/predictions/actions')
        await refundMatch(match.id)
        settled++
      }
    } catch (error) {
      errors.push({ matchId: match.id, error: error.message })
    }
  }

  return NextResponse.json({
    success: true,
    settled,
    errors: errors.length > 0 ? errors : undefined
  })
}

/**
 * Sync teams for a league
 */
async function syncTeams(supabase, searchParams) {
  const leagueApiId = searchParams.get('league')
  const season = searchParams.get('season') || new Date().getFullYear()

  if (!leagueApiId) {
    return NextResponse.json(
      { error: 'league parameter required' },
      { status: 400 }
    )
  }

  // Get league from database
  const { data: league } = await supabase
    .from('leagues')
    .select('id')
    .eq('api_football_id', parseInt(leagueApiId))
    .single()

  if (!league) {
    return NextResponse.json(
      { error: 'League not found in database' },
      { status: 404 }
    )
  }

  // Fetch teams from API
  const teams = await fetchFromAPI('/teams', {
    league: leagueApiId,
    season: season
  })

  let synced = 0

  for (const teamData of teams || []) {
    const team = teamData.team

    const { error } = await supabase
      .from('teams')
      .upsert({
        api_football_id: team.id,
        name: team.name,
        short_name: team.code,
        logo_url: team.logo,
        league_id: league.id,
        country: teamData.venue?.country || null
      }, { onConflict: 'api_football_id' })

    if (!error) synced++
  }

  return NextResponse.json({
    success: true,
    synced
  })
}

/**
 * Helper to get or create a team
 */
async function getOrCreateTeam(supabase, teamData, leagueId) {
  // Check if team exists
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('api_football_id', teamData.id)
    .single()

  if (existingTeam) {
    return existingTeam.id
  }

  // Create team
  const { data: newTeam, error } = await supabase
    .from('teams')
    .insert({
      api_football_id: teamData.id,
      name: teamData.name,
      logo_url: teamData.logo,
      league_id: leagueId
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating team:', error)
    return null
  }

  return newTeam.id
}

/**
 * Map API Football status to our status
 */
function mapFixtureStatus(status) {
  const statusMap = {
    'TBD': 'scheduled',
    'NS': 'scheduled',
    '1H': 'live',
    'HT': 'live',
    '2H': 'live',
    'ET': 'live',
    'P': 'live',
    'BT': 'live',
    'FT': 'finished',
    'AET': 'finished',
    'PEN': 'finished',
    'PST': 'postponed',
    'CANC': 'cancelled',
    'ABD': 'cancelled',
    'AWD': 'finished',
    'WO': 'finished',
    'LIVE': 'live'
  }
  return statusMap[status] || 'scheduled'
}

/**
 * POST handler - Manual actions (admin only)
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, matchId, homeScore, awayScore } = body

    const supabase = await createClient()

    // Verify admin (you should implement proper admin check)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    switch (action) {
      case 'settle': {
        if (!matchId || homeScore === undefined || awayScore === undefined) {
          return NextResponse.json(
            { error: 'matchId, homeScore, and awayScore required' },
            { status: 400 }
          )
        }
        const { settleMatch } = await import('@/app/predictions/actions')
        const result = await settleMatch(matchId, homeScore, awayScore)
        return NextResponse.json(result)
      }

      case 'refund': {
        if (!matchId) {
          return NextResponse.json(
            { error: 'matchId required' },
            { status: 400 }
          )
        }
        const { refundMatch } = await import('@/app/predictions/actions')
        const result = await refundMatch(matchId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: settle, refund' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('API Football POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
