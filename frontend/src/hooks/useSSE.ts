import { useEffect, useRef } from 'react'

export interface SSEMessage {
  event?: string
  data: string
  id?: string
}

export interface UseSSEOptions {
  url: string
  getToken: () => Promise<string>
  onMessage?: (message: SSEMessage) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

/**
 * Custom hook for Server-Sent Events with authentication support.
 * Unlike EventSource, this implementation supports custom headers like Authorization.
 */
export function useSSE({ url, getToken, onMessage, onError, enabled = true }: UseSSEOptions) {
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let isSubscribed = true
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const connect = async () => {
      try {
        const token = await getToken()
        
        console.log('[SSE] Connecting to:', url)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.statusText}`)
        }

        console.log('[SSE] Connected successfully')

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('Response body is not readable')
        }

        let buffer = ''
        let currentEvent: Partial<SSEMessage> = {}

        while (isSubscribed) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('[SSE] Stream ended')
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim() === '') {
              // Empty line indicates end of message
              if (currentEvent.data) {
                console.log('[SSE] Received message:', currentEvent)
                onMessage?.({
                  event: currentEvent.event,
                  data: currentEvent.data,
                  id: currentEvent.id,
                })
              }
              currentEvent = {}
              continue
            }

            if (line.startsWith(':')) {
              // Comment line, ignore
              continue
            }

            const colonIndex = line.indexOf(':')
            if (colonIndex === -1) {
              continue
            }

            const field = line.slice(0, colonIndex)
            let value = line.slice(colonIndex + 1)
            
            // Remove leading space if present
            if (value.startsWith(' ')) {
              value = value.slice(1)
            }

            switch (field) {
              case 'event':
                currentEvent.event = value
                break
              case 'data':
                currentEvent.data = currentEvent.data 
                  ? currentEvent.data + '\n' + value 
                  : value
                break
              case 'id':
                currentEvent.id = value
                break
              case 'retry':
                // Could implement reconnection logic here
                break
            }
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted && isSubscribed) {
          console.error('[SSE] Connection error:', error)
          onError?.(error instanceof Error ? error : new Error('SSE connection error'))
        }
      }
    }

    connect()

    return () => {
      isSubscribed = false
      abortController.abort()
      abortControllerRef.current = null
    }
  }, [url, getToken, onMessage, onError, enabled])

  return {
    disconnect: () => {
      abortControllerRef.current?.abort()
    }
  }
}
