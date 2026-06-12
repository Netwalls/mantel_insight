import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_URL}/realtime`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      console.log('[AlphaSight] WebSocket connected')
    })

    socket.on('disconnect', () => {
      console.log('[AlphaSight] WebSocket disconnected')
    })

    socket.on('connect_error', (err) => {
      console.warn('[AlphaSight] WebSocket error:', err.message)
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
