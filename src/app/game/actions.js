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
        .select('id, template_id')
        .eq('user_id', userId)
        .eq('is_equipped', true)

      console.log('[COIN BONUS DEBUG] Equipped cards:', equippedCards)
      console.log('[COIN BONUS DEBUG] Equipped error:', equippedError)
      console.log('[COIN BONUS DEBUG] Puzzle sport_category:', puzzle.sport_category)
      console.log('[COIN BONUS DEBUG] Base coins before buff:', baseCoins)

      if (!equippedError && equippedCards && equippedCards.length > 0) {
        // Extract card template IDs
        const templateIds = equippedCards.map(card => card.template_id).filter(Boolean)
        console.log('[COIN BONUS DEBUG] Template IDs:', templateIds)

        if (templateIds.length > 0) {
          // Fetch card templates with buff information
          const { data: cardTemplates, error: templateError } = await supabase
            .from('card_templates')
            .select('id, buff_type, buff_value, sport_category')
            .in('id', templateIds)

          console.log('[COIN BONUS DEBUG] Card templates:', cardTemplates)
          console.log('[COIN BONUS DEBUG] Template error:', templateError)

          if (!templateError && cardTemplates && cardTemplates.length > 0) {
            let totalMultiplier = 0

            // Loop through card templates and calculate buffs
            for (const template of cardTemplates) {
              const buffType = template.buff_type
              const buffValue = template.buff_value || 0

              console.log('[COIN BONUS DEBUG] Template:', { buffType, buffValue, sport_category: template.sport_category })

              // Apply GLOBAL_COIN_BONUS (affects all coin rewards)
              if (buffType === 'GLOBAL_COIN_BONUS') {
                console.log('[COIN BONUS DEBUG] Applying GLOBAL_COIN_BONUS:', buffValue)
                totalMultiplier += buffValue
              }

              // Apply COIN_BONUS (category-specific, only if sport_category matches puzzle sport_category)
              if (buffType === 'COIN_BONUS' && template.sport_category === puzzle.sport_category) {
                console.log('[COIN BONUS DEBUG] Applying COIN_BONUS:', buffValue, 'for category:', template.sport_category)
                totalMultiplier += buffValue
              }
            }

            console.log('[COIN BONUS DEBUG] Total multiplier:', totalMultiplier)
            console.log('[COIN BONUS DEBUG] Calculation:', baseCoins, '* (1 +', totalMultiplier, ')')

            // Apply multiplier to base coin reward
            // buff_value is stored as decimal (e.g., 0.10 for 10%), so multiply by (1 + totalMultiplier)
            baseCoins = Math.round(baseCoins * (1 + totalMultiplier))
            console.log('[COIN BONUS DEBUG] Final coins after buff:', baseCoins)
          }
        }
      }

      const coinsToAdd = baseCoins

      // AIRTIGHT: Calculate Legendary Box drop rate with KEY buffs
      // DEVELOPER OVERRIDE: Check if this is Gabriel's admin account
      // Note: Supabase auth.users table stores email, but profiles might not have it
      // Let's check auth.users instead
      const { data: authUser, error: authError } = await supabase.auth.getUser()

      console.log('[AUTH DEBUG] Auth user:', authUser)
      console.log('[AUTH DEBUG] Auth error:', authError)
      console.log('[AUTH DEBUG] User ID from param:', userId)

      const userEmail = authUser?.user?.email
      const isDevOverride = userEmail === 'gabrieltornquist7@gmail.com'
      let baseDropRate = isDevOverride ? 1.0 : 0.01 // DEV: 100% for testing, PROD: 1%

      console.log('[AUTH DEBUG] User email:', userEmail)
      console.log('[AUTH DEBUG] Is dev override?', isDevOverride)

      if (isDevOverride) {
        console.log('🔧 [DEVELOPER OVERRIDE] Base drop rate set to 100% for admin testing')
      }

      let totalKeyBonus = 0

      // Re-use the equipped cards data we already fetched for coin buffs
      if (!equippedError && equippedCards && equippedCards.length > 0) {
        const templateIds = equippedCards.map(card => card.template_id).filter(Boolean)

        if (templateIds.length > 0) {
          // Fetch card templates with KEY buff information
          const { data: keyCardTemplates, error: keyTemplateError } = await supabase
            .from('card_templates')
            .select('id, buff_type, buff_value, sport_category')
            .in('id', templateIds)

          console.log('[KEY DROP DEBUG] Card templates for key buffs:', keyCardTemplates)
          console.log('[KEY DROP DEBUG] Template error:', keyTemplateError)

          if (!keyTemplateError && keyCardTemplates && keyCardTemplates.length > 0) {
            // Loop through card templates and calculate key drop rate buffs
            for (const template of keyCardTemplates) {
              const buffType = template.buff_type
              const buffValue = template.buff_value || 0

              // Apply GLOBAL_KEY_DROP_RATE (affects all puzzles)
              if (buffType === 'GLOBAL_KEY_DROP_RATE') {
                console.log('[KEY DROP DEBUG] Applying GLOBAL_KEY_DROP_RATE:', buffValue)
                totalKeyBonus += buffValue
              }

              // Apply KEY_DROP_RATE (category-specific, only if sport_category matches)
              if (buffType === 'KEY_DROP_RATE' && template.sport_category === puzzle.sport_category) {
                console.log('[KEY DROP DEBUG] Applying KEY_DROP_RATE:', buffValue, 'for category:', template.sport_category)
                totalKeyBonus += buffValue
              }
            }
          }
        }
      }

      const finalDropRate = baseDropRate + totalKeyBonus

      // Enhanced logging for drop rate calculation
      console.log('═══════════════════════════════════════════════')
      console.log('🎲 LEGENDARY BOX DROP CALCULATION')
      console.log('═══════════════════════════════════════════════')
      console.log(`Base Drop Rate: ${baseDropRate} (${(baseDropRate * 100).toFixed(1)}%)`)
      console.log(`Total Buffs:    +${totalKeyBonus} (+${(totalKeyBonus * 100).toFixed(1)}%)`)
      console.log(`Final Rate:     ${finalDropRate} (${(finalDropRate * 100).toFixed(1)}%)`)
      console.log('═══════════════════════════════════════════════')

      // Roll for Legendary Box drop
      const dropRoll = Math.random()
      const keyDropped = dropRoll < finalDropRate
      console.log(`🎰 Roll: ${dropRoll.toFixed(4)} ${keyDropped ? '✅ KEY DROPPED!' : '❌ No drop'}`)
      console.log('═══════════════════════════════════════════════')

      // AIRTIGHT: Calculate Legendary Box drop rate (separate from keys)
      // DEV OVERRIDE: Set to 100% for Gabriel's testing
      const baseBoxDropRate = isDevOverride ? 1.0 : 0.01 // DEV: 100% for testing, PROD: 1%

      if (isDevOverride) {
        console.log('🔧 [DEVELOPER OVERRIDE] Legendary Box drop rate set to 100% for admin testing')
      }

      // For now, legendary boxes don't have buff-based rate increases (only base rate)
      // This can be expanded later to support box drop rate buffs
      const finalBoxDropRate = baseBoxDropRate

      console.log('═══════════════════════════════════════════════')
      console.log('📦 LEGENDARY BOX DROP CALCULATION')
      console.log('═══════════════════════════════════════════════')
      console.log(`Base Box Drop Rate: ${baseBoxDropRate} (${(baseBoxDropRate * 100).toFixed(1)}%)`)
      console.log(`Final Box Rate:     ${finalBoxDropRate} (${(finalBoxDropRate * 100).toFixed(1)}%)`)
      console.log('═══════════════════════════════════════════════')

      // Roll for Legendary Box drop
      const boxDropRoll = Math.random()
      const legendaryBoxDropped = boxDropRoll < finalBoxDropRate
      console.log(`🎰 Box Roll: ${boxDropRoll.toFixed(4)} ${legendaryBoxDropped ? '✅ BOX DROPPED!' : '❌ No drop'}`)
      console.log('═══════════════════════════════════════════════')

      // If box dropped, add it to user's inventory
      if (legendaryBoxDropped) {
        const { error: boxInventoryError } = await supabase
          .from('user_box_inventory')
          .insert({
            user_id: userId,
            box_type: 'legendary_box'
          })

        if (boxInventoryError) {
          console.error('❌ Failed to add legendary box to inventory:', boxInventoryError)
        } else {
          console.log('✅ Legendary box added to inventory')
        }
      }

      // Update user's coins and keys
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('coins, keys')
        .eq('id', userId)
        .single()

      console.log('[UPDATE DEBUG] Profile before update:', profile)
      console.log('[UPDATE DEBUG] Profile fetch error:', profileFetchError)

      const newCoins = (profile?.coins || 0) + coinsToAdd
      const newKeys = (profile?.keys || 0) + (keyDropped ? 1 : 0)

      console.log('[UPDATE DEBUG] Old coins:', profile?.coins, '| Coins to add:', coinsToAdd, '| New coins:', newCoins)
      console.log('[UPDATE DEBUG] Old keys:', profile?.keys, '| Key dropped?', keyDropped, '| New keys:', newKeys)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          coins: newCoins,
          keys: newKeys
        })
        .eq('id', userId)

      console.log('[UPDATE DEBUG] Update error:', updateError)
      if (updateError) {
        console.error('❌ Failed to update profile:', updateError)
      } else {
        console.log('✅ Profile updated successfully - New keys:', newKeys)
      }

      // Get updated profile for return
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
        newKeys: updatedProfile?.keys || 0,
        keyDropped: keyDropped,
        legendaryBoxDropped: legendaryBoxDropped
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

