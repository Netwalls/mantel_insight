'use client'

import { useEffect, useCallback } from 'react'
import { getSocket } from '@/lib/socket'

export function useWebSocket<T>(
  event: string,
  handler: (data: T) => void,
  subscribeEvent?: string,
) {
  const stableHandler = useCallback(handler, []) // eslint-disable-line

  useEffect(() => {
    const socket = getSocket()

    socket.on(event, stableHandler)

    if (subscribeEvent) {
      socket.emit(subscribeEvent)
    }

    return () => {
      socket.off(event, stableHandler)
    }
  }, [event, stableHandler, subscribeEvent])
}

export function useMultipleWebSocket(
  events: Array<{ event: string; handler: (data: any) => void }>,
  subscribeEvent?: string,
) {
  useEffect(() => {
    const socket = getSocket()

    for (const { event, handler } of events) {
      socket.on(event, handler)
    }

    if (subscribeEvent) {
      socket.emit(subscribeEvent)
    }

    return () => {
      for (const { event, handler } of events) {
        socket.off(event, handler)
      }
    }
  }, []) // eslint-disable-line
}
