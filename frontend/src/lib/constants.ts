import type { HttpMethod } from '@/types'

// Text-only color classes for HTTP method badges (e.g. in tab labels).
export const METHOD_TEXT_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-600',
  POST: 'text-blue-600',
  PUT: 'text-orange-600',
  PATCH: 'text-yellow-600',
  DELETE: 'text-red-600',
  HEAD: 'text-gray-500',
  OPTIONS: 'text-gray-500',
}

export const METHOD_BG_COLORS: Record<string, string> = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-orange-500',
  PATCH: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  HEAD: 'bg-gray-400',
  OPTIONS: 'bg-gray-400',
}
