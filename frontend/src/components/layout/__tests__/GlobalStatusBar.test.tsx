import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GlobalStatusBar } from '@/components/layout/GlobalStatusBar'

vi.mock('@/lib/api', () => ({
  apiService: {
    getTemplates: vi.fn().mockResolvedValue([]),
    getTemplateCategories: vi.fn().mockResolvedValue([]),
    getCookies: vi.fn().mockResolvedValue([]),
    getCookieDomains: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/store/collections', () => ({
  useCollectionsStore: () => ({
    createCollection: vi.fn(),
    importBruno: vi.fn(),
  }),
}))

vi.mock('@/store/tabs-store', () => ({
  useTabsStore: () => ({ loadRequestInActiveTab: vi.fn() }),
}))

describe('GlobalStatusBar', () => {
  it('renders a Console toggle button', () => {
    render(<GlobalStatusBar isConsoleOpen={false} onConsoleToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: /console/i })).toBeInTheDocument()
  })

  it('calls onConsoleToggle when Console button is clicked', () => {
    const toggle = vi.fn()
    render(<GlobalStatusBar isConsoleOpen={false} onConsoleToggle={toggle} />)
    fireEvent.click(screen.getByRole('button', { name: /console/i }))
    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('shows active state when console is open', () => {
    render(<GlobalStatusBar isConsoleOpen={true} onConsoleToggle={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /console/i })
    expect(btn.className).toMatch(/bg-accent/)
  })
})
