'use client'

import { useEffect, useState } from 'react'
import { Drawer, Spin, Typography, Image, Space } from 'antd'
import { EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { getArticle } from '@/lib/api'

const { Title, Paragraph, Text } = Typography
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ArticleDrawerProps {
  visible: boolean
  articleId: string | null
  onClose: () => void
}

export default function ArticleDrawer({ visible, articleId, onClose }: ArticleDrawerProps) {
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && articleId) {
      loadArticle()
    }
  }, [visible, articleId])

  const loadArticle = async () => {
    if (!articleId) return
    
    try {
      setLoading(true)
      const data: any = await getArticle(articleId)
      setArticle(data)
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理富文本内容中的图片路径
  const processContent = (content: string) => {
    if (!content) return ''
    // 将相对路径的图片转换为完整URL
    return content.replace(/src="\/uploads\//g, `src="${API_URL}/uploads/`)
  }

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={visible}
      width={720}
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      ) : article ? (
        <div className="p-6">
          {/* 封面图 */}
          {article.coverImage && (
            <div className="mb-6 -mx-6 -mt-6">
              <Image
                src={
                  article.coverImage.startsWith('http')
                    ? article.coverImage
                    : `${API_URL}${article.coverImage}`
                }
                alt={article.title}
                className="w-full"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* 标题 */}
          <Title level={2}>{article.title}</Title>


          {/* 内容 */}
          <div
            className="article-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: processContent(article.content) }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-gray-400">
          文章不存在
        </div>
      )}

      <style jsx global>{`
        .article-content {
          color: #333;
          line-height: 1.8;
        }
        .article-content p {
          margin-bottom: 1em;
        }
        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5em 0;
          border-radius: 8px;
        }
        .article-content ul,
        .article-content ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }
        .article-content blockquote {
          border-left: 4px solid #1890ff;
          padding-left: 1em;
          margin: 1em 0;
          color: #666;
          font-style: italic;
        }
        .article-content code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .article-content pre {
          background: #f5f5f5;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
        }
      `}</style>
    </Drawer>
  )
}

