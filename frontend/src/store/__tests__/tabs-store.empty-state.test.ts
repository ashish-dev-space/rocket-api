import { describe, expect, it, beforeEach, vi } from 'vitest'

// normalizeSession is not exported — test via store hydration behavior
// We simulate it by mocking sessionStorage with an empty tabs array
describe('tabs-store empty state', () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
  })

  it('starts with empty tabs when sessionStorage has no stored tabs', async () => {
    // No stored data → fresh load
    const { useTabsStore } = await import('@/store/tabs-store')
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(0)
    expect(state.activeTabId).toBe('')
  })

  it('closes last tab and leaves tabs empty', async () => {
    const { useTabsStore } = await import('@/store/tabs-store')
    // Store starts empty; open one tab first
    useTabsStore.getState().newTab()
    expect(useTabsStore.getState().tabs).toHaveLength(1)

    const tabId = useTabsStore.getState().tabs[0].id
    useTabsStore.getState().closeTab(tabId)

    expect(useTabsStore.getState().tabs).toHaveLength(0)
    expect(useTabsStore.getState().activeTabId).toBe('')
  })
})
