import { describe, expect, it } from 'vitest'
import {
  RequestTab,
  Tab,
  toPersistedTabsSession,
} from '@/store/tabs-store'

describe('toPersistedTabsSession', () => {
  it('drops volatile response/loading fields from persisted request tabs', () => {
    const requestTab: RequestTab = {
      kind: 'request',
      id: 'tab-1',
      request: {
        id: 'req-1',
        name: 'Get users',
        method: 'GET',
        url: 'https://example.com/users',
        headers: [],
        queryParams: [],
        pathParams: [],
        body: { type: 'none', content: '' },
        auth: { type: 'none' },
      },
      response: {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: '{"ok":true}',
        size: 11,
        time: 50,
      },
      isDirty: false,
      isLoading: true,
      lastSavedSnapshot: '{}',
    }

    const session = toPersistedTabsSession({
      tabs: [requestTab as Tab],
      activeTabId: requestTab.id,
    })

    const persistedRequestTab = session.tabs[0]
    if (persistedRequestTab.kind !== 'request') {
      throw new Error('expected request tab')
    }

    expect(persistedRequestTab.response).toBeNull()
    expect(persistedRequestTab.isLoading).toBe(false)
  })
})

