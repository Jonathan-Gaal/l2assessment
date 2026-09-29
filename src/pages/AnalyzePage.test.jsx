import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AnalyzePage from './AnalyzePage'
import { categorizeMessage } from '../utils/llmHelper'

vi.mock('../utils/llmHelper', () => ({
  categorizeMessage: vi.fn(),
}))

describe('AnalyzePage mock-fallback banner', () => {
  beforeEach(() => {
    localStorage.clear()
    categorizeMessage.mockReset()
  })

  it('shows no warning banner when the result came from the real AI', async () => {
    categorizeMessage.mockResolvedValue({
      category: 'Billing Issue',
      reasoning: 'Looks like a billing issue.',
      source: 'ai',
    })

    render(<AnalyzePage />)
    fireEvent.change(screen.getByPlaceholderText('Paste customer message here...'), {
      target: { value: 'Why was I charged twice?' },
    })
    fireEvent.click(screen.getByText('Analyze Message'))

    await waitFor(() => expect(screen.getByText('Billing Issue')).toBeInTheDocument())
    expect(screen.queryByText('AI service unavailable')).not.toBeInTheDocument()
  })

  it('shows a visible warning banner when the result is a mock fallback', async () => {
    categorizeMessage.mockResolvedValue({
      category: 'Technical Problem',
      reasoning: 'Keyword-based guess.',
      source: 'mock',
    })

    render(<AnalyzePage />)
    fireEvent.change(screen.getByPlaceholderText('Paste customer message here...'), {
      target: { value: 'Server down now' },
    })
    fireEvent.click(screen.getByText('Analyze Message'))

    await waitFor(() => expect(screen.getByText('AI service unavailable')).toBeInTheDocument())
  })

  it('saves the source of the result into history so it can be audited later', async () => {
    categorizeMessage.mockResolvedValue({
      category: 'Technical Problem',
      reasoning: 'Keyword-based guess.',
      source: 'mock',
    })

    render(<AnalyzePage />)
    fireEvent.change(screen.getByPlaceholderText('Paste customer message here...'), {
      target: { value: 'Server down now' },
    })
    fireEvent.click(screen.getByText('Analyze Message'))

    await waitFor(() => {
      const history = JSON.parse(localStorage.getItem('triageHistory') || '[]')
      expect(history[0].source).toBe('mock')
    })
  })
})
