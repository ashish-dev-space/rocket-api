import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the tabs store
const mockNewTab = vi.fn()
vi.mock('@/store/tabs-store', () => ({
  useTabsStore: (selector: (s: { newTab: () => void }) => unknown) =>
    selector({ newTab: mockNewTab }),
}))

import { WelcomeScreen } from '../WelcomeScreen'

describe('WelcomeScreen', () => {
  beforeEach(() => {
    mockNewTab.mockClear()
  })
  it('renders the heading', () => {
    render(<WelcomeScreen />)
    expect(screen.getByText('Launch your first request')).toBeInTheDocument()
  })

  it('renders the rocket image', () => {
    render(<WelcomeScreen />)
    const img = screen.getByAltText('Rocket API')
    expect(img).toBeInTheDocument()
  })

  it('renders the New Request button', () => {
    render(<WelcomeScreen />)
    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument()
  })

  it('calls newTab when New Request button is clicked', async () => {
    render(<WelcomeScreen />)
    await userEvent.click(screen.getByRole('button', { name: /new request/i }))
    expect(mockNewTab).toHaveBeenCalledOnce()
  })
})
