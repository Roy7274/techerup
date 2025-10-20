// 全局类型定义

export interface Inquiry {
  id: string
  city: string
  grade: string
  identity: string
  studentGender: string
  phone: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  conversations?: Conversation[]
}

export interface Conversation {
  id: string
  inquiryId?: string
  sessionId: string
  sender: 'user' | 'bot' | 'agent'
  message: string
  metadata?: any
  createdAt: string
}

export interface Banner {
  id: string
  title: string
  imageUrl: string
  link?: string
  order: number
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface MerchantInfo {
  id: string
  name: string
  description: string
  services: string[]
  advantages: string[]
  contact: {
    phone?: string
    address?: string
    wechat?: string
    [key: string]: any
  }
  businessHours?: string
  logoUrl?: string
  coverUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Admin {
  id: string
  username: string
  email?: string
  role: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface InquiryStats {
  total: number
  contacted: number
  uncontacted: number
  byCity: Array<{ city: string; _count: number }>
  byGrade: Array<{ grade: string; _count: number }>
}

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  statusCode?: number
}

