import type { CollectionNode } from '@/lib/api'

export interface CollectionStats {
  totalRequests: number
  totalFolders: number
  methodCounts: Record<string, number>
  environmentsCount: number
}

export function computeCollectionStats(
  tree: CollectionNode,
  environmentsCount: number
): CollectionStats {
  let totalRequests = 0
  let totalFolders = 0
  const methodCounts: Record<string, number> = {}

  function traverse(node: CollectionNode) {
    if (node.type === 'request') {
      totalRequests++
      const method = node.method ?? 'GET'
      methodCounts[method] = (methodCounts[method] ?? 0) + 1
    } else if (node.type === 'folder') {
      totalFolders++
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }

  traverse(tree)

  return { totalRequests, totalFolders, methodCounts, environmentsCount }
}
