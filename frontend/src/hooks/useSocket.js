import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export function useSocket(eventos = {}) {
  const socketRef = useRef(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:3001', { transports: ['websocket'] })
    const socket = socketRef.current

    Object.entries(eventos).forEach(([evento, handler]) => {
      socket.on(evento, handler)
    })

    return () => {
      Object.keys(eventos).forEach(e => socket.off(e))
      socket.disconnect()
    }
  }, [])

  return socketRef.current
}
