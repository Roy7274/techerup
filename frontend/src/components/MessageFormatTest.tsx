'use client'

import React from 'react'
import { Card, Space, Typography } from 'antd'
import { formatMessage, hasFormatting, createSafeHtml } from '@/lib/messageFormatter'

const { Title, Paragraph, Text } = Typography

export default function MessageFormatTest() {
  // 测试消息
  const testMessages = [
    {
      title: '原始AI回复消息',
      message: '您好! 感谢您联系我们在线教育机构。我们已收到您留下的联系方式,我们的客服团队会尽快与您取得联系(通常在24小时内)。\n\n**为了更好地为您服务,您可以提前了解以下信息:**\n\n1. **试听课程**: 新用户可免费体验1节一对一辅导或小班课,您对哪个年级/科目更感兴趣?\n\n2. **上课时间**: 我们支持灵活预约,您更倾向工作日晚上还是周末上课?\n\n3. **其他需求**: 是否需要学习规划或上门辅导服务?\n\n如有紧急问题,也可直接拨打**18111111111** (工作时间:9:00-21:00)或发送邮件至**123@qq.com**。\n\n期待为您提供优质的教育服务!'
    },
    {
      title: '简单加粗测试',
      message: '这是一个**加粗文本**的测试消息。'
    },
    {
      title: '混合格式测试',
      message: '这里有**加粗文本**和*斜体文本*，还有普通文本。'
    },
    {
      title: '多种格式测试',
      message: '这里有**加粗文本**、*斜体文本*、__下划线文本__、~~删除线文本~~和`代码文本`。'
    },
    {
      title: '复杂格式测试',
      message: '**重要提示**: 请确保您的*联系信息*准确无误。\n\n联系方式：\n- 电话：**400-123-4567**\n- 邮箱：__support@example.com__\n- 工作时间：~~24小时~~ 9:00-18:00\n\n如需技术支持，请使用`在线客服`功能。'
    },
    {
      title: '无格式消息',
      message: '这是一条普通的文本消息，没有任何格式标记。'
    }
  ]

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>消息格式化功能测试</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {testMessages.map((test, index) => (
          <Card key={index} title={test.title} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>原始消息:</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  marginTop: '8px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace'
                }}>
                  {test.message}
                </div>
              </div>
              
              <div>
                <Text strong>格式化后:</Text>
                <div style={{ 
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  padding: '10px', 
                  borderRadius: '4px',
                  marginTop: '8px',
                  minHeight: '60px'
                }}>
                  {hasFormatting(test.message) ? (
                    <div dangerouslySetInnerHTML={createSafeHtml(formatMessage(test.message))} />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{test.message}</div>
                  )}
                </div>
              </div>
              
              <div>
                <Text strong>检测结果:</Text>
                <Text type={hasFormatting(test.message) ? 'success' : 'secondary'}>
                  {hasFormatting(test.message) ? '包含格式标记' : '无格式标记'}
                </Text>
              </div>
            </Space>
          </Card>
        ))}
      </Space>
    </div>
  )
}
