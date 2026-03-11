import type { IRouteObject } from '@/providers/Routes/Context'
import { CollectionHistoryRouteSync } from '@/features/collections/route-sync'

export const historyRoutes: IRouteObject[] = [
  {
    path: 'collections/:collectionName/history',
    element: <CollectionHistoryRouteSync />,
  },
]

export default historyRoutes
