import { useState } from 'react'
import { useProfiles, type ProfileWithStories } from '../hooks/useProfiles'
import {
  useCreateProfile,
  useToggleProfile,
  useRegenerateProfileToken,
  useDeleteProfile,
  useUpdateProfileStories,
} from '../hooks/useProfileMutations'
import { useDialog } from '@/hooks/useDialog'
import type { WorkStory } from '@/types'

interface ProfileManagerProps {
  userId: string
  publishedStories: WorkStory[]
}

export function ProfileManager({ userId, publishedStories }: ProfileManagerProps) {
  const { data: profiles, isLoading } = useProfiles(userId)
  const { showAlert, showConfirm, DialogContainer } = useDialog()

  const [isCreating, setIsCreating] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500">Loading profiles...</div>
      </div>
    )
  }

  const hasProfiles = profiles && profiles.length > 0

  return (
    <>
      {DialogContainer}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Share Profiles</h2>
          {hasProfiles && !isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + New Profile
            </button>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Create curated profiles with selected stories to share with specific audiences.
        </p>

        {publishedStories.length === 0 && (
          <p className="text-amber-600 text-sm mb-4">
            Publish at least one story to create a shareable profile.
          </p>
        )}

        {/* Create Profile Form */}
        {isCreating && (
          <CreateProfileForm
            userId={userId}
            publishedStories={publishedStories}
            onCancel={() => setIsCreating(false)}
            onSuccess={() => setIsCreating(false)}
            showAlert={showAlert}
          />
        )}

        {/* Profile List */}
        {hasProfiles && !isCreating && (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                userId={userId}
                publishedStories={publishedStories}
                isEditing={editingProfileId === profile.id}
                onEdit={() => setEditingProfileId(profile.id)}
                onCancelEdit={() => setEditingProfileId(null)}
                showAlert={showAlert}
                showConfirm={showConfirm}
              />
            ))}
          </div>
        )}

        {/* Empty state - prompt to create first profile */}
        {!hasProfiles && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            disabled={publishedStories.length === 0}
            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Your First Profile
          </button>
        )}
      </div>
    </>
  )
}

interface CreateProfileFormProps {
  userId: string
  publishedStories: WorkStory[]
  onCancel: () => void
  onSuccess: () => void
  showAlert: (message: string, title?: string) => void
}

function CreateProfileForm({
  userId,
  publishedStories,
  onCancel,
  onSuccess,
  showAlert,
}: CreateProfileFormProps) {
  const createProfile = useCreateProfile()
  const [name, setName] = useState('')
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(
    publishedStories.map((s) => s.id)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showAlert('Please enter a profile name.', 'Error')
      return
    }

    if (selectedStoryIds.length === 0) {
      showAlert('Please select at least one story to include.', 'Error')
      return
    }

    try {
      await createProfile.mutateAsync({
        userId,
        name: name.trim(),
        storyIds: selectedStoryIds,
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to create profile:', err)
      showAlert('Failed to create profile. Please try again.', 'Error')
    }
  }

  const toggleStory = (storyId: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-4 bg-gray-50">
      <div className="mb-4">
        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
          Profile Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Backend Engineering, Leadership Experience"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stories to Include
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {publishedStories.map((story) => (
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
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createProfile.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {createProfile.isPending ? 'Creating...' : 'Create Profile'}
        </button>
      </div>
    </form>
  )
}

interface ProfileCardProps {
  profile: ProfileWithStories
  userId: string
  publishedStories: WorkStory[]
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

function ProfileCard({
  profile,
  userId,
  publishedStories,
  isEditing,
  onEdit,
  onCancelEdit,
  showAlert,
  showConfirm,
}: ProfileCardProps) {
  const toggleProfile = useToggleProfile()
  const regenerateToken = useRegenerateProfileToken()
  const deleteProfile = useDeleteProfile()
  const updateStories = useUpdateProfileStories()

  const [copied, setCopied] = useState(false)
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(
    profile.stories.map((s) => s.id)
  )

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

  const isExpired = profile.expires_at && new Date(profile.expires_at) < new Date()

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
          {isExpired && (
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

      {profile.is_active && !isExpired && (
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

      {/* Edit stories section */}
      {isEditing ? (
        <div className="border-t pt-3 mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edit Stories
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {publishedStories.map((story) => (
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
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={onEdit}
            className="text-gray-500 hover:text-gray-700"
          >
            Edit stories
          </button>
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
}
