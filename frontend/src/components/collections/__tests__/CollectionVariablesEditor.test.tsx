import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CollectionVariablesEditor } from '@/components/collections/CollectionVariablesEditor'

type MockCollectionState = {
  activeCollection: { name: string } | null
  collectionVariables: Array<{
    key: string
    value: string
    enabled: boolean
    secret: boolean
  }>
  saveCollectionVariables: ReturnType<typeof vi.fn>
}

let mockState: MockCollectionState = {
  activeCollection: { name: 'collection-a' },
  collectionVariables: [],
  saveCollectionVariables: vi.fn(),
}

vi.mock('@/store/collections', () => ({
  useCollectionsStore: () => mockState,
}))

describe('CollectionVariablesEditor', () => {
  it('refreshes variable rows when active collection context changes', () => {
    mockState = {
      activeCollection: { name: 'collection-a' },
      collectionVariables: [
        { key: 'host', value: 'https://a.example.com', enabled: true, secret: false },
      ],
      saveCollectionVariables: vi.fn(),
    }

    const { rerender } = render(<CollectionVariablesEditor />)
    expect(screen.getByDisplayValue('host')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://a.example.com')).toBeInTheDocument()

    mockState = {
      activeCollection: { name: 'collection-b' },
      collectionVariables: [
        { key: 'host', value: 'https://b.example.com', enabled: true, secret: false },
      ],
      saveCollectionVariables: vi.fn(),
    }

    rerender(<CollectionVariablesEditor />)

    expect(screen.queryByDisplayValue('https://a.example.com')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('https://b.example.com')).toBeInTheDocument()
  })
})
