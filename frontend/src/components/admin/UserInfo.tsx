'use client'

import { useState, useEffect } from 'react'
import { Avatar, Dropdown, Typography, Tag, Space, Tooltip } from 'antd'
import { UserOutlined, CrownOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { getProfile } from '@/lib/api'

const { Text } = Typography

interface User {
  id: string
  username: string
  role: string
  cities: string[]
  email?: string
}

export default function UserInfo() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getProfile()
        setUser(userData)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <Space>
        <Avatar size="small" icon={<UserOutlined />} />
        <Text>加载中...</Text>
      </Space>
    )
  }

  if (!user) {
    return null
  }

  // 获取角色显示文本和图标
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          text: '超级管理员',
          icon: <CrownOutlined style={{ color: '#faad14' }} />,
          color: 'gold'
        }
      case 'admin':
        return {
          text: '管理员',
          icon: <UserOutlined />,
          color: 'blue'
        }
      default:
        return {
          text: '用户',
          icon: <UserOutlined />,
          color: 'default'
        }
    }
  }

  // 处理城市显示逻辑
  const getCityDisplay = (cities: string[], role: string) => {
    if (role === 'super_admin') {
      return {
        text: '全城市',
        tooltip: '超级管理员可管理所有城市'
      }
    }
    
    if (!cities || cities.length === 0) {
      return {
        text: '未分配城市',
        tooltip: '请联系超级管理员分配管理城市'
      }
    }
    
    if (cities.length === 1) {
      return {
        text: cities[0],
        tooltip: `管理城市：${cities[0]}`
      }
    }
    
    if (cities.length <= 3) {
      return {
        text: cities.join('、'),
        tooltip: `管理城市：${cities.join('、')}`
      }
    }
    
    // 超过3个城市时，显示前2个+数量
    return {
      text: `${cities.slice(0, 2).join('、')}等${cities.length}城`,
      tooltip: `管理城市：${cities.join('、')}`
    }
  }

  const roleInfo = getRoleInfo(user.role)
  const cityInfo = getCityDisplay(user.cities, user.role)

  const dropdownItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '12px 16px', minWidth: '200px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar 
              size="small" 
              icon={roleInfo.icon}
              style={{ 
                backgroundColor: roleInfo.color === 'gold' ? '#faad14' : '#1890ff'
              }}
            />
            <Text strong style={{ fontSize: '16px' }}>{user.username}</Text>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <Tag color={roleInfo.color} icon={roleInfo.icon} style={{ fontSize: '12px' }}>
              {roleInfo.text}
            </Tag>
          </div>
          <div style={{ marginBottom: user.email ? '8px' : '0' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              <EnvironmentOutlined style={{ marginRight: '6px' }} /> 
              {cityInfo.text}
            </Text>
          </div>
          {user.email && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                📧 {user.email}
              </Text>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <Dropdown
      menu={{ items: dropdownItems }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Space 
        style={{ 
          cursor: 'pointer', 
          padding: '2px 6px', 
          borderRadius: '4px',
          transition: 'background-color 0.2s ease',
          backgroundColor: 'transparent'
        }}
        className="hover:bg-gray-50"
      >
        <Avatar 
          size="small" 
          icon={roleInfo.icon}
          style={{ 
            backgroundColor: roleInfo.color === 'gold' ? '#faad14' : '#1890ff'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Text strong style={{ fontSize: '14px', lineHeight: '16px', color: '#262626' }}>
            {user.username}
          </Text>
          <Tooltip title={cityInfo.tooltip}>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: '12px', 
                lineHeight: '14px',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#8c8c8c'
              }}
            >
              <EnvironmentOutlined style={{ marginRight: '4px' }} /> {cityInfo.text}
            </Text>
          </Tooltip>
        </div>
      </Space>
    </Dropdown>
  )
}
