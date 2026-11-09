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

  it('requests deterministic JSON output and passes the message as its own user turn', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '{}' } }] })

    await categorizeMessage('Why was I charged twice?')

    const request = mockCreate.mock.calls[0][0]
    expect(request.temperature).toBe(0)
    expect(request.response_format).toEqual({ type: 'json_object' })
    expect(request.messages.at(-1)).toEqual({ role: 'user', content: 'Why was I charged twice?' })
  })

  it('reads category, label and reason from the structured AI reply', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"category":"Technical Problem","label":"Account Compromise","reason":"Unauthorized login and password change"}' } }],
    })

    const result = await categorizeMessage('Someone logged into my account')

    expect(result.category).toBe('Technical Problem')
    expect(result.label).toBe('Account Compromise')
    expect(result.reasoning).toBe('**Category:** Account Compromise - Unauthorized login and password change')
  })

  it('routes a category outside the allowed list to Unknown', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"category":"Account Security","label":"Account Compromise","reason":"x"}' } }],
    })

    const result = await categorizeMessage('Someone logged into my account')

    expect(result.category).toBe('Unknown')
  })

  it('routes a non-JSON reply to Unknown and keeps the raw text as reasoning', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'This is a billing issue.' } }],
    })

    const result = await categorizeMessage('Why was I charged twice?')

    expect(result.category).toBe('Unknown')
    expect(result.reasoning).toBe('This is a billing issue.')
  })

  it('tags a successful AI response with source "ai"', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'This is a billing issue.' } }],
    })

    const result = await categorizeMessage('Why was I charged twice?')

    expect(result.source).toBe('ai')
  })

  it('falls back to a mock categorization when the API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid API Key'))

    const result = await categorizeMessage('Server down now')

    expect(result.category).toBeTruthy()
    expect(result.reasoning).toBeTruthy()
  })

  it('tags a failed API call with source "mock" so the UI can warn the user', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid API Key'))

    const result = await categorizeMessage('Server down now')

    expect(result.source).toBe('mock')
  })
})
