'use client'

import { useState } from 'react'
import { Layout, Menu, Button } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  PictureOutlined,
  ShopOutlined,
  MessageOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import InquiryManagement from '@/components/admin/InquiryManagement'
import BannerManagement from '@/components/admin/BannerManagement'
import MerchantManagement from '@/components/admin/MerchantManagement'
import ConversationManagement from '@/components/admin/ConversationManagement'
import AgentChat from '@/components/admin/AgentChat'
import Dashboard from '@/components/admin/Dashboard'
import ContentModuleManagement from '@/components/admin/ContentModuleManagement'
import AutoReplyManagement from '@/components/admin/AutoReplyManagement'

const { Header, Sider, Content } = Layout

export default function AdminPage() {
  const [selectedMenu, setSelectedMenu] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/admin/login'
  }

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <Dashboard />
      case 'inquiries':
        return <InquiryManagement />
      case 'agent-chat':
        return <AgentChat />
      case 'conversations':
        return <ConversationManagement />
      case 'auto-replies':
        return <AutoReplyManagement />
      case 'content-modules':
        return <ContentModuleManagement />
      case 'banners':
        return <BannerManagement />
      case 'merchant':
        return <MerchantManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-600">
            {collapsed ? '学' : '学与思·后台'}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={({ key }) => setSelectedMenu(key)}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: '数据概览',
            },
            {
              key: 'inquiries',
              icon: <UserOutlined />,
              label: '咨询管理',
            },
            {
              key: 'agent-chat',
              icon: <CustomerServiceOutlined />,
              label: '人工客服',
            },
            {
              key: 'conversations',
              icon: <MessageOutlined />,
              label: '对话记录',
            },
            {
              key: 'auto-replies',
              icon: <RobotOutlined />,
              label: '自动回复',
            },
            {
              key: 'content-modules',
              icon: <AppstoreOutlined />,
              label: '内容模块',
            },
            {
              key: 'banners',
              icon: <PictureOutlined />,
              label: '轮播图管理',
            },
            {
              key: 'merchant',
              icon: <ShopOutlined />,
              label: '商家信息',
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-xl font-semibold">管理后台</h2>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: '8px' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}

