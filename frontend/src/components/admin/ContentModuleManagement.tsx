'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Upload,
  Tag,
  Tabs,
  Select,
  Card,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import dynamic from 'next/dynamic'
import {
  getContentModules,
  createContentModule,
  updateContentModule,
  deleteContentModule,
  getContentCards,
  createContentCard,
  updateContentCard,
  deleteContentCard,
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadBannerImage,
} from '@/lib/api'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
})

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ContentModuleManagement() {
  const [activeTab, setActiveTab] = useState('modules')
  const [modules, setModules] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // 模块相关
  const [moduleModalVisible, setModuleModalVisible] = useState(false)
  const [editingModule, setEditingModule] = useState<any>(null)
  const [moduleForm] = Form.useForm()
  
  // 卡片相关
  const [cardModalVisible, setCardModalVisible] = useState(false)
  const [editingCard, setEditingCard] = useState<any>(null)
  const [cardForm] = Form.useForm()
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  
  // 文章相关
  const [articleModalVisible, setArticleModalVisible] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [articleForm] = Form.useForm()
  const [articleContent, setArticleContent] = useState('')
  const [articleCoverImage, setArticleCoverImage] = useState('')
  const [articleCoverFileList, setArticleCoverFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'modules') {
        const data = await getContentModules(false)
        setModules((data as any) || [])
      } else if (activeTab === 'cards') {
        const data = await getContentCards(undefined, false)
        setCards((data as any) || [])
      } else if (activeTab === 'articles') {
        const data = await getArticles(false)
        setArticles((data as any) || [])
      }
    } catch (error) {
      message.error('加载数据失败')
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // ===== 模块管理 =====
  const handleAddModule = () => {
    moduleForm.resetFields()
    setEditingModule(null)
    setModuleModalVisible(true)
  }

  const handleEditModule = (record: any) => {
    moduleForm.setFieldsValue(record)
    setEditingModule(record)
    setModuleModalVisible(true)
  }

  const handleDeleteModule = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模块吗？相关的卡片也会被删除。',
      onOk: async () => {
        try {
          await deleteContentModule(id)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleSubmitModule = async (values: any) => {
    try {
      if (editingModule) {
        await updateContentModule(editingModule.id, values)
        message.success('更新成功')
      } else {
        await createContentModule(values)
        message.success('创建成功')
      }
      setModuleModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
      console.error('保存模块失败:', error)
    }
  }

  // ===== 卡片管理 =====
  const handleAddCard = () => {
    cardForm.resetFields()
    setEditingCard(null)
    setUploadedImageUrl('')
    setFileList([])
    setTags([])
    setCardModalVisible(true)
  }

  const handleEditCard = (record: any) => {
    cardForm.setFieldsValue({
      ...record,
      tags: undefined, // tags单独处理
    })
    setEditingCard(record)
    setUploadedImageUrl(record.imageUrl)
    setTags(Array.isArray(record.tags) ? record.tags : [])
    
    if (record.imageUrl) {
      setFileList([
        {
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: record.imageUrl.startsWith('http')
            ? record.imageUrl
            : `${API_URL}${record.imageUrl}`,
        },
      ])
    } else {
      setFileList([])
    }
    setCardModalVisible(true)
  }

  const handleDeleteCard = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个卡片吗？',
      onOk: async () => {
        try {
          await deleteContentCard(id)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleSubmitCard = async (values: any) => {
    try {
      const imageUrl = uploadedImageUrl || values.imageUrl
      if (!imageUrl) {
        message.error('请上传图片或输入图片地址')
        return
      }

      const submitData = {
        ...values,
        imageUrl,
        tags,
      }

      if (editingCard) {
        await updateContentCard(editingCard.id, submitData)
        message.success('更新成功')
      } else {
        await createContentCard(submitData)
        message.success('创建成功')
      }
      setCardModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
      console.error('保存卡片失败:', error)
    }
  }

  const handleUploadChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList)
  }

  const customUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options
    
    try {
      setUploading(true)
      onProgress({ percent: 50 })
      
      const response: any = await uploadBannerImage(file)
      
      if (response.success) {
        const imageUrl = response.url
        setUploadedImageUrl(imageUrl)
        cardForm.setFieldsValue({ imageUrl })
        onSuccess(response, file)
        message.success('上传成功')
        onProgress({ percent: 100 })
      } else {
        onError(new Error('上传失败'))
        message.error('上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      onError(error)
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // ===== 文章管理 =====
  const handleAddArticle = () => {
    articleForm.resetFields()
    setEditingArticle(null)
    setArticleContent('')
    setArticleCoverImage('')
    setArticleCoverFileList([])
    setArticleModalVisible(true)
  }

  const handleEditArticle = (record: any) => {
    articleForm.setFieldsValue({
      title: record.title,
      author: record.author,
      isActive: record.isActive,
    })
    setEditingArticle(record)
    setArticleContent(record.content || '')
    setArticleCoverImage(record.coverImage || '')
    
    if (record.coverImage) {
      setArticleCoverFileList([
        {
          uid: '-1',
          name: 'cover.png',
          status: 'done',
          url: record.coverImage.startsWith('http')
            ? record.coverImage
            : `${API_URL}${record.coverImage}`,
        },
      ])
    } else {
      setArticleCoverFileList([])
    }
    setArticleModalVisible(true)
  }

  const handleDeleteArticle = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这篇文章吗？',
      onOk: async () => {
        try {
          await deleteArticle(id)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleSubmitArticle = async (values: any) => {
    try {
      if (!articleContent) {
        message.error('请输入文章内容')
        return
      }

      const submitData = {
        ...values,
        content: articleContent,
        coverImage: articleCoverImage || values.coverImage,
      }

      if (editingArticle) {
        await updateArticle(editingArticle.id, submitData)
        message.success('更新成功')
      } else {
        await createArticle(submitData)
        message.success('创建成功')
      }
      setArticleModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
      console.error('保存文章失败:', error)
    }
  }

  // 文章封面上传
  const handleArticleCoverUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options
    
    try {
      setUploading(true)
      onProgress({ percent: 50 })
      
      const response: any = await uploadBannerImage(file)
      
      if (response.success) {
        const imageUrl = response.url
        setArticleCoverImage(imageUrl)
        articleForm.setFieldsValue({ coverImage: imageUrl })
        onSuccess(response, file)
        message.success('上传成功')
        onProgress({ percent: 100 })
      } else {
        onError(new Error('上传失败'))
        message.error('上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      onError(error)
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  // 表格列定义
  const moduleColumns = [
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '卡片数量',
      key: 'cardCount',
      render: (record: any) => record.cards?.length || 0,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
          {isActive ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditModule(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteModule(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const cardColumns = [
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
    },
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) => {
        const imageSrc = url?.startsWith('http') ? url : `${API_URL}${url}`
        return (
          <img src={imageSrc} alt="卡片" className="w-20 h-16 object-cover rounded" />
        )
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '所属模块',
      key: 'module',
      render: (record: any) => record.module?.title || '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(tags) &&
            tags.map((tag, index) => (
              <Tag key={index} color="blue">
                {tag}
              </Tag>
            ))}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
          {isActive ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditCard(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCard(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const articleColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: '浏览次数',
      dataIndex: 'viewCount',
      key: 'viewCount',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
          {isActive ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditArticle(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteArticle(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">内容模块管理</h2>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'modules',
            label: '内容模块',
            children: (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">管理首页展示的内容模块</p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddModule}
                  >
                    添加模块
                  </Button>
                </div>
                <Table
                  dataSource={modules}
                  columns={moduleColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                />
              </>
            ),
          },
          {
            key: 'cards',
            label: '内容卡片',
            children: (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">管理模块内的内容卡片</p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddCard}
                  >
                    添加卡片
                  </Button>
                </div>
                <Table
                  dataSource={cards}
                  columns={cardColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
          {
            key: 'articles',
            label: '文章管理',
            children: (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">管理文章内容</p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddArticle}
                  >
                    添加文章
                  </Button>
                </div>
                <Table
                  dataSource={articles}
                  columns={articleColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
        ]}
      />

      {/* 模块编辑弹窗 */}
      <Modal
        title={editingModule ? '编辑模块' : '添加模块'}
        open={moduleModalVisible}
        onCancel={() => setModuleModalVisible(false)}
        onOk={() => moduleForm.submit()}
        width={600}
      >
        <Form
          form={moduleForm}
          layout="vertical"
          onFinish={handleSubmitModule}
        >
          <Form.Item
            label="模块标题"
            name="title"
            rules={[{ required: true, message: '请输入模块标题' }]}
          >
            <Input placeholder="如：课程服务、精选案例" />
          </Form.Item>

          <Form.Item label="模块描述" name="description">
            <Input.TextArea rows={2} placeholder="模块的简短描述（可选）" />
          </Form.Item>

          <Form.Item
            label="排序"
            name="order"
            initialValue={0}
          >
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 卡片编辑弹窗 */}
      <Modal
        title={editingCard ? '编辑卡片' : '添加卡片'}
        open={cardModalVisible}
        onCancel={() => setCardModalVisible(false)}
        onOk={() => cardForm.submit()}
        width={700}
        confirmLoading={uploading}
      >
        <Form form={cardForm} layout="vertical" onFinish={handleSubmitCard}>
          <Form.Item
            label="所属模块"
            name="moduleId"
            rules={[{ required: true, message: '请选择所属模块' }]}
          >
            <Select placeholder="选择模块">
              {modules.map((module) => (
                <Select.Option key={module.id} value={module.id}>
                  {module.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="卡片标题"
            name="title"
            rules={[{ required: true, message: '请输入卡片标题' }]}
          >
            <Input placeholder="请输入卡片标题" />
          </Form.Item>

          <Form.Item label="卡片图片" extra="支持拖拽上传">
            <Upload.Dragger
              name="file"
              fileList={fileList}
              customRequest={customUpload}
              onChange={handleUploadChange}
              maxCount={1}
              accept="image/*"
              listType="picture"
              onRemove={() => {
                setUploadedImageUrl('')
                setFileList([])
                cardForm.setFieldsValue({ imageUrl: '' })
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item label="或输入图片地址" name="imageUrl">
            <Input
              placeholder="https://example.com/image.jpg"
              disabled={!!uploadedImageUrl}
            />
          </Form.Item>

          <Form.Item 
            label="内容标签" 
            extra="添加标签可以让用户更直观地了解服务特点，如：上门家教、1对1辅导等"
          >
            <Space direction="vertical" className="w-full">
              {/* 预设标签选择 */}
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-2">快速选择常用标签：</div>
                <Space wrap>
                  {['上门家教', '小初高上门家教辅导', '985大学生家教', '免费试讲', '同城上门家教', '1对1辅导', '专职家教', '不限基础', '不限人数', '正式课', '线下面授', '1对1教学'].map((presetTag) => (
                    <Button
                      key={presetTag}
                      size="small"
                      type={tags.includes(presetTag) ? 'primary' : 'default'}
                      onClick={() => {
                        if (tags.includes(presetTag)) {
                          handleRemoveTag(presetTag)
                        } else {
                          setTags([...tags, presetTag])
                        }
                      }}
                      style={{
                        background: tags.includes(presetTag) ? '#e8e8e8' : '#f5f5f5',
                        color: tags.includes(presetTag) ? '#1890ff' : '#666',
                        borderColor: tags.includes(presetTag) ? '#1890ff' : '#d9d9d9',
                      }}
                    >
                      {presetTag}
                    </Button>
                  ))}
                </Space>
              </div>
              
              {/* 已选择的标签展示 */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">已选择标签（点击删除）：</div>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Tag
                        key={index}
                        closable
                        onClose={() => handleRemoveTag(tag)}
                        style={{
                          background: '#e8e8e8',
                          color: '#333',
                          border: 'none',
                          padding: '4px 12px',
                          fontSize: '13px',
                          borderRadius: '4px',
                        }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">暂无标签</div>
                )}
              </div>

              {/* 自定义标签输入 */}
              <div>
                <div className="text-sm text-gray-600 mb-2">或添加自定义标签：</div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="输入自定义标签名称"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onPressEnter={handleAddTag}
                  />
                  <Button type="primary" onClick={handleAddTag}>
                    添加
                  </Button>
                </Space.Compact>
              </div>
            </Space>
          </Form.Item>

          <Form.Item label="关联文章" name="articleId">
            <Select placeholder="选择文章（可选）" allowClear>
              {articles.map((article) => (
                <Select.Option key={article.id} value={article.id}>
                  {article.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="排序" name="order" initialValue={0}>
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 文章编辑弹窗 */}
      <Modal
        title={editingArticle ? '编辑文章' : '添加文章'}
        open={articleModalVisible}
        onCancel={() => setArticleModalVisible(false)}
        onOk={() => articleForm.submit()}
        width={1200}
        style={{ top: 20 }}
        confirmLoading={uploading}
      >
        <Form form={articleForm} layout="vertical" onFinish={handleSubmitArticle}>
          <Form.Item
            label="文章标题"
            name="title"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" size="large" />
          </Form.Item>

          <Form.Item
            label="文章内容"
            required
            extra="支持富文本编辑，可直接粘贴图片上传"
          >
            <RichTextEditor
              value={articleContent}
              onChange={setArticleContent}
              placeholder="请输入文章内容，支持粘贴图片..."
              height={400}
            />
          </Form.Item>

          <Form.Item label="封面图">
            <Upload.Dragger
              name="file"
              fileList={articleCoverFileList}
              customRequest={handleArticleCoverUpload}
              onChange={(info) => setArticleCoverFileList(info.fileList)}
              maxCount={1}
              accept="image/*"
              listType="picture"
              onRemove={() => {
                setArticleCoverImage('')
                setArticleCoverFileList([])
                articleForm.setFieldsValue({ coverImage: '' })
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽封面图到此区域上传</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item label="或输入封面图地址" name="coverImage">
            <Input
              placeholder="https://example.com/cover.jpg"
              disabled={!!articleCoverImage}
            />
          </Form.Item>

          <Form.Item label="作者" name="author">
            <Input placeholder="请输入作者姓名（可选）" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

