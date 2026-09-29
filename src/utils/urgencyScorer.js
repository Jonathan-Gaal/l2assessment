/**
 * Urgency Scorer - deterministic, keyword-driven urgency calculation.
 * No Date()/time-of-day dependence: the same message always scores the same.
 */

const EMERGENCY_KEYWORDS = [
  'down', 'outage', 'crash', "can't access", 'cannot access',
  'broken', 'not working', 'urgent', 'emergency', 'critical',
  'asap', 'immediately', 'connection lost', 'disconnected',
  'offline', 'security breach', 'hacked', 'data loss'
]

const POLITE_WORDS = ['please', 'thank', 'thanks', 'appreciate', 'kindly']
const POSITIVE_WORDS = ['happy', 'love', 'great', 'excellent', 'wonderful']

export function calculateUrgency(message) {
  let urgencyScore = 50
  const lowerMessage = message.toLowerCase()

  // Strong signal: explicit emergency/outage language
  let emergencyBoost = 0
  EMERGENCY_KEYWORDS.forEach(keyword => {
    if (lowerMessage.includes(keyword)) emergencyBoost += 25
  })
  urgencyScore += Math.min(emergencyBoost, 60)

  // Weak signal: exclamation marks (capped, no longer dominant)
  const exclamationCount = (message.match(/!/g) || []).length
  urgencyScore += Math.min(exclamationCount * 5, 15)

  // ALL-CAPS is not a calming signal; small bump only
  if (message === message.toUpperCase() && /[A-Z]/.test(message) && message.length > 10) {
    urgencyScore += 10
  }

  // Calm/polite tone dampens urgency, but capped so it can't mask a real emergency
  let dampening = 0
  POLITE_WORDS.forEach(word => { if (lowerMessage.includes(word)) dampening += 10 })
  POSITIVE_WORDS.forEach(word => { if (lowerMessage.includes(word)) dampening += 10 })
  urgencyScore -= Math.min(dampening, 30)

  if (urgencyScore >= 70) return "High"
  if (urgencyScore <= 30) return "Low"
  return "Medium"
}
