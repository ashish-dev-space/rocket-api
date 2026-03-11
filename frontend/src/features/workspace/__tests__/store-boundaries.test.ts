import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../../../..')

const filesToCheck = [
  'src/components/collections/CollectionsSidebar.tsx',
  'src/components/collections/CollectionOverview.tsx',
  'src/components/collections/EnvironmentsDialog.tsx',
  'src/components/collections/CollectionVariablesEditor.tsx',
  'src/components/request-builder/RequestTabs.tsx',
  'src/components/layout/GlobalStatusBar.tsx',
]

describe('feature component store boundaries', () => {
  it.each(filesToCheck)(
    'avoids direct collections/history store imports in %s',
    (relativePath) => {
      const source = readFileSync(resolve(root, relativePath), 'utf8')

      expect(source).not.toContain("from '@/store/collections'")
      expect(source).not.toContain("from '@/store/history'")
    }
  )
})
