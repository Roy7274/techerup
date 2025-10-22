'use client'

import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import { UserOutlined, PhoneOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { getInquiryStats, getInquiries } from '@/lib/api'
import DataOverviewCharts from '@/components/DataOverviewCharts'
import dayjs from 'dayjs'

export default function Dashboard() {
  const [stats, setStats] = useState<any>({})
  const [recentInquiries, setRecentInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, inquiriesData] = await Promise.all([
        getInquiryStats(),
        getInquiries()
      ])
      setStats(statsData)
      setRecentInquiries((inquiriesData as unknown as any[]).slice(0, 10))
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '学段',
      dataIndex: 'grade',
      key: 'grade',
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
        <Tag color={status === '已联系' ? 'success' : 'warning'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">数据概览</h2>
      
      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="总预约数"
              value={stats.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总已联系数"
              value={stats.contacted || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增预约数"
              value={stats.todayNew || 0}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日已联系数"
              value={stats.todayContacted || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>


      {/* 数据趋势分析 */}
      <div className="mb-6">
        <DataOverviewCharts />
      </div>

      {/* 最近咨询 */}
      <Card title="最近咨询">
        <Table
          dataSource={recentInquiries}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}

