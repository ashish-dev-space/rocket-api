import type { IRouteObject } from '@/providers/Routes/Context'
import { CollectionRouteSync, CollectionHistoryRouteSync } from '@/features/collections/route-sync'

export { CollectionRouteSync, CollectionHistoryRouteSync } from '@/features/collections/route-sync'

export const collectionsRoutes: IRouteObject[] = [
  {
    path: 'collections/:collectionName',
    element: <CollectionRouteSync />,
  },
  {
    path: 'collections/:collectionName/history',
    element: <CollectionHistoryRouteSync />,
  },
]

export default collectionsRoutes
