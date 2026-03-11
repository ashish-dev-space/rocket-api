import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

function decodeRoutePath(path: string) {
  return path
    .split('/')
    .map(segment => decodeURIComponent(segment))
    .join('/')
}

export function useRequestRouteState() {
  const params = useParams()

  return useMemo(() => {
    const collectionName = params.collectionName
      ? decodeURIComponent(params.collectionName)
      : ''
    const requestPath = params['*'] ? decodeRoutePath(params['*']) : ''

    return {
      collectionName,
      requestPath,
    }
  }, [params])
}

export default useRequestRouteState
