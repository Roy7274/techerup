import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// ===== 咨询 API =====
export const createInquiry = (data: any) => api.post('/inquiries', data)
export const getInquiries = (params?: any) => api.get('/inquiries', { params })
export const getInquiry = (id: string) => api.get(`/inquiries/${id}`)
export const updateInquiry = (id: string, data: any) => api.patch(`/inquiries/${id}`, data)
export const deleteInquiry = (id: string) => api.delete(`/inquiries/${id}`)
export const getInquiryStats = () => api.get('/inquiries/stats')

// ===== 对话 API =====
export const sendMessage = (data: { sessionId: string; message: string; metadata?: any }) =>
  api.post('/conversations/message', data)
export const getConversations = (sessionId: string) =>
  api.get(`/conversations/session/${sessionId}`)
export const sendAgentMessage = (data: { sessionId: string; message: string; agentId?: string }) =>
  api.post('/conversations/agent-message', data)
export const getSessionStatus = (sessionId: string) =>
  api.get(`/conversations/session-status/${sessionId}`)
export const getActiveSessions = (limit?: number) =>
  api.get('/conversations/active-sessions', { params: { limit } })
export const getPendingAgentSessions = () =>
  api.get('/conversations/pending-agent-sessions')
export const archiveSession = (sessionId: string) =>
  api.post('/conversations/session/archive', { sessionId })

// ===== 轮播图 API =====
export const getBanners = (activeOnly: boolean = true) =>
  api.get('/banners', { params: { active: activeOnly } })
export const createBanner = (data: any) => api.post('/banners', data)
export const updateBanner = (id: string, data: any) => api.patch(`/banners/${id}`, data)
export const deleteBanner = (id: string) => api.delete(`/banners/${id}`)
export const reorderBanners = (ids: string[]) => api.post('/banners/reorder', { ids })
export const uploadBannerImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/banners/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// ===== 商家信息 API =====
export const getMerchantInfo = () => api.get<any | null>('/merchant/active').then((res) => res as unknown as any)
export const getAllMerchants = () => api.get<any[]>('/merchant').then((res) => res as unknown as any[])
export const createMerchant = (data: any) => api.post<any>('/merchant', data).then((res) => res as unknown as any)
export const updateMerchantInfo = (id: string, data: any) => api.patch<any>(`/merchant/${id}`, data).then((res) => res as unknown as any)
export const uploadMerchantLogo = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/merchant/upload-logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// ===== 内容模块 API =====
export const getContentModules = (activeOnly: boolean = true) =>
  api.get('/content-modules', { params: { active: activeOnly } })
export const createContentModule = (data: any) => api.post('/content-modules', data)
export const updateContentModule = (id: string, data: any) => api.patch(`/content-modules/${id}`, data)
export const deleteContentModule = (id: string) => api.delete(`/content-modules/${id}`)

// ===== 内容卡片 API =====
export const getContentCards = (moduleId?: string, activeOnly: boolean = true) =>
  api.get('/content-cards', { params: { moduleId, active: activeOnly } })
export const createContentCard = (data: any) => api.post('/content-cards', data)
export const updateContentCard = (id: string, data: any) => api.patch(`/content-cards/${id}`, data)
export const deleteContentCard = (id: string) => api.delete(`/content-cards/${id}`)

// ===== 文章 API =====
export const getArticles = (activeOnly: boolean = true) =>
  api.get('/articles', { params: { active: activeOnly } })
export const getArticle = (id: string) => api.get(`/articles/${id}`)
export const createArticle = (data: any) => api.post('/articles', data)
export const updateArticle = (id: string, data: any) => api.patch(`/articles/${id}`, data)
export const deleteArticle = (id: string) => api.delete(`/articles/${id}`)

// ===== 认证 API =====
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password })
export const register = (username: string, password: string, email?: string) =>
  api.post('/auth/register', { username, password, email })
export const getProfile = () => api.get('/auth/profile')

// ===== 表单模板 API =====
export const getFormTemplates = (activeOnly: boolean = true) =>
  api.get('/form-templates', { params: { active: activeOnly } })
export const getFormTemplate = (id: string) => api.get(`/form-templates/${id}`)
export const createFormTemplate = (data: any) => api.post('/form-templates', data)
export const updateFormTemplate = (id: string, data: any) => api.patch(`/form-templates/${id}`, data)
export const deleteFormTemplate = (id: string) => api.delete(`/form-templates/${id}`)
export const toggleFormTemplateActive = (id: string) => api.patch(`/form-templates/${id}/toggle-active`)

// ===== 自动回复 API =====
export const getAutoReplies = (activeOnly: boolean = true) =>
  api.get('/auto-replies', { params: { active: activeOnly } })
export const getAutoReply = (id: string) => api.get(`/auto-replies/${id}`)
export const createAutoReply = (data: any) => api.post('/auto-replies', data)
export const updateAutoReply = (id: string, data: any) => api.patch(`/auto-replies/${id}`, data)
export const deleteAutoReply = (id: string) => api.delete(`/auto-replies/${id}`)
export const toggleAutoReplyActive = (id: string) => api.patch(`/auto-replies/${id}/toggle-active`)
export const getWelcomeMessage = () => api.get('/auto-replies/welcome')
export const matchAutoReply = (message: string, sessionId: string) =>
  api.post('/auto-replies/match', { message, sessionId })
export const pauseAutoReply = (sessionId: string, durationMinutes: number, reason: string) =>
  api.post('/auto-replies/pause', { sessionId, durationMinutes, reason })
export const resumeAutoReply = (sessionId: string) =>
  api.post('/auto-replies/resume', { sessionId })
export const checkAutoReplyStatus = (sessionId: string) =>
  api.get(`/auto-replies/status/${sessionId}`)

// ===== 表单提交 API =====
export const submitForm = (sessionId: string, formData: any) =>
  api.post('/conversations/submit-form', { sessionId, formData })

// ===== 会话表单数据 API =====
export const getSessionFormData = (sessionId: string) =>
  api.get(`/conversations/session/${sessionId}/form-data`)

// 页面初始化：保存浏览器定位得到的城市到会话
export const saveSessionCity = (sessionId: string, city: string) =>
  api.post('/conversations/session/save-city', { sessionId, city })

// ===== 工具函数 =====
export const getClientCity = async () => {
  try {
    // 使用浏览器地理位置 API
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // 使用免费的OpenStreetMap反向地理编码API
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=zh-CN`
              );
              const data = await response.json();
              
              if (data && data.address) {
                // 优先获取城市，如果没有则获取省份
                const city = data.address.city || 
                           data.address.town || 
                           data.address.village ||
                           data.address.county ||
                           data.address.state ||
                           '未知';
                resolve(city);
              } else {
                resolve('未知');
              }
            } catch (error) {
              console.warn('反向地理编码失败:', error);
              resolve('未知');
            }
          },
          (error) => {
            console.warn('获取地理位置失败:', error);
            // 如果用户拒绝或超时，尝试从时区推断
            try {
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (timezone.includes('Shanghai') || timezone.includes('Beijing')) {
                resolve('北京');
              } else if (timezone.includes('Chongqing')) {
                resolve('重庆');
              } else if (timezone.includes('Chengdu')) {
                resolve('成都');
              } else if (timezone.includes('Guangzhou')) {
                resolve('广州');
              } else if (timezone.includes('Shenzhen')) {
                resolve('深圳');
              } else {
                resolve('未知');
              }
            } catch (tzError) {
              resolve('未知');
            }
          },
          {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 300000 // 5分钟缓存
          }
        )
      })
    }
    
    // 如果地理位置API不可用，尝试从时区推断
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Shanghai') || timezone.includes('Beijing')) {
        return '北京';
      } else if (timezone.includes('Chongqing')) {
        return '重庆';
      } else if (timezone.includes('Chengdu')) {
        return '成都';
      } else if (timezone.includes('Guangzhou')) {
        return '广州';
      } else if (timezone.includes('Shenzhen')) {
        return '深圳';
      }
    } catch (error) {
      console.warn('时区推断失败:', error);
    }
    
    return '未知'
  } catch (error) {
    console.warn('地理位置API不可用:', error);
    return '未知'
  }
}

export default api

