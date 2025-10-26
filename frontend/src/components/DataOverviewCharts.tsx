'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, DatePicker, Select, Spin, message } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { CalendarOutlined, BarChartOutlined, LineChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getTrendData } from '@/lib/api'

const { RangePicker } = DatePicker
const { Option } = Select

interface TrendData {
  date: string
  contacted: number
  chatStarted: number
  inquiries: number
}

interface DataOverviewChartsProps {
  className?: string
  selectedCity?: string
}

export default function DataOverviewCharts({ className = '', selectedCity }: DataOverviewChartsProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])
  const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  useEffect(() => {
    loadTrendData()
  }, [dateRange, viewType, selectedCity])


  const loadTrendData = async () => {
    try {
      setLoading(true)
      const data = await getTrendData({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        groupBy: viewType,
        city: selectedCity || undefined
      })
      setTrendData(data)
    } catch (error) {
      console.error('加载趋势数据失败:', error)
      message.error('加载数据失败，请稍后重试')
      setTrendData([])
    } finally {
      setLoading(false)
    }
  }


  const formatXAxisLabel = (tickItem: string) => {
    if (viewType === 'monthly') {
      return dayjs(tickItem).format('YYYY-MM')
    }
    return dayjs(tickItem).format('MM-DD')
  }

  const formatTooltipLabel = (label: string) => {
    if (viewType === 'monthly') {
      return dayjs(label).format('YYYY年MM月')
    }
    return dayjs(label).format('YYYY年MM月DD日')
  }

  const renderChart = () => {
    if (trendData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          暂无数据
        </div>
      )
    }

    const commonProps = {
      data: trendData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={formatTooltipLabel}
              formatter={(value: number, name: string) => [
                value, 
                name === 'contacted' ? '已联系数' : 
                name === 'chatStarted' ? '开始聊天数' : '咨询表数'
              ]}
            />
            <Legend 
              formatter={(value) => 
                value === 'contacted' ? '已联系数' : 
                value === 'chatStarted' ? '开始聊天数' : '咨询表数'
              }
            />
            <Line 
              type="monotone" 
              dataKey="contacted" 
              stroke="#52c41a" 
              strokeWidth={2}
              dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="chatStarted" 
              stroke="#1890ff" 
              strokeWidth={2}
              dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="inquiries" 
              stroke="#faad14" 
              strokeWidth={2}
              dot={{ fill: '#faad14', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={formatTooltipLabel}
            formatter={(value: number, name: string) => [
              value, 
              name === 'contacted' ? '已联系数' : 
              name === 'chatStarted' ? '开始聊天数' : '咨询表数'
            ]}
          />
          <Legend 
            formatter={(value) => 
              value === 'contacted' ? '已联系数' : 
              value === 'chatStarted' ? '开始聊天数' : '咨询表数'
            }
          />
          <Bar dataKey="contacted" fill="#52c41a" name="已联系数" />
          <Bar dataKey="chatStarted" fill="#1890ff" name="开始聊天数" />
          <Bar dataKey="inquiries" fill="#faad14" name="咨询表数" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <Card 
        title={
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-500" />
            <span>数据趋势分析</span>
          </div>
        }
        extra={
          <div className="flex items-center gap-3">
            <Select
              value={viewType}
              onChange={setViewType}
              style={{ width: 100 }}
            >
              <Option value="daily">按日</Option>
              <Option value="monthly">按月</Option>
            </Select>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 100 }}
            >
              <Option value="line">
                <LineChartOutlined /> 折线图
              </Option>
              <Option value="bar">
                <BarChartOutlined /> 柱状图
              </Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          </div>
        }
      >
        <Spin spinning={loading}>
          {renderChart()}
        </Spin>
        
        {/* 数据统计卡片 */}
        <Row gutter={16} className="mt-6">
          <Col span={8}>
            <Card size="small" className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trendData.reduce((sum, item) => sum + item.contacted, 0)}
              </div>
              <div className="text-sm text-gray-600">总已联系数</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trendData.reduce((sum, item) => sum + item.chatStarted, 0)}
              </div>
              <div className="text-sm text-gray-600">总开始聊天数</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {trendData.reduce((sum, item) => sum + item.inquiries, 0)}
              </div>
              <div className="text-sm text-gray-600">总咨询表数</div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
