import { Link } from 'react-router-dom'
import { useStories } from '../hooks/useStories'
import { useDeleteStory } from '../hooks/useStoryMutations'
import { StoryCard } from './StoryCard'
import { useDialog } from '@/hooks/useDialog'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/lib/constants'

interface StoryListProps {
  userId: string
}

export function StoryList({ userId }: StoryListProps) {
  const { data: stories, isLoading, error } = useStories(userId)
  const deleteStory = useDeleteStory()
  const { showAlert, showConfirm, DialogContainer } = useDialog()

  const handleDelete = (storyId: string) => {
    showConfirm({
      title: 'Delete Story',
      message: 'Are you sure you want to delete this story? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteStory.mutateAsync({ id: storyId, userId })
        } catch (err) {
          logger.error('Failed to delete story', err)
          showAlert('Failed to delete story. Please try again.', 'Error')
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading your stories...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load stories. Please refresh and try again.
      </div>
    )
  }

  if (!stories || stories.length === 0) {
    return (
      <>
        {DialogContainer}
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No work stories yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first work story to start building your Level2 profile.
          </p>
          <Link
            to={ROUTES.STORY_NEW}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Story
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      {DialogContainer}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Your Work Stories ({stories.length})
          </h2>
          <Link
            to={ROUTES.STORY_NEW}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Story
          </Link>
        </div>

        <div className="space-y-3">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </>
  )
}
