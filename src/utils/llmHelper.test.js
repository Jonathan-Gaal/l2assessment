import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(function GroqMock() {
    this.chat = { completions: { create: mockCreate } }
  }),
}))

const { categorizeMessage } = await import('./llmHelper')

describe('categorizeMessage', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('calls Groq with the currently-supported free-tier model', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'General inquiry' } }],
    })

    await categorizeMessage('Can I upgrade my plan?')

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'openai/gpt-oss-20b' })
    )
  })

  it('parses a billing-related AI response into the Billing Issue category', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'This is a billing issue.' } }],
    })

    const result = await categorizeMessage('Why was I charged twice?')

    expect(result.category).toBe('Billing Issue')
  })

  it('falls back to a mock categorization when the API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid API Key'))

    const result = await categorizeMessage('Server down now')

    expect(result.category).toBeTruthy()
    expect(result.reasoning).toBeTruthy()
  })
})
