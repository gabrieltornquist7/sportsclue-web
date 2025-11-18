'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { getPersonalizedQuestion, submitAnswer } from '@/app/game/actions'

export default function GameUI({ userId, locale, initialCoins, username }) {
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [result, setResult] = useState(null) // { correct, message, coinsEarned }
  const [submitting, setSubmitting] = useState(false)
  const [coins, setCoins] = useState(initialCoins)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { t } = useLocale()

  // Fetch a new question
  const fetchQuestion = async () => {
    setLoading(true)
    setError(null)
    setSelectedAnswer(null)
    setResult(null)

    const response = await getPersonalizedQuestion(locale, userId)

    if (response.error) {
      setError(response.error)
      setLoading(false)
      return
    }

    if (response.success) {
      setQuestion(response.question)
    }

    setLoading(false)
  }

  // Load initial question
  useEffect(() => {
    fetchQuestion()
  }, [])

  // Handle answer selection
  const handleAnswerClick = (index) => {
    if (result || submitting) return // Prevent changes after submission
    setSelectedAnswer(index)
  }

  // Submit the answer
  const handleSubmit = async () => {
    if (selectedAnswer === null || submitting) return

    setSubmitting(true)

    const response = await submitAnswer(question.id, selectedAnswer, userId)

    if (response.error) {
      setError(response.error)
      setSubmitting(false)
      return
    }

    if (response.success) {
      setResult({
        correct: response.correct,
        message: response.message,
        coinsEarned: response.coinsEarned
      })
      
      // Update coins in UI
      if (response.correct) {
        setCoins(prev => prev + response.coinsEarned)
      }
    }

    setSubmitting(false)
  }

  // Load next question
  const handleNextQuestion = () => {
    fetchQuestion()
  }

  // Header component (always visible)
  const Header = () => (
    <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <a 
            href={`/${locale}/dashboard`}
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            ← {t('play.backToDashboard')}
          </a>
          <h1 className="text-xl font-semibold text-zinc-50">
            {t('play.title')}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2">
            <span className="text-2xl">🪙</span>
            <span className="font-semibold text-zinc-50">{coins}</span>
          </div>
          <div className="text-sm text-zinc-400">
            {username}
          </div>
        </div>
      </div>
    </div>
  )

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500 mx-auto"></div>
            <p className="text-zinc-400">{t('play.loadingQuestion')}</p>
          </div>
        </div>
      </>
    )
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
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
      </>
    )
  }

  // Main game UI
  return (
    <>
      <Header />
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* Question Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-sm">
          {/* Sport Category Badge */}
          <div className="mb-6 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-4 py-1.5 text-sm font-medium text-blue-400 border border-blue-600/30">
              <span className="text-lg">⚽</span>
              {question?.sportCategory}
            </span>
            {question?.difficulty && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                question.difficulty === 'hard' 
                  ? 'bg-red-900/30 text-red-400 border border-red-800/50' 
                  : question.difficulty === 'medium'
                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                  : 'bg-green-900/30 text-green-400 border border-green-800/50'
              }`}>
                {question.difficulty}
              </span>
            )}
          </div>

          {/* Question Text */}
          <h2 className="mb-8 text-2xl font-semibold leading-relaxed text-zinc-50">
            {question?.text}
          </h2>

          {/* Answer Options */}
          <div className="mb-8 space-y-3">
            {question?.options?.map((option, index) => {
              const isSelected = selectedAnswer === index
              const showResult = result !== null
              const isCorrectAnswer = showResult && result.correct && isSelected
              const isWrongAnswer = showResult && !result.correct && isSelected

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  disabled={showResult || submitting}
                  className={`w-full rounded-xl border-2 p-4 text-left text-lg font-medium transition-all ${
                    isCorrectAnswer
                      ? 'border-green-600 bg-green-600/20 text-green-300'
                      : isWrongAnswer
                      ? 'border-red-600 bg-red-600/20 text-red-300'
                      : isSelected
                      ? 'border-blue-600 bg-blue-600/20 text-blue-300'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
                  } ${showResult || submitting ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                >
                  <span className="mr-3 inline-block font-bold text-zinc-500">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              )
            })}
          </div>

          {/* Result Message */}
          {result && (
            <div className={`mb-6 rounded-xl border-2 p-4 text-center ${
              result.correct
                ? 'border-green-600/50 bg-green-900/20 text-green-300'
                : 'border-red-600/50 bg-red-900/20 text-red-300'
            }`}>
              <div className="mb-2 text-4xl">{result.correct ? '🎉' : '❌'}</div>
              <p className="text-lg font-semibold">{result.message}</p>
              {result.correct && (
                <p className="mt-2 text-sm">
                  {t('play.newBalance')}: {coins} {t('common.coins').toLowerCase()}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {!result ? (
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null || submitting}
                className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t('play.submitting') : t('play.submitAnswer')}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-700"
              >
                {t('play.nextQuestion')} →
              </button>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          {t('play.tip')}
        </div>
      </div>
    </div>
    </>
  )
}

