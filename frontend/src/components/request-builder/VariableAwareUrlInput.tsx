import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CollectionVar, Environment, QueryParam } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface VariableAwareUrlInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  activeEnvironment: Environment | null
  collectionVariables: CollectionVar[]
  pathParams?: QueryParam[]
  queryParams?: QueryParam[]
  onSaveVariable: (name: string, value: string) => Promise<void>
  onSaveParamToken?: (name: string, value: string, target: 'path' | 'query') => Promise<void> | void
}

interface UrlToken {
  name: string
  kind: 'template' | 'param'
  source: 'env' | 'collection' | 'param' | 'missing'
  value: string
  target?: 'path' | 'query'
}

const templateTokenRegex = /\{\{([^}]+)\}\}/g
const paramTokenRegex = /:([A-Za-z_][A-Za-z0-9_]*)/g
const highlightTokenRegex = /\{\{[^}]+\}\}|:[A-Za-z_][A-Za-z0-9_]*/g

const parseTokens = (
  url: string,
  activeEnvironment: Environment | null,
  collectionVariables: CollectionVar[],
  pathParams: QueryParam[],
  queryParams: QueryParam[]
): UrlToken[] => {
  const seen = new Set<string>()
  const tokens: UrlToken[] = []

  const envMap = new Map(
    (activeEnvironment?.variables ?? [])
      .filter(v => v.enabled && v.key)
      .map(v => [v.key, v.value])
  )
  const collectionMap = new Map(
    collectionVariables
      .filter(v => v.enabled && v.key)
      .map(v => [v.key, v.value])
  )
  const pathMap = new Map(
    pathParams
      .filter(v => v.enabled && v.key)
      .map(v => [v.key, v.value])
  )
  const queryMap = new Map(
    queryParams
      .filter(v => v.enabled && v.key)
      .map(v => [v.key, v.value])
  )

  for (const match of url.matchAll(templateTokenRegex)) {
    const name = match[1].trim()
    const key = `template:${name}`
    if (!name || seen.has(key)) continue
    seen.add(key)

    if (envMap.has(name)) {
      tokens.push({ name, kind: 'template', source: 'env', value: envMap.get(name) ?? '' })
      continue
    }
    if (collectionMap.has(name)) {
      tokens.push({ name, kind: 'template', source: 'collection', value: collectionMap.get(name) ?? '' })
      continue
    }
    tokens.push({ name, kind: 'template', source: 'missing', value: '' })
  }

  for (const match of url.matchAll(paramTokenRegex)) {
    const name = match[1].trim()
    const matchIndex = match.index ?? 0
    const queryStart = url.indexOf('?')
    const target: 'path' | 'query' = queryStart >= 0 && matchIndex > queryStart ? 'query' : 'path'
    const key = `param:${target}:${name}`
    if (!name || seen.has(key)) continue
    seen.add(key)

    if (target === 'path' && pathMap.has(name)) {
      tokens.push({ name, kind: 'param', source: 'param', value: pathMap.get(name) ?? '', target })
      continue
    }
    if (target === 'query' && queryMap.has(name)) {
      tokens.push({ name, kind: 'param', source: 'param', value: queryMap.get(name) ?? '', target })
      continue
    }
    if (envMap.has(name)) {
      tokens.push({ name, kind: 'param', source: 'env', value: envMap.get(name) ?? '', target })
      continue
    }
    if (collectionMap.has(name)) {
      tokens.push({ name, kind: 'param', source: 'collection', value: collectionMap.get(name) ?? '', target })
      continue
    }
    tokens.push({ name, kind: 'param', source: 'missing', value: '', target })
  }

  return tokens
}

export function VariableAwareUrlInput({
  value,
  onChange,
  placeholder,
  className,
  activeEnvironment,
  collectionVariables,
  pathParams = [],
  queryParams = [],
  onSaveVariable,
  onSaveParamToken,
}: VariableAwareUrlInputProps) {
  const tokens = useMemo(
    () => parseTokens(value, activeEnvironment, collectionVariables, pathParams, queryParams),
    [value, activeEnvironment, collectionVariables, pathParams, queryParams]
  )

  const [editingTokenKey, setEditingTokenKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const hoveredTokenRef = useRef<string | null>(null)
  const isContentHoveredRef = useRef(false)
  const suppressedReopenTokenRef = useRef<string | null>(null)
  const editingTokenKeyRef = useRef<string | null>(null)

  const tokenKey = (token: UrlToken) => `${token.kind}:${token.target ?? 'na'}:${token.name}`
  const tokenByKey = useMemo(() => new Map(tokens.map(t => [tokenKey(t), t])), [tokens])

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openEditor = (token: UrlToken) => {
    const key = tokenKey(token)
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (suppressedReopenTokenRef.current === key) {
      return
    }
    if (editingTokenKey !== key) {
      setEditingTokenKey(key)
      setEditingValue(token.value)
    }
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      if (hoveredTokenRef.current || isContentHoveredRef.current) {
        return
      }
      if (editingTokenKeyRef.current) {
        suppressedReopenTokenRef.current = editingTokenKeyRef.current
      }
      closeEditor()
    }, 220)
  }

  const closeEditor = () => {
    setEditingTokenKey(null)
    setEditingValue('')
    setIsSaving(false)
  }

  useEffect(() => {
    editingTokenKeyRef.current = editingTokenKey
  }, [editingTokenKey])

  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  const handleTokenPointerEnter = (token: UrlToken) => {
    hoveredTokenRef.current = token.name
    openEditor(token)
  }

  const handleTokenPointerLeave = (tokenName: string) => {
    if (hoveredTokenRef.current === tokenName) {
      hoveredTokenRef.current = null
    }
    if (suppressedReopenTokenRef.current === tokenName) {
      suppressedReopenTokenRef.current = null
    }
    scheduleClose()
  }

  const handleSave = async () => {
    const token = editingTokenKey ? tokenByKey.get(editingTokenKey) : undefined
    if (!token) return
    setIsSaving(true)
    try {
      if (token.kind === 'template') {
        await onSaveVariable(token.name, editingValue)
      } else if (token.target && onSaveParamToken) {
        await onSaveParamToken(token.name, editingValue, token.target)
      }
      closeEditor()
    } finally {
      setIsSaving(false)
    }
  }

  const tokenBadgeClass = (source: UrlToken['source']) => {
    if (source === 'env') return 'bg-primary/15 text-primary border-primary/30'
    if (source === 'param') return 'bg-amber-500/15 text-amber-700 border-amber-500/35'
    if (source === 'collection') return 'bg-accent text-accent-foreground border-border/70'
    return 'bg-destructive/10 text-destructive border-destructive/30'
  }

  const renderHighlightedValue = () => {
    if (!value) return null

    const parts: Array<{ type: 'text' | 'token'; value: string; name?: string; kind?: 'template' | 'param' }> = []
    let lastIndex = 0

    for (const match of value.matchAll(highlightTokenRegex)) {
      const start = match.index ?? 0
      const full = match[0]
      const isTemplate = full.startsWith('{{')
      const name = isTemplate
        ? full.slice(2, -2).trim()
        : full.slice(1).trim()
      if (start > lastIndex) {
        parts.push({ type: 'text', value: value.slice(lastIndex, start) })
      }
      parts.push({ type: 'token', value: full, name, kind: isTemplate ? 'template' : 'param' })
      lastIndex = start + full.length
    }
    if (lastIndex < value.length) {
      parts.push({ type: 'text', value: value.slice(lastIndex) })
    }

    return parts.map((part, idx) => {
      if (part.type === 'text') {
        return (
          <span key={`text-${idx}`} className="text-foreground/85">
            {part.value}
          </span>
        )
      }
      const syntheticToken: UrlToken | null =
        part.name && part.kind
          ? ({
              name: part.name,
              kind: part.kind,
              source: 'missing',
              value: '',
              target: part.kind === 'param' ? (value.indexOf('?') >= 0 && value.indexOf(part.value) > value.indexOf('?') ? 'query' : 'path') : undefined,
            } as UrlToken)
          : null
      const token = syntheticToken ? tokenByKey.get(tokenKey(syntheticToken)) ?? syntheticToken : null
      const source = token?.source ?? 'missing'
      return (
        <DropdownMenu
          key={`token-${idx}`}
          open={token ? editingTokenKey === tokenKey(token) : false}
          modal={false}
        >
          <DropdownMenuTrigger asChild>
            <span
              onPointerEnter={() => token && handleTokenPointerEnter(token)}
              onPointerLeave={() => {
                if (!token) return
                handleTokenPointerLeave(tokenKey(token))
              }}
              onFocus={() => token && openEditor(token)}
              className={`pointer-events-auto rounded px-0.5 border cursor-pointer ${tokenBadgeClass(source)}`}
              title={
                token?.kind === 'template'
                  ? source === 'missing' ? 'Missing variable' : 'Edit variable value'
                  : source === 'missing' ? 'Missing path/query value' : 'Edit path/query value'
              }
              tabIndex={0}
            >
              {part.value}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 p-3 space-y-2"
            onMouseEnter={() => {
              isContentHoveredRef.current = true
              clearCloseTimer()
            }}
            onMouseLeave={() => {
              isContentHoveredRef.current = false
              scheduleClose()
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {token?.kind === 'template'
                  ? `{{${token?.name ?? part.name ?? ''}}}`
                  : `:${token?.name ?? part.name ?? ''}`}
              </span>
              <span className="text-muted-foreground capitalize">
                {token?.kind === 'param' ? (token.target ?? 'param') : source}
              </span>
            </div>
            <Input
              value={token && editingTokenKey === tokenKey(token) ? editingValue : token?.value ?? ''}
              onChange={(e) => {
                if (!token) return
                const key = tokenKey(token)
                if (editingTokenKey !== key) {
                  setEditingTokenKey(key)
                }
                setEditingValue(e.target.value)
              }}
              className="h-8 text-xs"
              placeholder={token?.kind === 'template' ? 'Variable value' : 'Parameter value'}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={closeEditor}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={async () => {
                  if (!token) return
                  const key = tokenKey(token)
                  if (editingTokenKey !== key) {
                    setEditingTokenKey(key)
                    setEditingValue(token?.value ?? '')
                    if (token.kind === 'template') {
                      await onSaveVariable(token.name, token?.value ?? '')
                    } else if (token.target && onSaveParamToken) {
                      await onSaveParamToken(token.name, token?.value ?? '', token.target)
                    }
                    closeEditor()
                    return
                  }
                  await handleSave()
                }}
                disabled={isSaving}
              >
                Save
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    })
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${className ?? ''} ${value ? 'text-transparent caret-foreground' : ''}`}
        />
        {value && (
          <div className="absolute inset-0 px-3 flex items-center pointer-events-none overflow-hidden">
            <div className="w-full truncate text-sm font-mono leading-none">
              {renderHighlightedValue()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
