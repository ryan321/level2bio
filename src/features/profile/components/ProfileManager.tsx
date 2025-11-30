import { useState } from 'react'
import { useProfiles } from '../hooks/useProfiles'
import { useDialog } from '@/hooks/useDialog'
import { CreateProfileForm } from './CreateProfileForm'
import { ProfileCard } from './ProfileCard'
import type { WorkStory } from '@/types'

interface ProfileManagerProps {
  userId: string
  stories: WorkStory[]
}

export function ProfileManager({ userId, stories }: ProfileManagerProps) {
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

        {stories.length === 0 && (
          <p className="text-amber-600 text-sm mb-4">
            Create at least one story to create a shareable profile.
          </p>
        )}

        {/* Create Profile Form */}
        {isCreating && (
          <CreateProfileForm
            userId={userId}
            stories={stories}
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
                stories={stories}
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
            disabled={stories.length === 0}
            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Your First Profile
          </button>
        )}
      </div>
    </>
  )
}
