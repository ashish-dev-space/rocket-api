import { AuthConfig, FormDataField, Header, HttpMethod, QueryParam, RequestBody } from '@/types'

export interface CurlParseResult {
  method: HttpMethod
  url: string
  headers: Header[]
  queryParams: QueryParam[]
  auth: AuthConfig
  body: RequestBody
  warnings: string[]
}

export function looksLikeCurlCommand(input: string): boolean {
  return input.trimStart().startsWith('curl ')
    || input.trim() === 'curl'
    || input.trimStart().startsWith('curl\t')
}

const SUPPORTED_DATA_FLAGS = new Set([
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-urlencode',
  '-d',
])

const SUPPORTED_FORM_FLAGS = new Set(['--form', '-F'])
const SUPPORTED_HEADER_FLAGS = new Set(['--header', '-H'])
const SUPPORTED_REQUEST_FLAGS = new Set(['--request', '-X'])
const SUPPORTED_USER_FLAGS = new Set(['--user', '-u'])
const SUPPORTED_COOKIE_FLAGS = new Set(['--cookie', '-b'])
const UNSUPPORTED_FLAGS = new Set(['--compressed', '--location'])

function tokenizeCurl(input: string): string[] {
  const normalized = input.replace(/\\\n/g, ' ').replace(/\\\r\n/g, ' ')
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]

    if (quote) {
      if (char === quote) {
        quote = null
        continue
      }

      if (char === '\\' && quote === '"' && i + 1 < normalized.length) {
        current += normalized[i + 1]
        i += 1
        continue
      }

      current += char
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

function inferBodyType(headers: Header[], bodyContent: string, formData: FormDataField[]): RequestBody {
  if (formData.length > 0) {
    return {
      type: 'form-data',
      content: '',
      formData,
    }
  }

  if (!bodyContent) {
    return { type: 'none', content: '' }
  }

  const contentTypeHeader = headers.find(
    header => header.key.toLowerCase() === 'content-type'
  )
  const contentType = contentTypeHeader?.value.toLowerCase() ?? ''

  if (contentType.includes('application/json')) {
    return { type: 'json', content: bodyContent }
  }

  return { type: 'raw', content: bodyContent }
}

function toFormDataField(rawValue: string): FormDataField | null {
  const eqIndex = rawValue.indexOf('=')
  if (eqIndex <= 0) {
    return null
  }

  const key = rawValue.slice(0, eqIndex)
  const value = rawValue.slice(eqIndex + 1)

  if (value.startsWith('@')) {
    const filePath = value.slice(1)
    const fileName = filePath.split('/').pop() || filePath
    return {
      key,
      value: filePath,
      type: 'file',
      fileName,
      enabled: true,
    }
  }

  return {
    key,
    value,
    type: 'text',
    enabled: true,
  }
}

function parseQueryParams(url: string): QueryParam[] {
  try {
    const parsed = new URL(url)
    return Array.from(parsed.searchParams.entries()).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }))
  } catch {
    return []
  }
}

export function parseCurlCommand(input: string): CurlParseResult {
  const tokens = tokenizeCurl(input.trim())
  if (tokens[0] !== 'curl') {
    throw new Error('Input is not a cURL command')
  }

  const headers: Header[] = []
  const warnings: string[] = []
  const formData: FormDataField[] = []
  let method: HttpMethod = 'GET'
  let url = ''
  let bodyContent = ''
  let auth: AuthConfig = { type: 'none' }
  let shellLikeValueDetected = false

  const pushHeader = (header: string) => {
    const colonIndex = header.indexOf(':')
    if (colonIndex <= 0) {
      warnings.push(`Ignored malformed header: ${header}`)
      return
    }

    const key = header.slice(0, colonIndex).trim()
    const value = header.slice(colonIndex + 1).trim()
    if (/\$[{(]?[A-Za-z_][A-Za-z0-9_]*[)}]?/.test(value)) {
      shellLikeValueDetected = true
    }
    headers.push({ key, value, enabled: true })
  }

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i]

    if (SUPPORTED_REQUEST_FLAGS.has(token)) {
      const next = tokens[i + 1]
      if (next) {
        method = next.toUpperCase() as HttpMethod
        i += 1
      }
      continue
    }

    if (SUPPORTED_HEADER_FLAGS.has(token)) {
      const next = tokens[i + 1]
      if (next) {
        pushHeader(next)
        i += 1
      }
      continue
    }

    if (SUPPORTED_DATA_FLAGS.has(token)) {
      const next = tokens[i + 1] ?? ''
      if (/\$[{(]?[A-Za-z_][A-Za-z0-9_]*[)}]?/.test(next)) {
        shellLikeValueDetected = true
      }
      bodyContent = next
      if (method === 'GET') {
        method = 'POST'
      }
      i += 1
      continue
    }

    if (SUPPORTED_FORM_FLAGS.has(token)) {
      const next = tokens[i + 1] ?? ''
      const field = toFormDataField(next)
      if (field) {
        formData.push(field)
        if (method === 'GET') {
          method = 'POST'
        }
      } else {
        warnings.push(`Ignored malformed form field: ${next}`)
      }
      i += 1
      continue
    }

    if (SUPPORTED_USER_FLAGS.has(token)) {
      const next = tokens[i + 1] ?? ''
      const separatorIndex = next.indexOf(':')
      auth = {
        type: 'basic',
        basic: {
          username: separatorIndex >= 0 ? next.slice(0, separatorIndex) : next,
          password: separatorIndex >= 0 ? next.slice(separatorIndex + 1) : '',
        },
      }
      i += 1
      continue
    }

    if (SUPPORTED_COOKIE_FLAGS.has(token)) {
      const next = tokens[i + 1] ?? ''
      headers.push({
        key: 'Cookie',
        value: next,
        enabled: true,
      })
      i += 1
      continue
    }

    if (UNSUPPORTED_FLAGS.has(token)) {
      warnings.push(`Ignored unsupported flag: ${token}`)
      continue
    }

    if (token.startsWith('-')) {
      warnings.push(`Ignored unsupported flag: ${token}`)
      continue
    }

    if (!url) {
      url = token
    }
  }

  if (!url) {
    throw new Error('No URL found in cURL command')
  }

  if (shellLikeValueDetected) {
    warnings.push('Imported shell-like values as literal text')
  }

  return {
    method,
    url,
    headers,
    queryParams: parseQueryParams(url),
    auth,
    body: inferBodyType(headers, bodyContent, formData),
    warnings,
  }
}
