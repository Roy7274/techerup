'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Tabs,
  Tag,
  InputNumber,
  Popconfirm,
  Divider,
  Radio,
  Checkbox,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  FormOutlined,
  CloseOutlined,
  ShopOutlined,
  SettingOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import {
  getAutoReplies,
  createAutoReply,
  updateAutoReply,
  deleteAutoReply,
  toggleAutoReplyActive,
  getFormTemplates,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  toggleFormTemplateActive,
  getMerchantInfo,
  createMerchant,
  updateMerchantInfo,
} from '@/lib/api'

const { TextArea } = Input
const { TabPane } = Tabs

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
  _count?: { autoReplies: number }
}

interface AutoReply {
  id: string
  name: string
  triggerType: string
  keywords?: string[]
  priority: number
  message: string
  hasOptions: boolean
  options?: any
  formTemplateId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  formTemplate?: { id: string; name: string }
  // AI相关字段
  useAI?: boolean
  aiPrompt?: string
  aiModel?: string
  // 关键词AI结合功能
  keywordAIEnabled?: boolean
  keywordAIPrompt?: string
}

interface MerchantInfo {
  id: string
  businessName: string
  businessType: string
  businessDescription: string
  location: string
  contactPhone: string
  contactEmail: string
  businessHours: string
  services: string[]
  specialOffers: string
  targetAudience: string
  businessAdvantages: string
  // AI相关配置
  aiConfig: {
    defaultModel: string
    systemPrompt: string
    maxTokens: number
    temperature: number
    apiKey: string
    apiSecret: string
  }
  // 默认AI回复配置
  defaultAIEnabled?: boolean
  defaultAIPriority?: number
  defaultAIPrompt?: string
  createdAt: string
  updatedAt: string
}

export default function AutoReplyManagement() {
  const [activeTab, setActiveTab] = useState('autoReplies')
  
  // 自动回复相关状态
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([])
  const [autoReplyLoading, setAutoReplyLoading] = useState(false)
  const [autoReplyModalVisible, setAutoReplyModalVisible] = useState(false)
  const [editingAutoReply, setEditingAutoReply] = useState<AutoReply | null>(null)
  const [autoReplyForm] = Form.useForm()
  
  // 新增：可视化选项配置（选项可以关联表单字段）
  const [replyOptions, setReplyOptions] = useState<Array<{label: string; fieldName?: string; fieldValue?: string}>>([])

  // 表单模板相关状态
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null)
  const [templateForm] = Form.useForm()
  const [templateFields, setTemplateFields] = useState<FormField[]>([])
  const [defaultTemplateChecked, setDefaultTemplateChecked] = useState(false)

  // 商家信息相关状态
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null)
  const [merchantLoading, setMerchantLoading] = useState(false)
  const [merchantModalVisible, setMerchantModalVisible] = useState(false)
  const [merchantForm] = Form.useForm()
  const [services, setServices] = useState<string[]>([])
  const [defaultMerchantChecked, setDefaultMerchantChecked] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      await loadAutoReplies()
      await loadFormTemplates()
      await loadMerchantInfo()
      
      // 检查并创建默认配置（只在首次加载时）
      if (!defaultTemplateChecked) {
        await ensureDefaultFormTemplate()
      }
      if (!defaultMerchantChecked) {
        await ensureDefaultMerchantInfo()
      }
    }
    
    initializeData()
  }, [])

  // 确保存在默认表单模板
  const ensureDefaultFormTemplate = async () => {
    try {
      // 标记已检查过，避免重复检查
      setDefaultTemplateChecked(true)
      
      const templates = await getFormTemplates(false)
      // 修复：检查 templates 结构，确保正确访问数据
      const templateList = templates.data || templates || []
      const hasDefault = templateList.some((t: any) => t.name === '预约试听表单')
      
      if (!hasDefault) {
        console.log('未找到默认表单模板，正在创建...')
        // 创建默认表单模板
        await createFormTemplate({
          name: '预约试听表单',
          description: '用于收集用户预约试听的基本信息',
          isActive: true,
          order: 0,
          fields: [
            {
              fieldName: 'city',
              fieldLabel: '所在城市',
              fieldType: 'text',
              placeholder: '请输入您所在的城市',
              required: true,
              order: 0,
            },
            {
              fieldName: 'grade',
              fieldLabel: '学段',
              fieldType: 'select',
              options: ['小学', '初中', '高中'],
              placeholder: '请选择学段',
              required: true,
              order: 1,
            },
            {
              fieldName: 'studentGender',
              fieldLabel: '学生性别',
              fieldType: 'select',
              options: ['男孩', '女孩'],
              placeholder: '请选择学生性别',
              required: true,
              order: 2,
            },
            {
              fieldName: 'identity',
              fieldLabel: '咨询身份',
              fieldType: 'select',
              options: ['本人', '家长'],
              placeholder: '请选择咨询身份',
              required: true,
              order: 3,
            },
            {
              fieldName: 'phone',
              fieldLabel: '联系电话',
              fieldType: 'tel',
              placeholder: '请输入11位手机号',
              required: true,
              order: 4,
            },
          ],
        })
        message.success('已自动创建默认表单模板')
        loadFormTemplates()
      } else {
        console.log('默认表单模板已存在，跳过创建')
      }
    } catch (error) {
      console.error('创建默认表单模板失败:', error)
      // 即使出错也要标记为已检查，避免重复尝试
      setDefaultTemplateChecked(true)
    }
  }

  // 加载自动回复
  const loadAutoReplies = async () => {
    setAutoReplyLoading(true)
    try {
      const data = await getAutoReplies(false)
      setAutoReplies(data)
    } catch (error) {
      message.error('加载自动回复失败')
    } finally {
      setAutoReplyLoading(false)
    }
  }

  // 加载表单模板
  const loadFormTemplates = async () => {
    setTemplateLoading(true)
    try {
      const data = await getFormTemplates(false)
      setFormTemplates(data)
    } catch (error) {
      message.error('加载表单模板失败')
    } finally {
      setTemplateLoading(false)
    }
  }

  // 加载商家信息
  const loadMerchantInfo = async () => {
    setMerchantLoading(true)
    try {
      const data = await getMerchantInfo()
      setMerchantInfo(data)
      if (data?.services) {
        setServices(data.services)
      }
    } catch (error) {
      console.log('商家信息未配置，等待初始化')
    } finally {
      setMerchantLoading(false)
    }
  }

  // 确保存在默认商家信息
  const ensureDefaultMerchantInfo = async () => {
    try {
      setDefaultMerchantChecked(true)
      
      // 直接调用API检查是否已存在商家信息
      const existingMerchant = await getMerchantInfo()
      
      if (!existingMerchant) {
        console.log('未找到商家信息配置，正在创建默认配置...')
        const defaultMerchantInfo = {
          businessName: '在线教育机构',
          businessType: '教育培训',
          businessDescription: '专业的在线教育服务平台',
          location: '全国',
          contactPhone: '400-xxx-xxxx',
          contactEmail: 'contact@example.com',
          businessHours: '周一至周日 9:00-21:00',
          services: ['一对一辅导', '小班课程', '试听课程', '学习规划'],
          specialOffers: '新用户免费试听课程',
          targetAudience: '小学、初中、高中学生及家长',
          businessAdvantages: '师资力量雄厚，个性化教学方案，灵活的上课时间',
          aiConfig: {
            defaultModel: 'deepseek-v3.1-250821',
            systemPrompt: '你是一个专业的教育咨询顾问，请根据提供的商家信息回答用户问题，态度友好专业，重点推荐我们的课程和服务。',
            maxTokens: 2000,
            temperature: 0.7,
            apiKey: '',
            apiSecret: ''
          }
        }
        
        await createMerchant(defaultMerchantInfo)
        message.success('已创建默认商家信息配置')
        loadMerchantInfo()
      } else {
        console.log('商家信息配置已存在，跳过创建')
      }
    } catch (error) {
      console.error('创建默认商家信息失败:', error)
      setDefaultMerchantChecked(true)
    }
  }

  // 自动回复相关操作
  const handleAutoReplyEdit = (record: AutoReply) => {
    setEditingAutoReply(record)
    
    // 解析选项
    let parsedOptions: Array<{label: string; fieldName?: string; fieldValue?: string}> = []
    if (record.options && Array.isArray(record.options)) {
      parsedOptions = record.options.map((opt: any) => ({
        label: opt.label || '',
        fieldName: opt.fieldName,
        fieldValue: opt.fieldValue
      }))
    }
    setReplyOptions(parsedOptions)
    
    autoReplyForm.setFieldsValue({
      name: record.name,
      triggerType: record.triggerType,
      keywords: record.keywords || [],
      priority: record.priority,
      message: record.message,
      hasOptions: record.hasOptions,
      formTemplateId: record.formTemplateId,
      isActive: record.isActive,
      useAI: record.useAI,
      aiPrompt: record.aiPrompt,
      aiModel: record.aiModel,
      keywordAIEnabled: record.keywordAIEnabled,
      keywordAIPrompt: record.keywordAIPrompt,
    })
    setAutoReplyModalVisible(true)
  }

  const handleAutoReplyDelete = async (id: string) => {
    try {
      await deleteAutoReply(id)
      message.success('删除成功')
      loadAutoReplies()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleAutoReplyToggle = async (id: string) => {
    try {
      await toggleAutoReplyActive(id)
      message.success('状态切换成功')
      loadAutoReplies()
    } catch (error) {
      message.error('状态切换失败')
    }
  }

  const handleAutoReplySubmit = async () => {
    try {
      const values = await autoReplyForm.validateFields()
      
      // 处理选项
      let options = null
      if (values.hasOptions && replyOptions.length > 0) {
        options = replyOptions.map(opt => ({
          label: opt.label,
          value: opt.label,
          fieldName: opt.fieldName || undefined,
          fieldValue: opt.fieldValue || opt.label
        }))
      }

      const payload = {
        name: values.name,
        triggerType: values.triggerType,
        keywords: values.keywords || [],
        priority: values.priority || 0,
        message: values.message,
        hasOptions: values.hasOptions || false,
        options,
        formTemplateId: values.formTemplateId || null,
        isActive: values.isActive !== false,
        useAI: values.useAI || false,
        aiPrompt: values.aiPrompt || null,
        aiModel: values.aiModel || null,
        keywordAIEnabled: values.keywordAIEnabled || false,
        keywordAIPrompt: values.keywordAIPrompt || null,
      }

      if (editingAutoReply) {
        await updateAutoReply(editingAutoReply.id, payload)
        message.success('更新成功')
      } else {
        await createAutoReply(payload)
        message.success('创建成功')
      }

      setAutoReplyModalVisible(false)
      autoReplyForm.resetFields()
      setEditingAutoReply(null)
      setReplyOptions([])
      loadAutoReplies()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 表单模板相关操作
  const handleTemplateEdit = (record: FormTemplate) => {
    setEditingTemplate(record)
    templateForm.setFieldsValue({
      name: record.name,
      description: record.description,
      order: record.order,
      isActive: record.isActive,
    })
    setTemplateFields(record.fields || [])
    setTemplateModalVisible(true)
  }

  const handleTemplateDelete = async (id: string) => {
    try {
      await deleteFormTemplate(id)
      message.success('删除成功')
      loadFormTemplates()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '删除失败')
    }
  }

  const handleTemplateToggle = async (id: string) => {
    try {
      await toggleFormTemplateActive(id)
      message.success('状态切换成功')
      loadFormTemplates()
    } catch (error) {
      message.error('状态切换失败')
    }
  }

  const handleTemplateSubmit = async () => {
    try {
      const values = await templateForm.validateFields()
      
      // 过滤掉无效的字段（空字段名或标签）
      const validFields = templateFields.filter(field => 
        field.fieldName && field.fieldName.trim() && 
        field.fieldLabel && field.fieldLabel.trim()
      )
      
      // 如果有无效字段，提示用户
      if (templateFields.length > 0 && validFields.length !== templateFields.length) {
        message.warning('请填写完整的字段信息（字段名和标签不能为空）')
        return
      }
      
      // 确保字段数据格式正确
      const processedFields = validFields.map((field, index) => ({
        fieldName: field.fieldName.trim(),
        fieldLabel: field.fieldLabel.trim(),
        fieldType: field.fieldType || 'text',
        options: field.options || undefined,
        placeholder: field.placeholder?.trim() || undefined,
        required: field.required === true, // 保持用户设置的必填状态
        order: index,
      }))
      
      const payload = {
        name: values.name,
        description: values.description,
        order: values.order || 0,
        isActive: values.isActive !== false,
        fields: processedFields,
      }

      if (editingTemplate) {
        await updateFormTemplate(editingTemplate.id, payload)
        message.success('更新成功')
      } else {
        await createFormTemplate(payload)
        message.success('创建成功')
      }

      setTemplateModalVisible(false)
      templateForm.resetFields()
      setEditingTemplate(null)
      setTemplateFields([])
      loadFormTemplates()
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败')
    }
  }

  const handleAddField = () => {
    setTemplateFields([
      ...templateFields,
      {
        fieldName: `field_${templateFields.length + 1}`,
        fieldLabel: `字段${templateFields.length + 1}`,
        fieldType: 'text',
        required: false, // 默认非必填，让用户自主决定
        order: templateFields.length,
      },
    ])
  }

  const handleFieldChange = (index: number, field: string, value: any) => {
    const newFields = [...templateFields]
    newFields[index] = { ...newFields[index], [field]: value }
    setTemplateFields(newFields)
  }

  const handleRemoveField = (index: number) => {
    setTemplateFields(templateFields.filter((_, i) => i !== index))
  }

  // 商家信息相关操作
  const handleMerchantEdit = () => {
    if (merchantInfo) {
      merchantForm.setFieldsValue({
        businessName: merchantInfo.businessName,
        businessType: merchantInfo.businessType,
        businessDescription: merchantInfo.businessDescription,
        location: merchantInfo.location,
        contactPhone: merchantInfo.contactPhone,
        contactEmail: merchantInfo.contactEmail,
        businessHours: merchantInfo.businessHours,
        services: merchantInfo.services,
        specialOffers: merchantInfo.specialOffers,
        targetAudience: merchantInfo.targetAudience,
        businessAdvantages: merchantInfo.businessAdvantages,
        defaultModel: merchantInfo.aiConfig?.defaultModel || 'deepseek-v3.1-250821',
        systemPrompt: merchantInfo.aiConfig?.systemPrompt,
        maxTokens: merchantInfo.aiConfig?.maxTokens || 2000,
        temperature: merchantInfo.aiConfig?.temperature || 0.7,
        apiKey: merchantInfo.aiConfig?.apiKey,
        apiSecret: merchantInfo.aiConfig?.apiSecret,
        defaultAIEnabled: merchantInfo.defaultAIEnabled || false,
        defaultAIPriority: merchantInfo.defaultAIPriority || 5,
        defaultAIPrompt: merchantInfo.defaultAIPrompt,
      })
      setServices(merchantInfo.services || [])
    }
    setMerchantModalVisible(true)
  }

  const handleMerchantSubmit = async () => {
    try {
      // 验证服务项目
      if (services.length === 0) {
        message.error('请至少添加一个服务项目')
        return
      }

      // 验证服务项目不能为空
      const hasEmptyService = services.some(service => !service.trim())
      if (hasEmptyService) {
        message.error('服务项目不能为空')
        return
      }

      const values = await merchantForm.validateFields()
      
      // 验证API Key和Secret Key
      if (!values.apiKey || values.apiKey.trim().length < 10) {
        message.error('API Key长度不能少于10个字符')
        return
      }
      if (!values.apiSecret || values.apiSecret.trim().length < 10) {
        message.error('Secret Key长度不能少于10个字符')
        return
      }
      
      const payload = {
        businessName: values.businessName,
        businessType: values.businessType,
        businessDescription: values.businessDescription,
        location: values.location,
        contactPhone: values.contactPhone,
        contactEmail: values.contactEmail,
        businessHours: values.businessHours,
        services: services.filter(service => service.trim()), // 过滤空服务
        specialOffers: values.specialOffers,
        targetAudience: values.targetAudience,
        businessAdvantages: values.businessAdvantages,
        aiConfig: {
          defaultModel: values.defaultModel || 'deepseek-v3.1-250821',
          systemPrompt: values.systemPrompt,
          maxTokens: values.maxTokens || 2000,
          temperature: values.temperature || 0.7,
          apiKey: values.apiKey?.trim(),
          apiSecret: values.apiSecret?.trim(),
        },
        defaultAIEnabled: values.defaultAIEnabled || false,
        defaultAIPriority: values.defaultAIPriority || 5,
        defaultAIPrompt: values.defaultAIPrompt,
      }

      console.log('提交的payload:', JSON.stringify(payload, null, 2))

      if (merchantInfo) {
        await updateMerchantInfo(merchantInfo.id, payload)
        message.success('更新成功')
      } else {
        await createMerchant(payload)
        message.success('创建成功')
      }

      setMerchantModalVisible(false)
      merchantForm.resetFields()
      setServices([])
      loadMerchantInfo()
    } catch (error) {
      console.error('提交失败:', error)
      if (error.errorFields && error.errorFields.length > 0) {
        message.error('请检查表单填写是否正确')
      } else {
        message.error('提交失败')
      }
    }
  }

  const handleAddService = () => {
    setServices([...services, ''])
  }

  const handleServiceChange = (index: number, value: string) => {
    const newServices = [...services]
    newServices[index] = value
    setServices(newServices)
  }

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  // 验证字段是否有效
  const isFieldValid = (field: FormField) => {
    return field.fieldName && field.fieldName.trim() && 
           field.fieldLabel && field.fieldLabel.trim()
  }

  // 获取无效字段数量
  const getInvalidFieldsCount = () => {
    return templateFields.filter(field => !isFieldValid(field)).length
  }

  // 自动回复表格列
  const autoReplyColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '触发类型',
      dataIndex: 'triggerType',
      key: 'triggerType',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          welcome: { text: '欢迎语', color: 'green' },
          keyword: { text: '关键词', color: 'blue' },
          default: { text: '默认回复', color: 'orange' },
          scheduled: { text: '定时询问', color: 'cyan' },
        }
        const config = typeMap[type] || { text: type, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 150,
      render: (keywords: string[]) => {
        if (!keywords || keywords.length === 0) return '-'
        return keywords.map((k) => (
          <Tag key={k} style={{ marginBottom: 4 }}>
            {k}
          </Tag>
        ))
      },
    },
    {
      title: '回复内容',
      dataIndex: 'message',
      key: 'message',
      width: 200,
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a: AutoReply, b: AutoReply) => a.priority - b.priority,
    },
    {
      title: '带选项',
      dataIndex: 'hasOptions',
      key: 'hasOptions',
      width: 80,
      render: (hasOptions: boolean) => (
        <Tag color={hasOptions ? 'green' : 'default'}>
          {hasOptions ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: 'AI智能',
      dataIndex: 'useAI',
      key: 'useAI',
      width: 80,
      render: (useAI: boolean, record: AutoReply) => {
        if (record.triggerType === 'keyword') {
          if (record.keywordAIEnabled) {
            return <Tag color="blue" icon={<BulbOutlined />}>关键词AI</Tag>
          }
          if (useAI) {
            return <Tag color="gold" icon={<BulbOutlined />}>AI</Tag>
          }
          return <Tag color="default">固定</Tag>
        }
        return <Tag color="default">固定</Tag>
      },
    },
    {
      title: '关联表单',
      dataIndex: 'formTemplate',
      key: 'formTemplate',
      width: 120,
      render: (formTemplate: any) => formTemplate?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record: AutoReply) => (
        <Switch
          checked={isActive}
          onChange={() => handleAutoReplyToggle(record.id)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: AutoReply) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleAutoReplyEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个自动回复吗？"
            onConfirm={() => handleAutoReplyDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 表单模板表格列
  const templateColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '字段数量',
      dataIndex: 'fields',
      key: 'fieldCount',
      width: 100,
      render: (fields: FormField[]) => fields?.length || 0,
    },
    {
      title: '关联回复数',
      dataIndex: '_count',
      key: 'autoReplyCount',
      width: 100,
      render: (count: any) => count?.autoReplies || 0,
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      sorter: (a: FormTemplate, b: FormTemplate) => a.order - b.order,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record: FormTemplate) => (
        <Switch
          checked={isActive}
          onChange={() => handleTemplateToggle(record.id)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: FormTemplate) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleTemplateEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个表单模板吗？"
            description={
              record._count?.autoReplies
                ? '注意：此模板被自动回复使用，删除可能影响功能'
                : undefined
            }
            onConfirm={() => handleTemplateDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <RobotOutlined />
                自动回复管理
              </span>
            }
            key="autoReplies"
          >
            <Card
              title="自动回复配置说明"
              style={{ marginBottom: 16 }}
              size="small"
              type="inner"
            >
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>触发类型说明：</strong></p>
                <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
                  <li><strong>欢迎语</strong>：用户首次进入时发送，建议设置高优先级（如100）</li>
                  <li><strong>关键词触发</strong>：匹配用户消息中的关键词时触发，如&quot;价格&quot;、&quot;费用&quot;等</li>
                  <li><strong>定时询问</strong>：按优先级顺序发送的询问消息，用于收集用户信息（城市→学段→性别→身份→电话）</li>
                  <li><strong>默认回复</strong>：当没有其他匹配时的回复，建议设置低优先级（如10）</li>
                </ul>
                <p><strong>定时询问配置建议：</strong></p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>城市询问：优先级90，包含城市选项</li>
                  <li>学段询问：优先级80，包含小学/初中/高中选项</li>
                  <li>性别询问：优先级70，包含男孩/女孩选项</li>
                  <li>身份询问：优先级60，包含本人/家长选项</li>
                  <li>电话询问：优先级50，不包含选项</li>
                </ul>
              </div>
            </Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingAutoReply(null)
                  autoReplyForm.resetFields()
                  setReplyOptions([])
                  setAutoReplyModalVisible(true)
                }}
              >
                新增自动回复
              </Button>
            </div>
            <Table
              columns={autoReplyColumns}
              dataSource={autoReplies}
              rowKey="id"
              loading={autoReplyLoading}
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FormOutlined />
                表单模板管理
              </span>
            }
            key="formTemplates"
          >
            <Card
              title="表单模板说明"
              style={{ marginBottom: 16 }}
              size="small"
              type="inner"
            >
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>字段配置要求：</strong></p>
                <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
                  <li><strong>字段名</strong>：用于数据存储，如 phone、city（必填，英文）</li>
                  <li><strong>字段标签</strong>：用户看到的标签，如"联系电话"、"所在城市"（必填）</li>
                  <li><strong>字段类型</strong>：text（文本）、tel（电话）、select（下拉）、radio（单选）、checkbox（多选）</li>
                  <li><strong>必填设置</strong>：由您决定该字段是否必填，影响用户填写时的验证</li>
                  <li><strong>选项配置</strong>：下拉、单选、多选类型需要配置选项，格式如：["选项1","选项2"]</li>
                </ul>
                <p><strong>默认模板字段：</strong></p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>所在城市（文本输入）</li>
                  <li>学段（下拉选择：小学/初中/高中）</li>
                  <li>学生性别（下拉选择：男孩/女孩）</li>
                  <li>咨询身份（下拉选择：本人/家长）</li>
                  <li>联系电话（手机号输入）</li>
                </ul>
              </div>
            </Card>
            <Table
              columns={templateColumns}
              dataSource={formTemplates}
              rowKey="id"
              loading={templateLoading}
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <ShopOutlined />
                商家提示词配置
              </span>
            }
            key="merchantInfo"
          >
            <Card
              title="商家提示词配置说明"
              style={{ marginBottom: 16 }}
              size="small"
              type="inner"
            >
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>商家提示词配置：</strong></p>
                <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
                  <li><strong>基本信息</strong>：商家名称、类型、描述等基础信息</li>
                  <li><strong>联系方式</strong>：电话、邮箱、营业时间等联系信息</li>
                  <li><strong>业务信息</strong>：服务项目、特色优势、目标客户等</li>
                  <li><strong>AI配置</strong>：模型选择、系统提示词、API密钥等</li>
                </ul>
                <p><strong>默认AI智能回复配置：</strong></p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>默认AI回复：当没有其他特殊触发时，自动使用AI回复</li>
                  <li>优先级设置：控制默认AI回复的优先级</li>
                  <li>系统提示词：定义AI回复的角色和风格</li>
                  <li>模型参数：控制AI回复的创造性和长度</li>
                </ul>
              </div>
            </Card>
            
            <Card 
              title="商家信息" 
              extra={
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={handleMerchantEdit}
                  loading={merchantLoading}
                >
                  {merchantInfo ? '编辑配置' : '初始化配置'}
                </Button>
              }
            >
              {merchantLoading ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  加载中...
                </div>
              ) : merchantInfo ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                  <Card size="small" title="基本信息" type="inner">
                    <p><strong>商家名称：</strong>{merchantInfo.businessName}</p>
                    <p><strong>业务类型：</strong>{merchantInfo.businessType}</p>
                    <p><strong>业务描述：</strong>{merchantInfo.businessDescription}</p>
                    <p><strong>所在地区：</strong>{merchantInfo.location}</p>
                  </Card>
                  
                  <Card size="small" title="联系信息" type="inner">
                    <p><strong>联系电话：</strong>{merchantInfo.contactPhone}</p>
                    <p><strong>联系邮箱：</strong>{merchantInfo.contactEmail}</p>
                    <p><strong>营业时间：</strong>{merchantInfo.businessHours}</p>
                  </Card>
                  
                  <Card size="small" title="业务信息" type="inner">
                    <p><strong>服务项目：</strong></p>
                    <div style={{ marginLeft: 16, marginBottom: 8 }}>
                      {merchantInfo.services.map((service, index) => (
                        <Tag key={index} style={{ marginBottom: 4 }}>{service}</Tag>
                      ))}
                    </div>
                    <p><strong>特色优势：</strong>{merchantInfo.businessAdvantages}</p>
                    <p><strong>目标客户：</strong>{merchantInfo.targetAudience}</p>
                    <p><strong>优惠活动：</strong>{merchantInfo.specialOffers}</p>
                  </Card>
                  
                  <Card size="small" title="AI配置" type="inner">
                    <p><strong>默认模型：</strong>{merchantInfo.aiConfig?.defaultModel || '未配置'}</p>
                    <p><strong>最大输出：</strong>{merchantInfo.aiConfig?.maxTokens || 0} tokens</p>
                    <p><strong>创造性：</strong>{merchantInfo.aiConfig?.temperature || 0}</p>
                    <p><strong>API状态：</strong>
                      <Tag color={merchantInfo.aiConfig?.apiKey ? 'green' : 'red'}>
                        {merchantInfo.aiConfig?.apiKey ? '已配置' : '未配置'}
                      </Tag>
                    </p>
                  </Card>
                  
                  <Card size="small" title="默认AI回复" type="inner">
                    <p><strong>默认AI回复：</strong>
                      <Tag color={merchantInfo.defaultAIEnabled ? 'green' : 'red'}>
                        {merchantInfo.defaultAIEnabled ? '已开启' : '未开启'}
                      </Tag>
                    </p>
                    <p><strong>优先级：</strong>{merchantInfo.defaultAIPriority || 5}</p>
                    <p><strong>提示词：</strong>
                      {merchantInfo.defaultAIPrompt ? 
                        (merchantInfo.defaultAIPrompt.length > 50 ? 
                          merchantInfo.defaultAIPrompt.substring(0, 50) + '...' : 
                          merchantInfo.defaultAIPrompt) : 
                        '未设置'
                      }
                    </p>
                  </Card>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <p>暂未配置商家信息，请点击右上角按钮进行初始化配置</p>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* 自动回复编辑弹窗 */}
      <Modal
        title={editingAutoReply ? '编辑自动回复' : '新增自动回复'}
        open={autoReplyModalVisible}
        onOk={handleAutoReplySubmit}
        onCancel={() => {
          setAutoReplyModalVisible(false)
          autoReplyForm.resetFields()
          setEditingAutoReply(null)
          setReplyOptions([])
        }}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={autoReplyForm} layout="vertical">
          <Form.Item
            label="回复名称"
            name="name"
            rules={[{ required: true, message: '请输入回复名称' }]}
          >
            <Input placeholder="用于管理识别，如：欢迎语、课程咨询等" />
          </Form.Item>

          <Form.Item
            label="触发类型"
            name="triggerType"
            rules={[{ required: true, message: '请选择触发类型' }]}
          >
            <Select placeholder="请选择触发类型">
              <Select.Option value="welcome">欢迎语（用户首次进入时发送）</Select.Option>
              <Select.Option value="keyword">关键词触发（匹配用户消息中的关键词）</Select.Option>
              <Select.Option value="scheduled">定时询问（按顺序发送的询问消息，用于收集用户信息）</Select.Option>
              <Select.Option value="default">默认回复（当没有其他匹配时的回复）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.triggerType !== cur.triggerType}
          >
            {({ getFieldValue }) =>
              getFieldValue('triggerType') === 'keyword' ? (
                <div>
                  <Form.Item
                    label="触发关键词"
                    name="keywords"
                    extra="输入关键词后按回车添加，支持多个关键词"
                  >
                    <Select
                      mode="tags"
                      style={{ width: '100%' }}
                      placeholder="输入关键词后按回车添加"
                      tokenSeparators={[',']}
                    />
                  </Form.Item>
                  <Form.Item
                    label="启用关键词AI回复"
                    name="keywordAIEnabled"
                    valuePropName="checked"
                    extra="开启后，当触发关键词时会结合AI智能回复"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) => prev.keywordAIEnabled !== cur.keywordAIEnabled}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('keywordAIEnabled') ? (
                        <Form.Item
                          label="关键词AI提示词"
                          name="keywordAIPrompt"
                          extra="专门用于关键词触发的AI提示词，留空则使用系统提示词"
                        >
                          <TextArea 
                            rows={3} 
                            placeholder="例如：当用户询问价格相关问题时，请重点介绍我们的课程优势和性价比..."
                          />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label="优先级"
            name="priority"
            extra="数字越大优先级越高，多个匹配时优先使用高优先级的回复"
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.triggerType !== cur.triggerType}
          >
            {({ getFieldValue }) =>
              getFieldValue('triggerType') !== 'ai' ? (
                <Form.Item
                  label="回复内容"
                  name="message"
                  rules={[{ required: true, message: '请输入回复内容' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="输入自动回复的文本内容"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.triggerType !== cur.triggerType}
          >
            {({ getFieldValue }) =>
              getFieldValue('triggerType') === 'keyword' ? (
                <div>
                  <Form.Item
                    label="启用AI智能回复"
                    name="useAI"
                    valuePropName="checked"
                    extra="开启后，当触发关键词时会结合AI智能回复"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) => prev.useAI !== cur.useAI}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('useAI') ? (
                        <div>
                          <Form.Item
                            label="AI模型"
                            name="aiModel"
                            extra="选择使用的AI模型，留空则使用默认配置"
                          >
                            <Select placeholder="使用默认模型" allowClear>
                              <Select.Option value="qianfan-lightning-128b-a19b">qianfan-lightning-128b-a19b</Select.Option>
                              <Select.Option value="deepseek-v3.1-250821">DeepSeek v3.1</Select.Option>
                              <Select.Option value="ernie-4.0-8k">ERNIE 4.0 8K</Select.Option>
                              <Select.Option value="ernie-3.5-8k">ERNIE 3.5 8K</Select.Option>
                              <Select.Option value="ernie-lite-8k">ERNIE Lite 8K</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            label="AI提示词"
                            name="aiPrompt"
                            extra="自定义AI回复的角色和风格，留空则使用商家信息中的默认提示词"
                          >
                            <TextArea
                              rows={4}
                              placeholder="例如：你是一个专业的教育咨询顾问，请根据用户问题提供专业建议..."
                            />
                          </Form.Item>
                        </div>
                      ) : (
                        <Form.Item
                          label="回复内容"
                          name="message"
                          rules={[{ required: true, message: '请输入回复内容' }]}
                        >
                          <TextArea
                            rows={4}
                            placeholder="输入自动回复的文本内容"
                          />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                </div>
              ) : (
                <Form.Item
                  label="回复内容"
                  name="message"
                  rules={[{ required: true, message: '请输入回复内容' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="输入自动回复的文本内容"
                  />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item
            label="包含可点击选项"
            name="hasOptions"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.hasOptions !== cur.hasOptions}
          >
            {({ getFieldValue }) =>
              getFieldValue('hasOptions') ? (
                <Form.Item 
                  label="可点击选项" 
                  extra="用户点击选项后会自动发送到聊天，如果关联了表单字段会自动保存"
                >
                  <div>
                    {replyOptions.map((option, index) => (
                      <Card 
                        key={index} 
                        size="small" 
                        style={{ marginBottom: 12 }}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => {
                              setReplyOptions(replyOptions.filter((_, i) => i !== index))
                            }}
                          />
                        }
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Input
                            placeholder="选项文字，如：男孩"
                            value={option.label}
                            onChange={(e) => {
                              const newOptions = [...replyOptions]
                              newOptions[index].label = e.target.value
                              setReplyOptions(newOptions)
                            }}
                            addonBefore="按钮文字"
                          />
                          <Select
                            placeholder="不关联字段"
                            value={option.fieldName}
                            onChange={(value) => {
                              const newOptions = [...replyOptions]
                              newOptions[index].fieldName = value
                              setReplyOptions(newOptions)
                            }}
                            allowClear
                            style={{ width: '100%' }}
                          >
                            <Select.Option value="">不关联字段</Select.Option>
                            <Select.Option value="city">保存到：所在城市</Select.Option>
                            <Select.Option value="grade">保存到：学段</Select.Option>
                            <Select.Option value="studentGender">保存到：学生性别</Select.Option>
                            <Select.Option value="identity">保存到：咨询身份</Select.Option>
                          </Select>
                          {option.fieldName && (
                            <Input
                              placeholder="保存的值（默认使用按钮文字）"
                              value={option.fieldValue}
                              onChange={(e) => {
                                const newOptions = [...replyOptions]
                                newOptions[index].fieldValue = e.target.value
                                setReplyOptions(newOptions)
                              }}
                              addonBefore="保存值"
                            />
                          )}
                        </Space>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => setReplyOptions([...replyOptions, { label: '', fieldName: '', fieldValue: '' }])}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加选项
                    </Button>
                  </div>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item 
            label="关联表单收集" 
            name="formTemplateId"
            extra="勾选后，此自动回复会收集用户信息到预约试听表单"
          >
            <Select
              placeholder="不关联表单"
              allowClear
            >
              {formTemplates
                .filter((t) => t.isActive)
                .map((template) => (
                  <Select.Option key={template.id} value={template.id}>
                    {template.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      {/* 表单模板编辑弹窗 */}
      <Modal
        title={editingTemplate ? '编辑表单模板' : '新增表单模板'}
        open={templateModalVisible}
        onOk={handleTemplateSubmit}
        onCancel={() => {
          setTemplateModalVisible(false)
          templateForm.resetFields()
          setEditingTemplate(null)
          setTemplateFields([])
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            label="模板名称"
            name="name"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="如：预约试听、课程咨询" />
          </Form.Item>

          <Form.Item label="模板描述" name="description">
            <Input placeholder="描述该模板的用途" />
          </Form.Item>

          <Form.Item label="排序" name="order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <Divider>表单字段</Divider>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span>表单字段配置</span>
              {getInvalidFieldsCount() > 0 && (
                <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                  有 {getInvalidFieldsCount()} 个字段需要完善信息
                </span>
              )}
            </div>
            <Button type="dashed" onClick={handleAddField} block>
              <PlusOutlined /> 添加字段
            </Button>
          </div>

          {templateFields.map((field, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 12 }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>字段 {index + 1}</span>
                  {field.required && (
                    <Tag color="red" size="small">必填</Tag>
                  )}
                  {!isFieldValid(field) && (
                    <Tag color="orange" size="small">需要完善</Tag>
                  )}
                </div>
              }
              extra={
                <Button
                  type="link"
                  danger
                  onClick={() => handleRemoveField(index)}
                >
                  删除
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ width: '100%' }}>
                  <Input
                    placeholder="字段名（如：phone）"
                    value={field.fieldName}
                    onChange={(e) =>
                      handleFieldChange(index, 'fieldName', e.target.value)
                    }
                    style={{ width: 150 }}
                    status={!field.fieldName || !field.fieldName.trim() ? 'error' : ''}
                  />
                  <Input
                    placeholder="字段标签（如：联系电话）"
                    value={field.fieldLabel}
                    onChange={(e) =>
                      handleFieldChange(index, 'fieldLabel', e.target.value)
                    }
                    style={{ width: 150 }}
                    status={!field.fieldLabel || !field.fieldLabel.trim() ? 'error' : ''}
                  />
                  <Select
                    value={field.fieldType}
                    onChange={(value) =>
                      handleFieldChange(index, 'fieldType', value)
                    }
                    style={{ width: 120 }}
                  >
                    <Select.Option value="text">文本</Select.Option>
                    <Select.Option value="tel">电话</Select.Option>
                    <Select.Option value="select">下拉选择</Select.Option>
                    <Select.Option value="radio">单选</Select.Option>
                    <Select.Option value="checkbox">多选</Select.Option>
                  </Select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '12px' }}>必填：</span>
                    <Switch
                      size="small"
                      checked={field.required}
                      onChange={(checked) =>
                        handleFieldChange(index, 'required', checked)
                      }
                    />
                  </div>
                </Space>
                <Input
                  placeholder="占位符文本"
                  value={field.placeholder}
                  onChange={(e) =>
                    handleFieldChange(index, 'placeholder', e.target.value)
                  }
                />
                {['select', 'radio', 'checkbox'].includes(field.fieldType) && (
                  <TextArea
                    placeholder='选项（JSON格式），如：["选项1","选项2"]'
                    value={
                      typeof field.options === 'string'
                        ? field.options
                        : JSON.stringify(field.options || [])
                    }
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        handleFieldChange(index, 'options', parsed)
                      } catch {
                        handleFieldChange(index, 'options', e.target.value)
                      }
                    }}
                    rows={2}
                  />
                )}
              </Space>
            </Card>
          ))}
        </Form>
      </Modal>

      {/* 商家信息编辑弹窗 */}
      <Modal
        title="商家信息配置"
        open={merchantModalVisible}
        onOk={handleMerchantSubmit}
        onCancel={() => {
          setMerchantModalVisible(false)
          merchantForm.resetFields()
          setServices([])
        }}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form form={merchantForm} layout="vertical">
          <Divider>基本信息</Divider>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item
              label="商家名称"
              name="businessName"
              rules={[{ required: true, message: '请输入商家名称' }]}
            >
              <Input placeholder="如：优学教育" />
            </Form.Item>
            <Form.Item
              label="业务类型"
              name="businessType"
              rules={[{ required: true, message: '请输入业务类型' }]}
            >
              <Input placeholder="如：教育培训、课外辅导" />
            </Form.Item>
          </div>
          
          <Form.Item
            label="业务描述"
            name="businessDescription"
            rules={[{ required: true, message: '请输入业务描述' }]}
          >
            <TextArea rows={3} placeholder="简要描述您的业务特色和定位" />
          </Form.Item>

          <Divider>联系信息</Divider>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item
              label="所在地区"
              name="location"
              rules={[{ required: true, message: '请输入所在地区' }]}
            >
              <Input placeholder="如：北京市海淀区" />
            </Form.Item>
            <Form.Item
              label="联系电话"
              name="contactPhone"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="如：400-xxx-xxxx" />
            </Form.Item>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item
              label="联系邮箱"
              name="contactEmail"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="如：contact@example.com" />
            </Form.Item>
            <Form.Item
              label="营业时间"
              name="businessHours"
              rules={[{ required: true, message: '请输入营业时间' }]}
            >
              <Input placeholder="如：周一至周日 9:00-21:00" />
            </Form.Item>
          </div>

          <Divider>业务信息</Divider>
          <Form.Item 
            label="服务项目"
            rules={[{ required: true, message: '请至少添加一个服务项目' }]}
            validateStatus={services.length === 0 ? 'error' : ''}
            help={services.length === 0 ? '请至少添加一个服务项目' : ''}
          >
            <div>
              {services.map((service, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
                  <Input
                    placeholder="服务项目"
                    value={service}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Button 
                    type="link" 
                    danger 
                    onClick={() => handleRemoveService(index)}
                  >
                    删除
                  </Button>
                </Space>
              ))}
              <Button type="dashed" onClick={handleAddService} block>
                <PlusOutlined /> 添加服务项目
              </Button>
            </div>
          </Form.Item>
          
          <Form.Item
            label="特色优势"
            name="businessAdvantages"
            rules={[{ required: true, message: '请输入特色优势' }]}
          >
            <TextArea rows={2} placeholder="描述您的业务优势和特色" />
          </Form.Item>
          
          <Form.Item
            label="目标客户"
            name="targetAudience"
            rules={[{ required: true, message: '请输入目标客户' }]}
          >
            <Input placeholder="如：小学、初中、高中学生及家长" />
          </Form.Item>
          
          <Form.Item
            label="优惠活动"
            name="specialOffers"
          >
            <TextArea rows={2} placeholder="描述当前的优惠活动和特价课程" />
          </Form.Item>

          <Divider>AI配置</Divider>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item
              label="默认AI模型"
              name="defaultModel"
              rules={[{ required: true, message: '请选择默认AI模型' }]}
            >
              <Select placeholder="选择AI模型">
                <Select.Option value="qianfan-lightning-128b-a19b">Qianfan-Lightning</Select.Option>
                <Select.Option value="deepseek-v3.1-250821">DeepSeek v3.1</Select.Option>
                <Select.Option value="ernie-4.0-8k">ERNIE 4.0 8K</Select.Option>
                <Select.Option value="ernie-3.5-8k">ERNIE 3.5 8K</Select.Option>
                <Select.Option value="ernie-lite-8k">ERNIE Lite 8K</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="最大输出长度"
              name="maxTokens"
              rules={[
                { required: true, message: '请输入最大输出长度' },
                { type: 'number', min: 100, max: 4000, message: '长度必须在100-4000之间' }
              ]}
            >
              <InputNumber min={100} max={4000} style={{ width: '100%' }} placeholder="2000" />
            </Form.Item>
          </div>
          
          <Form.Item
            label="创造性参数"
            name="temperature"
            rules={[
              { required: true, message: '请设置创造性参数' },
              { type: 'number', min: 0, max: 1, message: '数值必须在0-1之间' }
            ]}
            extra="0-1之间，数值越高回答越有创造性，建议0.7"
          >
            <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} placeholder="0.7" />
          </Form.Item>
          
          <Form.Item
            label="系统提示词"
            name="systemPrompt"
            rules={[{ required: true, message: '请输入系统提示词' }]}
            extra="定义AI的角色和回复风格，这将作为所有AI回复的基础设定"
          >
            <TextArea 
              rows={4} 
              placeholder="例如：你是一个专业的教育咨询顾问，请根据提供的商家信息回答用户问题，态度友好专业，重点推荐我们的课程和服务。"
            />
          </Form.Item>

          <Divider>默认AI回复配置</Divider>
          <Form.Item
            label="启用默认AI回复"
            name="defaultAIEnabled"
            valuePropName="checked"
            extra="开启后，当没有其他特殊触发时，系统会自动使用AI回复用户"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.defaultAIEnabled !== cur.defaultAIEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('defaultAIEnabled') ? (
                <div>
                  <Form.Item
                    label="默认AI回复优先级"
                    name="defaultAIPriority"
                    rules={[{ required: true, message: '请设置默认AI回复优先级' }]}
                    extra="数字越大优先级越高，建议设置为5-10之间"
                  >
                    <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="5" />
                  </Form.Item>
                  <Form.Item
                    label="默认AI回复提示词"
                    name="defaultAIPrompt"
                    extra="专门用于默认AI回复的提示词，留空则使用系统提示词"
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="例如：你是一个友好的客服助手，请根据用户的问题提供专业、详细的回答..."
                    />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item
              label="百度千帆API Key"
              name="apiKey"
              rules={[
                { required: true, message: '请输入API Key' },
                { min: 10, message: 'API Key长度不能少于10个字符' }
              ]}
              extra="用于调用百度千帆AI服务"
            >
              <Input.Password placeholder="输入API Key" />
            </Form.Item>
            <Form.Item
              label="百度千帆Secret Key"
              name="apiSecret"
              rules={[
                { required: true, message: '请输入Secret Key' },
                { min: 10, message: 'Secret Key长度不能少于10个字符' }
              ]}
              extra="用于API认证"
            >
              <Input.Password placeholder="输入Secret Key" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

