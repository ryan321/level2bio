import { useState, memo } from 'react'
import {
  useUpdateProfile,
  useToggleProfile,
  useRegenerateProfileToken,
  useDeleteProfile,
  useUpdateProfileStories,
} from '../hooks/useProfileMutations'
import { toDateTimeLocal, formatDateTime, isExpired, getMinDateTimeLocal } from '@/lib/dateUtils'
import type { ProfileWithStories } from '../hooks/useProfiles'
import type { WorkStory } from '@/types'

export interface ProfileCardProps {
  profile: ProfileWithStories
  userId: string
  stories: WorkStory[]
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  showAlert: (message: string, title?: string) => void
  showConfirm: (options: {
    message: string
    title?: string
    confirmLabel?: string
    variant?: 'default' | 'danger'
    onConfirm: () => void
  }) => void
}

export const ProfileCard = memo(function ProfileCard({
  profile,
  userId,
  stories,
  isEditing,
  onEdit,
  onCancelEdit,
  showAlert,
  showConfirm,
}: ProfileCardProps) {
  const toggleProfile = useToggleProfile()
  const updateProfile = useUpdateProfile()
  const regenerateToken = useRegenerateProfileToken()
  const deleteProfile = useDeleteProfile()
  const updateStories = useUpdateProfileStories()

  const [copied, setCopied] = useState(false)
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(
    profile.stories.map((s) => s.id)
  )
  const [editingExpiration, setEditingExpiration] = useState(false)
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocal(profile.expires_at))
  const [editingDetails, setEditingDetails] = useState(false)
  const [editHeadline, setEditHeadline] = useState(profile.headline || '')
  const [editBio, setEditBio] = useState(profile.bio || '')

  const shareUrl = `${window.location.origin}/p/${profile.share_token}`

  const handleToggle = async () => {
    try {
      await toggleProfile.mutateAsync({
        profileId: profile.id,
        isActive: !profile.is_active,
        userId,
      })
    } catch (err) {
      console.error('Failed to toggle profile:', err)
      showAlert('Failed to update profile. Please try again.', 'Error')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      showAlert('Failed to copy link. Please copy it manually.', 'Error')
    }
  }

  const handleRegenerate = () => {
    showConfirm({
      title: 'Regenerate Link',
      message:
        'This will create a new link. Anyone with the old link will no longer be able to access this profile. Continue?',
      confirmLabel: 'Regenerate',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await regenerateToken.mutateAsync({ profileId: profile.id, userId })
        } catch (err) {
          console.error('Failed to regenerate token:', err)
          showAlert('Failed to regenerate link. Please try again.', 'Error')
        }
      },
    })
  }

  const handleDelete = () => {
    showConfirm({
      title: 'Delete Profile',
      message:
        'This will permanently delete this profile and its share link. This cannot be undone. Continue?',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteProfile.mutateAsync({ profileId: profile.id, userId })
        } catch (err) {
          console.error('Failed to delete profile:', err)
          showAlert('Failed to delete profile. Please try again.', 'Error')
        }
      },
    })
  }

  const handleSaveStories = async () => {
    try {
      await updateStories.mutateAsync({
        profileId: profile.id,
        userId,
        storyIds: selectedStoryIds,
      })
      onCancelEdit()
    } catch (err) {
      console.error('Failed to update stories:', err)
      showAlert('Failed to update stories. Please try again.', 'Error')
    }
  }

  const toggleStory = (storyId: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    )
  }

  const handleSaveExpiration = async () => {
    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      setEditingExpiration(false)
    } catch (err) {
      console.error('Failed to update expiration:', err)
      showAlert('Failed to update expiration. Please try again.', 'Error')
    }
  }

  const handleClearExpiration = async () => {
    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        userId,
        expiresAt: null,
      })
      setExpiresAt('')
      setEditingExpiration(false)
    } catch (err) {
      console.error('Failed to clear expiration:', err)
      showAlert('Failed to clear expiration. Please try again.', 'Error')
    }
  }

  const handleSaveDetails = async () => {
    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        userId,
        headline: editHeadline || null,
        bio: editBio || null,
      })
      setEditingDetails(false)
    } catch (err) {
      console.error('Failed to update profile details:', err)
      showAlert('Failed to update profile details. Please try again.', 'Error')
    }
  }

  const handleClearDetails = async () => {
    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        userId,
        headline: null,
        bio: null,
      })
      setEditHeadline('')
      setEditBio('')
      setEditingDetails(false)
    } catch (err) {
      console.error('Failed to clear profile details:', err)
      showAlert('Failed to clear profile details. Please try again.', 'Error')
    }
  }

  const profileIsExpired = isExpired(profile.expires_at)

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium">{profile.name}</h3>
          <p className="text-sm text-gray-500">
            {profile.stories.length} {profile.stories.length === 1 ? 'story' : 'stories'}
            {profile.view_count > 0 && ` · ${profile.view_count} views`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profileIsExpired && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              Expired
            </span>
          )}
          <span className="text-sm text-gray-500">
            {profile.is_active ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={handleToggle}
            disabled={toggleProfile.isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              profile.is_active ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={profile.is_active}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                profile.is_active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {profile.is_active && !profileIsExpired && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-1.5 bg-gray-50 border rounded text-sm text-gray-700 font-mono"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Expiration info/edit */}
      {editingExpiration ? (
        <div className="border-t pt-3 mt-3 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link Expiration
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={getMinDateTimeLocal()}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
          />
          <div className="flex justify-end gap-2">
            {profile.expires_at && (
              <button
                onClick={handleClearExpiration}
                disabled={updateProfile.isPending}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
              >
                Remove expiration
              </button>
            )}
            <button
              onClick={() => {
                setExpiresAt(toDateTimeLocal(profile.expires_at))
                setEditingExpiration(false)
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveExpiration}
              disabled={updateProfile.isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : profile.expires_at && !profileIsExpired ? (
        <div className="text-sm text-gray-500 mb-3">
          Expires: {formatDateTime(profile.expires_at)}
          <button
            onClick={() => setEditingExpiration(true)}
            className="ml-2 text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
      ) : null}

      {/* Profile details (headline/bio) edit section */}
      {editingDetails ? (
        <div className="border-t pt-3 mt-3 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Override
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Override the headline and bio for this specific profile. Leave blank to use your default.
          </p>
          <div className="space-y-3 mb-3">
            <div>
              <label htmlFor={`headline-${profile.id}`} className="block text-xs text-gray-600 mb-1">
                Headline
              </label>
              <input
                id={`headline-${profile.id}`}
                type="text"
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                placeholder="e.g., Senior Backend Engineer"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor={`bio-${profile.id}`} className="block text-xs text-gray-600 mb-1">
                Bio
              </label>
              <textarea
                id={`bio-${profile.id}`}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="A brief introduction tailored for this audience..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {(profile.headline || profile.bio) && (
              <button
                onClick={handleClearDetails}
                disabled={updateProfile.isPending}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
              >
                Clear override
              </button>
            )}
            <button
              onClick={() => {
                setEditHeadline(profile.headline || '')
                setEditBio(profile.bio || '')
                setEditingDetails(false)
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDetails}
              disabled={updateProfile.isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (profile.headline || profile.bio) ? (
        <div className="text-sm text-gray-500 mb-3 border-t pt-3 mt-3">
          <div className="flex items-start justify-between">
            <div>
              {profile.headline && (
                <div className="font-medium text-gray-700">{profile.headline}</div>
              )}
              {profile.bio && (
                <div className="text-gray-500 mt-1">{profile.bio}</div>
              )}
            </div>
            <button
              onClick={() => setEditingDetails(true)}
              className="text-blue-600 hover:text-blue-700 text-xs ml-2 shrink-0"
            >
              Edit
            </button>
          </div>
        </div>
      ) : null}

      {/* Edit stories section */}
      {isEditing ? (
        <div className="border-t pt-3 mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edit Stories
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {stories.map((story) => (
              <label
                key={story.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStoryIds.includes(story.id)}
                  onChange={() => toggleStory(story.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{story.title}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStories}
              disabled={updateStories.isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {updateStories.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <button
            onClick={onEdit}
            className="text-gray-500 hover:text-gray-700"
          >
            Edit stories
          </button>
          {!profile.headline && !profile.bio && (
            <button
              onClick={() => setEditingDetails(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              Customize
            </button>
          )}
          {!profile.expires_at && (
            <button
              onClick={() => setEditingExpiration(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              Set expiration
            </button>
          )}
          <button
            onClick={handleRegenerate}
            disabled={regenerateToken.isPending}
            className="text-gray-500 hover:text-gray-700"
          >
            Regenerate link
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProfile.isPending}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
})
