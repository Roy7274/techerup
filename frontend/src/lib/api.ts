import axios from 'axios'
import config from './config'
import { getToken, logout } from './auth'

const API_URL = config.API_URL

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
    const token = getToken()
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
    
    // 处理401未授权错误 - 身份验证过期
    if (error.response?.status === 401) {
      // 使用统一的登出函数
      logout()
    }
    
    return Promise.reject(error)
  }
)

// ===== 咨询 API =====
export const createInquiry = (data: any) => api.post('/inquiries', data)
export const getInquiries = (params?: any) => api.get('/inquiries', { params })
export const getInquiry = (id: string) => api.get(`/inquiries/${id}`)
export const updateInquiry = (id: string, data: any) => api.patch(`/inquiries/${id}`, data)
export const deleteInquiry = (id: string) => api.delete(`/inquiries/${id}`)
export const getInquiryStats = (params?: any) => api.get('/inquiries/stats', { params })

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
export const deleteSession = (sessionId: string) =>
  api.post('/conversations/session/delete', { sessionId })

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
export const register = (username: string, password: string, email?: string, cities?: string[]) =>
  api.post('/auth/register', { username, password, email, cities })
export const getProfile = () => api.get('/auth/profile')

// ===== 管理员管理 API =====
export const getAdmins = () => api.get('/admin/list')
export const createAdmin = (data: any) => api.post('/admin/create', data)
export const updateAdmin = (id: string, data: any) => api.put(`/admin/${id}`, data)
export const resetAdminPassword = (id: string, newPassword: string) => 
  api.put(`/admin/${id}/reset-password`, { newPassword })
export const deleteAdmin = (id: string) => api.delete(`/admin/${id}`)
export const getManageableCities = () => api.get('/admin/cities')

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

// ===== 数据统计 API =====
export const getTrendData = (params: {
  startDate: string
  endDate: string
  groupBy: 'daily' | 'monthly'
  city?: string
}) => api.get('/inquiries/trend', { params })

// 获取可访问的城市列表
export const getAccessibleCities = () => api.get('/admin/cities')

// 获取数据库中实际存在的城市列表
export const getAvailableCities = () => api.get('/inquiries/cities')

// ===== 工具函数 =====
export const getClientCity = async () => {
  try {
    // 优先使用IP地理位置API
    const city = await getCityFromIP();
    if (city && city !== '未知') {
      return city;
    }

    // 如果IP地理位置失败，尝试浏览器地理位置API
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
            resolve('未知');
          },
          {
            timeout: 5000,
            enableHighAccuracy: false,
            maximumAge: 300000 // 5分钟缓存
          }
        )
      })
    }
    
    return '未知'
  } catch (error) {
    console.warn('地理位置API不可用:', error);
    return '未知'
  }
}

// 英文到中文城市名称映射
const cityNameMapping: { [key: string]: string } = {
  // 主要城市
  'Beijing': '北京',
  'Shanghai': '上海',
  'Guangzhou': '广州',
  'Shenzhen': '深圳',
  'Chengdu': '成都',
  'Hangzhou': '杭州',
  'Nanjing': '南京',
  'Wuhan': '武汉',
  'Xi\'an': '西安',
  'Tianjin': '天津',
  'Chongqing': '重庆',
  'Suzhou': '苏州',
  'Changsha': '长沙',
  'Zhengzhou': '郑州',
  'Dongguan': '东莞',
  'Qingdao': '青岛',
  'Dalian': '大连',
  'Ningbo': '宁波',
  'Xiamen': '厦门',
  'Fuzhou': '福州',
  'Wuxi': '无锡',
  'Hefei': '合肥',
  'Kunming': '昆明',
  'Harbin': '哈尔滨',
  'Jinan': '济南',
  'Foshan': '佛山',
  'Changchun': '长春',
  'Wenzhou': '温州',
  'Shijiazhuang': '石家庄',
  'Nanchang': '南昌',
  'Taiyuan': '太原',
  'Guiyang': '贵阳',
  'Lanzhou': '兰州',
  'Urumqi': '乌鲁木齐',
  'Hohhot': '呼和浩特',
  'Haikou': '海口',
  'Yinchuan': '银川',
  'Xining': '西宁',
  'Lhasa': '拉萨'
}

// 将英文城市名转换为中文
const translateCityName = (cityName: string): string => {
  if (!cityName) return '未知'
  
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(cityName)) {
    return cityName
  }
  
  // 查找映射
  const chineseName = cityNameMapping[cityName]
  if (chineseName) {
    return chineseName
  }
  
  // 如果没有找到映射，返回原名称
  return cityName
}

// 通过IP地址获取城市信息
const getCityFromIP = async (): Promise<string> => {
  try {
    // 主要服务：ip-api.com (支持中文)
    try {
      const response = await fetch('http://ip-api.com/json/?lang=zh-CN', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.city) {
          return data.city;
        }
      }
    } catch (error) {
      console.warn('ip-api.com 服务失败:', error);
    }

    // 备用服务1：ipapi.co (需要翻译)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.city) {
          const translatedCity = translateCityName(data.city);
          return translatedCity;
        }
      }
    } catch (error) {
      console.warn('ipapi.co 服务失败:', error);
    }

    // 备用服务2：ipinfo.io (需要翻译)
    try {
      const response = await fetch('https://ipinfo.io/json', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.city) {
          const translatedCity = translateCityName(data.city);
          return translatedCity;
        }
      }
    } catch (error) {
      console.warn('ipinfo.io 服务失败:', error);
    }

    return '未知';
  } catch (error) {
    console.warn('所有IP地理位置服务都失败:', error);
    return '未知';
  }
}

export default api

