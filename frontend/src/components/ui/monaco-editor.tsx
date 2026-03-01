import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
}

const SUPPORTED_LANGUAGES = [
  { value: 'json', label: 'JSON', icon: '{ }' },
  { value: 'javascript', label: 'JavaScript', icon: 'JS' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS' },
  { value: 'html', label: 'HTML', icon: '</>' },
  { value: 'xml', label: 'XML', icon: '</>' },
  { value: 'yaml', label: 'YAML', icon: 'YML' },
  { value: 'plaintext', label: 'Plain Text', icon: 'TXT' },
  { value: 'graphql', label: 'GraphQL', icon: 'GQL' },
  { value: 'sql', label: 'SQL', icon: 'SQL' },
]

export function MonacoEditor({
  value,
  onChange,
  language = 'json',
  height = '200px',
}: MonacoEditorProps) {
  const { theme } = useTheme()
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs-light'

  return (
    <div className="relative" style={{ height }}>
      <Editor
        height={height}
        language={language}
        value={value}
        theme={editorTheme}
        onChange={(newValue) => onChange(newValue || '')}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Loading editor...
          </div>
        }
      />
    </div>
  )
}

export { SUPPORTED_LANGUAGES }