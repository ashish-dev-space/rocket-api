import type { IRouteObject } from '@/providers/Routes/Context'
import { CollectionOverview } from '@/components/collections/CollectionOverview'

export const collectionsRoutes: IRouteObject[] = [
  {
    path: 'collections/:collectionName',
    element: <CollectionOverview />,
  },
  {
    path: 'collections/:collectionName/history',
    element: <CollectionOverview />,
  },
]

export default collectionsRoutes
