import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkStory, StoryAsset } from '@/types'
import { templates, type TemplateType } from '../templates'
import { useUpdateStory } from '../hooks/useStoryMutations'
import { MarkdownEditor } from './MarkdownEditor'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/features/auth'

interface StoryEditorProps {
  story: WorkStory
}

export function StoryEditor({ story }: StoryEditorProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const updateStory = useUpdateStory()
  const template = templates[story.template_type as TemplateType]

  // Local state for form
  const [title, setTitle] = useState(story.title)
  const [responses, setResponses] = useState<Record<string, string>>(
    (story.responses as Record<string, string>) || {}
  )
  const [assets, setAssets] = useState<StoryAsset[]>(
    (story.assets as unknown as StoryAsset[]) || []
  )
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const hasChanges =
      title !== story.title ||
      JSON.stringify(responses) !== JSON.stringify(story.responses || {}) ||
      JSON.stringify(assets) !== JSON.stringify(story.assets || [])
    setHasUnsavedChanges(hasChanges)
  }, [title, responses, assets, story])

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
          assets: assets as unknown as undefined,
        },
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [story.id, title, responses, assets, hasUnsavedChanges, isSaving, updateStory])

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

  const handleAssetUploaded = (asset: StoryAsset) => {
    setAssets((prev) => [...prev, asset])
  }

  const handleSaveAndExit = async () => {
    if (hasUnsavedChanges) {
      await save()
    }
    navigate(ROUTES.DASHBOARD)
  }

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
      {user && (
        <div className="space-y-8">
          {template.prompts.map((prompt) => (
            <div key={prompt.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {prompt.label}
              </label>
              {prompt.hint && (
                <p className="text-sm text-gray-500 mb-2">{prompt.hint}</p>
              )}
              <MarkdownEditor
                value={responses[prompt.key] || ''}
                onChange={(value) => handleResponseChange(prompt.key, value)}
                placeholder={prompt.placeholder}
                rows={5}
                userId={user.id}
                storyId={story.id}
                onAssetUploaded={handleAssetUploaded}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
