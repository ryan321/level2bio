import { useState, useCallback, type ReactNode } from 'react'
import { AlertDialog, ConfirmDialog } from '@/components/Dialog'

interface AlertState {
  isOpen: boolean
  title: string
  message: string
}

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  variant: 'default' | 'danger'
  onConfirm: () => void
}

interface UseDialogReturn {
  // Show an alert dialog (replacement for window.alert)
  showAlert: (message: string, title?: string) => void
  // Show a confirm dialog (replacement for window.confirm)
  showConfirm: (options: {
    message: string
    title?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'danger'
    onConfirm: () => void
  }) => void
  // Component to render in JSX
  DialogContainer: ReactNode
}

export function useDialog(): UseDialogReturn {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
  })

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
    onConfirm: () => {},
  })

  const showAlert = useCallback((message: string, title = 'Notice') => {
    setAlertState({
      isOpen: true,
      title,
      message,
    })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const showConfirm = useCallback(
    ({
      message,
      title = 'Confirm',
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      variant = 'default',
      onConfirm,
    }: {
      message: string
      title?: string
      confirmLabel?: string
      cancelLabel?: string
      variant?: 'default' | 'danger'
      onConfirm: () => void
    }) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        variant,
        onConfirm,
      })
    },
    []
  )

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const DialogContainer = (
    <>
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
      />
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        variant={confirmState.variant}
      />
    </>
  )

  return {
    showAlert,
    showConfirm,
    DialogContainer,
  }
}
