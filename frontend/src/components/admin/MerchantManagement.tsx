'use client'

import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Switch, message, Space, Tag, Upload } from 'antd'
import { SaveOutlined, InboxOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { getAllMerchants, updateMerchantInfo, createMerchant, uploadMerchantLogo } from '@/lib/api'
import RichTextEditor from '@/components/RichTextEditor'
import config from '@/lib/config'

const API_URL = config.API_URL

export default function MerchantManagement() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [merchant, setMerchant] = useState<any>(null)
  const [services, setServices] = useState<string[]>([])
  const [advantages, setAdvantages] = useState<string[]>([])
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([])
  const [messageApi, contextHolder] = message.useMessage()
  const [detailedDescription, setDetailedDescription] = useState<string>('')

  useEffect(() => {
    loadMerchant()
  }, [])

  const loadMerchant = async () => {
    try {
      const data = await getAllMerchants()
      if (data.length > 0) {
        const merchantData = data[0]
        setMerchant(merchantData)
        form.setFieldsValue({
          name: merchantData.name,
          description: merchantData.description,
          welcomeMessage: merchantData.welcomeMessage,
          businessHours: merchantData.businessHours,
          logoUrl: merchantData.logoUrl,
          coverUrl: merchantData.coverUrl,
          isActive: merchantData.isActive,
          phone: merchantData.contact?.phone,
          address: merchantData.contact?.address,
        })
        setServices(Array.isArray(merchantData.services) ? merchantData.services : [])
        setAdvantages(Array.isArray(merchantData.advantages) ? merchantData.advantages : [])
        setDetailedDescription(merchantData.detailedDescription || '')
        
        // 设置Logo预览
        if (merchantData.logoUrl) {
          setUploadedLogoUrl(merchantData.logoUrl)
          setLogoFileList([
            {
              uid: '-1',
              name: 'logo.png',
              status: 'done',
              url: merchantData.logoUrl.startsWith('http')
                ? merchantData.logoUrl
                : `${API_URL}${merchantData.logoUrl}`,
            },
          ])
        }
      }
    } catch (error) {
      console.error('加载商家信息失败:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const data = {
        name: values.name,
        description: values.description,
        welcomeMessage: values.welcomeMessage,
        businessHours: values.businessHours,
        logoUrl: uploadedLogoUrl || values.logoUrl,
        coverUrl: values.coverUrl,
        isActive: values.isActive,
        services,
        advantages,
        detailedDescription,
        contact: {
          phone: values.phone,
          address: values.address,
        },
      }
      if (merchant?.id) {
        await updateMerchantInfo(merchant.id, data)
      } else {
        await createMerchant(data)
      }
      messageApi.success('保存成功')
      loadMerchant()
    } catch (error) {
      messageApi.error('保存失败')
      console.error('保存商家信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUploadChange: UploadProps['onChange'] = (info) => {
    setLogoFileList(info.fileList)
  }

  const customLogoUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options
    
    try {
      setUploading(true)
      onProgress({ percent: 50 })
      
      const response: any = await uploadMerchantLogo(file)
      
      if (response.success) {
        const logoUrl = response.url
        const absoluteUrl = logoUrl.startsWith('http') ? logoUrl : `${API_URL}${logoUrl}`
        setUploadedLogoUrl(logoUrl)
        form.setFieldsValue({ logoUrl })
        // 确保预览列表可用绝对地址，避免图片裂开
        setLogoFileList([
          {
            uid: String(Date.now()),
            name: file.name || 'logo.png',
            status: 'done',
            url: absoluteUrl,
          } as UploadFile,
        ])
        onSuccess(response, file)
        messageApi.success('Logo上传成功')
        onProgress({ percent: 100 })
      } else {
        onError(new Error('上传失败'))
        messageApi.error('Logo上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      onError(error)
      messageApi.error('Logo上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleAddService = (value: string) => {
    if (value && !services.includes(value)) {
      setServices([...services, value])
    }
  }

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const handleAddAdvantage = (value: string) => {
    if (value && !advantages.includes(value)) {
      setAdvantages([...advantages, value])
    }
  }

  const handleRemoveAdvantage = (index: number) => {
    setAdvantages(advantages.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">商家信息管理</h2>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="机构名称"
            name="name"
            rules={[{ required: true, message: '请输入机构名称' }]}
          >
            <Input placeholder="如：学与思教育" />
          </Form.Item>

          <Form.Item
            label="机构简介"
            name="description"
            rules={[{ required: true, message: '请输入机构简介' }]}
          >
            <Input.TextArea rows={4} placeholder="简要介绍您的机构..." />
          </Form.Item>

          {/* 详细描述（富文本编辑器） */}
          <Form.Item
            label="详细介绍"
            help="支持富文本编辑，可以插入图片、设置格式等"
          >
            <RichTextEditor
              value={detailedDescription}
              onChange={setDetailedDescription}
              placeholder="详细介绍您的机构，包括教学理念、师资力量、教学环境等..."
              height={300}
            />
          </Form.Item>

          {/* 欢迎语（用于前台对话默认展示） */}
          <Form.Item
            label="欢迎语（对话默认文案）"
            name="welcomeMessage"
            rules={[{ required: true, message: '请输入欢迎语' }]}
          >
            <Input.TextArea rows={3} placeholder="例如：您好，我们提供上门一对一辅导，支持先试课再决定~" />
          </Form.Item>

          {/* 服务特色 */}
          <Form.Item label="服务特色">
            <Space direction="vertical" className="w-full">
              <div className="flex flex-wrap gap-2 mb-2">
                {services.map((service, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => handleRemoveService(index)}
                    color="blue"
                  >
                    {service}
                  </Tag>
                ))}
              </div>
              <Input
                placeholder="输入服务特色后按回车添加"
                onPressEnter={(e: any) => {
                  handleAddService(e.target.value)
                  e.target.value = ''
                }}
              />
            </Space>
          </Form.Item>

          {/* 师资优势 */}
          <Form.Item label="师资优势">
            <Space direction="vertical" className="w-full">
              <div className="flex flex-wrap gap-2 mb-2">
                {advantages.map((advantage, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => handleRemoveAdvantage(index)}
                    color="green"
                  >
                    {advantage}
                  </Tag>
                ))}
              </div>
              <Input
                placeholder="输入师资优势后按回车添加"
                onPressEnter={(e: any) => {
                  handleAddAdvantage(e.target.value)
                  e.target.value = ''
                }}
              />
            </Space>
          </Form.Item>

          <Form.Item
            label="营业时间"
            name="businessHours"
          >
            <Input placeholder="如：周一至周日 9:00-21:00" />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="phone"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="如：13800000000" />
          </Form.Item>
          <Form.Item
            label="联系地址"
            name="address"
            rules={[{ required: true, message: '请输入联系地址' }]}
          >
            <Input placeholder="如：北京市海淀区中关村大街 1 号" />
          </Form.Item>

          <Form.Item
            label="Logo图片"
            extra="支持拖拽上传，或点击上传。建议尺寸：200x200px，支持 JPG、PNG 格式"
          >
            <Upload.Dragger
              name="file"
              fileList={logoFileList}
              customRequest={customLogoUpload}
              onChange={handleLogoUploadChange}
              maxCount={1}
              accept="image/*"
              listType="picture"
              onRemove={() => {
                setUploadedLogoUrl('')
                setLogoFileList([])
                form.setFieldsValue({ logoUrl: '' })
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽Logo图片到此区域上传</p>
              <p className="ant-upload-hint">支持单个文件上传</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            label="或输入Logo地址"
            name="logoUrl"
            help={uploadedLogoUrl ? `已上传Logo: ${uploadedLogoUrl}` : undefined}
          >
            <Input 
              placeholder="https://example.com/logo.png" 
              disabled={!!uploadedLogoUrl}
            />
          </Form.Item>

          <Form.Item
            label="封面图地址"
            name="coverUrl"
          >
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

