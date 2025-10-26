/**
 * 身份验证工具函数
 */

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('token')
  return !!token
}

// 获取当前token
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

// 设置token
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
}

// 清除token
export const clearToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
}

// 登出并重定向到登录页
export const logout = (showMessage: boolean = true): void => {
  if (typeof window === 'undefined') return
  
  // 清除token
  clearToken()
  
  // 显示提示消息
  if (showMessage) {
    import('antd').then(({ message }) => {
      message.error('登录已过期，请重新登录')
    })
  }
  
  // 延迟重定向，确保用户看到提示
  setTimeout(() => {
    // 检查当前是否在管理后台页面
    if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
      window.location.href = '/admin/login'
    }
  }, showMessage ? 1500 : 0)
}

// 检查token是否即将过期（可选功能，需要后端支持）
export const isTokenExpiringSoon = (): boolean => {
  // 这里可以添加JWT token解析逻辑来检查过期时间
  // 目前简单返回false，因为当前实现没有token过期时间信息
  return false
}

// 刷新token（可选功能，需要后端支持）
export const refreshToken = async (): Promise<boolean> => {
  try {
    // 这里可以添加token刷新逻辑
    // 目前简单返回false，因为当前实现没有refresh token
    return false
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}
