import { useState, memo } from 'react'
import { useCreateProfile } from '../hooks/useProfileMutations'
import { getMinDateTimeLocal } from '@/lib/dateUtils'
import type { WorkStory } from '@/types'

interface CreateProfileFormProps {
  userId: string
  stories: WorkStory[]
  onCancel: () => void
  onSuccess: () => void
  showAlert: (message: string, title?: string) => void
}

export const CreateProfileForm = memo(function CreateProfileForm({
  userId,
  stories,
  onCancel,
  onSuccess,
  showAlert,
}: CreateProfileFormProps) {
  const createProfile = useCreateProfile()
  const [name, setName] = useState('')
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(
    stories.map((s) => s.id)
  )
  const [expiresAt, setExpiresAt] = useState('')

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
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
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
      </div>

      <div className="mb-4">
        <label htmlFor="profile-expires" className="block text-sm font-medium text-gray-700 mb-1">
          Link Expiration (Optional)
        </label>
        <input
          id="profile-expires"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={getMinDateTimeLocal()}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty for no expiration
        </p>
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
})
