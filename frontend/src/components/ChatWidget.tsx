'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Input, Button, Avatar, Space, Form, Select, message as antdMessage } from 'antd'
const { TextArea } = Input
import { SendOutlined, UserOutlined, RobotOutlined, CustomerServiceOutlined, ArrowUpOutlined, PhoneOutlined } from '@ant-design/icons'
import { sendMessage, getConversations, getSessionStatus, getFormTemplate, submitForm, getSessionFormData, getClientCity, saveSessionCity } from '@/lib/api'
import UnifiedFormModal from './UnifiedFormModal'
import { formatMessage, hasFormatting, createSafeHtml, getFormatStyles, getFormatClassName } from '@/lib/messageFormatter'
import { 
  initSocket, 
  joinSession, 
  leaveSession, 
  onNewMessage, 
  offNewMessage,
  onSessionUpdate,
  offSessionUpdate
} from '@/lib/socket'

interface Message {
  id: string
  sender: 'user' | 'bot' | 'agent'
  message: string
  createdAt: string
  metadata?: any
}

interface ChatWidgetProps {
  visible: boolean
  onClose: () => void
  welcomeMessage?: string
  inline?: boolean
  merchantName?: string
  merchantLogo?: string
  onBookingClick?: () => void
}
import config from '@/lib/config'

const API_URL = config.API_URL

export default function ChatWidget({ visible, onClose, welcomeMessage, inline = false, merchantName, merchantLogo, onBookingClick }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [showServiceIndicator, setShowServiceIndicator] = useState(true)
  
  // 表单相关状态
  const [formModalVisible, setFormModalVisible] = useState(false)
  const [currentFormTemplate, setCurrentFormTemplate] = useState<any>(null)
  
  // 地理信息状态
  const [geoInfoFetched, setGeoInfoFetched] = useState(false)
  const [cachedGeoInfo, setCachedGeoInfo] = useState<any>(null)
  // 从 localStorage 获取或生成新的 sessionId
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let storedSessionId = localStorage.getItem('chat_session_id')
      if (!storedSessionId) {
        storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('chat_session_id', storedSessionId)
      }
      return storedSessionId
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })
  const [isAgent, setIsAgent] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false)

  // 初始化聊天和WebSocket连接
  useEffect(() => {
    if (!visible) return
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true
    
    console.log('初始化聊天，SessionId:', sessionId)
    
    // 重置状态
    setShowServiceIndicator(true) // 用户进入时立即显示"正在为您服务"
    
    // 初始化WebSocket连接
    initSocket()
    
    initChat()
  }, [visible, sessionId])

  // 页面加载后立刻定位并保存城市到会话（只执行一次）
  useEffect(() => {
    if (geoInfoFetched) return; // 如果已经获取过，不再重复获取
    
    (async () => {
      try {
        const city = await getClientCity()
        if (city && city !== '未知') {
          await saveSessionCity(sessionId, city as string)
          setCachedGeoInfo({ city, source: 'browser' })
          setGeoInfoFetched(true)
        } else {
          setGeoInfoFetched(true) // 即使获取失败也标记为已获取，避免重复尝试
        }
      } catch (e) {
        console.warn('页面加载定位失败:', e)
        setGeoInfoFetched(true) // 即使获取失败也标记为已获取，避免重复尝试
      }
    })()
  }, [sessionId, geoInfoFetched])

  // 管理WebSocket监听器
  useEffect(() => {
    if (!visible) return
    
    console.log('设置WebSocket监听器，SessionId:', sessionId)
    
    // 加入会话房间
    joinSession(sessionId, 'user')
    
    // 监听新消息
    const handleNewMessage = async (message: any) => {
      console.log('收到实时消息:', message)
      setMessages((prev) => {
        // 检查消息是否已存在（避免重复）
        if (prev.some((msg) => msg.id === message.id)) {
          console.log('消息已存在，跳过重复添加:', message.id)
          return prev
        }
        // 验证消息内容
        if (!message.message || !message.message.trim()) {
          console.log('消息内容为空，跳过添加:', message.id)
          return prev
        }
        return [...prev, message]
      })

      // 注意：不再自动弹出表单，表单应该通过用户点击选项或按钮来触发
    }
    
    // 监听会话状态更新
    const handleSessionUpdate = (update: any) => {
      console.log('会话状态更新:', update)
      if (update.isAgent !== undefined) {
        setIsAgent(update.isAgent)
      }
      if (update.message) {
        setMessages((prev) => {
          // 检查消息是否已存在（避免重复）
          if (prev.some((msg) => msg.id === update.message.id)) {
            console.log('会话更新消息已存在，跳过重复添加:', update.message.id)
            return prev
          }
          // 验证消息内容
          if (!update.message.message || !update.message.message.trim()) {
            console.log('会话更新消息内容为空，跳过添加:', update.message.id)
            return prev
          }
          return [...prev, update.message]
        })
      }
    }
    
    onNewMessage(handleNewMessage)
    onSessionUpdate(handleSessionUpdate)
    
    // 清理函数
    return () => {
      console.log('清理WebSocket监听器，SessionId:', sessionId)
      leaveSession(sessionId)
      offNewMessage()
      offSessionUpdate()
      
      // 清理完成
    }
  }, [visible, sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initChat = async () => {
    try {
      setLoading(true)
      
      // 首先检查会话状态
      try {
        const sessionStatus: any = await getSessionStatus(sessionId)
        if (sessionStatus && sessionStatus.isAgent) {
          setIsAgent(true)
        }
      } catch (error) {
        // 如果会话不存在，会自动创建，不需要特殊处理
        console.log('会话状态检查:', error)
      }

      // 拉取历史消息
      const history = await getConversations(sessionId)
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history)
        // 双重检查：历史消息中是否有人工客服介入
        const hasAgentMessage = history.some((msg: any) => msg.sender === 'agent')
        if (hasAgentMessage) {
          setIsAgent(true)
        }
        return
      }

      // "正在为您服务"已经在用户进入时显示，无需额外处理
    } catch (error) {
      console.error('初始化对话失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setLoading(true)
    
    // 保存当前状态，避免多次状态更新导致闪烁
    const currentMessages = messages
    const existingWelcomeMessage = currentMessages.find(msg => msg.id.startsWith('welcome_'))
    const hasServiceIndicator = showServiceIndicator

    try {
      // 使用缓存的地理信息（如果页面加载时已经获取过）
      let geoInfo = null;
      if (cachedGeoInfo) {
        geoInfo = cachedGeoInfo;
        console.log('发送消息时使用缓存地理信息:', geoInfo);
      }

      const response: any = await sendMessage({
        sessionId,
        message: userMessage,
        metadata: geoInfo ? { geoInfo } : undefined
      })

      // 重新加载消息，但保留欢迎语和正在为您服务提示
      const history: any = await getConversations(sessionId)
      const newMessages = Array.isArray(history) ? (history as Message[]) : []
      
      // 如果有现有的欢迎语，确保它被保留
      if (existingWelcomeMessage) {
        const hasWelcomeInNew = newMessages.some(msg => msg.id.startsWith('welcome_'))
        if (!hasWelcomeInNew) {
          newMessages.unshift(existingWelcomeMessage)
        }
      }
      
      // 批量更新状态，减少重新渲染次数
      setMessages(newMessages)
      
      // 如果返回了isAgent状态，更新它
      if (response && response.isAgent !== undefined) {
        setIsAgent(response.isAgent)
      }
      
      // 检查是否有人工客服介入
      if (Array.isArray(history)) {
        const hasAgentMessage = history.some((msg: any) => msg.sender === 'agent')
        if (hasAgentMessage) {
          setIsAgent(true)
        }
      }
      
      // 保持"正在为您服务"提示的显示状态
      // 不自动隐藏，让用户看到服务提示
      
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setLoading(false)
    }
  }


  const getSenderIcon = (sender: string) => {
    if (sender === 'user') {
      return <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
    }
    // bot 或 agent 类型消息，根据 isAgent 状态决定图标
    if (isAgent) {
      return <Avatar icon={<CustomerServiceOutlined />} style={{ backgroundColor: '#f56a00' }} />
    }
    // 如果有商家Logo，使用Logo，否则使用机器人图标
    if (merchantLogo) {
      const logoSrc = merchantLogo.startsWith('http') ? merchantLogo : `${API_URL}${merchantLogo}`
      return <Avatar src={logoSrc} style={{ backgroundColor: '#1890ff' }} />
    }
    return <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
  }

  const getSenderName = (sender: string) => {
    if (sender === 'user') {
      return '我'
    }
    // bot 或 agent 类型消息，根据 isAgent 状态决定显示名称
    if (isAgent) {
      return '人工客服'
    }
    return merchantName || '商家'
  }

  // 处理选项按钮点击
  const handleOptionClick = async (option: any, messageId: string) => {
    console.log('点击选项:', option, '消息ID:', messageId)
    
    // 防止重复点击
    if (loading) {
      return
    }
    
    setLoading(true)
    
    try {
      const response: any = await sendMessage({
        sessionId,
        message: option.label,
        metadata: {
          fromOption: true,
          fieldName: option.fieldName,
          fieldValue: option.fieldValue || option.label,
          messageId: messageId // 添加消息ID用于验证选项匹配
        }
      })

      // 重新加载消息
      const history: any = await getConversations(sessionId)
      setMessages(Array.isArray(history) ? history : [])

      // 如果返回了isAgent状态，更新它
      if (response && response.isAgent !== undefined) {
        setIsAgent(response.isAgent)
      }
      
      // 检查是否有人工客服介入
      if (Array.isArray(history)) {
        const hasAgentMessage = history.some((msg: any) => msg.sender === 'agent')
        if (hasAgentMessage) {
          setIsAgent(true)
        }
      }

    } catch (error) {
      console.error('发送选项失败:', error)
      antdMessage.error('发送失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理表单提交成功
  const handleFormSubmitSuccess = async () => {
    // 发送一条确认消息
    await sendMessage({
      sessionId,
      message: `我已提交${currentFormTemplate?.name || '表单'}`,
    })
    
    // 重新加载消息
    const history: any = await getConversations(sessionId)
    setMessages(Array.isArray(history) ? history : [])
  }


  const ChatContent = (
    <>
      {/* 消息列表 - 移动端优化 */}
      <div className={`chat-messages-container space-y-2.5 sm:space-y-3 py-3 sm:py-4 px-1 sm:px-2 md:px-12 lg:px-20 xl:px-28 2xl:px-36 bg-gray-100 ${inline ? 'pb-24' : 'pb-32'}`} style={{ flex: 1, paddingBottom: inline ? '6rem' : '8rem' }}>
        {/* 正在为您服务提示 - 显示在消息列表顶部 */}
        {showServiceIndicator && (
          <div className="flex justify-center message-bubble mt-4 sm:mt-6">
            <div className="px-4 py-2 bg-white text-gray-600 text-sm rounded-full shadow-sm border border-gray-200">
              正在为您服务
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={msg.id}>
            <div
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} message-bubble`}
            >
              {msg.sender !== 'user' && (
                <div className="flex-shrink-0 mr-1 mt-1">
                  {merchantLogo ? (
                    <img
                      src={merchantLogo.startsWith('http') ? merchantLogo : `${API_URL}${merchantLogo}`}
                      alt={merchantName || '商家'}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs leading-tight text-center whitespace-pre-line">
                        {(() => {
                          const name = merchantName || '商家'
                          const chars = name.slice(0, 4)
                          return chars.length === 4 ? `${chars.slice(0, 2)}\n${chars.slice(2, 4)}` : chars
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="max-w-[85%] sm:max-w-[70%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[35%] 2xl:max-w-[30%]">
                <div
                  className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-base sm:text-lg leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm shadow-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-md'
                  }`}
                >
                  {hasFormatting(msg.message) ? (
                    <div 
                      className={getFormatClassName()}
                      dangerouslySetInnerHTML={createSafeHtml(formatMessage(msg.message))} 
                      style={getFormatStyles()}
                    />
                  ) : (
                    msg.message
                  )}
                </div>
                
                {/* 如果消息包含可点击选项，显示按钮 */}
                {msg.metadata?.hasOptions && msg.metadata?.options && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.metadata.options.map((option: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(option, msg.id)}
                        disabled={loading}
                        className={`px-4 py-2 bg-white text-blue-600 border-2 border-blue-500 rounded-full text-sm font-medium transition-all shadow-sm ${
                          loading 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-blue-50 active:scale-95'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        ))}
        
        
        {loading && (
          <div className="flex justify-start message-bubble">
            <div className="flex-shrink-0 mr-1 mt-1">
              {merchantLogo ? (
                <img
                  src={merchantLogo.startsWith('http') ? merchantLogo : `${API_URL}${merchantLogo}`}
                  alt={merchantName || '商家'}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs leading-tight text-center whitespace-pre-line">
                    {(() => {
                      const name = merchantName || '商家'
                      const chars = name.slice(0, 4)
                      return chars.length === 4 ? `${chars.slice(0, 2)}\n${chars.slice(2, 4)}` : chars
                    })()}
                  </span>
                </div>
              )}
            </div>
            <div className="max-w-[85%] sm:max-w-[70%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[35%] 2xl:max-w-[30%]">
              <div className="px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-tl-sm bg-white shadow-md border border-gray-100 text-base sm:text-lg">
                <div className="typing-indicator flex space-x-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 - 始终悬浮在底部 */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* 预约按钮 - 位于输入框左侧上方 */}
          <div className="flex justify-start mb-2">
            <Button
              type="primary"
              size="small"
              shape="round"
              icon={<PhoneOutlined />}
              onClick={() => {
                if (onBookingClick) {
                  onBookingClick()
                }
              }}
              className="shadow-md hover:shadow-lg transition-all duration-300 text-xs px-3 py-1.5"
            >
              预约免费试听
            </Button>
          </div>
          <div className="relative flex items-end bg-white rounded-3xl shadow-lg border border-gray-200 hover:border-gray-300 transition-colors px-4 py-3">
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="可详细描述您的问题~"
              disabled={loading}
              autoSize={{ minRows: 1, maxRows: 6 }}
              className="border-0 bg-transparent text-base resize-none pr-10"
              style={{ 
                boxShadow: 'none', 
                background: 'transparent',
                padding: '6px 0',
                lineHeight: '1.6'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-shrink-0 ml-2 mb-0.5 w-10 h-10 flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 rounded-full"
              aria-label="发送"
              style={{ 
                border: 'none', 
                outline: 'none',
                boxShadow: 'none'
              }}
              tabIndex={-1}
            >
              {loading ? (
                <span className="animate-spin text-lg">⏳</span>
              ) : (
                <ArrowUpOutlined className="text-lg" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* 统一表单弹窗 */}
      <UnifiedFormModal
        visible={formModalVisible}
        onClose={() => {
          setFormModalVisible(false)
          setCurrentFormTemplate(null)
        }}
        sessionId={sessionId}
        messages={messages}
        title={currentFormTemplate?.name || '填写信息'}
        formTemplateId={currentFormTemplate?.id}
        showExtractedInfo={true}
        showSaveDraft={false}
      />
    </>
  )

  if (!visible) return null

  if (inline) {
    return (
      <div className="flex flex-col bg-gray-100 w-full" style={{ minHeight: '400px' }}>
        {ChatContent}
      </div>
    )
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      styles={{ 
        body: { height: '500px', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#f5f5f5' },
        header: { backgroundColor: '#f5f5f5' }
      }}
    >
      {ChatContent}
    </Modal>
  )
}

