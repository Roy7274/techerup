'use client'

import { useState } from 'react'
import { Layout, Menu, Button, Space } from 'antd'
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
  TeamOutlined,
} from '@ant-design/icons'
import InquiryManagement from '@/components/admin/InquiryManagement'
import BannerManagement from '@/components/admin/BannerManagement'
import MerchantManagement from '@/components/admin/MerchantManagement'
import ConversationManagement from '@/components/admin/ConversationManagement'
import AgentChat from '@/components/admin/AgentChat'
import Dashboard from '@/components/admin/Dashboard'
import ContentModuleManagement from '@/components/admin/ContentModuleManagement'
import AutoReplyManagement from '@/components/admin/AutoReplyManagement'
import AdminManagement from '@/components/admin/AdminManagement'
import PermissionWrapper from '@/components/admin/PermissionWrapper'
import { usePermissions } from '@/components/admin/PermissionWrapper'
import { logout } from '@/lib/auth'
import AuthGuard from '@/components/admin/AuthGuard'
import UserInfo from '@/components/admin/UserInfo'

const { Header, Sider, Content } = Layout

export default function AdminPage() {
  const [selectedMenu, setSelectedMenu] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const { canManageAdmins } = usePermissions()

  const handleLogout = () => {
    logout(false) // 不显示过期提示，因为这是主动登出
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
      case 'admins':
        return <AdminManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <AuthGuard>
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
              ...(canManageAdmins ? [{
                key: 'conversations',
                icon: <MessageOutlined />,
                label: '对话记录',
              }] : []),
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
                key: 'merchant',
                icon: <ShopOutlined />,
                label: '商家信息',
              },
              ...(canManageAdmins ? [{
                key: 'admins',
                icon: <TeamOutlined />,
                label: '管理员管理',
              }] : []),
            ]}
          />
        </Sider>
        <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-xl font-semibold">管理后台</h2>
          <Space size="middle">
            <UserInfo />
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
          </Space>
        </Header>
          <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: '8px' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </AuthGuard>
  )
}

