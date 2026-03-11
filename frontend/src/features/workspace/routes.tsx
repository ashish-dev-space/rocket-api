import type { IRouteObject } from '@/providers/Routes/Context'
import App from '@/App'
import { collectionsRoutes } from '@/features/collections/routes'
import { historyRoutes } from '@/features/history/routes'
import { requestBuilderRoutes } from '@/features/request-builder/routes'

export const workspaceRoutes: IRouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      ...collectionsRoutes,
      ...requestBuilderRoutes,
      ...historyRoutes,
    ],
  },
]

export default workspaceRoutes
