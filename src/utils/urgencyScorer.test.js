import { describe, it, expect } from 'vitest'
import { calculateUrgency } from './urgencyScorer'

describe('calculateUrgency', () => {
  it('is deterministic for the same message', () => {
    const message = 'SITE IS DOWN RIGHT NOW'
    const first = calculateUrgency(message)
    const second = calculateUrgency(message)
    expect(first).toBe(second)
  })

  it('marks a real outage message as High, even in ALL CAPS and short', () => {
    expect(calculateUrgency('SITE IS DOWN RIGHT NOW')).toBe('High')
  })

  it('marks a short emergency message as High (brevity is not calm)', () => {
    expect(calculateUrgency('Server down now')).toBe('High')
  })

  it('marks an outage described in lowercase as High', () => {
    expect(calculateUrgency('Database connection lost')).toBe('High')
  })

  it('marks a message that cannot access the account as High', () => {
    expect(calculateUrgency("My payment failed and now I can't access the dashboard")).toBe('High')
  })

  it('does not mark a polite thank-you message as High', () => {
    const result = calculateUrgency('Thank you so much! I really appreciate the fast response!')
    expect(result).not.toBe('High')
  })

  it('does not mark long, positive, exclamation-heavy feedback as High', () => {
    const result = calculateUrgency(
      "Hi! I was just browsing and wanted to say your product is great, I love it, wonderful work, excellent service!!!"
    )
    expect(result).not.toBe('High')
  })

  it('treats a simple question as non-urgent', () => {
    expect(calculateUrgency('What are your business hours?')).not.toBe('High')
  })

  it('only returns High, Medium, or Low', () => {
    const messages = [
      'SITE IS DOWN RIGHT NOW',
      'Thank you!',
      'Can I upgrade my plan?',
      'hi',
    ]
    messages.forEach((message) => {
      expect(['High', 'Medium', 'Low']).toContain(calculateUrgency(message))
    })
  })
})
