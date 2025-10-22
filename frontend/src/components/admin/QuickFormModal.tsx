'use client'

import UnifiedFormModal from '../UnifiedFormModal'

interface QuickFormModalProps {
  visible: boolean
  onClose: () => void
  sessionId?: string
  messages?: Array<{
    id: string
    sender: 'user' | 'bot' | 'agent' | 'system'
    message: string
    createdAt: string
  }>
}

export default function QuickFormModal({ visible, onClose, sessionId, messages = [] }: QuickFormModalProps) {
  return (
    <UnifiedFormModal
      visible={visible}
      onClose={onClose}
      sessionId={sessionId}
      messages={messages}
      title="快速录入表单"
      showExtractedInfo={true}
      showSaveDraft={true}
    />
  )
}
