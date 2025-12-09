'use client'

import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Database,
  Check,
  X,
  AlertCircle,
  Trophy,
  Users,
  Calendar,
  Key,
  ExternalLink,
  Loader2
} from 'lucide-react'

export default function PredictionsAdminPage() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [error, setError] = useState(null)

  // Fetch status on load
  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/football?action=status')
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError('Failed to fetch status')
    }
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    setError(null)

    try {
      const response = await fetch('/api/football?action=sync-all')
      const data = await response.json()

      if (data.success) {
        setSyncResult(data)
        // Refresh status after sync
        await fetchStatus()
      } else {
        setError(data.error || 'Sync failed')
      }
    } catch (err) {
      setError('Sync request failed: ' + err.message)
    }

    setSyncing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Predictions Admin</h1>
            <p className="text-zinc-400">Sync match data from API-Football</p>
          </div>

          {/* API Key Status */}
          <div className={`mb-6 rounded-xl border p-6 backdrop-blur-md ${
            status?.apiKeyConfigured
              ? 'bg-green-900/20 border-green-500/30'
              : 'bg-amber-900/20 border-amber-500/30'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                status?.apiKeyConfigured ? 'bg-green-500/20' : 'bg-amber-500/20'
              }`}>
                <Key className={`w-5 h-5 ${status?.apiKeyConfigured ? 'text-green-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${status?.apiKeyConfigured ? 'text-green-300' : 'text-amber-300'}`}>
                  {status?.apiKeyConfigured ? 'API Key Configured' : 'API Key Not Configured'}
                </h3>
                {!status?.apiKeyConfigured && (
                  <div className="mt-2 text-sm text-amber-200/80">
                    <p className="mb-2">To enable real match data:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Get a free API key from{' '}
                        <a
                          href="https://dashboard.api-football.com/register"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300 underline inline-flex items-center gap-1"
                        >
                          API-Football <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>Add to Vercel environment variables:</li>
                    </ol>
                    <code className="mt-2 block bg-black/30 rounded p-2 text-xs">
                      FOOTBALL_API_KEY=your_api_key_here
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Status */}
          {loading ? (
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 p-8 text-center">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-2" />
              <p className="text-zinc-400">Loading status...</p>
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Current Database Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-zinc-800/50">
                  <Trophy className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{status?.counts?.leagues || 0}</p>
                  <p className="text-sm text-zinc-400">Leagues</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-zinc-800/50">
                  <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{status?.counts?.teams || 0}</p>
                  <p className="text-sm text-zinc-400">Teams</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-zinc-800/50">
                  <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{status?.counts?.upcomingMatches || 0}</p>
                  <p className="text-sm text-zinc-400">Matches</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-900/20 border border-red-500/30 p-4">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Sync Result */}
          {syncResult && (
            <div className="mb-6 rounded-xl bg-green-900/20 border border-green-500/30 p-4">
              <div className="flex items-center gap-2 text-green-300 mb-3">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Sync Completed!</span>
              </div>
              <div className="text-sm text-green-200/80 space-y-1">
                <p>Leagues: {syncResult.results?.leagues?.created} created, {syncResult.results?.leagues?.existing} existing</p>
                <p>Teams synced: {syncResult.results?.teams}</p>
                <p>Matches synced: {syncResult.results?.matches}</p>
                {syncResult.results?.errors?.length > 0 && (
                  <div className="mt-2 p-2 bg-red-900/30 rounded text-red-300">
                    <p className="font-medium">Errors ({syncResult.results.errors.length}):</p>
                    <ul className="text-xs mt-1">
                      {syncResult.results.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing || !status?.apiKeyConfigured}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold text-lg text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {syncing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Syncing Matches...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sync Matches from API-Football
              </>
            )}
          </button>

          {!status?.apiKeyConfigured && (
            <p className="text-center text-zinc-500 text-sm mt-4">
              Configure your API key above to enable syncing
            </p>
          )}

          {/* Back Link */}
          <div className="mt-8 text-center">
            <a
              href="/en/predictions"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Back to Predictions
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
