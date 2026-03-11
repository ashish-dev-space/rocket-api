import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTabsStore, isRequestTab } from '@/store/tabs-store'

function encodeRoutePath(path: string) {
  return path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

function buildTabPath(tab: ReturnType<typeof useTabsStore.getState>['tabs'][number] | undefined) {
  if (!tab) {
    return '/'
  }

  if (isRequestTab(tab)) {
    if (!tab.collectionName || !tab.filePath) {
      return '/'
    }

    return `/collections/${encodeURIComponent(tab.collectionName)}/requests/${encodeRoutePath(tab.filePath)}`
  }

  return `/collections/${encodeURIComponent(tab.collectionName)}`
}

export function useRouteSyncedTabs() {
  const navigate = useNavigate()
  const location = useLocation()
  const tabs = useTabsStore(state => state.tabs)
  const activeTabId = useTabsStore(state => state.activeTabId)

  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId),
    [tabs, activeTabId]
  )

  useEffect(() => {
    const targetPath = buildTabPath(activeTab)
    if (location.pathname === targetPath) {
      return
    }

    if (!activeTab && location.pathname !== '/') {
      return
    }

    navigate(targetPath, { replace: true })
  }, [activeTab, location.pathname, navigate])
}

export default useRouteSyncedTabs
