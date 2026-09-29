import { describe, it, expect } from 'vitest'
import { getRecommendedAction } from './templates'

describe('getRecommendedAction', () => {
  it('no longer sends Feature Request to the billing portal', () => {
    const action = getRecommendedAction('Feature Request', 'Medium')
    expect(action.toLowerCase()).not.toContain('billing portal')
  })

  it('prepends an escalation instruction for High-urgency issues', () => {
    const action = getRecommendedAction('Billing Issue', 'High')
    expect(action).toMatch(/^Escalate immediately:/)
  })

  it('does not escalate Medium or Low urgency issues', () => {
    expect(getRecommendedAction('Billing Issue', 'Medium')).not.toMatch(/^Escalate immediately:/)
    expect(getRecommendedAction('Billing Issue', 'Low')).not.toMatch(/^Escalate immediately:/)
  })

  it('falls back for an unrecognized category', () => {
    expect(getRecommendedAction('Not A Real Category', 'Medium')).toBe('No recommendation available.')
  })
})
