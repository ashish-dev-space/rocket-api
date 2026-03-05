const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1'
const DEFAULT_WS_URL = 'ws://localhost:8080/ws'

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const resolveHealthUrl = (apiBaseUrl: string): string => {
  try {
    const url = new URL(apiBaseUrl)
    return `${url.origin}/health`
  } catch {
    return 'http://localhost:8080/health'
  }
}

const resolveWsUrl = (apiBaseUrl: string): string => {
  try {
    const url = new URL(apiBaseUrl)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}/ws`
  } catch {
    return DEFAULT_WS_URL
  }
}

export interface RuntimeConfig {
  apiBaseUrl: string
  healthUrl: string
  wsUrl: string
}

export const getRuntimeConfig = (): RuntimeConfig => {
  const apiBaseUrl = stripTrailingSlash(
    import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
  )
  const wsUrl = import.meta.env.VITE_WS_URL || resolveWsUrl(apiBaseUrl)

  return {
    apiBaseUrl,
    healthUrl: resolveHealthUrl(apiBaseUrl),
    wsUrl,
  }
}

