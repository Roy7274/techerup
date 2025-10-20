'use client'

import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Select, DatePicker, message, Modal, Form, Input, Switch } from 'antd'
import { EyeOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { getInquiries, updateInquiry, deleteInquiry } from '@/lib/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function InquiryManagement() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<any>({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [showIncomplete, setShowIncomplete] = useState(false) // 默认不显示信息不完整的咨询

  useEffect(() => {
    loadInquiries()
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

  const columns = [
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
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
    },
    {
      title: '身份',
      dataIndex: 'identity',
      key: 'identity',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.status === '未联系' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleStatusChange(record.id, '已联系')}
            >
              标记已联系
            </Button>
          )}
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
        <h2 className="text-2xl font-bold">咨询管理</h2>
        <Space>
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
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条${!showIncomplete ? '（已隐藏信息不完整的咨询）' : ''}`,
        }}
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
    </div>
  )
}

