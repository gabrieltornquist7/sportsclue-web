import { NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Cron endpoint for automated prediction market updates
 * This should be called periodically by Vercel Cron or external cron service
 *
 * Actions:
 * - sync-fixtures: Sync upcoming fixtures (run daily)
 * - sync-live: Update live match scores (run every 2-5 minutes during match days)
 * - settle: Settle finished matches (run after live sync)
 */
export async function GET(request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'all'

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const results = {}

    // Sync fixtures (daily)
    if (action === 'all' || action === 'sync-fixtures') {
      try {
        const fixturesRes = await fetch(`${baseUrl}/api/football?action=sync-fixtures`)
        results.fixtures = await fixturesRes.json()
      } catch (error) {
        results.fixtures = { error: error.message }
      }
    }

    // Sync live scores (every few minutes)
    if (action === 'all' || action === 'sync-live') {
      try {
        const liveRes = await fetch(`${baseUrl}/api/football?action=sync-live`)
        results.live = await liveRes.json()
      } catch (error) {
        results.live = { error: error.message }
      }
    }

    // Settle finished matches
    if (action === 'all' || action === 'settle') {
      try {
        const settleRes = await fetch(`${baseUrl}/api/football?action=sync-results`)
        results.settle = await settleRes.json()
      } catch (error) {
        results.settle = { error: error.message }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action,
      results
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', message: error.message },
      { status: 500 }
    )
  }
}
