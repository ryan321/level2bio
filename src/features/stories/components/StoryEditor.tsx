import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkStory } from '@/types'
import { templates, type TemplateType } from '../templates'
import { useUpdateStory } from '../hooks/useStoryMutations'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'
import { ROUTES } from '@/lib/constants'

interface StoryEditorProps {
  story: WorkStory
}

export function StoryEditor({ story }: StoryEditorProps) {
  const navigate = useNavigate()
  const updateStory = useUpdateStory()
  const template = templates[story.template_type as TemplateType]

  // Local state for form
  const [title, setTitle] = useState(story.title)
  const [responses, setResponses] = useState<Record<string, string>>(
    (story.responses as Record<string, string>) || {}
  )
  const [videoUrl, setVideoUrl] = useState(story.video_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const hasChanges =
      title !== story.title ||
      videoUrl !== (story.video_url || '') ||
      JSON.stringify(responses) !== JSON.stringify(story.responses || {})
    setHasUnsavedChanges(hasChanges)
  }, [title, responses, videoUrl, story])

  // Auto-save with debounce
  const save = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) return

    setIsSaving(true)
    try {
      await updateStory.mutateAsync({
        id: story.id,
        updates: {
          title,
          responses,
          video_url: videoUrl || null,
        },
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [story.id, title, responses, videoUrl, hasUnsavedChanges, isSaving, updateStory])

  // Debounced auto-save
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      save()
    }, 2000) // Save after 2 seconds of no changes

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, save])

  const handleResponseChange = (key: string, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveAndExit = async () => {
    if (hasUnsavedChanges) {
      await save()
    }
    navigate(ROUTES.DASHBOARD)
  }

  const videoId = extractYouTubeId(videoUrl)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            {template.name}
          </div>
          <div className="text-xs text-gray-400">
            {isSaving ? (
              'Saving...'
            ) : lastSaved ? (
              `Last saved ${lastSaved.toLocaleTimeString()}`
            ) : hasUnsavedChanges ? (
              'Unsaved changes'
            ) : (
              'All changes saved'
            )}
          </div>
        </div>
        <button
          onClick={handleSaveAndExit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Done
        </button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Story Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your story a clear, descriptive title..."
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
        />
      </div>

      {/* Prompts */}
      <div className="space-y-8">
        {template.prompts.map((prompt) => (
          <div key={prompt.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {prompt.label}
            </label>
            {prompt.hint && (
              <p className="text-sm text-gray-500 mb-2">{prompt.hint}</p>
            )}
            <textarea
              value={responses[prompt.key] || ''}
              onChange={(e) => handleResponseChange(prompt.key, e.target.value)}
              placeholder={prompt.placeholder}
              rows={5}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {(responses[prompt.key] || '').length} characters
            </div>
          </div>
        ))}
      </div>

      {/* Video Section */}
      <div className="mt-10 pt-8 border-t">
        <h3 className="text-lg font-semibold mb-2">Video Walkthrough (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add a YouTube link to walk viewers through your story. Private or unlisted videos work great.
        </p>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        {/* Video Preview */}
        {videoId && (
          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-2">Preview:</div>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <iframe
                src={getYouTubeEmbedUrl(videoId)}
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {videoUrl && !videoId && (
          <p className="text-sm text-red-600 mt-2">
            Could not parse YouTube URL. Please use a standard YouTube link.
          </p>
        )}
      </div>
    </div>
  )
}
