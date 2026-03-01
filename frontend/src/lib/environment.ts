import { Environment, EnvironmentVariable } from '@/types'

/**
 * Substitutes environment variables in a string
 * Variables are in the format {{variableName}}
 */
export function substituteVariables(text: string, environment: Environment | null): string {
  if (!environment || !environment.variables) {
    return text
  }

  // Get enabled variables as a map
  const variables = environment.variables
    .filter((v: EnvironmentVariable) => v.enabled)
    .reduce((acc: Record<string, string>, v: EnvironmentVariable) => {
      acc[v.key] = v.value
      return acc
    }, {})

  // Replace {{variableName}} with the value
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? variables[varName] : match
  })
}

/**
 * Substitutes environment variables in URL, headers, and body
 */
export function substituteRequestVariables(
  url: string,
  headers: Array<{ key: string; value: string; enabled: boolean }>,
  body: string,
  environment: Environment | null
): {
  url: string
  headers: Array<{ key: string; value: string; enabled: boolean }>
  body: string
} {
  // Substitute in URL
  const substitutedUrl = substituteVariables(url, environment)

  // Substitute in headers
  const substitutedHeaders = headers.map(h => ({
    ...h,
    key: substituteVariables(h.key, environment),
    value: substituteVariables(h.value, environment)
  }))

  // Substitute in body
  const substitutedBody = substituteVariables(body, environment)

  return {
    url: substitutedUrl,
    headers: substitutedHeaders,
    body: substitutedBody
  }
}

/**
 * Extracts all variable names from a string
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  
  return matches.map(match => match.slice(2, -2)) // Remove {{ and }}
}

/**
 * Checks if all variables in a string are defined in the environment
 */
export function validateVariables(
  text: string,
  environment: Environment | null
): { valid: boolean; missing: string[] } {
  const variables = extractVariables(text)
  
  if (!environment || variables.length === 0) {
    return { valid: true, missing: [] }
  }

  const enabledVarKeys = new Set(
    environment.variables
      .filter((v: EnvironmentVariable) => v.enabled)
      .map((v: EnvironmentVariable) => v.key)
  )

  const missing = variables.filter(v => !enabledVarKeys.has(v))
  
  return {
    valid: missing.length === 0,
    missing
  }
}