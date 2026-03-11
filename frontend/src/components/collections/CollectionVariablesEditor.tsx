import { useEffect, useState } from 'react'
import { useCollections } from '@/features/collections/hooks/useCollections'
import { useCollectionSettings } from '@/features/collections/hooks/useCollectionSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import type { CollectionVar } from '@/types'

export function CollectionVariablesEditor() {
  const { activeCollection } = useCollections()
  const { collectionVariables, saveCollectionVariables } = useCollectionSettings(
    activeCollection?.name
  )

  const [editingVars, setEditingVars] = useState<CollectionVar[]>(() =>
    collectionVariables.map(v => ({ ...v }))
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [revealedSecrets, setRevealedSecrets] = useState<Set<number>>(new Set())

  useEffect(() => {
    setEditingVars(collectionVariables.map(v => ({ ...v })))
    setIsDirty(false)
    setRevealedSecrets(new Set())
  }, [activeCollection?.name, collectionVariables])

  const handleVarChange = (index: number, field: keyof CollectionVar, value: string | boolean) => {
    setEditingVars(vars => vars.map((v, i) => i === index ? { ...v, [field]: value } : v))
    setIsDirty(true)
  }

  const handleAddVar = () => {
    setEditingVars(vars => [...vars, { key: '', value: '', enabled: true, secret: false }])
    setIsDirty(true)
  }

  const handleDeleteVar = (index: number) => {
    setEditingVars(vars => vars.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  const toggleRevealSecret = (index: number) => {
    setRevealedSecrets(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index); else next.add(index)
      return next
    })
  }

  const handleSave = async () => {
    if (!activeCollection) return
    setIsSaving(true)
    try {
      await saveCollectionVariables(activeCollection.name, editingVars)
      setIsDirty(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-muted px-1 rounded">{'{{variableName}}'}</code> in requests.
          Environment variables override these on collision.
        </p>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="h-7 text-xs"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
          Save
        </Button>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 px-1">
        <span className="text-xs font-medium text-muted-foreground">Key</span>
        <span className="text-xs font-medium text-muted-foreground">Value</span>
        <span className="text-xs font-medium text-muted-foreground w-8 text-center">Secret</span>
        <span className="text-xs font-medium text-muted-foreground w-8 text-center">On</span>
        <span className="w-7" />
      </div>

      {/* Variable rows */}
      <div className="space-y-1.5">
        {editingVars.map((v, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center">
            <Input
              value={v.key}
              onChange={e => handleVarChange(i, 'key', e.target.value)}
              placeholder="variable_name"
              className="h-7 text-xs font-mono"
            />
            <div className="relative">
              <Input
                value={v.value}
                onChange={e => handleVarChange(i, 'value', e.target.value)}
                placeholder="value"
                type={v.secret && !revealedSecrets.has(i) ? 'password' : 'text'}
                className="h-7 text-xs font-mono pr-7"
              />
              {v.secret && (
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => toggleRevealSecret(i)}
                  title={revealedSecrets.has(i) ? 'Hide value' : 'Reveal value'}
                >
                  {revealedSecrets.has(i) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            <button
              type="button"
              title="Mark as secret"
              className={`h-7 w-8 flex items-center justify-center rounded transition-colors ${
                v.secret ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleVarChange(i, 'secret', !v.secret)}
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={v.enabled ? 'Disable variable' : 'Enable variable'}
              className={`h-7 w-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                v.enabled ? 'text-foreground' : 'text-muted-foreground'
              }`}
              onClick={() => handleVarChange(i, 'enabled', !v.enabled)}
            >
              {v.enabled ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => handleDeleteVar(i)}
              title="Delete variable"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs w-full justify-start"
        onClick={handleAddVar}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add variable
      </Button>
    </div>
  )
}
