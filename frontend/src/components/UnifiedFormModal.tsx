'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Select, Input, Button, message, Space, Divider, Typography, Card } from 'antd'
import { FormOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined, BookOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons'
import { createInquiry, getSessionFormData, submitForm, getFormTemplates, updateInquiry } from '@/lib/api'

const { Text, Title } = Typography

interface UnifiedFormModalProps {
  visible: boolean
  onClose: () => void
  sessionId?: string
  messages?: Array<{
    id: string
    sender: 'user' | 'bot' | 'agent' | 'system'
    message: string
    createdAt: string
  }>
  title?: string
  formTemplateId?: string // 指定使用哪个表单模板
  showExtractedInfo?: boolean // 是否显示从对话中提取的信息
  showSaveDraft?: boolean // 是否显示保存草稿按钮
  initialValues?: Record<string, any> // 预填值（用于再编辑）
  inquiryId?: string // 传入则走更新咨询逻辑
  onSubmitted?: () => void // 提交成功回调，用于刷新外层列表
}

interface ExtractedInfo {
  city?: string
  grade?: string
  studentGender?: string
  identity?: string
  phone?: string
  name?: string
}

interface FormField {
  fieldName: string
  fieldLabel: string
  fieldType: string
  options?: any
  placeholder?: string
  required?: boolean
  order?: number
}

interface FormTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  order: number
  fields: FormField[]
  createdAt: string
  updatedAt: string
}

export default function UnifiedFormModal({ 
  visible, 
  onClose, 
  sessionId, 
  messages = [], 
  title = '填写信息',
  formTemplateId,
  showExtractedInfo = true,
  showSaveDraft = false,
  initialValues,
  inquiryId,
  onSubmitted
}: UnifiedFormModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({})
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<FormTemplate | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      loadFormTemplates()
      loadExistingData()
      if (showExtractedInfo) {
        extractInfoFromMessages()
      }
      // 加载传入的初始值（编辑模式）
      if (initialValues && Object.keys(initialValues).length > 0) {
        form.setFieldsValue(initialValues)
      }
    }
  }, [visible, formTemplateId])

  // 监听sessionId变化，重置表单和提取信息
  useEffect(() => {
    if (visible && sessionId) {
      // 重置表单
      form.resetFields()
      setExtractedInfo({})
      
      // 重新提取信息
      if (showExtractedInfo && messages.length > 0) {
        extractInfoFromMessages()
      }
      
      // 尝试加载该会话的已有表单数据
      loadExistingData()
    }
  }, [sessionId])

  // 加载表单模板
  const loadFormTemplates = async () => {
    try {
      setTemplateLoading(true)
      const templates = await getFormTemplates(false)
      setFormTemplates(templates)
      
      // 如果指定了模板ID，使用指定的模板
      if (formTemplateId) {
        const template = templates.find(t => t.id === formTemplateId)
        if (template) {
          setCurrentTemplate(template)
        }
      } else {
        // 否则使用第一个激活的模板
        const activeTemplate = templates.find(t => t.isActive)
        if (activeTemplate) {
          setCurrentTemplate(activeTemplate)
        }
      }
    } catch (error) {
      console.error('加载表单模板失败:', error)
      message.error('加载表单模板失败')
    } finally {
      setTemplateLoading(false)
    }
  }

  // 加载已存在的表单数据
  const loadExistingData = async () => {
    if (!sessionId) return
    
    try {
      const sessionFormData = await getSessionFormData(sessionId)
      if (sessionFormData && sessionFormData.data) {
        const data = sessionFormData.data
        // 只设置非空的字段值
        const formData: any = {}
        if (data.city) formData.city = data.city
        if (data.grade) formData.grade = data.grade
        if (data.studentGender) formData.studentGender = data.studentGender
        if (data.identity) formData.identity = data.identity
        if (data.phone) formData.phone = data.phone
        if (data.name) formData.name = data.name
        
        if (Object.keys(formData).length > 0) {
          form.setFieldsValue(formData)
          setExtractedInfo(data)
        }
      }
    } catch (error) {
      console.warn('加载会话表单数据失败:', error)
    }
  }

  // 从消息中提取信息
  const extractInfoFromMessages = () => {
    const userMessages = messages.filter(msg => msg.sender === 'user')
    const extracted: ExtractedInfo = {}

    userMessages.forEach(msg => {
      const text = msg.message.toLowerCase()

      // 提取城市信息
      const cityPatterns = [
        /我在(.+?)(?:市|区|县)/,
        /我在(.+?)(?:上学|工作|居住)/,
        /(.+?)(?:市|区|县)的/,
        /来自(.+?)(?:市|区|县)/
      ]
      for (const pattern of cityPatterns) {
        const match = text.match(pattern)
        if (match && !extracted.city) {
          extracted.city = match[1].trim()
          break
        }
      }

      // 提取学段信息
      if (!extracted.grade) {
        if (text.includes('小学') || text.includes('一年级') || text.includes('二年级') || 
            text.includes('三年级') || text.includes('四年级') || text.includes('五年级') || 
            text.includes('六年级')) {
          extracted.grade = '小学'
        } else if (text.includes('初中') || text.includes('初一') || text.includes('初二') || 
                   text.includes('初三') || text.includes('七年级') || text.includes('八年级') || 
                   text.includes('九年级')) {
          extracted.grade = '初中'
        } else if (text.includes('高中') || text.includes('高一') || text.includes('高二') || 
                   text.includes('高三') || text.includes('十年级') || text.includes('十一年级') || 
                   text.includes('十二年级')) {
          extracted.grade = '高中'
        }
      }

      // 提取性别信息
      if (!extracted.studentGender) {
        if (text.includes('男孩') || text.includes('儿子') || text.includes('男') || 
            text.includes('他') || text.includes('男生')) {
          extracted.studentGender = '男孩'
        } else if (text.includes('女孩') || text.includes('女儿') || text.includes('女') || 
                   text.includes('她') || text.includes('女生')) {
          extracted.studentGender = '女孩'
        }
      }

      // 提取身份信息
      if (!extracted.identity) {
        if (text.includes('我是家长') || text.includes('我是妈妈') || text.includes('我是爸爸') || 
            text.includes('家长') || text.includes('父母')) {
          extracted.identity = '家长'
        } else if (text.includes('我是学生') || text.includes('本人') || text.includes('我自己')) {
          extracted.identity = '本人'
        }
      }

      // 提取电话号码
      const phonePattern = /1[3-9]\d{9}/
      const phoneMatch = text.match(phonePattern)
      if (phoneMatch && !extracted.phone) {
        extracted.phone = phoneMatch[0]
      }

      // 提取姓名
      const namePatterns = [
        /我叫(.+?)(?:，|。|$)/,
        /我是(.+?)(?:，|。|$)/,
        /姓名(.+?)(?:，|。|$)/,
        /名字(.+?)(?:，|。|$)/
      ]
      for (const pattern of namePatterns) {
        const match = text.match(pattern)
        if (match && !extracted.name) {
          const name = match[1].trim()
          if (name.length <= 10 && !name.includes('电话') && !name.includes('手机')) {
            extracted.name = name
            break
          }
        }
      }
    })

    setExtractedInfo(extracted)
    
    // 自动填充表单（只填充空字段，不覆盖已有数据）
    if (Object.keys(extracted).length > 0) {
      const currentValues = form.getFieldsValue()
      const newValues: any = {}
      
      // 只设置当前为空且提取到的字段
      Object.keys(extracted).forEach(key => {
        if (!currentValues[key] && extracted[key as keyof ExtractedInfo]) {
          newValues[key] = extracted[key as keyof ExtractedInfo]
        }
      })
      
      if (Object.keys(newValues).length > 0) {
        form.setFieldsValue(newValues)
      }
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      if (inquiryId) {
        await updateInquiry(inquiryId, values)
        message.success('表单更新成功！')
        onSubmitted?.()
        handleClose()
      } else if (sessionId) {
        // 使用submitForm API提交表单
        await submitForm(sessionId, values)
        message.success('表单提交成功！')
        onSubmitted?.()
        handleClose()
      } else {
        // 如果没有会话ID，使用createInquiry API
        await createInquiry(values)
        message.success('表单提交成功！')
        onSubmitted?.()
        handleClose()
      }
    } catch (error) {
      message.error('表单提交失败，请稍后重试')
      console.error('表单提交失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue()
      if (sessionId) {
        // 使用现有的submitForm API保存草稿，添加isDraft标记
        await submitForm(sessionId, { ...values, isDraft: true })
        message.success('草稿已保存到会话中')
      } else {
        message.warning('请先选择一个会话')
      }
    } catch (error) {
      message.error('保存草稿失败，请检查网络连接')
      console.error('保存草稿失败:', error)
    }
  }

  const handleClose = () => {
    // 关闭时重置表单
    form.resetFields()
    setExtractedInfo({})
    onClose()
  }

  // 渲染表单字段
  const renderFormField = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder || `请输入${field.fieldLabel}`,
    }

    switch (field.fieldType) {
      case 'select':
        return (
          <Select {...commonProps} options={field.options?.map((opt: string) => ({ label: opt, value: opt }))} />
        )
      case 'radio':
        return (
          <Select {...commonProps} options={field.options?.map((opt: string) => ({ label: opt, value: opt }))} />
        )
      case 'tel':
        return <Input {...commonProps} type="tel" maxLength={11} />
      default:
        return <Input {...commonProps} />
    }
  }

  if (templateLoading) {
    return (
      <Modal
        title={title}
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={600}
        centered
      >
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">加载表单模板中...</p>
        </div>
      </Modal>
    )
  }

  if (!currentTemplate) {
    return (
      <Modal
        title={title}
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={600}
        centered
      >
        <div className="text-center py-8">
          <p className="text-gray-500">没有可用的表单模板</p>
          <Button onClick={handleClose} className="mt-4">
            关闭
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FormOutlined className="text-blue-500" />
          <span>{title}</span>
          {sessionId && (
            <span className="text-sm text-gray-500 ml-2">
              (会话: {sessionId.slice(-8)})
            </span>
          )}
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      centered
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' }
      }}
    >
      {/* 提取信息展示 */}
      {showExtractedInfo && Object.keys(extractedInfo).length > 0 && (
        <Card 
          size="small" 
          className="mb-4 bg-blue-50 border-blue-200"
          title={
            <div className="flex items-center gap-2 text-blue-600">
              <UserOutlined />
              <span className="text-sm">从对话中提取的信息</span>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-2 text-xs">
            {extractedInfo.city && (
              <div className="flex items-center gap-1">
                <EnvironmentOutlined className="text-blue-500" />
                <Text className="text-blue-600">城市: {extractedInfo.city}</Text>
              </div>
            )}
            {extractedInfo.grade && (
              <div className="flex items-center gap-1">
                <BookOutlined className="text-blue-500" />
                <Text className="text-blue-600">学段: {extractedInfo.grade}</Text>
              </div>
            )}
            {extractedInfo.studentGender && (
              <div className="flex items-center gap-1">
                {extractedInfo.studentGender === '男孩' ? 
                  <ManOutlined className="text-blue-500" /> : 
                  <WomanOutlined className="text-blue-500" />
                }
                <Text className="text-blue-600">性别: {extractedInfo.studentGender}</Text>
              </div>
            )}
            {extractedInfo.identity && (
              <div className="flex items-center gap-1">
                <UserOutlined className="text-blue-500" />
                <Text className="text-blue-600">身份: {extractedInfo.identity}</Text>
              </div>
            )}
            {extractedInfo.phone && (
              <div className="flex items-center gap-1">
                <PhoneOutlined className="text-blue-500" />
                <Text className="text-blue-600">电话: {extractedInfo.phone}</Text>
              </div>
            )}
            {extractedInfo.name && (
              <div className="flex items-center gap-1">
                <UserOutlined className="text-blue-500" />
                <Text className="text-blue-600">姓名: {extractedInfo.name}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="small"
      >
        <div className="grid grid-cols-2 gap-4">
          {currentTemplate.fields.map((field) => (
            <Form.Item
              key={field.fieldName}
              label={field.fieldLabel}
              name={field.fieldName}
              rules={[
                {
                  required: field.required,
                  message: `请输入${field.fieldLabel}`,
                },
                ...(field.fieldType === 'tel' ? [{
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入有效的手机号码',
                }] : []),
              ]}
            >
              {renderFormField(field)}
            </Form.Item>
          ))}
        </div>

        <Divider />

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={handleClose}>
              取消
            </Button>
            {showSaveDraft && (
              <Button onClick={handleSaveDraft}>
                保存草稿
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              提交表单
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div className="text-center text-xs text-gray-500 mt-3">
        <p>提交后，我们的老师会在24小时内联系您</p>
      </div>
    </Modal>
  )
}
