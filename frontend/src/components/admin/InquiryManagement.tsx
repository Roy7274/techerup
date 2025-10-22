'use client'

import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Select, DatePicker, message, Modal, Form, Input, Switch, Row, Col, Popconfirm } from 'antd'
import { EyeOutlined, DeleteOutlined, CheckOutlined, FormOutlined, EditOutlined, UndoOutlined } from '@ant-design/icons'
import { getInquiries, updateInquiry, deleteInquiry, getFormTemplates } from '@/lib/api'
import dayjs from 'dayjs'
import QuickFormModal from './QuickFormModal'
import UnifiedFormModal from '../UnifiedFormModal'

const { RangePicker } = DatePicker

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

export default function InquiryManagement() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<any>({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [showIncomplete, setShowIncomplete] = useState(false) // 默认不显示信息不完整的咨询
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)
  const [quickFormVisible, setQuickFormVisible] = useState(false)
  const [editFormVisible, setEditFormVisible] = useState(false)
  const [editingInquiry, setEditingInquiry] = useState<any | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    loadInquiries()
    loadFormTemplates()
  }, [filters])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      const data = await getInquiries(filters)
      setInquiries(data as unknown as any[])
    } catch (error) {
      message.error('加载失败')
      console.error('加载咨询列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFormTemplates = async () => {
    try {
      setTemplateLoading(true)
      const response = await getFormTemplates(false)
      const templates = Array.isArray(response) ? response : response.data || []
      setFormTemplates(templates)
    } catch (error) {
      console.error('加载表单模板失败:', error)
      message.error('加载表单模板失败')
    } finally {
      setTemplateLoading(false)
    }
  }

  // 获取当前活跃的表单模板字段
  const getActiveFormFields = () => {
    const activeTemplate = formTemplates.find(t => t.isActive)
    return activeTemplate?.fields || []
  }

  // 过滤显示的数据
  const getDisplayInquiries = () => {
    if (showIncomplete) {
      return inquiries // 显示所有
    }
    // 过滤掉"信息不完整"的记录
    return inquiries.filter(inq => inq.status !== '信息不完整')
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateInquiry(id, { status })
      message.success('状态更新成功')
      loadInquiries()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条咨询记录吗？',
      onOk: async () => {
        try {
          await deleteInquiry(id)
          message.success('删除成功')
          loadInquiries()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleViewDetail = (record: any) => {
    setSelectedInquiry(record)
    setDetailVisible(true)
  }

  const handleOpenQuickForm = () => {
    setQuickFormVisible(true)
  }

  const handleEditInquiry = (record: any) => {
    setEditingInquiry(record)
    setEditFormVisible(true)
  }

  const handleBatchMarkContacted = async () => {
    if (selectedRowKeys.length === 0) return
    try {
      await Promise.all(selectedRowKeys.map((id) => updateInquiry(String(id), { status: '已联系' })))
      message.success('批量标记成功')
      setSelectedRowKeys([])
      loadInquiries()
    } catch (error) {
      message.error('批量标记失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return
    try {
      await Promise.all(selectedRowKeys.map((id) => deleteInquiry(String(id))))
      message.success('批量删除成功')
      setSelectedRowKeys([])
      loadInquiries()
    } catch (error) {
      message.error('批量删除失败')
    }
  }

  // 动态生成列定义
  const getColumns = () => {
    const formFields = getActiveFormFields()
    const hasFormFields = formFields.length > 0
    
    const baseColumns = [
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => (
          <Tag color={
            status === '已联系' ? 'success' : 
            status === '信息不完整' ? 'default' : 
            'warning'
          }>
            {status}
          </Tag>
        ),
        filters: [
          { text: '已联系', value: '已联系' },
          { text: '未联系', value: '未联系' },
          { text: '信息不完整', value: '信息不完整' },
        ],
        onFilter: (value: any, record: any) => record.status === value,
      },
      {
        title: '提交时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
        sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      },
      {
        title: '操作',
        key: 'action',
        width: 280,
        fixed: 'right' as const,
        render: (text: any, record: any) => (
          <Space size="small">
            {record.status === '未联系' && (
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, '已联系')}
              >
                标记已联系
              </Button>
            )}
            {record.status === '已联系' && (
              <Button
                type="link"
                icon={<UndoOutlined />}
                onClick={() => handleStatusChange(record.id, '未联系')}
              >
                撤回联系
              </Button>
            )}
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              查看
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditInquiry(record)}
            >
              编辑表单
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

    if (hasFormFields) {
      // 使用动态字段
      const dynamicColumns = formFields.map(field => ({
        title: field.fieldLabel,
        dataIndex: field.fieldName,
        key: field.fieldName,
        width: 120,
        ellipsis: true,
        render: (value: any, record: any) => {
          // 优先从formData中获取值，如果没有则从直接字段获取
          const formDataValue = record.formData?.[field.fieldName]
          const directValue = record[field.fieldName]
          return formDataValue || directValue || '-'
        },
        // 为某些字段添加筛选器
        ...(field.fieldName === 'city' && {
          filters: Array.from(new Set(inquiries.map(i => i.city))).map(city => ({
            text: city,
            value: city,
          })),
          onFilter: (value: any, record: any) => record.city === value,
        }),
        ...(field.fieldName === 'grade' && {
          filters: [
            { text: '小学', value: '小学' },
            { text: '初中', value: '初中' },
            { text: '高中', value: '高中' },
          ],
          onFilter: (value: any, record: any) => record.grade === value,
        }),
      }))
      
      return [...dynamicColumns, ...baseColumns]
    } else {
      // 回退到固定字段
      const fallbackColumns = [
        {
          title: '城市',
          dataIndex: 'city',
          key: 'city',
          width: 100,
          filters: Array.from(new Set(inquiries.map(i => i.city))).map(city => ({
            text: city,
            value: city,
          })),
          onFilter: (value: any, record: any) => record.city === value,
        },
        {
          title: '学段',
          dataIndex: 'grade',
          key: 'grade',
          width: 100,
          filters: [
            { text: '小学', value: '小学' },
            { text: '初中', value: '初中' },
            { text: '高中', value: '高中' },
          ],
          onFilter: (value: any, record: any) => record.grade === value,
        },
        {
          title: '性别',
          dataIndex: 'studentGender',
          key: 'studentGender',
          width: 80,
        },
        {
          title: '身份',
          dataIndex: 'identity',
          key: 'identity',
          width: 80,
        },
        {
          title: '联系电话',
          dataIndex: 'phone',
          key: 'phone',
          width: 120,
        },
      ]
      
      return [...fallbackColumns, ...baseColumns]
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">咨询管理</h2>
        <Space>
          <Button type="primary" icon={<FormOutlined />} onClick={handleOpenQuickForm}>
            手动录入表单
          </Button>
          <Space>
            <Switch 
              checked={showIncomplete}
              onChange={setShowIncomplete}
            />
            <span className="text-sm">显示信息不完整的咨询</span>
          </Space>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Select.Option value="已联系">已联系</Select.Option>
            <Select.Option value="未联系">未联系</Select.Option>
            <Select.Option value="信息不完整">信息不完整</Select.Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  startDate: dates[0]?.toISOString(),
                  endDate: dates[1]?.toISOString(),
                })
              } else {
                const { startDate, endDate, ...rest } = filters
                setFilters(rest)
              }
            }}
          />
          <Button onClick={() => setFilters({})}>重置筛选</Button>
        </Space>
      </div>

      <Table
        dataSource={getDisplayInquiries()}
        columns={getColumns()}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条${!showIncomplete ? '（已隐藏信息不完整的咨询）' : ''}`,
        }}
        title={() => (
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <Button disabled={selectedRowKeys.length === 0} icon={<CheckOutlined />} onClick={handleBatchMarkContacted}>
              批量标记已联系
            </Button>
            <Popconfirm
              title="确认批量删除"
              description={`确定删除选中的 ${selectedRowKeys.length} 条咨询记录吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger disabled={selectedRowKeys.length === 0} icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
          </Space>
        )}
      />

      {/* 详情弹窗 */}
      <Modal
        title="咨询详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedInquiry && (
          <div className="space-y-4">
            {(() => {
              const formFields = getActiveFormFields()
              const hasFormFields = formFields.length > 0
              
              if (hasFormFields) {
                // 使用动态字段
                const fieldsWithValues = formFields.filter(field => {
                  const formDataValue = selectedInquiry.formData?.[field.fieldName]
                  const directValue = selectedInquiry[field.fieldName]
                  return formDataValue || directValue
                })
                
                return (
                  <>
                    <Row gutter={16}>
                      {fieldsWithValues.map((field) => {
                        const formDataValue = selectedInquiry.formData?.[field.fieldName]
                        const directValue = selectedInquiry[field.fieldName]
                        const displayValue = formDataValue || directValue || '-'
                        
                        return (
                          <Col key={field.fieldName} span={12} className="mb-3">
                            <div>
                              <label className="font-semibold text-gray-600">{field.fieldLabel}：</label>
                              <div className="mt-1 text-gray-800">{displayValue}</div>
                            </div>
                          </Col>
                        )
                      })}
                    </Row>
                  </>
                )
              } else {
                // 回退到固定字段显示
                return (
                  <>
                    <div>
                      <label className="font-semibold">城市：</label>
                      <span>{selectedInquiry.city}</span>
                    </div>
                    <div>
                      <label className="font-semibold">学段：</label>
                      <span>{selectedInquiry.grade}</span>
                    </div>
                    <div>
                      <label className="font-semibold">学生性别：</label>
                      <span>{selectedInquiry.studentGender}</span>
                    </div>
                    <div>
                      <label className="font-semibold">咨询身份：</label>
                      <span>{selectedInquiry.identity}</span>
                    </div>
                    <div>
                      <label className="font-semibold">联系电话：</label>
                      <span>{selectedInquiry.phone}</span>
                    </div>
                  </>
                )
              }
            })()}
            
            <div>
              <label className="font-semibold">状态：</label>
              <Tag color={selectedInquiry.status === '已联系' ? 'success' : 'warning'}>
                {selectedInquiry.status}
              </Tag>
            </div>
            <div>
              <label className="font-semibold">提交时间：</label>
              <span>{dayjs(selectedInquiry.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
            {selectedInquiry.contactTime && (
              <div>
                <label className="font-semibold">联系时间：</label>
                <span>{dayjs(selectedInquiry.contactTime).format('YYYY-MM-DD HH:mm:ss')}</span>
              </div>
            )}
            {selectedInquiry.notes && (
              <div>
                <label className="font-semibold">备注：</label>
                <p className="mt-2 p-2 bg-gray-50 rounded">{selectedInquiry.notes}</p>
              </div>
            )}
            {selectedInquiry.conversations && selectedInquiry.conversations.length > 0 && (
              <div>
                <label className="font-semibold">对话记录：</label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {selectedInquiry.conversations.map((conv: any) => (
                    <div key={conv.id} className={`p-2 rounded ${conv.sender === 'user' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className="text-xs text-gray-500">{conv.sender === 'user' ? '用户' : conv.sender === 'agent' ? '客服' : '机器人'}</div>
                      <div className="text-sm">{conv.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 手动录入表单（新建） */}
      <QuickFormModal
        visible={quickFormVisible}
        onClose={() => setQuickFormVisible(false)}
      />

      {/* 表单再编辑（编辑现有咨询） */}
      <UnifiedFormModal
        visible={editFormVisible}
        onClose={() => {
          setEditFormVisible(false)
          setEditingInquiry(null)
        }}
        title="编辑咨询表单"
        showExtractedInfo={false}
        showSaveDraft={false}
        initialValues={(() => {
          if (!editingInquiry) return undefined as any
          const formFields = getActiveFormFields()
          const result: any = {}
          formFields.forEach((f) => {
            const v = editingInquiry.formData?.[f.fieldName] ?? editingInquiry[f.fieldName]
            if (v !== undefined && v !== null && v !== '') result[f.fieldName] = v
          })
          return result
        })()}
        inquiryId={editingInquiry?.id}
        onSubmitted={() => {
          loadInquiries()
        }}
      />
    </div>
  )
}

