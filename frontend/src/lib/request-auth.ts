import { AuthConfig, QueryParam } from '@/types'

export const applyApiKeyToQueryParams = (
  queryParams: QueryParam[],
  auth: AuthConfig
): QueryParam[] => {
  if (auth.type !== 'api-key' || auth.apiKey?.in !== 'query') {
    return queryParams
  }

  const key = auth.apiKey.key?.trim()
  if (!key) return queryParams

  const value = auth.apiKey.value ?? ''
  const existingIndex = queryParams.findIndex(param => param.key === key)

  if (existingIndex === -1) {
    return [...queryParams, { key, value, enabled: true }]
  }

  return queryParams.map((param, index) =>
    index === existingIndex ? { ...param, value, enabled: true } : param
  )
}

