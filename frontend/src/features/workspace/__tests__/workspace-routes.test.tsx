import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import routes from '@/app/routes'

vi.mock('@/App', () => ({
  default: () => <div data-testid="workspace-root">WorkspaceRoot</div>,
}))

vi.mock('@/features/workspace/components/WorkspaceShell', () => ({
  WorkspaceShell: () => <div data-testid="workspace-shell-route">WorkspaceShell</div>,
}))

vi.mock('@/routes/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">NotFound</div>,
}))

vi.mock('@/features/collections/routes', () => ({
  collectionsRoutes: [
    {
      path: 'collections/:collectionName',
      element: <div data-testid="collection-overview-route">CollectionOverviewRoute</div>,
    },
    {
      path: 'collections/:collectionName/history',
      element: <div data-testid="collection-history-route">CollectionHistoryRoute</div>,
    },
  ],
}))

vi.mock('@/features/request-builder/routes', () => ({
  requestBuilderRoutes: [
    {
      path: 'collections/:collectionName/requests/*',
      element: <div data-testid="request-builder-route">RequestBuilderRoute</div>,
    },
  ],
}))

function RenderRoutes() {
  return useRoutes(routes)
}

describe('workspace routes', () => {
  it('renders the workspace root at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <RenderRoutes />
      </MemoryRouter>
    )

    expect(screen.getByTestId('workspace-root')).toBeInTheDocument()
  })

  it('renders the collection overview route', () => {
    render(
      <MemoryRouter initialEntries={['/collections/snehal']}>
        <RenderRoutes />
      </MemoryRouter>
    )

    expect(screen.getByTestId('collection-overview-route')).toBeInTheDocument()
  })

  it('renders the request builder route', () => {
    render(
      <MemoryRouter initialEntries={['/collections/snehal/requests/folder/get-users.bru']}>
        <RenderRoutes />
      </MemoryRouter>
    )

    expect(screen.getByTestId('request-builder-route')).toBeInTheDocument()
  })

  it('renders the collection history route', () => {
    render(
      <MemoryRouter initialEntries={['/collections/snehal/history']}>
        <RenderRoutes />
      </MemoryRouter>
    )

    expect(screen.getByTestId('collection-history-route')).toBeInTheDocument()
  })

  it('renders not found for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <RenderRoutes />
      </MemoryRouter>
    )

    expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
  })
})
