import type { IRouteObject } from '@/providers/Routes/Context'
import { useEffect } from 'react'
import { useRequestRouteState } from '@/features/request-builder/hooks/useRequestRouteState'
import { useCollectionsStore } from '@/store/collections'
import { useTabsStore } from '@/store/tabs-store'

export function RequestRouteSync() {
  const { collectionName, requestPath } = useRequestRouteState()
  const collections = useCollectionsStore(state => state.collections)
  const setActiveCollection = useCollectionsStore(state => state.setActiveCollection)
  const loadRequestFromPath = useTabsStore(state => state.loadRequestFromPath)

  useEffect(() => {
    if (!collectionName || !requestPath) {
      return
    }

    const collection = collections.find(item => item.name === collectionName)
    if (collection) {
      setActiveCollection(collection)
    }

    loadRequestFromPath(collectionName, requestPath)
  }, [collectionName, requestPath, collections, loadRequestFromPath, setActiveCollection])

  return null
}

export const requestBuilderRoutes: IRouteObject[] = [
  {
    path: 'collections/:collectionName/requests/*',
    element: <RequestRouteSync />,
  },
]

export default requestBuilderRoutes
