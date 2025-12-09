import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Seed endpoint to populate initial data for the prediction market
 * This creates leagues, teams, and sample matches for testing
 */
export async function POST(request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const results = {
      sports: 0,
      leagues: 0,
      teams: 0,
      matches: 0
    }

    // 1. Create Football sport if not exists
    const { data: existingSport } = await supabase
      .from('sports')
      .select('id')
      .eq('name', 'Football')
      .single()

    let sportId = existingSport?.id

    if (!sportId) {
      const { data: newSport, error } = await supabase
        .from('sports')
        .insert({
          name: 'Football',
          icon: 'football',
          is_active: true
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating sport:', error)
      } else {
        sportId = newSport.id
        results.sports = 1
      }
    }

    // 2. Create Leagues
    const leaguesData = [
      { name: 'Premier League', country: 'England', api_football_id: 39, logo_url: 'https://media.api-sports.io/football/leagues/39.png' },
      { name: 'La Liga', country: 'Spain', api_football_id: 140, logo_url: 'https://media.api-sports.io/football/leagues/140.png' },
      { name: 'Bundesliga', country: 'Germany', api_football_id: 78, logo_url: 'https://media.api-sports.io/football/leagues/78.png' },
      { name: 'Serie A', country: 'Italy', api_football_id: 135, logo_url: 'https://media.api-sports.io/football/leagues/135.png' },
      { name: 'Ligue 1', country: 'France', api_football_id: 61, logo_url: 'https://media.api-sports.io/football/leagues/61.png' },
      { name: 'Champions League', country: 'Europe', api_football_id: 2, logo_url: 'https://media.api-sports.io/football/leagues/2.png' }
    ]

    const leagueIds = {}

    for (const league of leaguesData) {
      const { data: existing } = await supabase
        .from('leagues')
        .select('id')
        .eq('name', league.name)
        .single()

      if (existing) {
        leagueIds[league.name] = existing.id
      } else {
        const { data: newLeague, error } = await supabase
          .from('leagues')
          .insert({
            ...league,
            sport_id: sportId,
            is_active: true
          })
          .select('id')
          .single()

        if (!error && newLeague) {
          leagueIds[league.name] = newLeague.id
          results.leagues++
        }
      }
    }

    // 3. Create Teams (Premier League teams as sample)
    const teamsData = [
      { name: 'Arsenal', short_name: 'ARS', api_football_id: 42, logo_url: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Chelsea', short_name: 'CHE', api_football_id: 49, logo_url: 'https://media.api-sports.io/football/teams/49.png' },
      { name: 'Liverpool', short_name: 'LIV', api_football_id: 40, logo_url: 'https://media.api-sports.io/football/teams/40.png' },
      { name: 'Manchester City', short_name: 'MCI', api_football_id: 50, logo_url: 'https://media.api-sports.io/football/teams/50.png' },
      { name: 'Manchester United', short_name: 'MUN', api_football_id: 33, logo_url: 'https://media.api-sports.io/football/teams/33.png' },
      { name: 'Tottenham', short_name: 'TOT', api_football_id: 47, logo_url: 'https://media.api-sports.io/football/teams/47.png' },
      { name: 'Newcastle United', short_name: 'NEW', api_football_id: 34, logo_url: 'https://media.api-sports.io/football/teams/34.png' },
      { name: 'Aston Villa', short_name: 'AVL', api_football_id: 66, logo_url: 'https://media.api-sports.io/football/teams/66.png' },
      { name: 'Brighton', short_name: 'BHA', api_football_id: 51, logo_url: 'https://media.api-sports.io/football/teams/51.png' },
      { name: 'West Ham', short_name: 'WHU', api_football_id: 48, logo_url: 'https://media.api-sports.io/football/teams/48.png' },
      // La Liga teams
      { name: 'Real Madrid', short_name: 'RMA', api_football_id: 541, logo_url: 'https://media.api-sports.io/football/teams/541.png' },
      { name: 'Barcelona', short_name: 'BAR', api_football_id: 529, logo_url: 'https://media.api-sports.io/football/teams/529.png' },
      { name: 'Atletico Madrid', short_name: 'ATM', api_football_id: 530, logo_url: 'https://media.api-sports.io/football/teams/530.png' },
      // Bundesliga teams
      { name: 'Bayern Munich', short_name: 'BAY', api_football_id: 157, logo_url: 'https://media.api-sports.io/football/teams/157.png' },
      { name: 'Borussia Dortmund', short_name: 'BVB', api_football_id: 165, logo_url: 'https://media.api-sports.io/football/teams/165.png' },
      // Serie A teams
      { name: 'Inter Milan', short_name: 'INT', api_football_id: 505, logo_url: 'https://media.api-sports.io/football/teams/505.png' },
      { name: 'AC Milan', short_name: 'MIL', api_football_id: 489, logo_url: 'https://media.api-sports.io/football/teams/489.png' },
      { name: 'Juventus', short_name: 'JUV', api_football_id: 496, logo_url: 'https://media.api-sports.io/football/teams/496.png' },
      // Ligue 1 teams
      { name: 'PSG', short_name: 'PSG', api_football_id: 85, logo_url: 'https://media.api-sports.io/football/teams/85.png' },
      { name: 'Marseille', short_name: 'OM', api_football_id: 81, logo_url: 'https://media.api-sports.io/football/teams/81.png' }
    ]

    const teamIds = {}
    const premierLeagueId = leagueIds['Premier League']

    for (const team of teamsData) {
      const { data: existing } = await supabase
        .from('teams')
        .select('id')
        .eq('name', team.name)
        .single()

      if (existing) {
        teamIds[team.name] = existing.id
      } else {
        // Determine league based on team
        let leagueId = premierLeagueId
        if (['Real Madrid', 'Barcelona', 'Atletico Madrid'].includes(team.name)) {
          leagueId = leagueIds['La Liga']
        } else if (['Bayern Munich', 'Borussia Dortmund'].includes(team.name)) {
          leagueId = leagueIds['Bundesliga']
        } else if (['Inter Milan', 'AC Milan', 'Juventus'].includes(team.name)) {
          leagueId = leagueIds['Serie A']
        } else if (['PSG', 'Marseille'].includes(team.name)) {
          leagueId = leagueIds['Ligue 1']
        }

        const { data: newTeam, error } = await supabase
          .from('teams')
          .insert({
            ...team,
            league_id: leagueId,
            country: 'Various'
          })
          .select('id')
          .single()

        if (!error && newTeam) {
          teamIds[team.name] = newTeam.id
          results.teams++
        }
      }
    }

    // 4. Create Sample Matches (upcoming)
    const now = new Date()
    const matchesData = [
      // Today
      {
        home_team: 'Arsenal',
        away_team: 'Chelsea',
        league: 'Premier League',
        date: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        venue: 'Emirates Stadium'
      },
      {
        home_team: 'Liverpool',
        away_team: 'Manchester City',
        league: 'Premier League',
        date: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        venue: 'Anfield'
      },
      // Tomorrow
      {
        home_team: 'Real Madrid',
        away_team: 'Barcelona',
        league: 'La Liga',
        date: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        venue: 'Santiago Bernabeu'
      },
      {
        home_team: 'Bayern Munich',
        away_team: 'Borussia Dortmund',
        league: 'Bundesliga',
        date: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        venue: 'Allianz Arena'
      },
      // Day after tomorrow
      {
        home_team: 'Inter Milan',
        away_team: 'AC Milan',
        league: 'Serie A',
        date: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        venue: 'San Siro'
      },
      {
        home_team: 'PSG',
        away_team: 'Marseille',
        league: 'Ligue 1',
        date: new Date(now.getTime() + 50 * 60 * 60 * 1000),
        venue: 'Parc des Princes'
      },
      // More Premier League
      {
        home_team: 'Manchester United',
        away_team: 'Tottenham',
        league: 'Premier League',
        date: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        venue: 'Old Trafford'
      },
      {
        home_team: 'Newcastle United',
        away_team: 'Aston Villa',
        league: 'Premier League',
        date: new Date(now.getTime() + 74 * 60 * 60 * 1000),
        venue: "St. James' Park"
      },
      {
        home_team: 'Brighton',
        away_team: 'West Ham',
        league: 'Premier League',
        date: new Date(now.getTime() + 96 * 60 * 60 * 1000),
        venue: 'Amex Stadium'
      },
      // Champions League
      {
        home_team: 'Manchester City',
        away_team: 'Real Madrid',
        league: 'Champions League',
        date: new Date(now.getTime() + 120 * 60 * 60 * 1000),
        venue: 'Etihad Stadium'
      }
    ]

    for (const match of matchesData) {
      const homeTeamId = teamIds[match.home_team]
      const awayTeamId = teamIds[match.away_team]
      const leagueId = leagueIds[match.league]

      if (!homeTeamId || !awayTeamId || !leagueId) {
        console.log(`Skipping match: missing IDs for ${match.home_team} vs ${match.away_team}`)
        continue
      }

      // Check if match already exists (same teams, same day)
      const matchDate = match.date.toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .eq('home_team_id', homeTeamId)
        .eq('away_team_id', awayTeamId)
        .gte('match_date', `${matchDate}T00:00:00`)
        .lt('match_date', `${matchDate}T23:59:59`)
        .single()

      if (!existing) {
        // Add some initial pool activity for realistic odds
        const initialPools = generateInitialPools()

        const { error } = await supabase
          .from('matches')
          .insert({
            league_id: leagueId,
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            match_date: match.date.toISOString(),
            venue: match.venue,
            status: 'scheduled',
            total_pool: initialPools.total,
            home_pool: initialPools.home,
            draw_pool: initialPools.draw,
            away_pool: initialPools.away,
            prediction_count: initialPools.count,
            is_settled: false
          })

        if (!error) {
          results.matches++
        } else {
          console.error('Error creating match:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      results
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed data', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate random initial pool distribution for realistic odds
 */
function generateInitialPools() {
  const count = Math.floor(Math.random() * 50) + 10 // 10-60 predictions
  const avgStake = Math.floor(Math.random() * 200) + 50 // 50-250 average stake
  const total = count * avgStake

  // Random distribution favoring home slightly
  const homePercent = (Math.random() * 30 + 35) / 100 // 35-65%
  const drawPercent = (Math.random() * 20 + 15) / 100 // 15-35%
  const awayPercent = 1 - homePercent - drawPercent

  return {
    total,
    home: Math.floor(total * homePercent),
    draw: Math.floor(total * drawPercent),
    away: Math.floor(total * awayPercent),
    count
  }
}
