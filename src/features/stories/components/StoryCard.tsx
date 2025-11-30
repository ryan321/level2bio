import { Link } from 'react-router-dom'
import type { WorkStory } from '@/types'
import { templates } from '../templates'
import { ROUTES } from '@/lib/constants'

interface StoryCardProps {
  story: WorkStory
  onDelete?: (id: string) => void
}

export function StoryCard({ story, onDelete }: StoryCardProps) {
  const template = templates[story.template_type]
  const responses = story.responses as Record<string, string>
  const filledPrompts = Object.values(responses).filter((v) => v && v.trim()).length
  const totalPrompts = template.prompts.length

  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {template.name}
            </span>
          </div>
          <h3 className="font-semibold text-lg truncate">{story.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filledPrompts} of {totalPrompts} prompts completed
            {story.video_url && ' • Video attached'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.STORY_EDITOR.replace(':id', story.id)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(story.id)}
              className="text-sm text-gray-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
