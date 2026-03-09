import { create } from 'zustand'
import { ConsoleEntry, HttpRequest, HttpResponse } from '@/types'

const MAX_ENTRIES = 200

interface ConsoleState {
  entries: ConsoleEntry[]
  addEntry: (req: HttpRequest, res: HttpResponse) => void
  clearEntries: () => void
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  entries: [],

  addEntry: (req, res) => {
    const entry: ConsoleEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.status,
      statusText: res.statusText,
      duration: res.time,
      size: res.size,
      requestHeaders: req.headers
        .filter(h => h.enabled)
        .reduce<Record<string, string>>((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
      requestBody: req.body.content,
      responseHeaders: res.headers,
      responseBody: res.body,
    }
    set(state => ({
      entries: [entry, ...state.entries].slice(0, MAX_ENTRIES),
    }))
  },

  clearEntries: () => set({ entries: [] }),
}))
