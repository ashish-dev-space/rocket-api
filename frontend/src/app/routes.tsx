import { IRouteObject } from '@/providers/Routes/Context'
import { workspaceRoutes } from '@/features/workspace/routes'
import { NotFoundPage } from '@/routes/NotFoundPage'

export const routes: IRouteObject[] = [
  ...workspaceRoutes,
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

export default routes
