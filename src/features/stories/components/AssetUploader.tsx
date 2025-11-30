import { useCallback, useRef, useState } from 'react'
import { useAssetUpload, formatFileSize } from '../hooks/useAssetUpload'
import type { StoryAsset } from '@/types'

interface AssetUploaderProps {
  userId: string
  storyId: string
  assets: StoryAsset[]
  onAssetsChange: (assets: StoryAsset[]) => void
  maxAssets?: number
}

export function AssetUploader({
  userId,
  storyId,
  assets,
  onAssetsChange,
  maxAssets = 10,
}: AssetUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const { upload, remove, isUploading, error } = useAssetUpload({
    userId,
    storyId,
  })

  const handleFiles = useCallback(
    async (files: FileList) => {
      const remainingSlots = maxAssets - assets.length
      const filesToUpload = Array.from(files).slice(0, remainingSlots)

      for (const file of filesToUpload) {
        try {
          const asset = await upload(file)
          onAssetsChange([...assets, asset])
        } catch {
          // Error is handled by the hook
        }
      }
    },
    [assets, maxAssets, onAssetsChange, upload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
        // Reset input so same file can be selected again
        e.target.value = ''
      }
    },
    [handleFiles]
  )

  const handleRemove = useCallback(
    async (asset: StoryAsset) => {
      try {
        await remove(asset)
        onAssetsChange(assets.filter((a) => a.id !== asset.id))
      } catch {
        // Error is handled by the hook
      }
    },
    [assets, onAssetsChange, remove]
  )

  const canAddMore = assets.length < maxAssets

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-gray-500">
            {isUploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Click to upload</span>
                {' or drag and drop'}
                <p className="text-sm mt-1">
                  Images, videos, or PDFs (max 50MB each)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Asset list */}
      {assets.length > 0 && (
        <div className="space-y-2">
          {assets.map((asset) => (
            <AssetItem key={asset.id} asset={asset} onRemove={handleRemove} />
          ))}
        </div>
      )}

      {/* Remaining slots indicator */}
      {assets.length > 0 && canAddMore && (
        <p className="text-xs text-gray-500">
          {maxAssets - assets.length} more file{maxAssets - assets.length !== 1 ? 's' : ''} can be added
        </p>
      )}
    </div>
  )
}

interface AssetItemProps {
  asset: StoryAsset
  onRemove: (asset: StoryAsset) => void
}

function AssetItem({ asset, onRemove }: AssetItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Preview/Icon */}
      <div className="w-12 h-12 flex-shrink-0 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
        {asset.type === 'image' ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : asset.type === 'video' ? (
          <VideoIcon />
        ) : (
          <PdfIcon />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
        <p className="text-xs text-gray-500">
          {asset.type.toUpperCase()} · {formatFileSize(asset.size)}
        </p>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(asset)}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Remove"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function VideoIcon() {
  return (
    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6M9 13h6" />
    </svg>
  )
}
