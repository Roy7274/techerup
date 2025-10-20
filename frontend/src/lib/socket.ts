import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

let socket: Socket | null = null

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('WebSocket 已连接:', socket?.id)
    })

    socket.on('disconnect', () => {
      console.log('WebSocket 已断开')
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket 连接错误:', error)
    })
  }

  return socket
}

export const getSocket = (): Socket | null => {
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// 加入会话房间
export const joinSession = (sessionId: string, userType: 'user' | 'agent') => {
  const socket = getSocket()
  if (socket) {
    socket.emit('join-session', { sessionId, userType })
  }
}

// 离开会话房间
export const leaveSession = (sessionId: string) => {
  const socket = getSocket()
  if (socket) {
    socket.emit('leave-session', { sessionId })
  }
}

// 监听新消息
export const onNewMessage = (callback: (message: any) => void) => {
  const socket = getSocket()
  if (socket) {
    socket.on('new-message', callback)
  }
}

// 取消监听新消息
export const offNewMessage = () => {
  const socket = getSocket()
  if (socket) {
    socket.off('new-message')
  }
}

// 监听会话状态更新
export const onSessionUpdate = (callback: (update: any) => void) => {
  const socket = getSocket()
  if (socket) {
    socket.on('session-update', callback)
  }
}

// 取消监听会话状态更新
export const offSessionUpdate = () => {
  const socket = getSocket()
  if (socket) {
    socket.off('session-update')
  }
}

// 监听新的人工客服会话（仅客服端）
export const onNewAgentSession = (callback: (data: any) => void) => {
  const socket = getSocket()
  if (socket) {
    socket.on('new-agent-session', callback)
  }
}

// 取消监听新的人工客服会话
export const offNewAgentSession = () => {
  const socket = getSocket()
  if (socket) {
    socket.off('new-agent-session')
  }
}

// 监听新用户消息（客服端监控所有会话）
export const onNewUserMessage = (callback: (data: any) => void) => {
  const socket = getSocket()
  if (socket) {
    socket.on('new-user-message', callback)
  }
}

// 取消监听新用户消息
export const offNewUserMessage = () => {
  const socket = getSocket()
  if (socket) {
    socket.off('new-user-message')
  }
}

// 监听用户离开会话
export const onUserLeft = (callback: (data: any) => void) => {
  const socket = getSocket()
  if (socket) {
    socket.on('user-left', callback)
  }
}

// 取消监听用户离开会话
export const offUserLeft = () => {
  const socket = getSocket()
  if (socket) {
    socket.off('user-left')
  }
}

