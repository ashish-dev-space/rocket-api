import { create } from 'zustand'
import { HttpRequest, HttpMethod, Header, QueryParam, RequestBody, AuthConfig } from '@/types'

interface RequestState {
  // Current request being edited
  currentRequest: HttpRequest | null
  
  // Request metadata
  isDirty: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  createNewRequest: () => void
  loadRequest: (request: HttpRequest) => void
  updateRequest: (updates: Partial<HttpRequest>) => void
  updateMethod: (method: HttpMethod) => void
  updateUrl: (url: string) => void
  updateHeaders: (headers: Header[]) => void
  updateQueryParams: (params: QueryParam[]) => void
  updateBody: (body: RequestBody) => void
  updateAuth: (auth: AuthConfig) => void
  
  // Save/Load from backend
  saveRequest: (collectionName: string, path?: string) => Promise<void>
  loadRequestFromPath: (collectionName: string, path: string) => Promise<void>
  
  // Reset
  resetRequest: () => void
  setError: (error: string | null) => void
}

const createDefaultRequest = (): HttpRequest => ({
  id: Date.now().toString(),
  name: 'Untitled Request',
  method: 'GET',
  url: '',
  headers: [
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ],
  queryParams: [],
  body: {
    type: 'none',
    content: ''
  },
  auth: {
    type: 'none'
  }
})

export const useRequestStore = create<RequestState>((set, get) => ({
  currentRequest: createDefaultRequest(),
  isDirty: false,
  isLoading: false,
  error: null,
  
  createNewRequest: () => {
    set({
      currentRequest: createDefaultRequest(),
      isDirty: false,
      error: null
    })
  },
  
  loadRequest: (request: HttpRequest) => {
    set({
      currentRequest: { ...request },
      isDirty: false,
      error: null
    })
  },
  
  updateRequest: (updates: Partial<HttpRequest>) => {
    const { currentRequest } = get()
    if (currentRequest) {
      set({
        currentRequest: { ...currentRequest, ...updates },
        isDirty: true
      })
    }
  },
  
  updateMethod: (method: HttpMethod) => {
    const { currentRequest } = get()
    if (currentRequest) {
      set({
        currentRequest: { ...currentRequest, method },
        isDirty: true
      })
    }
  },
  
  updateUrl: (url: string) => {
    const { currentRequest } = get()
    if (currentRequest) {
      set({
        currentRequest: { ...currentRequest, url },
        isDirty: true
      })
    }
  },
  
  updateHeaders: (headers: Header[]) => {
    const { currentRequest } = get()
    if (currentRequest) {
      set({
        currentRequest: { ...currentRequest, headers },
        isDirty: true
      })
    }
  },
  
  updateQueryParams: (queryParams: QueryParam[]) => {
    const { currentRequest } = get()
    if (currentRequest) {
      set({
        currentRequest: { ...currentRequest, queryParams },
        isDirty: true
      })
    }
  },
  
  updateBody: (body: RequestBody) => {
    const { currentRequest } = get()
    if (currentRequest) {
      set({
        currentRequest: { ...currentRequest, body },
        isDirty: true
      })
    }
  },
  
  updateAuth: (auth: AuthConfig) => {
    const { currentRequest } = get()
    if (currentRequest) {
      set({
        currentRequest: { ...currentRequest, auth },
        isDirty: true
      })
    }
  },
  
  saveRequest: async (collectionName: string, path?: string) => {
    const { currentRequest } = get()
    if (!currentRequest) return
    
    set({ isLoading: true, error: null })
    
    try {
      const { apiService } = await import('@/lib/api')
      
      // Convert HttpRequest to BruFile format
      const bruFile = {
        meta: {
          name: currentRequest.name,
          type: 'http' as const,
          seq: 1
        },
        http: {
          method: currentRequest.method,
          url: currentRequest.url,
          headers: currentRequest.headers.filter(h => h.enabled).map(h => ({
            key: h.key,
            value: h.value
          })),
          queryParams: currentRequest.queryParams.filter(q => q.enabled).map(q => ({
            key: q.key,
            value: q.value,
            enabled: q.enabled
          })),
          auth: currentRequest.auth.type !== 'none' ? {
            type: currentRequest.auth.type,
            basic: currentRequest.auth.basic,
            bearer: currentRequest.auth.bearer,
            apiKey: currentRequest.auth.apiKey
          } : undefined
        },
        body: {
          type: currentRequest.body.type,
          data: currentRequest.body.content,
          formData: currentRequest.body.formData,
          fileName: currentRequest.body.fileName
        }
      }
      
      await apiService.saveRequest(collectionName, path, bruFile)
      set({ isDirty: false, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save request',
        isLoading: false
      })
    }
  },
  
  loadRequestFromPath: async (collectionName: string, path: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const { apiService } = await import('@/lib/api')
      const bruFile = await apiService.getRequest(collectionName, path) as {
        meta: { name: string }
        http: {
          method: HttpMethod
          url: string
          headers: Array<{ key: string; value: string }>
          queryParams?: Array<{ key: string; value: string; enabled: boolean }>
          auth?: {
            type: 'none' | 'basic' | 'bearer' | 'api-key'
            basic?: { username: string; password: string }
            bearer?: { token: string }
            apiKey?: { key: string; value: string; in: 'header' | 'query' }
          }
        }
        body: { 
          type: string
          data?: string
          formData?: Array<{
            key: string
            value: string
            type: 'text' | 'file'
            fileName?: string
            fileContent?: string
            enabled: boolean
          }>
          fileName?: string
        }
      }
      
      // Convert BruFile to HttpRequest
      const request: HttpRequest = {
        id: Date.now().toString(),
        name: bruFile.meta.name,
        method: bruFile.http.method,
        url: bruFile.http.url,
        headers: bruFile.http.headers.map(h => ({
          key: h.key,
          value: h.value,
          enabled: true
        })),
        queryParams: bruFile.http.queryParams?.map(q => ({
          key: q.key,
          value: q.value,
          enabled: q.enabled
        })) || [],
        body: {
          type: (bruFile.body.type as 'none' | 'json' | 'form-data' | 'raw' | 'binary') || 'none',
          content: bruFile.body.data || '',
          formData: bruFile.body.formData,
          fileName: bruFile.body.fileName
        },
        auth: bruFile.http.auth || {
          type: 'none'
        }
      }
      
      set({
        currentRequest: request,
        isDirty: false,
        isLoading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load request',
        isLoading: false
      })
    }
  },
  
  resetRequest: () => {
    set({
      currentRequest: createDefaultRequest(),
      isDirty: false,
      error: null
    })
  },
  
  setError: (error: string | null) => {
    set({ error })
  }
}))