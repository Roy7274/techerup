'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Select, Input, Button, message } from 'antd'
import { createInquiry, getClientCity, getSessionFormData } from '@/lib/api'

interface BookingModalProps {
  visible: boolean
  onClose: () => void
  sessionId?: string
}

export default function BookingModal({ visible, onClose, sessionId }: BookingModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [city, setCity] = useState('')

  useEffect(() => {
    if (visible) {
      loadCity()
    }
  }, [visible])

  const loadCity = async () => {
    try {
      // 如果有sessionId，优先从会话中获取地理信息
      if (sessionId) {
        try {
          const sessionFormData = await getSessionFormData(sessionId)
          if (sessionFormData && sessionFormData.city) {
            setCity(sessionFormData.city)
            form.setFieldValue('city', sessionFormData.city)
            return
          }
        } catch (error) {
          console.warn('从会话获取地理信息失败:', error)
        }
      }

      // 如果会话中没有地理信息，使用客户端检测
      const detectedCity = await getClientCity()
      setCity(detectedCity as string)
      form.setFieldValue('city', detectedCity)
    } catch (error) {
      console.error('加载城市信息失败:', error)
      setCity('北京')
      form.setFieldValue('city', '北京')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      await createInquiry(values)
      message.success('预约成功！我们会尽快联系您')
      form.resetFields()
      onClose()
    } catch (error) {
      message.error('预约失败，请稍后重试')
      console.error('预约失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={<span className="text-base sm:text-lg font-semibold">预约免费试课</span>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={typeof window !== 'undefined' && window.innerWidth < 640 ? '90%' : 500}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ city }}
      >
        <Form.Item
          label={<span className="text-sm sm:text-base">所在城市</span>}
          name="city"
          rules={[{ required: true, message: '请输入所在城市' }]}
        >
          <Input placeholder="请输入城市，如：北京" size="large" className="text-sm sm:text-base" />
        </Form.Item>

        <Form.Item
          label={<span className="text-sm sm:text-base">学段</span>}
          name="grade"
          rules={[{ required: true, message: '请选择学段' }]}
        >
          <Select placeholder="请选择学段" size="large" className="text-sm sm:text-base">
            <Select.Option value="小学">小学</Select.Option>
            <Select.Option value="初中">初中</Select.Option>
            <Select.Option value="高中">高中</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={<span className="text-sm sm:text-base">学生性别</span>}
          name="studentGender"
          rules={[{ required: true, message: '请选择学生性别' }]}
        >
          <Select placeholder="请选择学生性别" size="large" className="text-sm sm:text-base">
            <Select.Option value="男孩">男孩</Select.Option>
            <Select.Option value="女孩">女孩</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={<span className="text-sm sm:text-base">咨询身份</span>}
          name="identity"
          rules={[{ required: true, message: '请选择咨询身份' }]}
        >
          <Select placeholder="请选择咨询身份" size="large" className="text-sm sm:text-base">
            <Select.Option value="家长">家长</Select.Option>
            <Select.Option value="本人">本人</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={<span className="text-sm sm:text-base">联系电话</span>}
          name="phone"
          rules={[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}
        >
          <Input 
            placeholder="请输入11位手机号" 
            size="large" 
            maxLength={11}
            type="tel"
            className="text-sm sm:text-base"
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            className="text-sm sm:text-base font-medium"
          >
            立即预约
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 space-y-1">
        <p>提交后，我们的老师会在24小时内联系您</p>
        <p>预约试课完全免费，满意后再报名</p>
      </div>
    </Modal>
  )
}

