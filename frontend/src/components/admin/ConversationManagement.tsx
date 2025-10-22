'use client'

import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Modal, Statistic, Row, Col, Card as AntCard, Empty, message } from 'antd'
import { EyeOutlined, ReloadOutlined, MessageOutlined } from '@ant-design/icons'
import { getInquiries, getFormTemplates } from '@/lib/api'
import dayjs from 'dayjs'

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

export default function ConversationManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedConversations, setSelectedConversations] = useState<any[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)

  useEffect(() => {
    loadData()
    loadFormTemplates()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response: any = await getInquiries()
      const inquiries = Array.isArray(response) ? response : []
      // 只显示有对话记录的咨询
      const withConversations = inquiries.filter((inq: any) => inq.conversations && inq.conversations.length > 0)
      setData(withConversations)
      
      if (withConversations.length > 0) {
        message.success(`加载成功：${withConversations.length} 条有对话记录的咨询`)
      } else {
        message.info('暂无对话记录')
      }
    } catch (error) {
      console.error('加载对话记录失败:', error)
      message.error('加载对话记录失败')
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

  const handleViewDetail = (inquiry: any) => {
    setSelectedConversations(inquiry.conversations)
    setSelectedInquiry(inquiry)
    setDetailVisible(true)
  }

  // 统计信息
  const getTotalMessages = () => {
    return data.reduce((sum, inq) => sum + (inq.conversations?.length || 0), 0)
  }

  const getUserMessages = () => {
    return data.reduce((sum, inq) => 
      sum + (inq.conversations?.filter((c: any) => c.sender === 'user').length || 0), 0)
  }

  const getAgentMessages = () => {
    return data.reduce((sum, inq) => 
      sum + (inq.conversations?.filter((c: any) => c.sender === 'agent').length || 0), 0)
  }

  // 获取当前活跃的表单模板字段
  const getActiveFormFields = () => {
    const activeTemplate = formTemplates.find(t => t.isActive)
    return activeTemplate?.fields || []
  }

  // 渲染用户信息字段
  const renderUserInfoField = (field: FormField, record: any) => {
    const value = record[field.fieldName]
    if (!value) return null

    return (
      <div key={field.fieldName} className="flex items-center gap-1 mb-1">
        <span className="text-xs text-gray-500 min-w-0 flex-shrink-0">{field.fieldLabel}:</span>
        <span className="text-sm font-medium text-gray-800 truncate">{value}</span>
      </div>
    )
  }

  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (text: any, record: any) => {
        const formFields = getActiveFormFields()
        const hasFormFields = formFields.length > 0
        
        if (hasFormFields) {
          // 使用动态表单字段
          const renderedFields = formFields
            .filter(field => record[field.fieldName])
            .map(field => renderUserInfoField(field, record))
          
          return (
            <div>
              {renderedFields.length > 0 ? (
                <div className="space-y-1">
                  {renderedFields}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">暂无信息</div>
              )}
            </div>
          )
        } else {
          // 回退到固定字段显示
          return (
            <div>
              <div className="font-medium">{record.city} - {record.grade}</div>
              <div className="text-gray-500 text-sm">{record.phone}</div>
              <div className="text-xs text-gray-400 mt-1">
                {record.identity} - {record.studentGender}
              </div>
            </div>
          )
        }
      },
    },
    {
      title: '对话数量',
      key: 'conversationCount',
      render: (text: any, record: any) => {
        const total = record.conversations?.length || 0
        const userCount = record.conversations?.filter((c: any) => c.sender === 'user').length || 0
        const agentCount = record.conversations?.filter((c: any) => c.sender === 'agent').length || 0
        return (
          <div>
            <div className="font-medium">{total} 条消息</div>
            <div className="text-xs text-gray-500">
              用户: {userCount} | 客服: {agentCount}
            </div>
          </div>
        )
      },
    },
    {
      title: '对话时间',
      key: 'conversationTime',
      render: (text: any, record: any) => {
        const firstConv = record.conversations?.[0]
        const lastConv = record.conversations?.[record.conversations.length - 1]
        return (
          <div>
            <div className="text-sm">
              开始: {firstConv ? dayjs(firstConv.createdAt).format('MM-DD HH:mm') : '-'}
            </div>
            <div className="text-sm">
              结束: {lastConv ? dayjs(lastConv.createdAt).format('MM-DD HH:mm') : '-'}
            </div>
          </div>
        )
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (text: any, record: any) => (
        <Tag color={record.status === '已联系' ? 'green' : 'orange'}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">对话记录管理</h2>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={loadData}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {data.length > 0 && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <AntCard>
              <Statistic 
                title="咨询记录数" 
                value={data.length} 
                prefix={<MessageOutlined />}
              />
            </AntCard>
          </Col>
          <Col span={6}>
            <AntCard>
              <Statistic 
                title="总消息数" 
                value={getTotalMessages()}
              />
            </AntCard>
          </Col>
          <Col span={6}>
            <AntCard>
              <Statistic 
                title="用户消息" 
                value={getUserMessages()}
                valueStyle={{ color: '#3f8600' }}
              />
            </AntCard>
          </Col>
          <Col span={6}>
            <AntCard>
              <Statistic 
                title="客服消息" 
                value={getAgentMessages()}
                valueStyle={{ color: '#1890ff' }}
              />
            </AntCard>
          </Col>
        </Row>
      )}

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: (
            <Empty
              description={
                <div>
                  <p>暂无对话记录</p>
                  <p className="text-xs text-gray-400 mt-2">
                    当用户完成咨询或离开会话后，对话记录将自动保存至此
                  </p>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        }}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      {/* 对话详情弹窗 */}
      <Modal
        title={
          <div>
            <div className="text-lg font-bold">对话记录详情</div>
            {selectedInquiry && (
              <div className="text-sm font-normal text-gray-500 mt-1">
                {selectedInquiry.city} - {selectedInquiry.grade} - {selectedInquiry.phone}
              </div>
            )}
          </div>
        }
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false)
          setSelectedConversations([])
          setSelectedInquiry(null)
        }}
        footer={null}
        width={800}
      >
        {selectedInquiry && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Row gutter={16}>
              {(() => {
                const formFields = getActiveFormFields()
                const hasFormFields = formFields.length > 0
                
                if (hasFormFields) {
                  // 使用动态表单字段
                  const fieldsWithValues = formFields.filter(field => selectedInquiry[field.fieldName])
                  
                  // 根据字段数量动态调整列数
                  const getColSpan = (totalFields: number) => {
                    if (totalFields <= 2) return 12 // 2列
                    if (totalFields <= 4) return 6  // 4列
                    if (totalFields <= 6) return 4  // 6列
                    return 3 // 8列
                  }
                  
                  const colSpan = getColSpan(fieldsWithValues.length)
                  
                  return fieldsWithValues.map((field) => (
                    <Col key={field.fieldName} span={colSpan} className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">{field.fieldLabel}</div>
                      <div className="font-medium text-gray-800 break-words">{selectedInquiry[field.fieldName]}</div>
                    </Col>
                  ))
                } else {
                  // 回退到固定字段显示
                  return (
                    <>
                      <Col span={6}>
                        <div className="text-xs text-gray-500">城市</div>
                        <div className="font-medium">{selectedInquiry.city}</div>
                      </Col>
                      <Col span={6}>
                        <div className="text-xs text-gray-500">学段</div>
                        <div className="font-medium">{selectedInquiry.grade}</div>
                      </Col>
                      <Col span={6}>
                        <div className="text-xs text-gray-500">身份</div>
                        <div className="font-medium">{selectedInquiry.identity}</div>
                      </Col>
                      <Col span={6}>
                        <div className="text-xs text-gray-500">学生性别</div>
                        <div className="font-medium">{selectedInquiry.studentGender}</div>
                      </Col>
                    </>
                  )
                }
              })()}
            </Row>
          </div>
        )}
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {selectedConversations.length === 0 ? (
            <Empty description="暂无对话记录" />
          ) : (
            selectedConversations.map((conv: any) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg ${
                  conv.sender === 'user'
                    ? 'bg-blue-50 ml-8'
                    : conv.sender === 'agent'
                    ? 'bg-orange-50 mr-8'
                    : 'bg-gray-50 mr-8'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <Tag color={
                    conv.sender === 'user' ? 'blue' : conv.sender === 'agent' ? 'orange' : 'default'
                  }>
                    {conv.sender === 'user' ? '用户' : conv.sender === 'agent' ? '人工客服' : '机器人'}
                  </Tag>
                  <span className="text-xs text-gray-500">
                    {dayjs(conv.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{conv.message}</div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

