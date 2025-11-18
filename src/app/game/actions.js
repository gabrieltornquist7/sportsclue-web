'use server'

import { createClient } from '@/lib/supabase/server'
import { getSportName } from '@/lib/sports'

/**
 * Fetches a random puzzle personalized to the user's favorite sports
 * Includes 5 distractors from the same sport_category
 * @param {string} userId - User's ID to fetch their favorite sports
 * @param {string} locale - User's current locale (e.g., 'en', 'es', 'ar')
 * @returns {Object} Puzzle data with clues array, answer, and distractors
 */
export async function getPersonalizedPuzzle(userId, locale = 'en') {
  try {
    const supabase = await createClient()

    // Get user's favorite sports (stored as database IDs)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('favorite_sports')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.favorite_sports || profile.favorite_sports.length === 0) {
      return { error: 'No favorite sports found. Please update your profile.' }
    }

    // Fetch a random puzzle matching user's favorite sports
    // Include distractors column from database
    const { data: puzzles, error: puzzlesError } = await supabase
      .from('puzzles')
      .select('id, title, sport_category, clues, answer, distractors, difficulty')
      .in('sport_category', profile.favorite_sports)

    if (puzzlesError) {
      console.error('Error fetching puzzles:', puzzlesError)
      return { error: 'Failed to fetch puzzles' }
    }

    if (!puzzles || puzzles.length === 0) {
      return { 
        error: 'No puzzles available for your favorite sports. Please check back later.'
      }
    }

    // Select a random puzzle
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)]

    // Get distractors from the puzzle's distractors JSONB column
    let distractors = []
    if (randomPuzzle.distractors) {
      if (Array.isArray(randomPuzzle.distractors)) {
        distractors = randomPuzzle.distractors
      }
    }

    // Combine correct answer with distractors
    const answerOptions = [randomPuzzle.answer, ...distractors]

    // Shuffle the answer options
    const shuffledOptions = answerOptions.sort(() => Math.random() - 0.5)

    // Parse title (JSONB object with locale keys)
    let title = 'Who am I?'
    if (randomPuzzle.title) {
      if (typeof randomPuzzle.title === 'string') {
        title = randomPuzzle.title
      } else if (typeof randomPuzzle.title === 'object') {
        // Try to get locale-specific title, fallback to 'en' or first available
        title = randomPuzzle.title[locale] || randomPuzzle.title['en'] || Object.values(randomPuzzle.title)[0] || 'Who am I?'
      }
    }

    // Parse clues (JSONB object with locale keys, each containing an array)
    let clues = []
    if (randomPuzzle.clues) {
      if (Array.isArray(randomPuzzle.clues)) {
        // If clues is already an array (legacy format)
        clues = randomPuzzle.clues
      } else if (typeof randomPuzzle.clues === 'object') {
        // Get clues for the current locale
        const localeClues = randomPuzzle.clues[locale] || randomPuzzle.clues['en']
        if (Array.isArray(localeClues)) {
          clues = localeClues
        }
      }
    }

    if (clues.length === 0) {
      console.error('Puzzle has no clues:', randomPuzzle.id, 'Locale:', locale)
      return { error: 'Puzzle has invalid format or no clues for your language.' }
    }

    return {
      success: true,
      puzzle: {
        id: randomPuzzle.id,
        title: title,
        sportCategory: getSportName(randomPuzzle.sport_category),
        clues: clues,
        totalClues: clues.length,
        difficulty: randomPuzzle.difficulty,
        answerOptions: shuffledOptions, // Array of 6 answers (1 correct + 5 distractors)
        // Note: We don't send which one is correct - client will find out by guessing
      }
    }
  } catch (error) {
    console.error('Error in getPersonalizedPuzzle:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Validates a puzzle guess and awards coins if correct
 * @param {string} puzzleId - The puzzle ID
 * @param {string} selectedAnswer - The answer the user clicked
 * @param {number} cluesUsed - Number of clues revealed when guess was made
 * @param {string} userId - User's ID
 * @returns {Object} Result with correctness and coins earned
 */
export async function submitPuzzleGuess(puzzleId, selectedAnswer, cluesUsed, userId) {
  try {
    const supabase = await createClient()

    // Fetch the correct answer from the database (including sport_category for buffs)
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .select('answer, difficulty, clues, sport_category')
      .eq('id', puzzleId)
      .single()

    if (puzzleError || !puzzle) {
      return { error: 'Puzzle not found' }
    }

    // Normalize both strings for comparison (case-insensitive, trim whitespace)
    const normalizedGuess = selectedAnswer.trim().toLowerCase()
    const normalizedAnswer = puzzle.answer.trim().toLowerCase()

    // Check if answer is correct
    const isCorrect = normalizedGuess === normalizedAnswer

    if (isCorrect) {
      // Award coins based on clues used
      // 1 clue = 50 coins, 2 clues = 40, 3 clues = 30, 4 clues = 20, 5 clues = 10, 6+ clues = 0
      const coinMap = {
        1: 50,
        2: 40,
        3: 30,
        4: 20,
        5: 10
      }
      let baseCoins = coinMap[cluesUsed] || 0 // 0 coins if all clues used

      // AIRTIGHT: Fetch equipped cards and apply coin buffs
      const { data: equippedCards, error: equippedError } = await supabase
        .from('minted_cards')
        .select(`
          id,
          card_templates(
            buff_type,
            buff_value,
            sport_category
          )
        `)
        .eq('user_id', userId)
        .eq('is_equipped', true)

      if (!equippedError && equippedCards) {
        let globalCoinBonus = 0
        let categoryCoinBonus = 0

        // Loop through equipped cards and calculate buffs
        for (const card of equippedCards) {
          const template = Array.isArray(card.card_templates)
            ? card.card_templates[0]
            : card.card_templates

          if (!template) continue

          const buffType = template.buff_type
          const buffValue = template.buff_value || 0

          // Apply GLOBAL_COIN_BONUS (affects all coin rewards)
          if (buffType === 'GLOBAL_COIN_BONUS') {
            globalCoinBonus += buffValue
          }

          // Apply COIN_BONUS (category-specific, only if sport matches)
          if (buffType === 'COIN_BONUS' && template.sport_category === puzzle.sport_category) {
            categoryCoinBonus += buffValue
          }
        }

        // Apply buffs to base coin reward
        const totalBonus = globalCoinBonus + categoryCoinBonus
        baseCoins = Math.floor(baseCoins * (1 + totalBonus / 100)) // buff_value is percentage
      }

      const coinsToAdd = baseCoins

      // Update user's coins (even if 0, to ensure consistency)
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single()

      const newCoins = (profile?.coins || 0) + coinsToAdd

      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('id', userId)

      // Get updated keys (in case they changed elsewhere)
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('keys')
        .eq('id', userId)
        .single()

      // Generate ego message based on clues used
      let egoMessage = ''
      if (cluesUsed === 1) {
        egoMessage = '1 CLUE. Are you psychic? Seriously.'
      } else if (cluesUsed === 2) {
        egoMessage = "Okay, that's just showing off. Top 1%."
      } else if (cluesUsed === 3 || cluesUsed === 4) {
        egoMessage = "Solid. You've clearly got the knowledge."
      } else {
        egoMessage = "Phew, got it! A win is a win."
      }

      return {
        success: true,
        correct: true,
        coinsEarned: coinsToAdd,
        egoMessage: egoMessage,
        showShareButton: cluesUsed === 1,
        correctAnswer: puzzle.answer,
        newCoins: newCoins,
        newKeys: updatedProfile?.keys || 0
      }
    } else {
      // Wrong answer
      return {
        success: true,
        correct: false,
        coinsEarned: 0
      }
    }
  } catch (error) {
    console.error('Error in submitPuzzleGuess:', error)
    return { error: 'Failed to submit guess' }
  }
}

/**
 * Fetches a random question personalized to the user's favorite sports
 * @param {string} locale - User's current locale (e.g., 'en', 'ar', 'fr')
 * @param {string} userId - User's ID to fetch their favorite sports
 * @returns {Object} Question data with translated text and options
 */
export async function getPersonalizedQuestion(locale, userId) {
  try {
    const supabase = await createClient()

    // Get user's favorite sports (stored as database IDs)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('favorite_sports')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.favorite_sports || profile.favorite_sports.length === 0) {
      return { error: 'No favorite sports found. Please update your profile.' }
    }

    // Fetch a random question matching user's favorite sports
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, sport_category, question_text, options, correct_answer, difficulty')
      .in('sport_category', profile.favorite_sports)

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return { error: 'Failed to fetch questions' }
    }

    if (!questions || questions.length === 0) {
      return { 
        error: 'No questions available for your favorite sports. Please check back later.'
      }
    }

    // Select a random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

    // Extract the translated text based on locale
    let questionText = 'Question not available'
    let options = []

    // Parse question_text (JSONB field)
    if (randomQuestion.question_text) {
      if (typeof randomQuestion.question_text === 'string') {
        questionText = randomQuestion.question_text
      } else if (typeof randomQuestion.question_text === 'object') {
        questionText = randomQuestion.question_text[locale] || randomQuestion.question_text['en'] || 'Question not available'
      }
    }

    // Parse options (JSONB field)
    // Structure: { "en": { "a": "Option 1", "b": "Option 2", "c": "Option 3" }, "ar": {...}, ... }
    if (randomQuestion.options) {
      if (typeof randomQuestion.options === 'object') {
        // Get options for the current locale
        const localeOptions = randomQuestion.options[locale] || randomQuestion.options['en']
        
        if (localeOptions && typeof localeOptions === 'object') {
          // Convert object {"a": "...", "b": "...", "c": "..."} to array
          const optionKeys = ['a', 'b', 'c', 'd', 'e'] // Support up to 5 options
          options = optionKeys
            .map(key => localeOptions[key])
            .filter(option => option !== undefined && option !== null)
        }
      }
    }

    // Ensure we have valid options
    if (!Array.isArray(options) || options.length === 0) {
      console.error('Invalid options structure:', randomQuestion.options)
      return { error: 'Question has invalid format. Please contact support.' }
    }

    return {
      success: true,
      question: {
        id: randomQuestion.id,
        text: questionText,
        options: options,
        sportCategory: getSportName(randomQuestion.sport_category),
        difficulty: randomQuestion.difficulty,
        correctAnswerLetter: randomQuestion.correct_answer, // Store the letter for later validation
      }
    }
  } catch (error) {
    console.error('Error in getPersonalizedQuestion:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Submits an answer and awards coins if correct
 * @param {string} questionId - The question ID
 * @param {number} selectedAnswer - The index of the selected answer (0-based)
 * @param {string} userId - User's ID
 * @returns {Object} Result with correctness and coins earned
 */
export async function submitAnswer(questionId, selectedAnswerIndex, userId) {
  try {
    const supabase = await createClient()

    // Fetch the correct answer from the database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('correct_answer, difficulty')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return { error: 'Question not found' }
    }

    // Convert numeric index (0, 1, 2...) to letter (a, b, c...)
    const answerLetters = ['a', 'b', 'c', 'd', 'e']
    const selectedAnswerLetter = answerLetters[selectedAnswerIndex]

    // Check if answer is correct (comparing letters)
    const isCorrect = selectedAnswerLetter === question.correct_answer

    if (isCorrect) {
      // Award coins based on difficulty (easy: 10, medium: 20, hard: 30)
      const coinsToAdd = question.difficulty === 'hard' ? 30 : question.difficulty === 'medium' ? 20 : 10

      // Update user's coins
      const { error: updateError } = await supabase.rpc('increment_coins', {
        user_id: userId,
        coins_to_add: coinsToAdd
      })

      // If RPC doesn't exist, fall back to manual update
      if (updateError) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', userId)
          .single()

        const newCoins = (profile?.coins || 0) + coinsToAdd

        await supabase
          .from('profiles')
          .update({ coins: newCoins })
          .eq('id', userId)
      }

      return {
        success: true,
        correct: true,
        coinsEarned: coinsToAdd,
        message: `Correct! You earned ${coinsToAdd} coins! 🎉`
      }
    } else {
      return {
        success: true,
        correct: false,
        coinsEarned: 0,
        message: 'Wrong answer. Try the next question!'
      }
    }
  } catch (error) {
    console.error('Error in submitAnswer:', error)
    return { error: 'Failed to submit answer' }
  }
}

