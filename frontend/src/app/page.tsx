'use client'

import { useEffect, useState } from 'react'
import { Carousel, Button, Badge, Tag, Card } from 'antd'
import { CustomerServiceOutlined, PhoneOutlined } from '@ant-design/icons'
import ChatWidget from '@/components/ChatWidget'
import BookingModal from '@/components/BookingModal'
import ArticleDrawer from '@/components/ArticleDrawer'
import MerchantInfoDrawer from '@/components/MerchantInfoDrawer'
import { getMerchantInfo, getBanners, getContentModules } from '@/lib/api'
import config from '@/lib/config'

const API_URL = config.API_URL

export default function Home() {
  const [chatVisible, setChatVisible] = useState(false)
  const [bookingVisible, setBookingVisible] = useState(false)
  const [merchantInfo, setMerchantInfo] = useState<any>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [contentModules, setContentModules] = useState<any[]>([])
  const [articleDrawerVisible, setArticleDrawerVisible] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [merchantInfoDrawerVisible, setMerchantInfoDrawerVisible] = useState(false)

  useEffect(() => {
    loadData()
    
    const checkScrollPosition = () => {
      // 移动端优化：当页面滚动超过 30px 时折叠头部（移动端更快折叠）
      const threshold = window.innerWidth < 640 ? 30 : 80
      
      // 检查页面滚动位置
      const pageScrollY = window.scrollY
      
      // 现在只有页面滚动，统一处理
      const shouldCollapse = pageScrollY > threshold
      setHeaderCollapsed(shouldCollapse)
    }
    
    // 设置页面滚动监听器
    window.addEventListener('scroll', checkScrollPosition, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', checkScrollPosition)
    }
  }, [])

  const loadData = async () => {
    try {
      const [merchant, bannersData, modulesData] = await Promise.all([
        getMerchantInfo(),
        getBanners(),
        getContentModules()
      ])
      setMerchantInfo(merchant as any)
      setBanners((bannersData as unknown as any[]) || [])
      setContentModules((modulesData as unknown as any[]) || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleCardClick = (articleId: string | null) => {
    if (articleId) {
      setSelectedArticleId(articleId)
      setArticleDrawerVisible(true)
    }
  }

  // 弹窗模式已不需要，保留状态以兼容但不自动打开

  return (
    <main className="min-h-screen bg-gray-100 relative">
      {/* 固定头部导航栏 */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerCollapsed ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-white to-gray-50/80'
      }`}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {headerCollapsed ? (
            // 折叠状态：保持Logo一致，添加标签信息
            <div 
              className="flex items-center justify-between py-2.5 cursor-pointer"
              onClick={() => setMerchantInfoDrawerVisible(true)}
            >
              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                {merchantInfo?.logoUrl ? (
                  <img
                    src={
                      merchantInfo.logoUrl.startsWith('http')
                        ? merchantInfo.logoUrl
                        : `${API_URL}${merchantInfo.logoUrl}`
                    }
                    alt={merchantInfo?.name}
                    className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white font-bold text-xs leading-tight text-center whitespace-pre-line">
                      {(() => {
                        const name = merchantInfo?.name || '学与思教育'
                        const chars = name.slice(0, 4)
                        return chars.length === 4 ? `${chars.slice(0, 2)}\n${chars.slice(2, 4)}` : chars
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 leading-tight truncate">
                      同城上门家教平台 | {merchantInfo?.name || '学与思教育'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">在线中</span>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 mt-0.5 text-xs text-gray-500">
                    <span className="whitespace-nowrap">1.2万人已咨询</span>
                    <span className="text-orange-500">金牌商家</span>
                    <span className="whitespace-nowrap">收录2年</span>
                    <span className="whitespace-nowrap">资质认证</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 展开状态：移动端优化的垂直布局
            <div 
              className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity py-4 sm:py-6"
              onClick={() => setMerchantInfoDrawerVisible(true)}
            >
              {merchantInfo?.logoUrl ? (
                <img
                  src={
                    merchantInfo.logoUrl.startsWith('http')
                      ? merchantInfo.logoUrl
                      : `${API_URL}${merchantInfo.logoUrl}`
                  }
                  alt={merchantInfo?.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover mb-2.5 shadow-md border-2 border-white"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 mb-2.5 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm leading-tight text-center whitespace-pre-line">
                    {(() => {
                      const name = merchantInfo?.name || '学与思教育'
                      const chars = name.slice(0, 4)
                      return chars.length === 4 ? `${chars.slice(0, 2)}\n${chars.slice(2, 4)}` : chars
                    })()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center tracking-tight">
                  {merchantInfo?.name || '学与思教育'}
                </h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">在线中</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 text-center font-medium">
                {merchantInfo?.description || '同城上门家教平台'}
              </p>
              {(() => {
                const serviceTags = Array.isArray(merchantInfo?.services) ? merchantInfo?.services : []
                const advantageTags = Array.isArray(merchantInfo?.advantages) ? merchantInfo?.advantages : []
                const tags = [...serviceTags, ...advantageTags].filter(Boolean)
                if (tags.length === 0) return null
                return (
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-2.5 px-4">
                    {tags.map((tag: string, idx: number) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="px-2.5 sm:px-3 py-1 text-xs rounded-full border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </header>

      {/* 内容模块区域 - 移动端横向滚动 */}
      {contentModules.length > 0 && (
        <section 
          className="max-w-4xl mx-auto relative z-10 py-1.5 sm:py-2" 
          style={{ 
            marginTop: headerCollapsed ? '56px' : (() => {
              // 计算头部高度，考虑商家标签的存在
              const hasTags = merchantInfo && (
                (Array.isArray(merchantInfo?.services) && merchantInfo.services.length > 0) ||
                (Array.isArray(merchantInfo?.advantages) && merchantInfo.advantages.length > 0)
              )
              return hasTags ? '280px' : '200px'
            })()
          }}
        >
          {/* 移动端：横向滚动 */}
          <div className="block md:hidden">
            <div className="bg-white mx-3 rounded-xl shadow-sm border border-gray-100 p-2">
              {/* 标题区域 */}
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-base font-bold text-gray-900">服务推荐</h2>
                <span className="text-xs text-gray-500">左右滑动查看更多 →</span>
              </div>
              {/* 横向滚动卡片 */}
              <div className="overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex gap-3 pb-1">
                  {contentModules.map((module) => (
                    module.cards?.map((card: any) => {
                      const cardImageSrc = card.imageUrl?.startsWith('http')
                        ? card.imageUrl
                        : `${API_URL}${card.imageUrl}`
                      
                      return (
                        <div
                          key={card.id}
                          className="flex-shrink-0 w-40 cursor-pointer"
                          onClick={() => handleCardClick(card.articleId)}
                        >
                          <div className="rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 aspect-square mb-2">
                            <img
                              alt={card.title}
                              src={cardImageSrc}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                            {card.title}
                          </h3>
                          {Array.isArray(card.tags) && card.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {card.tags.slice(0, 2).map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded whitespace-nowrap"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 桌面端：原网格布局 */}
          <div className="hidden md:grid grid-cols-2 gap-6 px-4 mt-4">
            {contentModules.map((module) => (
              <div key={module.id} className="mb-0">
                <div className="bg-white rounded-2xl pt-6 pb-6 px-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight">{module.title}</h2>
                      <Button
                        type="link"
                        size="small"
                        className="text-gray-500 hover:text-gray-700 p-0 h-auto font-medium text-xs"
                      >
                        更多 →
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {module.cards?.map((card: any) => {
                      const cardImageSrc = card.imageUrl?.startsWith('http')
                        ? card.imageUrl
                        : `${API_URL}${card.imageUrl}`

                      return (
                        <div
                          key={card.id}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all group border border-transparent hover:border-gray-200"
                          onClick={() => handleCardClick(card.articleId)}
                        >
                          <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                            <img
                              alt={card.title}
                              src={cardImageSrc}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold mb-2 text-gray-900 line-clamp-1">{card.title}</h3>
                            {Array.isArray(card.tags) && card.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {card.tags.map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}



      

      {/* 内联聊天区域作为首页主体 - 移动端优化 */}
      <section 
        className="w-full relative z-10 sm:px-4"
        style={{ 
          marginTop: contentModules.length > 0 
            ? '4px' 
            : (headerCollapsed ? '80px' : (() => {
                // 计算头部高度，考虑商家标签的存在
                const hasTags = merchantInfo && (
                  (Array.isArray(merchantInfo?.services) && merchantInfo.services.length > 0) ||
                  (Array.isArray(merchantInfo?.advantages) && merchantInfo.advantages.length > 0)
                )
                return hasTags ? '320px' : '240px'
              })()),
          minHeight: 'calc(100vh - 200px)'
        }}
      >
        <ChatWidget
          visible={true}
          onClose={() => {}}
          inline
          merchantName={merchantInfo?.name}
          merchantLogo={merchantInfo?.logoUrl}
          welcomeMessage={undefined}
        />
      </section>

      {/* 预约按钮 - 右上角悬浮，根据头部状态调整位置 */}
      <div className={`fixed right-3 z-50 transition-all duration-300 ${
        headerCollapsed ? 'top-16' : 'top-3'
      }`}>
        <Button
          type="primary"
          size={headerCollapsed ? "small" : "middle"}
          shape="round"
          icon={<PhoneOutlined />}
          onClick={() => setBookingVisible(true)}
          className={`shadow-lg hover:shadow-xl transition-all duration-300 ${
            headerCollapsed 
              ? 'text-xs px-3 py-1.5' 
              : 'text-xs sm:text-sm px-4 py-2'
          }`}
        >
          {headerCollapsed ? '预约' : '预约试听'}
        </Button>
      </div>

      {/* 预约表单 */}
      <BookingModal
        visible={bookingVisible}
        onClose={() => setBookingVisible(false)}
      />

      {/* 文章抽屉 */}
      <ArticleDrawer
        visible={articleDrawerVisible}
        articleId={selectedArticleId}
        onClose={() => {
          setArticleDrawerVisible(false)
          setSelectedArticleId(null)
        }}
      />

      {/* 商家信息抽屉 */}
      <MerchantInfoDrawer
        visible={merchantInfoDrawerVisible}
        merchantInfo={merchantInfo}
        onClose={() => setMerchantInfoDrawerVisible(false)}
      />
    </main>
  )
}

