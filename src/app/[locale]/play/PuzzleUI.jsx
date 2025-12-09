'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getPersonalizedPuzzle, submitPuzzleGuess } from '@/app/game/actions'
import {
  Brain,
  Lightbulb,
  Trophy,
  Share2,
  ArrowRight,
  XCircle,
  CheckCircle,
  Coins,
  Key,
  Package,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'

export default function PuzzleUI({ userId, locale, username }) {
  const { coins, updateCurrency } = useCurrency()
  const [puzzle, setPuzzle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revealedClues, setRevealedClues] = useState(1) // Start with 1 clue revealed
  const [clueStates, setClueStates] = useState([]) // 'gray', 'red', 'green'
  const [answerStates, setAnswerStates] = useState({}) // { answer: 'disabled' | 'wrong' | 'correct' }
  const [result, setResult] = useState(null) // { correct, egoMessage, coinsEarned, showShareButton }
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const router = useRouter()
  const { t } = useLocale()

  // Fetch a new puzzle
  const fetchPuzzle = async () => {
    setLoading(true)
    setError(null)
    setRevealedClues(1)
    setClueStates([])
    setAnswerStates({})
    setResult(null)
    setGameOver(false)

    const response = await getPersonalizedPuzzle(userId, locale)

    if (response.error) {
      setError(response.error)
      setLoading(false)
      return
    }

    if (response.success) {
      setPuzzle(response.puzzle)
      // Initialize clue states - all gray
      setClueStates(new Array(response.puzzle.totalClues).fill('gray'))
      // Initialize answer states - all enabled
      const initialStates = {}
      response.puzzle.answerOptions.forEach(answer => {
        initialStates[answer] = 'enabled'
      })
      setAnswerStates(initialStates)
    }

    setLoading(false)
  }

  // Load initial puzzle
  useEffect(() => {
    fetchPuzzle()
  }, [])

  // Handle answer button click
  const handleAnswerClick = async (selectedAnswer) => {
    if (submitting || gameOver || answerStates[selectedAnswer] !== 'enabled') return

    setSubmitting(true)

    const response = await submitPuzzleGuess(puzzle.id, selectedAnswer, revealedClues, userId)

    if (response.error) {
      setError(response.error)
      setSubmitting(false)
      return
    }

    if (response.success) {
      if (response.correct) {
        // CORRECT ANSWER!
        // Turn current clue circle green
        const newClueStates = [...clueStates]
        newClueStates[revealedClues - 1] = 'green'
        setClueStates(newClueStates)

        // Mark correct answer as green, disable all others
        const newAnswerStates = { ...answerStates }
        Object.keys(newAnswerStates).forEach(answer => {
          if (answer === selectedAnswer) {
            newAnswerStates[answer] = 'correct'
          } else {
            newAnswerStates[answer] = 'disabled'
          }
        })
        setAnswerStates(newAnswerStates)

        // Update global currency context with new values from server
        if (response.newCoins !== undefined || response.newKeys !== undefined) {
          updateCurrency(response.newCoins, response.newKeys)
        }

        // Set result with ego message and drop notifications
        setResult({
          correct: true,
          egoMessage: response.egoMessage,
          coinsEarned: response.coinsEarned,
          showShareButton: response.showShareButton,
          correctAnswer: response.correctAnswer,
          keyDropped: response.keyDropped, // From server-side buff calculation
          legendaryBoxDropped: response.legendaryBoxDropped // From server-side drop calculation
        })

        setGameOver(true)
      } else {
        // WRONG ANSWER
        // Turn current clue circle red
        const newClueStates = [...clueStates]
        newClueStates[revealedClues - 1] = 'red'
        setClueStates(newClueStates)

        // Mark wrong answer as disabled (dark gray)
        const newAnswerStates = { ...answerStates }
        newAnswerStates[selectedAnswer] = 'wrong'
        setAnswerStates(newAnswerStates)

        // Reveal next clue if available
        if (revealedClues < puzzle.totalClues) {
          setRevealedClues(prev => prev + 1)
        }
      }
    }

    setSubmitting(false)
  }

  // Load next puzzle
  const handleNextPuzzle = () => {
    fetchPuzzle()
  }

  // Share functionality
  const handleShare = () => {
    const text = `I solved a SportsClue puzzle in just 1 clue! Can you beat that?`
    const url = window.location.origin

    if (navigator.share) {
      navigator.share({
        title: 'SportsClue Challenge',
        text: text,
        url: url
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${text} ${url}`)
      alert('Link copied to clipboard!')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                <Brain className="w-10 h-10 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-lg text-zinc-400">{t('play.loadingQuestion')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-red-400">{t('common.error')}</h2>
            <p className="mb-8 text-zinc-400">{error}</p>
            <button
              onClick={() => router.push(`/${locale}/settings`)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all"
            >
              {t('play.goToSettings')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main puzzle UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 sm:px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {t('play.title')}
            </h1>
            <p className="text-zinc-400">Guess the answer with as few clues as possible</p>
          </div>

          {/* Puzzle Card */}
          <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-2xl">

            {/* Card Header */}
            <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-800/30">
              <div className="flex items-center justify-between">
                {/* Sport Category */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-semibold text-blue-300">{puzzle?.sportCategory}</span>
                </div>

                {/* Clue Progress */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">Clue</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/50">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">{revealedClues}/{puzzle?.totalClues}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 sm:p-8">

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
                {puzzle?.title}
              </h2>

              {/* Clue Tracker Circles */}
              <div className="mb-8 flex justify-center gap-3">
                {clueStates.map((state, index) => (
                  <div
                    key={index}
                    className={`h-4 w-4 rounded-full transition-all duration-300 ${
                      state === 'green'
                        ? 'bg-emerald-500 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/30'
                        : state === 'red'
                        ? 'bg-red-500 ring-2 ring-red-400/50 shadow-lg shadow-red-500/30'
                        : index < revealedClues
                        ? 'bg-blue-500/60 ring-2 ring-blue-400/30'
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>

              {/* Revealed Clues */}
              <div className="mb-8 space-y-3">
                {puzzle?.clues.slice(0, revealedClues).map((clue, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4 backdrop-blur-sm transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-400">{index + 1}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed pt-1">{clue}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Answer Grid (2x3) */}
              {puzzle?.answerOptions && (
                <div className="mb-8 grid grid-cols-2 gap-3">
                  {puzzle.answerOptions.map((answer, index) => {
                    const state = answerStates[answer] || 'enabled'
                    const isEnabled = state === 'enabled'
                    const isWrong = state === 'wrong'
                    const isCorrect = state === 'correct'

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerClick(answer)}
                        disabled={!isEnabled || submitting || gameOver}
                        className={`group rounded-xl border-2 p-4 text-center font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-lg shadow-emerald-500/20'
                            : isWrong
                            ? 'border-zinc-600 bg-zinc-800/60 text-zinc-500 cursor-not-allowed'
                            : isEnabled
                            ? 'border-zinc-700/50 bg-zinc-800/40 text-zinc-200 hover:border-blue-500 hover:bg-blue-500/20 hover:text-blue-200 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer'
                            : 'border-zinc-600 bg-zinc-800/60 text-zinc-500 cursor-not-allowed'
                        } ${submitting || gameOver ? 'cursor-not-allowed' : ''}`}
                      >
                        {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        {isWrong && <XCircle className="w-5 h-5 text-zinc-500" />}
                        <span className="text-lg">{answer}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Result Display - Only shown on win */}
              {result && result.correct && (
                <div className="mb-6 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 p-6 text-center backdrop-blur-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/30 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="mb-2 text-2xl font-bold text-emerald-300">
                    {result.egoMessage}
                  </p>
                  {result.coinsEarned > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-lg text-emerald-400">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>+{result.coinsEarned} coins earned!</span>
                    </div>
                  ) : (
                    <p className="text-lg text-emerald-400">
                      Balance: {coins} coins
                    </p>
                  )}

                  {/* Premium Key Drop Notification */}
                  {result.keyDropped && (
                    <div className="mt-6 rounded-xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/40 p-5 shadow-lg shadow-amber-500/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center">
                          <Key className="w-6 h-6 text-amber-400 animate-bounce" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-amber-200 mb-1">
                        Legendary Key Found!
                      </p>
                      <p className="text-sm text-amber-300/90">
                        Use it to unlock Legendary Boxes in the store
                      </p>
                    </div>
                  )}

                  {/* Premium Legendary Box Drop Notification */}
                  {result.legendaryBoxDropped && (
                    <div className="mt-4 rounded-xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/40 p-5 shadow-lg shadow-amber-500/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center">
                          <Package className="w-6 h-6 text-amber-400 animate-bounce" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-amber-200 mb-1">
                        Legendary Box Dropped!
                      </p>
                      <p className="text-sm text-amber-300/90">
                        Open in your inventory for a chance at Legendary and Mythic cards
                      </p>
                    </div>
                  )}

                  {result.showShareButton && (
                    <button
                      onClick={handleShare}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                    >
                      <Share2 className="w-5 h-5" />
                      Brag About It
                    </button>
                  )}
                </div>
              )}

              {/* Next Puzzle Button (only shown when game is over) */}
              {gameOver && (
                <button
                  onClick={handleNextPuzzle}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 font-semibold text-lg text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {t('play.nextQuestion')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500">
            <Lightbulb className="w-4 h-4" />
            <p className="text-sm">{t('play.tip')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
