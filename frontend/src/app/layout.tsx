import type { Metadata } from 'next'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './globals.css'

export const metadata: Metadata = {
  title: '学与思教育 - 同城上门家教平台',
  description: '专注服务于小学、初中、高中年级学生，提供1对1全科上门家教辅导',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: '#0ea5e9',
              borderRadius: 8,
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}

