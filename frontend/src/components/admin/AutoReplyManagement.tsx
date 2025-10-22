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

  useEffect(() => {
    loadAutoReplies()
    loadFormTemplates()
    // 只在首次加载时检查默认模板
    if (!defaultTemplateChecked) {
      ensureDefaultFormTemplate()
    }
  }, [defaultTemplateChecked])

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
      
      const payload = {
        name: values.name,
        description: values.description,
        order: values.order || 0,
        isActive: values.isActive !== false,
        fields: templateFields,
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
      message.error('提交失败')
    }
  }

  const handleAddField = () => {
    setTemplateFields([
      ...templateFields,
      {
        fieldName: '',
        fieldLabel: '',
        fieldType: 'text',
        required: true,
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
          manual: { text: '手动', color: 'purple' },
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
              <p>当前使用固定的&quot;预约试听表单&quot;模板，包含以下字段：</p>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>所在城市（文本输入）</li>
                <li>学段（下拉选择：小学/初中/高中）</li>
                <li>学生性别（下拉选择：男孩/女孩）</li>
                <li>咨询身份（下拉选择：本人/家长）</li>
                <li>联系电话（手机号输入）</li>
              </ul>
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
              <Select.Option value="manual">手动触发</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.triggerType !== cur.triggerType}
          >
            {({ getFieldValue }) =>
              getFieldValue('triggerType') === 'keyword' ? (
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
            label="回复内容"
            name="message"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="输入自动回复的文本内容"
            />
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
            <Button type="dashed" onClick={handleAddField} block>
              <PlusOutlined /> 添加字段
            </Button>
          </div>

          {templateFields.map((field, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 12 }}
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
                  />
                  <Input
                    placeholder="字段标签（如：联系电话）"
                    value={field.fieldLabel}
                    onChange={(e) =>
                      handleFieldChange(index, 'fieldLabel', e.target.value)
                    }
                    style={{ width: 150 }}
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
                  <span>必填：</span>
                  <Switch
                    checked={field.required}
                    onChange={(checked) =>
                      handleFieldChange(index, 'required', checked)
                    }
                  />
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
    </div>
  )
}

