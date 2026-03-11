import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCollectionsStore } from '@/store/collections'
import { useTabsStore } from '@/store/tabs-store'

function useCollectionRouteSync() {
  const { collectionName: rawCollectionName } = useParams()
  const collectionName = rawCollectionName ? decodeURIComponent(rawCollectionName) : ''
  const collections = useCollectionsStore(state => state.collections)
  const setActiveCollection = useCollectionsStore(state => state.setActiveCollection)
  const openCollectionOverview = useTabsStore(state => state.openCollectionOverview)

  useEffect(() => {
    if (!collectionName) {
      return
    }

    const collection = collections.find(item => item.name === collectionName)
    if (collection) {
      setActiveCollection(collection)
    }

    openCollectionOverview(collectionName)
  }, [collectionName, collections, openCollectionOverview, setActiveCollection])
}

export function CollectionRouteSync() {
  useCollectionRouteSync()
  return null
}

export function CollectionHistoryRouteSync() {
  useCollectionRouteSync()
  return null
}
