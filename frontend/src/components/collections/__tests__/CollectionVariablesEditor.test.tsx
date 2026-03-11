import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CollectionVariablesEditor } from '@/components/collections/CollectionVariablesEditor'

type MockCollectionsState = {
  activeCollection: { name: string } | null
}

type MockCollectionSettingsState = {
  collectionVariables: Array<{
    key: string
    value: string
    enabled: boolean
    secret: boolean
  }>
  saveCollectionVariables: ReturnType<typeof vi.fn>
}

let mockCollectionsState: MockCollectionsState = {
  activeCollection: { name: 'collection-a' },
}

let mockCollectionSettingsState: MockCollectionSettingsState = {
  collectionVariables: [],
  saveCollectionVariables: vi.fn(),
}

vi.mock('@/features/collections/hooks/useCollections', () => ({
  useCollections: () => mockCollectionsState,
}))

vi.mock('@/features/collections/hooks/useCollectionSettings', () => ({
  useCollectionSettings: () => mockCollectionSettingsState,
}))

describe('CollectionVariablesEditor', () => {
  it('refreshes variable rows when active collection context changes', () => {
    mockCollectionsState = {
      activeCollection: { name: 'collection-a' },
    }
    mockCollectionSettingsState = {
      collectionVariables: [
        { key: 'host', value: 'https://a.example.com', enabled: true, secret: false },
      ],
      saveCollectionVariables: vi.fn(),
    }

    const { rerender } = render(<CollectionVariablesEditor />)
    expect(screen.getByDisplayValue('host')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://a.example.com')).toBeInTheDocument()

    mockCollectionsState = {
      activeCollection: { name: 'collection-b' },
    }
    mockCollectionSettingsState = {
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
