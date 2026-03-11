import type { IRouteObject } from '@/providers/Routes/Context'
import App from '@/App'

export const workspaceRoutes: IRouteObject[] = [
  {
    path: '/',
    element: <App />,
  },
]

export default workspaceRoutes
