import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WorkspaceShell } from '@/features/workspace/components/WorkspaceShell'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceShell />
    </QueryClientProvider>
  )
}

export default App
