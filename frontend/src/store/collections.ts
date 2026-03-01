import { create } from 'zustand'
import { Environment } from '@/types'
import { apiService, CollectionSummary, CollectionNode } from '@/lib/api'

interface CollectionsState {
  collections: CollectionSummary[]
  collectionTree: CollectionNode | null
  environments: Environment[]
  activeCollection: CollectionSummary | null
  activeEnvironment: Environment | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCollections: () => Promise<void>
  fetchCollectionTree: (name: string) => Promise<void>
  createCollection: (name: string) => Promise<void>
  deleteCollection: (name: string) => Promise<void>
  setActiveCollection: (collection: CollectionSummary | null) => void
  
  fetchEnvironments: (collection: string) => Promise<void>
  setActiveEnvironment: (environment: Environment | null) => void
  
  // Import/Export
  importBruno: (file: File, name?: string) => Promise<void>
  importPostman: (collection: unknown) => Promise<void>
  exportBruno: (collection: string) => Promise<void>
  exportPostman: (collection: string) => Promise<void>
  
  setError: (error: string | null) => void
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  collectionTree: null,
  environments: [],
  activeCollection: null,
  activeEnvironment: null,
  isLoading: false,
  error: null,
  
  fetchCollections: async () => {
    set({ isLoading: true, error: null })
    try {
      const collections = await apiService.getCollections()
      set({ collections, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch collections',
        isLoading: false 
      })
    }
  },
  
  fetchCollectionTree: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const tree = await apiService.getCollection(name)
      set({ collectionTree: tree, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch collection tree',
        isLoading: false 
      })
    }
  },
  
  createCollection: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const collection = await apiService.createCollection(name)
      set((state) => ({ 
        collections: [...state.collections, collection],
        isLoading: false 
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create collection',
        isLoading: false 
      })
    }
  },
  
  deleteCollection: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiService.deleteCollection(name)
      set((state) => ({ 
        collections: state.collections.filter(c => c.name !== name),
        activeCollection: state.activeCollection?.name === name ? null : state.activeCollection,
        isLoading: false 
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete collection',
        isLoading: false 
      })
    }
  },
  
  setActiveCollection: (collection: CollectionSummary | null) => {
    set({ activeCollection: collection })
    if (collection) {
      get().fetchEnvironments(collection.name)
    }
  },
  
  fetchEnvironments: async (collection: string) => {
    try {
      const envNames = await apiService.getEnvironments(collection)
      const envs: Environment[] = []
      for (const name of envNames) {
        try {
          const env = await apiService.getEnvironment(collection, name)
          envs.push(env)
        } catch {
          // Skip environments that fail to load
        }
      }
      set({ environments: envs })
    } catch (error) {
      console.error('Failed to fetch environments:', error)
    }
  },
  
  setActiveEnvironment: (environment: Environment | null) => {
    set({ activeEnvironment: environment })
  },
  
  importBruno: async (file: File, name?: string) => {
    set({ isLoading: true, error: null })
    try {
      const collection = await apiService.importBruno(file, name)
      set((state) => ({ 
        collections: [...state.collections, collection],
        isLoading: false 
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import collection',
        isLoading: false 
      })
    }
  },
  
  importPostman: async (collection: unknown) => {
    set({ isLoading: true, error: null })
    try {
      const imported = await apiService.importPostman(collection)
      set((state) => ({ 
        collections: [...state.collections, imported],
        isLoading: false 
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import collection',
        isLoading: false 
      })
    }
  },
  
  exportBruno: async (collection: string) => {
    try {
      const blob = await apiService.exportBruno(collection)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collection}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to export collection'
      })
    }
  },
  
  exportPostman: async (collection: string) => {
    try {
      const data = await apiService.exportPostman(collection)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collection}.postman_collection.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to export collection'
      })
    }
  },
  
  setError: (error: string | null) => {
    set({ error })
  }
}))