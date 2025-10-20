'use client'

import { Drawer, Typography, Image, Space, Tag, Divider, Button } from 'antd'
import { PhoneOutlined, EnvironmentOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface MerchantInfoDrawerProps {
  visible: boolean
  merchantInfo: any
  onClose: () => void
}

export default function MerchantInfoDrawer({ visible, merchantInfo, onClose }: MerchantInfoDrawerProps) {
  if (!merchantInfo) return null

  // 处理富文本内容中的图片路径
  const processContent = (content: string) => {
    if (!content) return ''
    // 将相对路径的图片转换为完整URL
    return content.replace(/src="\/uploads\//g, `src="${API_URL}/uploads/`)
  }

  return (
    <Drawer
      title="机构信息"
      placement="right"
      onClose={onClose}
      open={visible}
      width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      styles={{ body: { padding: 0 } }}
    >
      <div className="p-4 sm:p-6">
        {/* Logo和基本信息 - 移动端优化 */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          {merchantInfo.logoUrl ? (
            <Image
              src={
                merchantInfo.logoUrl.startsWith('http')
                  ? merchantInfo.logoUrl
                  : `${API_URL}${merchantInfo.logoUrl}`
              }
              alt={merchantInfo.name}
              width={window.innerWidth < 640 ? 60 : 80}
              height={window.innerWidth < 640 ? 60 : 80}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">
                {(merchantInfo.name || '学与思教育').slice(0, 4)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Title level={3} className="mb-1 text-lg sm:text-xl">{merchantInfo.name}</Title>
            <Text type="secondary" className="text-xs sm:text-sm">{merchantInfo.description}</Text>
          </div>
        </div>

        {/* 联系信息 - 移动端优化 */}
        <div className="mb-4 sm:mb-6">
          <Title level={4} className="text-base sm:text-lg mb-2 sm:mb-3">联系信息</Title>
          <Space direction="vertical" className="w-full" size="small">
            {merchantInfo.contact?.phone && (
              <div className="flex items-center gap-2">
                <PhoneOutlined className="text-blue-500 text-sm sm:text-base" />
                <Text className="text-sm sm:text-base">{merchantInfo.contact.phone}</Text>
              </div>
            )}
            {merchantInfo.contact?.address && (
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="text-green-500 text-sm sm:text-base" />
                <Text className="text-sm sm:text-base break-words">{merchantInfo.contact.address}</Text>
              </div>
            )}
            {merchantInfo.businessHours && (
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-orange-500 text-sm sm:text-base" />
                <Text className="text-sm sm:text-base">{merchantInfo.businessHours}</Text>
              </div>
            )}
          </Space>
        </div>

        {/* 服务特色 - 移动端优化 */}
        {merchantInfo.services && merchantInfo.services.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <Title level={4} className="text-base sm:text-lg mb-2 sm:mb-3">服务特色</Title>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {merchantInfo.services.map((service: string, index: number) => (
                <Tag key={index} color="blue" className="mb-1 sm:mb-2 text-xs sm:text-sm">
                  {service}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* 师资优势 - 移动端优化 */}
        {merchantInfo.advantages && merchantInfo.advantages.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <Title level={4} className="text-base sm:text-lg mb-2 sm:mb-3">师资优势</Title>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {merchantInfo.advantages.map((advantage: string, index: number) => (
                <Tag key={index} color="green" className="mb-1 sm:mb-2 text-xs sm:text-sm">
                  <StarOutlined className="mr-1" />
                  {advantage}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* 欢迎语 - 移动端优化 */}
        {merchantInfo.welcomeMessage && (
          <div className="mb-4 sm:mb-6">
            <Title level={4} className="text-base sm:text-lg mb-2 sm:mb-3">欢迎语</Title>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-400">
              <Text className="text-sm sm:text-base">{merchantInfo.welcomeMessage}</Text>
            </div>
          </div>
        )}

        {/* 详细描述（富文本内容） - 移动端优化 */}
        {merchantInfo.detailedDescription && (
          <div className="mb-4 sm:mb-6">
            <Title level={4} className="text-base sm:text-lg mb-2 sm:mb-3">详细介绍</Title>
            <div
              className="merchant-detail-content prose prose-sm sm:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: processContent(merchantInfo.detailedDescription) }}
            />
          </div>
        )}

        {/* 封面图 - 移动端优化 */}
        {merchantInfo.coverUrl && (
          <div className="mb-4 sm:mb-6">
            <Title level={4} className="text-base sm:text-lg mb-2 sm:mb-3">机构展示</Title>
            <Image
              src={
                merchantInfo.coverUrl.startsWith('http')
                  ? merchantInfo.coverUrl
                  : `${API_URL}${merchantInfo.coverUrl}`
              }
              alt={merchantInfo.name}
              className="w-full rounded-lg"
              style={{ maxHeight: '250px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* 状态指示 - 移动端优化 */}
        <div className="flex items-center justify-center gap-2 pt-3 sm:pt-4 border-t">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <Text type="secondary" className="text-xs sm:text-sm">
            {merchantInfo.isActive ? '营业中' : '暂停营业'}
          </Text>
        </div>
      </div>

      <style jsx global>{`
        .merchant-detail-content {
          color: #333;
          line-height: 1.8;
        }
        .merchant-detail-content p {
          margin-bottom: 1em;
        }
        .merchant-detail-content h1,
        .merchant-detail-content h2,
        .merchant-detail-content h3,
        .merchant-detail-content h4 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .merchant-detail-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5em 0;
          border-radius: 8px;
        }
        .merchant-detail-content ul,
        .merchant-detail-content ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }
        .merchant-detail-content blockquote {
          border-left: 4px solid #1890ff;
          padding-left: 1em;
          margin: 1em 0;
          color: #666;
          font-style: italic;
        }
        .merchant-detail-content code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .merchant-detail-content pre {
          background: #f5f5f5;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
        }
      `}</style>
    </Drawer>
  )
}

