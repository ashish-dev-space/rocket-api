import { AuthConfig, Header, HttpMethod, QueryParam, RequestBody } from '@/types'

export interface CodeGenRequest {
  method: HttpMethod
  url: string
  headers: Header[]
  queryParams: QueryParam[]
  body: RequestBody
  auth: AuthConfig
}

export type SnippetLanguage = 'curl' | 'python' | 'javascript' | 'go'

export const SNIPPET_LANGUAGES: { value: SnippetLanguage; label: string }[] = [
  { value: 'curl', label: 'cURL' },
  { value: 'python', label: 'Python (requests)' },
  { value: 'javascript', label: 'JavaScript (fetch)' },
  { value: 'go', label: 'Go (net/http)' },
]

function buildFullUrl(url: string, queryParams: QueryParam[]): string {
  const enabled = queryParams.filter(q => q.enabled && q.key)
  if (enabled.length === 0) return url

  const separator = url.includes('?') ? '&' : '?'
  const qs = enabled
    .map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
    .join('&')
  return `${url}${separator}${qs}`
}

function getAuthHeaders(auth: AuthConfig): Header[] {
  const headers: Header[] = []
  if (auth.type === 'bearer' && auth.bearer?.token) {
    headers.push({ key: 'Authorization', value: `Bearer ${auth.bearer.token}`, enabled: true })
  } else if (auth.type === 'basic' && auth.basic?.username) {
    const credentials = btoa(`${auth.basic.username}:${auth.basic.password || ''}`)
    headers.push({ key: 'Authorization', value: `Basic ${credentials}`, enabled: true })
  } else if (auth.type === 'api-key' && auth.apiKey?.key && auth.apiKey?.value && auth.apiKey.in === 'header') {
    headers.push({ key: auth.apiKey.key, value: auth.apiKey.value, enabled: true })
  } else if (auth.type === 'oauth2' && auth.oauth2?.accessToken) {
    headers.push({ key: 'Authorization', value: `Bearer ${auth.oauth2.accessToken}`, enabled: true })
  }
  return headers
}

function getBodyContent(body: RequestBody): { content: string; contentType: string | null } {
  if (body.type === 'none') return { content: '', contentType: null }
  if (body.type === 'json') return { content: body.content, contentType: 'application/json' }
  if (body.type === 'raw') return { content: body.content, contentType: 'text/plain' }
  if (body.type === 'x-www-form-urlencoded') {
    const pairs = (body.formData || [])
      .filter(f => f.enabled && f.key)
      .map(f => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
      .join('&')
    return { content: pairs, contentType: 'application/x-www-form-urlencoded' }
  }
  if (body.type === 'form-data') {
    return { content: '', contentType: 'multipart/form-data' }
  }
  return { content: '', contentType: null }
}

function shellEscape(str: string): string {
  if (/^[a-zA-Z0-9._\-/:=@%+,]+$/.test(str)) return str
  return "'" + str.replace(/'/g, "'\\''") + "'"
}

// --- cURL ---

function generateCurl(req: CodeGenRequest): string {
  const fullUrl = buildFullUrl(req.url, req.queryParams)
  const parts: string[] = ['curl']

  if (req.method !== 'GET') {
    parts.push(`-X ${req.method}`)
  }

  parts.push(shellEscape(fullUrl))

  const allHeaders = [
    ...req.headers.filter(h => h.enabled && h.key),
    ...getAuthHeaders(req.auth),
  ]

  // If body needs a content type and not already specified
  const { content, contentType } = getBodyContent(req.body)
  const hasContentType = allHeaders.some(h => h.key.toLowerCase() === 'content-type')
  if (contentType && !hasContentType && req.body.type !== 'form-data') {
    allHeaders.push({ key: 'Content-Type', value: contentType, enabled: true })
  }

  for (const h of allHeaders) {
    parts.push(`-H ${shellEscape(`${h.key}: ${h.value}`)}`)
  }

  if (req.auth.type === 'basic' && req.auth.basic?.username) {
    // Could also use -u flag for basic auth
  }

  if (req.body.type === 'form-data') {
    for (const field of (req.body.formData || []).filter(f => f.enabled && f.key)) {
      if (field.type === 'file') {
        parts.push(`-F ${shellEscape(`${field.key}=@${field.value}`)}`)
      } else {
        parts.push(`-F ${shellEscape(`${field.key}=${field.value}`)}`)
      }
    }
  } else if (content) {
    parts.push(`-d ${shellEscape(content)}`)
  }

  return parts.join(' \\\n  ')
}

// --- Python ---

function generatePython(req: CodeGenRequest): string {
  const lines: string[] = ['import requests', '']

  const fullUrl = buildFullUrl(req.url, req.queryParams)
  lines.push(`url = "${fullUrl}"`)

  const allHeaders = [
    ...req.headers.filter(h => h.enabled && h.key),
    ...getAuthHeaders(req.auth),
  ]

  const { content, contentType } = getBodyContent(req.body)
  const hasContentType = allHeaders.some(h => h.key.toLowerCase() === 'content-type')
  if (contentType && !hasContentType && req.body.type !== 'form-data') {
    allHeaders.push({ key: 'Content-Type', value: contentType, enabled: true })
  }

  if (allHeaders.length > 0) {
    lines.push('headers = {')
    for (const h of allHeaders) {
      lines.push(`    "${h.key}": "${h.value}",`)
    }
    lines.push('}')
  }

  if (req.body.type === 'form-data') {
    const fields = (req.body.formData || []).filter(f => f.enabled && f.key)
    if (fields.length > 0) {
      lines.push('files = {')
      for (const f of fields) {
        if (f.type === 'file') {
          lines.push(`    "${f.key}": open("${f.value}", "rb"),`)
        } else {
          lines.push(`    "${f.key}": (None, "${f.value}"),`)
        }
      }
      lines.push('}')
    }
  } else if (req.body.type === 'x-www-form-urlencoded') {
    const fields = (req.body.formData || []).filter(f => f.enabled && f.key)
    if (fields.length > 0) {
      lines.push('data = {')
      for (const f of fields) {
        lines.push(`    "${f.key}": "${f.value}",`)
      }
      lines.push('}')
    }
  }

  lines.push('')

  const args: string[] = [`"${fullUrl}"`]
  if (allHeaders.length > 0) args.push('headers=headers')

  if (req.body.type === 'form-data') {
    const fields = (req.body.formData || []).filter(f => f.enabled && f.key)
    if (fields.length > 0) args.push('files=files')
  } else if (req.body.type === 'x-www-form-urlencoded') {
    const fields = (req.body.formData || []).filter(f => f.enabled && f.key)
    if (fields.length > 0) args.push('data=data')
  } else if (content) {
    if (req.body.type === 'json') {
      args.push(`json=${content}`)
    } else {
      args.push(`data=${JSON.stringify(content)}`)
    }
  }

  lines.push(`response = requests.${req.method.toLowerCase()}(${args.join(', ')})`)
  lines.push('')
  lines.push('print(response.status_code)')
  lines.push('print(response.text)')

  return lines.join('\n')
}

// --- JavaScript (fetch) ---

function generateJavaScript(req: CodeGenRequest): string {
  const fullUrl = buildFullUrl(req.url, req.queryParams)
  const lines: string[] = []

  const allHeaders = [
    ...req.headers.filter(h => h.enabled && h.key),
    ...getAuthHeaders(req.auth),
  ]

  const { content, contentType } = getBodyContent(req.body)
  const hasContentType = allHeaders.some(h => h.key.toLowerCase() === 'content-type')
  if (contentType && !hasContentType && req.body.type !== 'form-data') {
    allHeaders.push({ key: 'Content-Type', value: contentType, enabled: true })
  }

  if (req.body.type === 'form-data') {
    lines.push('const formData = new FormData();')
    for (const f of (req.body.formData || []).filter(f => f.enabled && f.key)) {
      lines.push(`formData.append("${f.key}", "${f.value}");`)
    }
    lines.push('')
  }

  lines.push(`const response = await fetch("${fullUrl}", {`)
  lines.push(`  method: "${req.method}",`)

  if (allHeaders.length > 0) {
    lines.push('  headers: {')
    for (const h of allHeaders) {
      lines.push(`    "${h.key}": "${h.value}",`)
    }
    lines.push('  },')
  }

  if (req.body.type === 'form-data') {
    lines.push('  body: formData,')
  } else if (content) {
    if (req.body.type === 'json') {
      lines.push(`  body: JSON.stringify(${content}),`)
    } else {
      lines.push(`  body: ${JSON.stringify(content)},`)
    }
  }

  lines.push('});')
  lines.push('')
  lines.push('const data = await response.json();')
  lines.push('console.log(data);')

  return lines.join('\n')
}

// --- Go ---

function generateGo(req: CodeGenRequest): string {
  const fullUrl = buildFullUrl(req.url, req.queryParams)
  const lines: string[] = []

  lines.push('package main')
  lines.push('')
  lines.push('import (')
  lines.push('\t"fmt"')
  lines.push('\t"io"')
  lines.push('\t"net/http"')

  const { content } = getBodyContent(req.body)
  if (content) {
    lines.push('\t"strings"')
  }

  lines.push(')')
  lines.push('')
  lines.push('func main() {')

  if (content) {
    lines.push(`\tbody := strings.NewReader(${JSON.stringify(content)})`)
    lines.push(`\treq, err := http.NewRequest("${req.method}", "${fullUrl}", body)`)
  } else {
    lines.push(`\treq, err := http.NewRequest("${req.method}", "${fullUrl}", nil)`)
  }

  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')

  const allHeaders = [
    ...req.headers.filter(h => h.enabled && h.key),
    ...getAuthHeaders(req.auth),
  ]

  const { contentType } = getBodyContent(req.body)
  const hasContentType = allHeaders.some(h => h.key.toLowerCase() === 'content-type')
  if (contentType && !hasContentType && req.body.type !== 'form-data') {
    allHeaders.push({ key: 'Content-Type', value: contentType, enabled: true })
  }

  for (const h of allHeaders) {
    lines.push(`\treq.Header.Set("${h.key}", "${h.value}")`)
  }

  lines.push('')
  lines.push('\tclient := &http.Client{}')
  lines.push('\tresp, err := client.Do(req)')
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  lines.push('\tdefer resp.Body.Close()')
  lines.push('')
  lines.push('\trespBody, err := io.ReadAll(resp.Body)')
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  lines.push('')
  lines.push('\tfmt.Println(resp.StatusCode)')
  lines.push('\tfmt.Println(string(respBody))')
  lines.push('}')

  return lines.join('\n')
}

export function generateSnippet(language: SnippetLanguage, request: CodeGenRequest): string {
  switch (language) {
    case 'curl': return generateCurl(request)
    case 'python': return generatePython(request)
    case 'javascript': return generateJavaScript(request)
    case 'go': return generateGo(request)
  }
}
