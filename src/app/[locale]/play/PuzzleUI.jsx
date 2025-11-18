'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getPersonalizedPuzzle, submitPuzzleGuess } from '@/app/game/actions'
import { addLegendaryBoxDrop } from '@/app/store/actions'

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
        
        // AIRTIGHT: Server-side drop calculation with buffs
        const dropResult = await addLegendaryBoxDrop(userId)
        const dropMessage = dropResult.success && dropResult.dropped ? dropResult.message : null
        
        // Set result with ego message
        setResult({
          correct: true,
          egoMessage: response.egoMessage,
          coinsEarned: response.coinsEarned,
          showShareButton: response.showShareButton,
          correctAnswer: response.correctAnswer,
          legendaryDrop: dropMessage
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
        
        // Count how many wrong answers have been clicked
        const wrongAnswersCount = Object.values(newAnswerStates).filter(state => state === 'wrong').length
        
        // Reveal next clue if available
        if (revealedClues < puzzle.totalClues) {
          setRevealedClues(prev => prev + 1)
        }
        
        // If all wrong answers are clicked (5 distractors), the correct answer is the only one left
        // No fail state - user will eventually click the correct answer and win
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
    const text = `🧠 I solved a SportsClue puzzle in just 1 clue! Can you beat that? 🏆`
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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500 mx-auto"></div>
          <p className="text-zinc-400">{t('play.loadingQuestion')}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-red-400">{t('common.error')}</h2>
          <p className="mb-6 text-zinc-400">{error}</p>
          <button
            onClick={() => router.push(`/${locale}/settings`)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('play.goToSettings')}
          </button>
        </div>
      </div>
    )
  }

  // Main puzzle UI
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          {/* Puzzle Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-sm">
            
            {/* Sport Category and Title */}
            <div className="mb-6 text-center">
              <span className="inline-block rounded-full bg-blue-600/20 px-4 py-1.5 text-sm font-medium text-blue-400 border border-blue-600/30 mb-4">
                {puzzle?.sportCategory}
              </span>
              <h2 className="text-3xl font-bold text-zinc-50">
                {puzzle?.title}
              </h2>
            </div>

            {/* Clue Tracker Circles */}
            <div className="mb-8 flex justify-center gap-3">
              {clueStates.map((state, index) => (
                <div
                  key={index}
                  className={`h-4 w-4 rounded-full transition-all ${
                    state === 'green'
                      ? 'bg-green-500 ring-2 ring-green-400/50'
                      : state === 'red'
                      ? 'bg-red-500 ring-2 ring-red-400/50'
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
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-zinc-300"
                >
                  <span className="mr-2 font-bold text-blue-400">Clue {index + 1}:</span>
                  {clue}
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
                      className={`rounded-xl border-2 p-4 text-center text-lg font-semibold transition-all ${
                        isCorrect
                          ? 'border-green-500 bg-green-500/20 text-green-300'
                          : isWrong
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : isEnabled
                          ? 'border-zinc-700 bg-zinc-800/50 text-zinc-200 hover:border-blue-500 hover:bg-blue-600/20 hover:text-blue-300 cursor-pointer'
                          : 'border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      } ${submitting || gameOver ? 'cursor-not-allowed' : ''}`}
                    >
                      {answer}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Result Display - Only shown on win (user always wins) */}
            {result && result.correct && (
              <div className="mb-6 rounded-xl border-2 border-green-600/50 bg-green-900/20 p-6 text-center">
                <div className="mb-3 text-5xl">🎉</div>
                <p className="mb-2 text-2xl font-bold text-green-300">
                  {result.egoMessage}
                </p>
                {result.coinsEarned > 0 ? (
                  <p className="text-lg text-green-400">
                    +{result.coinsEarned} coins! New balance: {coins}
                  </p>
                ) : (
                  <p className="text-lg text-green-400">
                    New balance: {coins} coins
                  </p>
                )}
                {result.legendaryDrop && (
                  <p className="mt-2 text-lg font-bold text-yellow-400">
                    {result.legendaryDrop}
                  </p>
                )}
                {result.showShareButton && (
                  <button
                    onClick={handleShare}
                    className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white transition-all hover:from-purple-700 hover:to-pink-700 hover:scale-105"
                  >
                    🎯 Brag About It
                  </button>
                )}
              </div>
            )}

            {/* Next Puzzle Button (only shown when game is over) */}
            {gameOver && (
              <button
                onClick={handleNextPuzzle}
                className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-700"
              >
                {t('play.nextQuestion')} →
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="mt-6 text-center text-sm text-zinc-500">
            💡 {t('play.tip')}
        </div>
      </div>
    </div>
  )
}
