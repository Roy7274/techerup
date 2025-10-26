'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm, 
  Tag,
  Space,
  Card,
  Typography
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons'
import { 
  getAdmins, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin, 
  resetAdminPassword,
  getManageableCities 
} from '@/lib/api'

const { Title } = Typography
const { Option } = Select

interface Admin {
  id: string
  username: string
  email?: string
  role: string
  cities: string[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const data = await getAdmins()
      setAdmins(data)
    } catch (error) {
      message.error('获取管理员列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCities = async () => {
    try {
      const data = await getManageableCities()
      setCities(data)
    } catch (error) {
      message.error('获取城市列表失败')
    }
  }

  useEffect(() => {
    loadAdmins()
    loadCities()
  }, [])

  const handleCreate = () => {
    setEditingAdmin(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    form.setFieldsValue({
      ...admin,
      cities: admin.cities
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingAdmin) {
        await updateAdmin(editingAdmin.id, values)
        message.success('管理员更新成功')
      } else {
        await createAdmin(values)
        message.success('管理员创建成功')
      }
      setModalVisible(false)
      loadAdmins()
    } catch (error) {
      message.error(editingAdmin ? '更新失败' : '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdmin(id)
      message.success('删除成功')
      loadAdmins()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleResetPassword = async (values: any) => {
    try {
      await resetAdminPassword(editingAdmin!.id, values.newPassword)
      message.success('密码重置成功')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
    } catch (error) {
      message.error('密码重置失败')
    }
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'super_admin' ? 'red' : 'blue'}>
          {role === 'super_admin' ? '超级管理员' : '管理员'}
        </Tag>
      ),
    },
    {
      title: '管理城市',
      dataIndex: 'cities',
      key: 'cities',
      render: (cities: string[]) => (
        <div>
          {cities.length === 0 ? (
            <Tag color="green">全部城市</Tag>
          ) : (
            cities.map(city => <Tag key={city}>{city}</Tag>)
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (lastLogin: string) => 
        lastLogin ? new Date(lastLogin).toLocaleString() : '从未登录',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Admin) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<KeyOutlined />} 
            onClick={() => {
              setEditingAdmin(record)
              setPasswordModalVisible(true)
            }}
          >
            重置密码
          </Button>
          <Popconfirm
            title="确定要删除这个管理员吗？"
            onConfirm={() => handleDelete(record.id)}
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
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>管理员管理</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            新增管理员
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={admins}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingAdmin ? '编辑管理员' : '新增管理员'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          {!editingAdmin && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="邮箱"
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="cities"
            label="管理城市"
            extra="超级管理员可以管理所有城市，普通管理员只能管理指定城市"
          >
            <Select
              mode="multiple"
              placeholder="请选择管理的城市"
              allowClear
            >
              {cities.map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            initialValue={true}
          >
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        onOk={() => passwordForm.submit()}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
