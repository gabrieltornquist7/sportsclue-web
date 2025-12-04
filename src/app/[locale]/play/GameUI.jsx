'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/contexts/LocaleContext'
import { getPersonalizedQuestion, submitAnswer } from '@/app/game/actions'
import { ArrowLeft, Coins, Trophy, Zap, CheckCircle, XCircle, ArrowRight, Target, Brain, Lightbulb, Timer, Star, Sparkles } from 'lucide-react'

export default function GameUI({ userId, locale, initialCoins, username }) {
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [coins, setCoins] = useState(initialCoins)
  const [error, setError] = useState(null)
  const [streak, setStreak] = useState(0)
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
    if (result || submitting) return
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

      if (response.correct) {
        setCoins(prev => prev + response.coinsEarned)
        setStreak(prev => prev + 1)
      } else {
        setStreak(0)
      }
    }

    setSubmitting(false)
  }

  // Load next question
  const handleNextQuestion = () => {
    fetchQuestion()
  }

  // Difficulty configuration
  const difficultyConfig = {
    easy: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', icon: Star },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', icon: Zap },
    hard: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', icon: Target }
  }

  // Sport icons mapping
  const sportIcons = {
    'Football': '⚽',
    'Basketball': '🏀',
    'Tennis': '🎾',
    'Cricket': '🏏',
    'Baseball': '⚾',
    'Hockey': '🏒',
    'Golf': '⛳',
    'Rugby': '🏉',
    'Boxing': '🥊',
    'MMA': '🥋',
    'Formula 1': '🏎️',
    'Olympics': '🏅',
    'default': '🏆'
  }

  const getSportIcon = (category) => {
    return sportIcons[category] || sportIcons.default
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

  const difficulty = question?.difficulty || 'medium'
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.medium
  const DiffIcon = diffConfig.icon

  // Main game UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-zinc-800/50 bg-zinc-900/60 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back button */}
            <a
              href={`/${locale}/dashboard`}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">{t('play.backToDashboard')}</span>
            </a>

            {/* Center: Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">{t('play.title')}</h1>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-3">
              {/* Streak */}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-300">{streak}</span>
                </div>
              )}

              {/* Coins */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/60 border border-zinc-700/50">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">{coins}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 sm:px-6">
        <div className="max-w-3xl mx-auto">

          {/* Question Card */}
          <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-2xl">

            {/* Card Header */}
            <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-800/30">
              <div className="flex items-center justify-between">
                {/* Sport Category */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xl">
                    {getSportIcon(question?.sportCategory)}
                  </div>
                  <span className="font-semibold text-blue-300">{question?.sportCategory}</span>
                </div>

                {/* Difficulty Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${diffConfig.bg} border ${diffConfig.border}`}>
                  <DiffIcon className={`w-4 h-4 ${diffConfig.color}`} />
                  <span className={`text-sm font-semibold uppercase tracking-wide ${diffConfig.color}`}>
                    {difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-6 sm:p-8">
              {/* Question Text */}
              <h2 className="text-xl sm:text-2xl font-semibold text-white leading-relaxed mb-8">
                {question?.text}
              </h2>

              {/* Answer Options */}
              <div className="space-y-3 mb-8">
                {question?.options?.map((option, index) => {
                  const isSelected = selectedAnswer === index
                  const showResult = result !== null
                  const isCorrectAnswer = showResult && result.correct && isSelected
                  const isWrongAnswer = showResult && !result.correct && isSelected
                  const letter = String.fromCharCode(65 + index)

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerClick(index)}
                      disabled={showResult || submitting}
                      className={`group w-full rounded-xl border-2 p-4 text-left transition-all duration-200 flex items-center gap-4 ${
                        isCorrectAnswer
                          ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20'
                          : isWrongAnswer
                          ? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/20'
                          : isSelected
                          ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                          : 'border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600 hover:bg-zinc-800/60'
                      } ${showResult || submitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {/* Letter Badge */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${
                        isCorrectAnswer
                          ? 'bg-emerald-500 text-white'
                          : isWrongAnswer
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-700/50 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                      }`}>
                        {letter}
                      </div>

                      {/* Option Text */}
                      <span className={`text-lg font-medium flex-1 ${
                        isCorrectAnswer
                          ? 'text-emerald-200'
                          : isWrongAnswer
                          ? 'text-red-200'
                          : isSelected
                          ? 'text-blue-200'
                          : 'text-zinc-300'
                      }`}>
                        {option}
                      </span>

                      {/* Result Icon */}
                      {isCorrectAnswer && (
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      )}
                      {isWrongAnswer && (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Result Message */}
              {result && (
                <div className={`mb-8 rounded-2xl border-2 p-6 text-center backdrop-blur-sm ${
                  result.correct
                    ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-900/30 to-emerald-800/20'
                    : 'border-red-500/50 bg-gradient-to-br from-red-900/30 to-red-800/20'
                }`}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    result.correct ? 'bg-emerald-500/30' : 'bg-red-500/30'
                  }`}>
                    {result.correct ? (
                      <Trophy className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400" />
                    )}
                  </div>
                  <p className={`text-xl font-bold mb-2 ${
                    result.correct ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {result.correct ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-zinc-400">{result.message}</p>
                  {result.correct && result.coinsEarned > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-300 font-semibold">+{result.coinsEarned} coins earned!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {!result ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null || submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 font-semibold text-lg text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('play.submitting')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {t('play.submitAnswer')}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 font-semibold text-lg text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
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

          {/* Streak Indicator */}
          {streak >= 3 && (
            <div className="mt-6 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-6 h-6 text-amber-400" />
                <p className="text-amber-300 font-semibold">
                  You're on fire! {streak} correct answers in a row!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
