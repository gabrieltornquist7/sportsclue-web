/**
 * Single source of truth for all sports in the application.
 * Each sport has:
 * - id: The database value used in sport_category column (lowercase snake_case)
 * - name: The display name shown to users
 */
export const SPORTS = [
  { id: 'american_football', name: 'American Football' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'football', name: 'Football' },
  { id: 'baseball', name: 'Baseball' },
  { id: 'hockey', name: 'Hockey' },
  { id: 'mma', name: 'MMA' },
  { id: 'boxing', name: 'Boxing' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'golf', name: 'Golf' },
  { id: 'rally', name: 'Rally' },
  { id: 'formula', name: 'Formula' }
]

/**
 * Get sport display name from database ID
 * @param {string} id - Database sport ID (e.g., 'american_football')
 * @returns {string} Display name (e.g., 'American Football')
 */
export function getSportName(id) {
  const sport = SPORTS.find(s => s.id === id)
  return sport ? sport.name : id
}

/**
 * Get sport database ID from display name
 * @param {string} name - Display name (e.g., 'American Football')
 * @returns {string} Database ID (e.g., 'american_football')
 */
export function getSportId(name) {
  const sport = SPORTS.find(s => s.name === name)
  return sport ? sport.id : name.toLowerCase().replace(/\s+/g, '_')
}

