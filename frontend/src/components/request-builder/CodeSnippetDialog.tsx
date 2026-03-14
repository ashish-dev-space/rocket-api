import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MonacoEditor } from '@/components/ui/monaco-editor'
import { generateSnippet, SNIPPET_LANGUAGES, type SnippetLanguage, type CodeGenRequest } from '@/lib/code-generators'
import { Check, Copy } from 'lucide-react'

interface CodeSnippetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: CodeGenRequest
}

const MONACO_LANGUAGES: Record<SnippetLanguage, string> = {
  curl: 'shell',
  python: 'python',
  javascript: 'javascript',
  go: 'go',
}

export function CodeSnippetDialog({ open, onOpenChange, request }: CodeSnippetDialogProps) {
  const [language, setLanguage] = useState<SnippetLanguage>('curl')
  const [copied, setCopied] = useState(false)

  const snippet = useMemo(
    () => generateSnippet(language, request),
    [language, request]
  )

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Generate Code Snippet</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <Select value={language} onValueChange={(v) => setLanguage(v as SnippetLanguage)}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SNIPPET_LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value} className="text-xs">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleCopy} className="ml-auto h-8 text-xs">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="flex-1 min-h-[300px] border rounded overflow-hidden">
          <MonacoEditor
            height="100%"
            language={MONACO_LANGUAGES[language]}
            value={snippet}
            onChange={() => {}}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
