import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import isEqual from 'fast-deep-equal'
import type { WorkStory, StoryAsset } from '@/types'
import { templates, type TemplateType } from '../templates'
import { useUpdateStory } from '../hooks/useStoryMutations'
import { MarkdownEditor } from './MarkdownEditor'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { useAuth } from '@/features/auth'
import { useToast } from '@/components/Toast'

/** Auto-save debounce delay in milliseconds */
const AUTO_SAVE_DELAY_MS = 2000

interface StoryEditorProps {
  story: WorkStory
}

/** Help popup showing formatting options */
function FormattingHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="help-title"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="help-title" className="text-lg font-semibold">Formatting Guide</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6 text-sm">
            {/* Markdown basics */}
            <section>
              <h3 className="font-medium text-gray-900 mb-2">Markdown Formatting</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 font-mono text-xs">
                <div><span className="text-gray-500">**bold**</span> → <strong>bold</strong></div>
                <div><span className="text-gray-500">*italic*</span> → <em>italic</em></div>
                <div><span className="text-gray-500">[link text](https://...)</span> → <span className="text-blue-600 underline">link text</span></div>
                <div><span className="text-gray-500">- item</span> → bullet list</div>
                <div><span className="text-gray-500">1. item</span> → numbered list</div>
              </div>
            </section>

            {/* YouTube embeds */}
            <section>
              <h3 className="font-medium text-gray-900 mb-2">Embed YouTube Videos</h3>
              <p className="text-gray-600 mb-2">
                To embed a video inline, use "YouTube" as the link text:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs">
                <span className="text-gray-500">[YouTube](https://youtube.com/watch?v=...)</span>
              </div>
              <p className="text-gray-500 mt-2 text-xs">
                The video will appear embedded in your story. Private and unlisted videos work too.
              </p>
            </section>

            {/* File uploads */}
            <section>
              <h3 className="font-medium text-gray-900 mb-2">Upload Files</h3>
              <p className="text-gray-600 mb-2">
                Add images, videos, or PDFs to your story:
              </p>
              <ul className="text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">•</span>
                  Click "Attach" to upload a file
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">•</span>
                  Drag and drop files onto the editor
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">•</span>
                  Paste images directly from clipboard
                </li>
              </ul>
              <p className="text-gray-500 mt-2 text-xs">
                Supported: Images (JPG, PNG, GIF, WebP), Videos (MP4, WebM, MOV), PDFs. Max 50MB.
              </p>
            </section>

            {/* Preview */}
            <section>
              <h3 className="font-medium text-gray-900 mb-2">Preview</h3>
              <p className="text-gray-600">
                Click the "Preview" button to see how your content will look to viewers.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
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
  const [showHelp, setShowHelp] = useState(false)

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
      logger.error('Auto-save failed', err)
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
          <div className="text-sm text-gray-600 mb-1">
            {template.name}
          </div>
          <div className="text-xs text-gray-600">
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Formatting help"
            title="Formatting help"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            aria-label="Save and return to dashboard"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Done
          </button>
        </div>
      </div>

      {/* Help popup */}
      <FormattingHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />

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
