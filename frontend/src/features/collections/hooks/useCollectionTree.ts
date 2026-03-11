import { useEffect } from 'react'
import { useCollectionsStore } from '@/store/collections'

export function useCollectionTree(collectionName?: string) {
  const collectionTree = useCollectionsStore(state => state.collectionTree)
  const isCollectionTreeLoading = useCollectionsStore(state => state.isCollectionTreeLoading)
  const error = useCollectionsStore(state => state.error)
  const fetchCollectionTree = useCollectionsStore(state => state.fetchCollectionTree)

  useEffect(() => {
    if (!collectionName) {
      return
    }

    fetchCollectionTree(collectionName)
  }, [collectionName, fetchCollectionTree])

  return { collectionTree, isCollectionTreeLoading, error, fetchCollectionTree }
}

export default useCollectionTree
