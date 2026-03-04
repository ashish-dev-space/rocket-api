import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CollectionVar, Environment } from '@/types'

interface VariableAwareUrlInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  activeEnvironment: Environment | null
  collectionVariables: CollectionVar[]
  onSaveVariable: (name: string, value: string) => Promise<void>
}

interface UrlToken {
  name: string
  source: 'env' | 'collection' | 'missing'
  value: string
}

const tokenRegex = /\{\{([^}]+)\}\}/g

const parseTokens = (
  url: string,
  activeEnvironment: Environment | null,
  collectionVariables: CollectionVar[]
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

  for (const match of url.matchAll(tokenRegex)) {
    const name = match[1].trim()
    if (!name || seen.has(name)) continue
    seen.add(name)

    if (envMap.has(name)) {
      tokens.push({ name, source: 'env', value: envMap.get(name) ?? '' })
      continue
    }
    if (collectionMap.has(name)) {
      tokens.push({ name, source: 'collection', value: collectionMap.get(name) ?? '' })
      continue
    }
    tokens.push({ name, source: 'missing', value: '' })
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
  onSaveVariable,
}: VariableAwareUrlInputProps) {
  const tokens = useMemo(
    () => parseTokens(value, activeEnvironment, collectionVariables),
    [value, activeEnvironment, collectionVariables]
  )

  const [editingVarName, setEditingVarName] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const tokenByName = useMemo(() => new Map(tokens.map(t => [t.name, t])), [tokens])
  const activeToken = editingVarName ? tokenByName.get(editingVarName) ?? null : null

  const openEditor = (token: UrlToken) => {
    setEditingVarName(token.name)
    setEditingValue(token.value)
  }

  const closeEditor = () => {
    setEditingVarName(null)
    setEditingValue('')
    setIsSaving(false)
  }

  const handleSave = async () => {
    if (!editingVarName) return
    setIsSaving(true)
    try {
      await onSaveVariable(editingVarName, editingValue)
      closeEditor()
    } finally {
      setIsSaving(false)
    }
  }

  const tokenBadgeClass = (source: UrlToken['source']) => {
    if (source === 'env') return 'bg-primary/15 text-primary border-primary/30'
    if (source === 'collection') return 'bg-accent text-accent-foreground border-border/70'
    return 'bg-destructive/10 text-destructive border-destructive/30'
  }

  return (
    <div className="space-y-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />

      {tokens.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap min-h-[1.5rem]">
          {tokens.map(token => (
            <button
              key={token.name}
              type="button"
              onMouseEnter={() => openEditor(token)}
              onFocus={() => openEditor(token)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${tokenBadgeClass(token.source)}`}
              title={token.source === 'missing' ? 'Missing variable' : 'Edit variable value'}
            >
              {`{{${token.name}}}`}
            </button>
          ))}
        </div>
      )}

      {activeToken && (
        <div className="rounded-md border border-border bg-card p-2.5 shadow-sm space-y-2 max-w-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{`{{${activeToken.name}}}`}</span>
            <span className="text-muted-foreground capitalize">{activeToken.source}</span>
          </div>
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="h-8 text-xs"
            placeholder="Variable value"
            autoFocus
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
              onClick={handleSave}
              disabled={isSaving}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
