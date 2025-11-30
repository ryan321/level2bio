import { useRef, useCallback, useState } from 'react'
import { RichMarkdown } from '@/components/RichMarkdown'
import { useAssetUpload } from '../hooks/useAssetUpload'
import type { StoryAsset } from '@/types'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  userId: string
  storyId: string
  onAssetUploaded?: (asset: StoryAsset) => void
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 5,
  userId,
  storyId,
  onAssetUploaded,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const { upload, isUploading, error } = useAssetUpload({
    userId,
    storyId,
  })

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current
      if (!textarea) {
        onChange(value + text)
        return
      }

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + text + value.substring(end)
      onChange(newValue)

      // Set cursor position after inserted text
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length
        textarea.focus()
      })
    },
    [value, onChange]
  )

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        const asset = await upload(file)
        onAssetUploaded?.(asset)

        // Insert markdown syntax based on file type
        let markdown: string
        if (asset.type === 'image') {
          markdown = `\n![${asset.name}](${asset.url})\n`
        } else if (asset.type === 'video') {
          // Videos can't be embedded in standard markdown, use a link
          markdown = `\n[${asset.name} (video)](${asset.url})\n`
        } else {
          markdown = `\n[${asset.name}](${asset.url})\n`
        }

        insertAtCursor(markdown)
      } catch {
        // Error handled by hook
      }
    },
    [upload, insertAtCursor, onAssetUploaded]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileUpload(file)
        e.target.value = ''
      }
    },
    [handleFileUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            handleFileUpload(file)
          }
          break
        }
      }
    },
    [handleFileUpload]
  )

  return (
    <div className="relative">
      {/* Editor/Preview container - side by side on desktop, stacked on mobile */}
      <div className={`flex flex-col ${showPreview ? 'lg:flex-row lg:gap-4' : ''}`}>
        {/* Editor */}
        <div className={`${showPreview ? 'lg:w-1/2' : 'w-full'}`}>
          <div
            className={`relative ${dragActive ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              rows={rows}
              disabled={isUploading}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y disabled:opacity-50 font-mono text-sm"
            />

            {/* Upload overlay when dragging */}
            {dragActive && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none">
                <p className="text-blue-600 font-medium">Drop file to upload</p>
              </div>
            )}

            {/* Uploading overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">Uploading...</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview pane */}
        {showPreview && (
          <div className="lg:w-1/2 mt-4 lg:mt-0">
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[120px] max-h-[400px] overflow-y-auto">
              {value ? (
                <div className="prose prose-sm max-w-none">
                  <RichMarkdown>{value}</RichMarkdown>
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">Preview will appear here...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-50 flex items-center gap-1"
            title="Upload image, video, or PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attach
          </button>
          <span className="text-xs text-gray-400 hidden sm:inline">
            paste/drop
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline" title="Use [YouTube](url) to embed videos">
            <code className="bg-gray-100 px-1 rounded">[YouTube](url)</code> to embed
          </span>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`text-xs flex items-center gap-1 ${showPreview ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
        </div>
        <div className="text-xs text-gray-400">
          {value.length} chars
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
