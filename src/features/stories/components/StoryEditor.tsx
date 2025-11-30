import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import isEqual from 'fast-deep-equal'
import type { WorkStory, StoryAsset } from '@/types'
import { templates, type TemplateType } from '../templates'
import { useUpdateStory } from '../hooks/useStoryMutations'
import { MarkdownEditor } from './MarkdownEditor'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/features/auth'
import { useToast } from '@/components/Toast'

/** Auto-save debounce delay in milliseconds */
const AUTO_SAVE_DELAY_MS = 2000

interface StoryEditorProps {
  story: WorkStory
}

export function StoryEditor({ story }: StoryEditorProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
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
  const [saveError, setSaveError] = useState<string | null>(null)

  // Use refs to avoid stale closures in the save callback
  const titleRef = useRef(title)
  const responsesRef = useRef(responses)
  const assetsRef = useRef(assets)

  // Keep refs in sync with state
  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { responsesRef.current = responses }, [responses])
  useEffect(() => { assetsRef.current = assets }, [assets])

  // Memoized change detection using deep equality
  const hasUnsavedChanges = useMemo(() => {
    return (
      title !== story.title ||
      !isEqual(responses, story.responses || {}) ||
      !isEqual(assets, story.assets || [])
    )
  }, [title, responses, assets, story.title, story.responses, story.assets])

  // Stable save function that reads from refs
  const save = useCallback(async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateStory.mutateAsync({
        id: story.id,
        updates: {
          title: titleRef.current,
          responses: responsesRef.current,
          assets: assetsRef.current as unknown as undefined,
        },
      })
      setLastSaved(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auto-save failed'
      setSaveError(message)
      addToast(message, 'error')
      console.error('Auto-save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [story.id, updateStory, addToast])

  // Debounced auto-save - only triggers when changes exist and not currently saving
  useEffect(() => {
    if (!hasUnsavedChanges || isSaving) return

    const timer = setTimeout(() => {
      save()
    }, AUTO_SAVE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, isSaving, save])

  const handleResponseChange = useCallback((key: string, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleAssetUploaded = useCallback((asset: StoryAsset) => {
    setAssets((prev) => [...prev, asset])
  }, [])

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
            ) : saveError ? (
              <span className="text-red-500">{saveError}</span>
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
          disabled={isSaving}
          aria-label="Save and return to dashboard"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Done
        </button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <label htmlFor="story-title" className="block text-sm font-medium text-gray-700 mb-2">
          Story Title
        </label>
        <input
          id="story-title"
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
              <label
                htmlFor={`prompt-${prompt.key}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {prompt.label}
              </label>
              {prompt.hint && (
                <p className="text-sm text-gray-500 mb-2">{prompt.hint}</p>
              )}
              <MarkdownEditor
                id={`prompt-${prompt.key}`}
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
