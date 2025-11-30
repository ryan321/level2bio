import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import {
  StoryEditor,
  TemplateSelector,
  useStory,
  useCreateStory,
} from '@/features/stories'
import type { TemplateType } from '@/features/stories'
import { ROUTES } from '@/lib/constants'

export default function StoryEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = id === 'new'

  // For new stories, track creation state
  const [isCreating, setIsCreating] = useState(false)

  const createStory = useCreateStory()

  // Fetch existing story if editing
  const { data: story, isLoading, error } = useStory(isNew ? undefined : id)

  // Handle template selection for new story
  const handleSelectTemplate = async (templateType: TemplateType) => {
    if (!user) return

    setIsCreating(true)

    try {
      const newStory = await createStory.mutateAsync({
        userId: user.id,
        templateType,
        title: 'Untitled Story',
      })
      // Navigate to the new story's edit page (replace history so back goes to dashboard)
      navigate(ROUTES.STORY_EDITOR.replace(':id', newStory.id), { replace: true })
    } catch (err) {
      console.error('Failed to create story:', err)
      alert('Failed to create story. Please try again.')
      setIsCreating(false)
    }
  }

  // Loading state
  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading story...</div>
      </div>
    )
  }

  // Error or not found
  if (!isNew && (error || !story)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Story not found</h1>
        <p className="text-gray-600 mb-6">
          This story doesn't exist or you don't have access to it.
        </p>
        <Link
          to={ROUTES.DASHBOARD}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  // New story - show template selector
  if (isNew && !isCreating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link
              to={ROUTES.DASHBOARD}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          <TemplateSelector onSelect={handleSelectTemplate} />
        </div>
      </div>
    )
  }

  // Creating new story - show loading
  if (isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Creating your story...</div>
      </div>
    )
  }

  // Edit existing story
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            to={ROUTES.DASHBOARD}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <StoryEditor story={story!} />
        </div>
      </div>
    </div>
  )
}
