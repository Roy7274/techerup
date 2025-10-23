'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Space, Modal, Form, Input, Switch, message, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import { getBanners, createBanner, updateBanner, deleteBanner, reorderBanners, uploadBannerImage } from '@/lib/api'
import type { UploadFile, UploadProps } from 'antd'
import config from '@/lib/config'

const API_URL = config.API_URL

export default function BannerManagement() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBanner, setEditingBanner] = useState<any>(null)
  const [form] = Form.useForm()
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      setLoading(true)
      const data = await getBanners(false) // 获取所有轮播图
      setBanners(data as any)
    } catch (error) {
      message.error('加载失败')
      console.error('加载轮播图失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setEditingBanner(null)
    setUploadedImageUrl('')
    setFileList([])
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    form.setFieldsValue(record)
    setEditingBanner(record)
    setUploadedImageUrl(record.imageUrl)
    // 如果有图片，设置文件列表用于预览
    if (record.imageUrl) {
      setFileList([
        {
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: `${API_URL}${record.imageUrl}`,
        },
      ])
    } else {
      setFileList([])
    }
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个轮播图吗？',
      onOk: async () => {
        try {
          await deleteBanner(id)
          message.success('删除成功')
          loadBanners()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleSubmit = async (values: any) => {
    try {
      // 使用上传的图片URL或表单中输入的URL
      const imageUrl = uploadedImageUrl || values.imageUrl
      if (!imageUrl) {
        message.error('请上传图片或输入图片地址')
        return
      }

      const submitData = {
        ...values,
        imageUrl,
      }

      if (editingBanner) {
        await updateBanner(editingBanner.id, submitData)
        message.success('更新成功')
      } else {
        await createBanner(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadBanners()
    } catch (error) {
      message.error('操作失败')
      console.error('保存轮播图失败:', error)
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
        form.setFieldsValue({ imageUrl })
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

  const columns = [
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
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) => {
        // 如果是相对路径，添加API_URL前缀
        const imageSrc = url?.startsWith('http') ? url : `${API_URL}${url}`
        return (
          <img src={imageSrc} alt="轮播图" className="w-32 h-20 object-cover rounded" />
        )
      },
    },
    {
      title: '跳转链接',
      dataIndex: 'link',
      key: 'link',
      ellipsis: true,
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
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">轮播图管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加轮播图
        </Button>
      </div>

      <Table
        dataSource={banners}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingBanner ? '编辑轮播图' : '添加轮播图'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        confirmLoading={uploading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item
            label="轮播图图片"
            extra="支持拖拽上传，或点击上传。支持 JPG、PNG、GIF、WEBP 格式，文件大小不超过 5MB"
          >
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
                form.setFieldsValue({ imageUrl: '' })
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个文件上传
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            label="或输入图片地址"
            name="imageUrl"
            help={uploadedImageUrl ? `已上传图片: ${uploadedImageUrl}` : undefined}
          >
            <Input 
              placeholder="https://example.com/image.jpg" 
              disabled={!!uploadedImageUrl}
            />
          </Form.Item>

          <Form.Item
            label="跳转链接"
            name="link"
          >
            <Input placeholder="https://example.com (可选)" />
          </Form.Item>

          <Form.Item
            label="排序"
            name="order"
            initialValue={0}
          >
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="描述信息（可选）" />
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

