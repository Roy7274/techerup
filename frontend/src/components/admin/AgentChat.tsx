'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, List, Input, Button, Badge, Avatar, Space, Empty, message as antMessage, Tooltip, Modal, Popconfirm, Alert } from 'antd'
import { SendOutlined, UserOutlined, CustomerServiceOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { getConversations, sendAgentMessage, getActiveSessions, getPendingAgentSessions, archiveSession } from '@/lib/api'
import { 
  initSocket, 
  joinSession, 
  leaveSession, 
  onNewMessage, 
  offNewMessage,
  onNewAgentSession,
  offNewAgentSession,
  onUserLeft,
  offUserLeft
} from '@/lib/socket'

interface Message {
  id: string
  sender: 'user' | 'bot' | 'agent' | 'system'
  message: string
  createdAt: string
}

interface Session {
  sessionId: string
  lastMessage: string
  lastActivity: string
  unreadCount?: number
}

export default function AgentChat() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [userLeftAlert, setUserLeftAlert] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const data: any = await getPendingAgentSessions()
      if (Array.isArray(data)) {
        setSessions(data.map((item: any) => ({
          sessionId: item.sessionId,
          lastMessage: item.lastMessage,
          lastActivity: item.lastMessageTime || item.lastActivity,
          unreadCount: item.unreadCount,
        })))
      }
    } catch (error) {
      console.error('加载会话列表失败:', error)
    }
  }

  useEffect(() => {
    // 初始化WebSocket连接
    initSocket()
    
    // 请求桌面通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    loadSessions()
    
    // 监听新的人工客服会话
    onNewAgentSession((data: any) => {
      console.log('收到新的客服会话通知:', data)
      // 重新加载会话列表
      loadSessions()
      // 显示桌面通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('新的客服会话', {
          body: '有新的用户需要人工客服',
          icon: '/favicon.ico',
        })
      }
      // 显示消息提示
      antMessage.info('有新的用户请求人工客服')
    })
    
    // 每30秒自动刷新会话列表（作为备用）
    const interval = setInterval(loadSessions, 30000)
    
    return () => {
      clearInterval(interval)
      offNewAgentSession()
      offUserLeft()
      if (selectedSession) {
        leaveSession(selectedSession)
        offNewMessage()
      }
    }
  }, [selectedSession])

  // 加载选中会话的消息
  const loadMessages = async (sessionId: string) => {
    try {
      const history: any = await getConversations(sessionId)
      setMessages(Array.isArray(history) ? history : [])
    } catch (error) {
      console.error('加载消息失败:', error)
      antMessage.error('加载消息失败')
    }
  }

  // 选择会话
  const handleSelectSession = async (sessionId: string) => {
    // 如果已经选中了其他会话，先离开
    if (selectedSession) {
      leaveSession(selectedSession)
      offNewMessage()
      offUserLeft()
    }
    
    setSelectedSession(sessionId)
    setUserLeftAlert(false)
    await loadMessages(sessionId)
    
    // 加入新会话房间
    joinSession(sessionId, 'agent')
    
    // 监听该会话的新消息
    onNewMessage((message: any) => {
      console.log('客服收到实时消息:', message)
      setMessages((prev) => {
        // 检查消息是否已存在（避免重复）
        if (prev.some((msg) => msg.id === message.id)) {
          return prev
        }
        return [...prev, message]
      })
      
      // 如果是用户消息，刷新会话列表（更新未读数）
      if (message.sender === 'user') {
        loadSessions()
      }
    })
    
    // 监听用户离开事件
    onUserLeft((data: any) => {
      console.log('用户离开会话:', data)
      if (data.sessionId === sessionId) {
        setUserLeftAlert(true)
        antMessage.warning('用户已离开会话')
        // 显示系统消息
        setMessages((prev) => [...prev, {
          id: `system-${Date.now()}`,
          sender: 'system',
          message: data.message || '用户已离开会话',
          createdAt: new Date().toISOString(),
        }])
      }
    })
  }

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || !selectedSession) return

    const messageText = inputValue.trim()
    setInputValue('')
    setLoading(true)

    try {
      await sendAgentMessage({
        sessionId: selectedSession,
        message: messageText,
        agentId: 'admin', // 实际应该从当前登录用户获取
      })

      // 重新加载消息和会话列表
      await loadMessages(selectedSession)
      await loadSessions()
      antMessage.success('发送成功')
    } catch (error) {
      console.error('发送消息失败:', error)
      antMessage.error('发送消息失败')
    } finally {
      setLoading(false)
    }
  }

  // 手动输入sessionId进行测试
  const handleManualSessionId = () => {
    const sessionId = prompt('请输入会话ID (sessionId):')
    if (sessionId) {
      handleSelectSession(sessionId)
    }
  }

  // 归档（删除）会话
  const handleArchiveSession = async (sessionId: string) => {
    try {
      await archiveSession(sessionId)
      antMessage.success('会话已归档')
      // 刷新会话列表
      await loadSessions()
      // 如果删除的是当前选中的会话，清空选中状态
      if (selectedSession === sessionId) {
        setSelectedSession(null)
        setMessages([])
        setUserLeftAlert(false)
      }
    } catch (error) {
      console.error('归档会话失败:', error)
      antMessage.error('归档会话失败')
    }
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* 左侧会话列表 */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>会话列表</span>
            <span className="text-xs font-normal text-gray-500">
              ({sessions.length} 个会话)
            </span>
          </div>
        }
        className="w-80"
        style={{ height: '100%' }}
        styles={{ body: { height: '100%', overflowY: 'auto', padding: 16 } }}
        extra={
          <Space>
            <Tooltip title="刷新列表">
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={loadSessions}
              />
            </Tooltip>
            <Tooltip title="手动输入会话ID">
              <Button 
                size="small" 
                icon={<PlusOutlined />}
                onClick={handleManualSessionId}
              >
                添加
              </Button>
            </Tooltip>
          </Space>
        }
      >
        {sessions.length === 0 ? (
          <Empty 
            description={
              <div>
                <p>暂无待处理会话</p>
                <p className="text-xs text-gray-400 mt-2">
                  当用户点击&ldquo;转人工&rdquo;后，会话会出现在这里
                </p>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space direction="vertical">
              <Button type="primary" onClick={loadSessions} icon={<ReloadOutlined />}>
                刷新列表
              </Button>
              <Button onClick={handleManualSessionId} icon={<PlusOutlined />}>
                手动输入会话ID
              </Button>
            </Space>
          </Empty>
        ) : (
          <div className="overflow-y-auto">
            <List
              dataSource={sessions}
              renderItem={(session) => (
                <List.Item
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedSession === session.sessionId ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectSession(session.sessionId)}
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="归档会话"
                      description="确定要归档此会话吗？对话记录将保存到咨询记录中。"
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        handleArchiveSession(session.sessionId)
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />}
                    title={
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {session.sessionId.slice(0, 15)}...
                        </span>
                        {session.unreadCount ? (
                          <Badge count={session.unreadCount} />
                        ) : null}
                      </div>
                    }
                    description={
                      <div>
                        <div className="text-xs truncate">{session.lastMessage}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(session.lastActivity).toLocaleString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>

      {/* 右侧聊天区域 */}
      <Card 
        title={
          selectedSession ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CustomerServiceOutlined />
                <span>会话: {selectedSession.slice(0, 30)}...</span>
              </div>
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={() => loadMessages(selectedSession)}
              >
                刷新消息
              </Button>
            </div>
          ) : (
            '请选择会话'
          )
        }
        className="flex-1"
        style={{ height: '100%' }}
        styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}
      >
        {!selectedSession ? (
          <Empty 
            description={
              <div>
                <p>请选择一个会话开始聊天</p>
                <p className="text-xs text-gray-400 mt-2">
                  从左侧会话列表中选择一个会话
                </p>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="flex flex-col h-full">
            {/* 用户离开提示 */}
            {userLeftAlert && (
              <Alert
                message="用户已离开会话"
                description="用户已关闭或离开了聊天窗口"
                type="warning"
                showIcon
                closable
                onClose={() => setUserLeftAlert(false)}
                className="mb-4"
              />
            )}
            
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
              {messages.map((msg) => (
                msg.sender === 'system' ? (
                  // 系统消息 - 居中显示
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg max-w-md">
                      <div className="text-sm text-yellow-800 text-center font-medium">
                        {msg.message}
                      </div>
                      <div className="text-xs text-yellow-600 text-center mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 普通消息
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'agent' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex ${
                        msg.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'
                      } items-start space-x-2 max-w-[80%]`}
                    >
                      <Avatar
                        icon={
                          msg.sender === 'user' ? (
                            <UserOutlined />
                          ) : (
                            <CustomerServiceOutlined />
                          )
                        }
                        style={{
                          backgroundColor:
                            msg.sender === 'user' ? '#87d068' : '#f56a00',
                        }}
                      />
                      <div className={`${msg.sender === 'agent' ? 'mr-2' : 'ml-2'}`}>
                        <div className="text-xs text-gray-500 mb-1">
                          {msg.sender === 'user'
                            ? '用户'
                            : msg.sender === 'agent'
                            ? '人工客服'
                            : '机器人'}
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            msg.sender === 'agent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                placeholder="输入消息..."
                disabled={loading}
                size="large"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
                size="large"
              >
                发送
              </Button>
            </Space.Compact>
          </div>
        )}
      </Card>
    </div>
  )
}

