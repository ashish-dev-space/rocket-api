import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useRouteSyncedTabs } from '@/features/workspace/hooks/useRouteSyncedTabs'
import { CollectionRouteSync, CollectionHistoryRouteSync } from '@/features/collections/routes'
import { RequestRouteSync } from '@/features/request-builder/routes'

const {
  openCollectionOverviewMock,
  loadRequestFromPathMock,
  setActiveCollectionMock,
  collectionsStoreState,
  tabsStoreState,
  useCollectionsStoreMock,
  useTabsStoreMock,
} = vi.hoisted(() => {
  const openCollectionOverviewMock = vi.fn()
  const loadRequestFromPathMock = vi.fn()
  const setActiveCollectionMock = vi.fn()

  const collectionsStoreState = {
    collections: [{ id: '1', name: 'snehal', path: '/tmp/snehal', requestCount: 1 }],
    activeCollection: null as null | { id: string; name: string; path: string; requestCount: number },
    setActiveCollection: setActiveCollectionMock,
  }

  const useCollectionsStoreMock = Object.assign(
    vi.fn((selector?: (state: typeof collectionsStoreState) => unknown) =>
      selector ? selector(collectionsStoreState) : collectionsStoreState
    ),
    {
      getState: vi.fn(() => collectionsStoreState),
    }
  )

  const tabsStoreState = {
    tabs: [] as Array<
      | { kind: 'collection-overview'; id: string; collectionName: string }
      | { kind: 'request'; id: string; collectionName?: string; filePath?: string }
    >,
    activeTabId: '',
    openCollectionOverview: openCollectionOverviewMock,
    loadRequestFromPath: loadRequestFromPathMock,
  }

  const useTabsStoreMock = Object.assign(
    vi.fn((selector?: (state: typeof tabsStoreState) => unknown) =>
      selector ? selector(tabsStoreState) : tabsStoreState
    ),
    {
      getState: vi.fn(() => tabsStoreState),
    }
  )

  return {
    openCollectionOverviewMock,
    loadRequestFromPathMock,
    setActiveCollectionMock,
    collectionsStoreState,
    tabsStoreState,
    useCollectionsStoreMock,
    useTabsStoreMock,
  }
})

vi.mock('@/store/collections', () => ({
  useCollectionsStore: useCollectionsStoreMock,
}))

vi.mock('@/store/tabs-store', async () => {
  const actual = await vi.importActual<typeof import('@/store/tabs-store')>('@/store/tabs-store')
  return {
    ...actual,
    useTabsStore: useTabsStoreMock,
  }
})

function RouteSyncHarness() {
  useRouteSyncedTabs()
  return (
    <>
      <LocationProbe />
      <Outlet />
    </>
  )
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

describe('route sync', () => {
  beforeEach(() => {
    openCollectionOverviewMock.mockReset()
    loadRequestFromPathMock.mockReset()
    setActiveCollectionMock.mockReset()
    tabsStoreState.tabs = []
    tabsStoreState.activeTabId = ''
    collectionsStoreState.activeCollection = null
  })

  it('navigating to a collection route updates collection context', async () => {
    render(
      <MemoryRouter initialEntries={['/collections/snehal']}>
        <Routes>
          <Route path="/" element={<RouteSyncHarness />}>
            <Route path="collections/:collectionName" element={<CollectionRouteSync />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(setActiveCollectionMock).toHaveBeenCalledWith(collectionsStoreState.collections[0])
      expect(openCollectionOverviewMock).toHaveBeenCalledWith('snehal')
    })
  })

  it('navigating to a request route opens the corresponding request tab', async () => {
    render(
      <MemoryRouter initialEntries={['/collections/snehal/requests/folder/get-users.bru']}>
        <Routes>
          <Route path="/" element={<RouteSyncHarness />}>
            <Route path="collections/:collectionName/requests/*" element={<RequestRouteSync />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(loadRequestFromPathMock).toHaveBeenCalledWith(
        'snehal',
        'folder/get-users.bru'
      )
    })
  })

  it('restoring an active tab navigates back to its route', async () => {
    tabsStoreState.tabs = [
      { kind: 'collection-overview', id: 'overview-1', collectionName: 'snehal' },
    ]
    tabsStoreState.activeTabId = 'overview-1'

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*" element={<RouteSyncHarness />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/collections/snehal')
    })
  })
})
