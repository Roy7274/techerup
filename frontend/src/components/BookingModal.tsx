'use client'

import UnifiedFormModal from './UnifiedFormModal'

interface BookingModalProps {
  visible: boolean
  onClose: () => void
  sessionId?: string
}

export default function BookingModal({ visible, onClose, sessionId }: BookingModalProps) {
  return (
    <UnifiedFormModal
      visible={visible}
      onClose={onClose}
      sessionId={sessionId}
      title="预约免费试课"
      showExtractedInfo={false}
      showSaveDraft={false}
    />
  )
}

