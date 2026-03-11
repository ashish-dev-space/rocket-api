import type { IRouteObject } from '@/providers/Routes/Context'
import { CollectionOverview } from '@/components/collections/CollectionOverview'

export const historyRoutes: IRouteObject[] = [
  {
    path: 'collections/:collectionName/history',
    element: <CollectionOverview />,
  },
]

export default historyRoutes
