// 统一的环境变量配置
const config = {
  // API 基础 URL
  API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  
  // Socket.IO URL
  SOCKET_URL: process.env.NEXT_PUBLIC_API_URL || '',
  
  // 是否为开发环境
  IS_DEV: process.env.NODE_ENV === 'development',
  
  // 是否为生产环境
  IS_PROD: process.env.NODE_ENV === 'production',
}

// 在开发环境中，如果没有设置 API_URL，使用 localhost
if (config.IS_DEV && !config.API_URL) {
  config.API_URL = 'http://localhost:3001'
  config.SOCKET_URL = 'http://localhost:3001'
}

// 在生产环境中，如果没有设置 API_URL，使用相对路径（空字符串）
if (config.IS_PROD && !config.API_URL) {
  config.API_URL = ''
  config.SOCKET_URL = ''
}

// 如果设置了 API_URL，直接使用
if (config.API_URL) {
  config.SOCKET_URL = config.API_URL
}

export default config
