import { useEffect, useRef, useCallback, useState } from 'react'

interface WebSocketMessage {
  type: string
  collection?: string
  data: unknown
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const isConnectedRef = useRef(false)
  const shouldReconnectRef = useRef(true)
  const isUnmountedRef = useRef(false)
  const optionsRef = useRef(options)
  const connectRef = useRef<(() => void) | null>(null)
  
  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    isConnectedRef.current = false
  }, [])

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }
    shouldReconnectRef.current = true

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        isConnectedRef.current = true
        optionsRef.current.onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          optionsRef.current.onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        // Don't log if it was a clean close or connection refused (backend not running)
        if (!event.wasClean && event.code !== 1006) {
          console.log('WebSocket disconnected')
        }
        setIsConnected(false)
        isConnectedRef.current = false
        optionsRef.current.onDisconnect?.()
        
        if (shouldReconnectRef.current && !isUnmountedRef.current) {
          // Attempt to reconnect after 5 seconds.
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current?.()
          }, 5000)
        }
      }

      ws.onerror = (error) => {
        // Only log error if we were previously connected
        if (isConnectedRef.current) {
          console.error('WebSocket error:', error)
        }
        optionsRef.current.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }, [url])

  // Store connect function in ref to avoid circular dependency
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    isUnmountedRef.current = false
    connect()

    return () => {
      isUnmountedRef.current = true
      disconnect()
    }
  }, [connect, disconnect])

  return {
    send,
    isConnected,
    connect,
    disconnect
  }
}
