import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoryAsset, AssetType } from '@/types'

const BUCKET_NAME = 'story-assets'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const ALLOWED_TYPES: Record<string, AssetType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'application/pdf': 'pdf',
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UseAssetUploadOptions {
  userId: string
  storyId: string
  onProgress?: (progress: UploadProgress) => void
}

export interface UseAssetUploadResult {
  upload: (file: File) => Promise<StoryAsset>
  remove: (asset: StoryAsset) => Promise<void>
  isUploading: boolean
  error: string | null
  progress: UploadProgress | null
}

function getAssetType(mimeType: string): AssetType | null {
  return ALLOWED_TYPES[mimeType] || null
}

function generateFilePath(userId: string, storyId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${userId}/${storyId}/${timestamp}-${sanitizedName}`
}

export function useAssetUpload({
  userId,
  storyId,
  onProgress,
}: UseAssetUploadOptions): UseAssetUploadResult {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const upload = useCallback(
    async (file: File): Promise<StoryAsset> => {
      setError(null)
      setProgress(null)

      // Validate file type
      const assetType = getAssetType(file.type)
      if (!assetType) {
        const err = `File type "${file.type}" is not supported. Please upload an image, video, or PDF.`
        setError(err)
        throw new Error(err)
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const err = `File is too large. Maximum size is 50MB.`
        setError(err)
        throw new Error(err)
      }

      setIsUploading(true)

      try {
        const filePath = generateFilePath(userId, storyId, file.name)

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)

        const asset: StoryAsset = {
          id: crypto.randomUUID(),
          name: file.name,
          type: assetType,
          size: file.size,
          url: urlData.publicUrl,
          mimeType: file.type,
        }

        // Update progress to complete
        const completeProgress = { loaded: file.size, total: file.size, percentage: 100 }
        setProgress(completeProgress)
        onProgress?.(completeProgress)

        return asset
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [userId, storyId, onProgress]
  )

  const remove = useCallback(
    async (asset: StoryAsset): Promise<void> => {
      setError(null)

      try {
        // Extract path from URL
        const url = new URL(asset.url)
        const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
        if (pathParts.length < 2) {
          throw new Error('Invalid asset URL')
        }
        const filePath = decodeURIComponent(pathParts[1])

        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath])

        if (deleteError) {
          throw new Error(deleteError.message)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed'
        setError(message)
        throw err
      }
    },
    []
  )

  return {
    upload,
    remove,
    isUploading,
    error,
    progress,
  }
}

// Utility to format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
