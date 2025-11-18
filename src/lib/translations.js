// Simple translation system - no magic library

export async function getTranslations(locale) {
  try {
    const translations = await import(`../../messages/${locale}.json`)
    return translations.default
  } catch (error) {
    // Fallback to English if locale not found
    const translations = await import(`../../messages/en.json`)
    return translations.default
  }
}

export function createTranslator(messages) {
  return function t(key) {
    const keys = key.split('.')
    let value = messages
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }
}

