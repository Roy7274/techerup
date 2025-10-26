'use client'

import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Select } from 'antd'
import { UserOutlined, PhoneOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { getInquiryStats, getInquiries, getAvailableCities } from '@/lib/api'
import DataOverviewCharts from '@/components/DataOverviewCharts'
import dayjs from 'dayjs'

const { Option } = Select

export default function Dashboard() {
  const [stats, setStats] = useState<any>({})
  const [recentInquiries, setRecentInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])

  useEffect(() => {
    loadAvailableCities()
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedCity])

  const loadAvailableCities = async () => {
    try {
      const response = await getAvailableCities()
      
      // 处理API响应
      let cities = response
      if (response && response.data) {
        cities = response.data
      }
      
      // 确保cities是数组
      if (Array.isArray(cities)) {
        setAvailableCities(cities)
      } else {
        setAvailableCities([])
      }
    } catch (error) {
      console.error('加载城市列表失败:', error)
      setAvailableCities([])
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const params = selectedCity ? { city: selectedCity } : {}
      
      const [statsData, inquiriesData] = await Promise.all([
        getInquiryStats(params),
        getInquiries(params)
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">数据概览</h2>
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-sm">城市筛选：</span>
          <Select
            value={selectedCity}
            onChange={setSelectedCity}
            placeholder="选择城市筛选"
            allowClear
            style={{ width: 200 }}
          >
            {Array.isArray(availableCities) && availableCities.map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>
        </div>
      </div>
      
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
        <DataOverviewCharts selectedCity={selectedCity} />
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

