import { useEffect } from 'react'
import { useCollectionsStore } from '@/store/collections'

export function useCollectionSettings(collectionName?: string) {
  const environments = useCollectionsStore(state => state.environments)
  const activeEnvironment = useCollectionsStore(state => state.activeEnvironment)
  const collectionVariables = useCollectionsStore(state => state.collectionVariables)
  const fetchEnvironments = useCollectionsStore(state => state.fetchEnvironments)
  const fetchEnvironmentDetail = useCollectionsStore(state => state.fetchEnvironmentDetail)
  const setActiveEnvironment = useCollectionsStore(state => state.setActiveEnvironment)
  const createEnvironment = useCollectionsStore(state => state.createEnvironment)
  const saveEnvironment = useCollectionsStore(state => state.saveEnvironment)
  const deleteEnvironment = useCollectionsStore(state => state.deleteEnvironment)
  const fetchCollectionVariables = useCollectionsStore(state => state.fetchCollectionVariables)
  const saveCollectionVariables = useCollectionsStore(state => state.saveCollectionVariables)

  useEffect(() => {
    if (!collectionName) {
      return
    }

    fetchEnvironments(collectionName)
    fetchCollectionVariables(collectionName)
  }, [collectionName, fetchEnvironments, fetchCollectionVariables])

  return {
    environments,
    activeEnvironment,
    collectionVariables,
    fetchEnvironments,
    fetchEnvironmentDetail,
    setActiveEnvironment,
    createEnvironment,
    saveEnvironment,
    deleteEnvironment,
    fetchCollectionVariables,
    saveCollectionVariables,
  }
}

export default useCollectionSettings
