import type { IRouteObject } from '@/providers/Routes/Context'
import { RequestBuilder } from '@/components/request-builder/RequestBuilder'

export const requestBuilderRoutes: IRouteObject[] = [
  {
    path: 'collections/:collectionName/requests/*',
    element: <RequestBuilder />,
  },
]

export default requestBuilderRoutes
