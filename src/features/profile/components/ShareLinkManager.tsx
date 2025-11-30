import { useState } from 'react'
import { useShareLink } from '../hooks/useShareLink'
import {
  useCreateShareLink,
  useToggleShareLink,
  useRegenerateShareLink,
} from '../hooks/useShareLinkMutations'
import { useDialog } from '@/hooks/useDialog'

interface ShareLinkManagerProps {
  userId: string
  hasPublishedStories: boolean
}

export function ShareLinkManager({ userId, hasPublishedStories }: ShareLinkManagerProps) {
  const { data: shareLink, isLoading } = useShareLink(userId)
  const createShareLink = useCreateShareLink()
  const toggleShareLink = useToggleShareLink()
  const regenerateShareLink = useRegenerateShareLink()
  const { showAlert, showConfirm, DialogContainer } = useDialog()

  const [copied, setCopied] = useState(false)

  const shareUrl = shareLink
    ? `${window.location.origin}/p/${shareLink.token}`
    : null

  const handleActivate = async () => {
    if (!hasPublishedStories) {
      showAlert(
        'You need at least one published story before you can share your profile.',
        'Publish a Story First'
      )
      return
    }

    try {
      await createShareLink.mutateAsync(userId)
    } catch (err) {
      console.error('Failed to create share link:', err)
      showAlert('Failed to create share link. Please try again.', 'Error')
    }
  }

  const handleToggle = async () => {
    if (!shareLink) return

    // If turning on and no published stories, prevent
    if (!shareLink.is_active && !hasPublishedStories) {
      showAlert(
        'You need at least one published story before you can activate your link.',
        'Publish a Story First'
      )
      return
    }

    try {
      await toggleShareLink.mutateAsync({
        id: shareLink.id,
        isActive: !shareLink.is_active,
      })
    } catch (err) {
      console.error('Failed to toggle share link:', err)
      showAlert('Failed to update share link. Please try again.', 'Error')
    }
  }

  const handleRegenerate = () => {
    if (!shareLink) return

    showConfirm({
      title: 'Regenerate Link',
      message:
        'This will create a new link and deactivate the old one. Anyone with the old link will no longer be able to access your profile. Continue?',
      confirmLabel: 'Regenerate',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await regenerateShareLink.mutateAsync(shareLink.id)
        } catch (err) {
          console.error('Failed to regenerate share link:', err)
          showAlert('Failed to regenerate link. Please try again.', 'Error')
        }
      },
    })
  }

  const handleCopy = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      showAlert('Failed to copy link. Please copy it manually.', 'Error')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500">Loading share settings...</div>
      </div>
    )
  }

  // No share link yet - show activation prompt
  if (!shareLink) {
    return (
      <>
        {DialogContainer}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Share Your Profile</h2>
          <p className="text-gray-600 text-sm mb-4">
            Create a private link to share your Level2 profile with hiring managers and recruiters.
          </p>
          <button
            onClick={handleActivate}
            disabled={createShareLink.isPending}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {createShareLink.isPending ? (
              'Creating...'
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Create Share Link
              </>
            )}
          </button>
          {!hasPublishedStories && (
            <p className="text-amber-600 text-sm mt-3">
              Publish at least one story to activate your share link.
            </p>
          )}
        </div>
      </>
    )
  }

  // Has share link - show management UI
  return (
    <>
      {DialogContainer}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Share Your Profile</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {shareLink.is_active ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={handleToggle}
              disabled={toggleShareLink.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                shareLink.is_active ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={shareLink.is_active}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shareLink.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {shareLink.is_active ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={shareUrl || ''}
                className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700 font-mono"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {shareLink.view_count > 0
                  ? `Viewed ${shareLink.view_count} time${shareLink.view_count === 1 ? '' : 's'}`
                  : 'No views yet'}
              </p>
              <button
                onClick={handleRegenerate}
                disabled={regenerateShareLink.isPending}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Regenerate link
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">
            Your share link is currently disabled. Toggle it on to share your profile.
          </p>
        )}

        {!hasPublishedStories && (
          <p className="text-amber-600 text-sm mt-3">
            Publish at least one story to make your profile visible.
          </p>
        )}
      </div>
    </>
  )
}
