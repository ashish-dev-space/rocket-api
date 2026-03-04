import { beforeEach, describe, expect, it, vi } from 'vitest'

const getCollectionsMock = vi.fn()

vi.mock('@/lib/api', () => ({
  apiService: {
    getCollections: getCollectionsMock,
  },
}))

async function loadStore() {
  vi.resetModules()
  const mod = await import('@/store/collections')
  return mod.useCollectionsStore
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('collections-store fetch dedupe', () => {
  beforeEach(() => {
    getCollectionsMock.mockReset()
  })

  it('coalesces concurrent fetchCollections calls into a single API request', async () => {
    const pending = deferred<Array<{ id: string; name: string; path: string; requestCount: number }>>()
    getCollectionsMock.mockReturnValue(pending.promise)

    const useCollectionsStore = await loadStore()

    const p1 = useCollectionsStore.getState().fetchCollections()
    const p2 = useCollectionsStore.getState().fetchCollections()

    expect(getCollectionsMock).toHaveBeenCalledTimes(1)

    pending.resolve([
      { id: '1', name: 'A', path: '/tmp/a', requestCount: 1 },
    ])
    await Promise.all([p1, p2])

    expect(useCollectionsStore.getState().collections).toHaveLength(1)
    expect(useCollectionsStore.getState().collections[0]?.name).toBe('A')
  })
})
