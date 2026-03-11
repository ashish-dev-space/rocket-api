import { describe, expect, it } from 'vitest'
import { parseCurlCommand } from '@/lib/curl-parser'

describe('parseCurlCommand', () => {
  it('parses a JSON curl command with method, headers, and raw body', () => {
    const result = parseCurlCommand(
      `curl --request POST 'https://api.example.com/users?status=active' \
      --header 'Content-Type: application/json' \
      --header 'X-Trace-Id: abc-123' \
      --data-raw '{"name":"Rocket"}'`
    )

    expect(result.method).toBe('POST')
    expect(result.url).toBe('https://api.example.com/users?status=active')
    expect(result.headers).toEqual([
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'X-Trace-Id', value: 'abc-123', enabled: true },
    ])
    expect(result.body.type).toBe('json')
    expect(result.body.content).toBe('{"name":"Rocket"}')
    expect(result.warnings).toEqual([])
  })

  it('parses multipart curl fields and file parts', () => {
    const result = parseCurlCommand(
      `curl -X POST https://uploads.example.com \
      -F 'title=Spec' \
      -F 'attachment=@/tmp/spec.pdf'`
    )

    expect(result.method).toBe('POST')
    expect(result.url).toBe('https://uploads.example.com')
    expect(result.body.type).toBe('form-data')
    expect(result.body.formData).toEqual([
      {
        key: 'title',
        value: 'Spec',
        type: 'text',
        enabled: true,
      },
      {
        key: 'attachment',
        value: '/tmp/spec.pdf',
        type: 'file',
        fileName: 'spec.pdf',
        enabled: true,
      },
    ])
  })

  it('parses basic auth and cookie flags', () => {
    const result = parseCurlCommand(
      `curl https://api.example.com/me -u 'demo:s3cret' -b 'session=abc123; theme=dark'`
    )

    expect(result.auth).toEqual({
      type: 'basic',
      basic: {
        username: 'demo',
        password: 's3cret',
      },
    })
    expect(result.headers).toContainEqual({
      key: 'Cookie',
      value: 'session=abc123; theme=dark',
      enabled: true,
    })
  })

  it('records warnings for unsupported flags without failing the import', () => {
    const result = parseCurlCommand(
      `curl https://api.example.com/users --compressed --location`
    )

    expect(result.url).toBe('https://api.example.com/users')
    expect(result.warnings).toEqual([
      'Ignored unsupported flag: --compressed',
      'Ignored unsupported flag: --location',
    ])
  })

  it('keeps unresolved shell-like values as literal text and warns', () => {
    const result = parseCurlCommand(
      `curl https://api.example.com/users -H "Authorization: Bearer $TOKEN" --data-raw '{"name":"$USER"}'`
    )

    expect(result.headers).toContainEqual({
      key: 'Authorization',
      value: 'Bearer $TOKEN',
      enabled: true,
    })
    expect(result.body.content).toBe('{"name":"$USER"}')
    expect(result.warnings).toContain('Imported shell-like values as literal text')
  })
})
