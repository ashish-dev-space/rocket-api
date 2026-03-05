import { describe, expect, it } from 'vitest'
import { applyApiKeyToQueryParams } from '@/lib/request-auth'
import { AuthConfig, QueryParam } from '@/types'

describe('applyApiKeyToQueryParams', () => {
  it('appends api-key query param when missing', () => {
    const queryParams: QueryParam[] = [{ key: 'page', value: '1', enabled: true }]
    const auth: AuthConfig = {
      type: 'api-key',
      apiKey: { key: 'token', value: 'abc', in: 'query' },
    }

    expect(applyApiKeyToQueryParams(queryParams, auth)).toEqual([
      { key: 'page', value: '1', enabled: true },
      { key: 'token', value: 'abc', enabled: true },
    ])
  })

  it('updates existing key instead of duplicating', () => {
    const queryParams: QueryParam[] = [{ key: 'token', value: 'old', enabled: false }]
    const auth: AuthConfig = {
      type: 'api-key',
      apiKey: { key: 'token', value: 'new', in: 'query' },
    }

    expect(applyApiKeyToQueryParams(queryParams, auth)).toEqual([
      { key: 'token', value: 'new', enabled: true },
    ])
  })

  it('does nothing for non-query api key auth', () => {
    const queryParams: QueryParam[] = [{ key: 'page', value: '1', enabled: true }]
    const auth: AuthConfig = {
      type: 'api-key',
      apiKey: { key: 'token', value: 'abc', in: 'header' },
    }

    expect(applyApiKeyToQueryParams(queryParams, auth)).toEqual(queryParams)
  })
})

