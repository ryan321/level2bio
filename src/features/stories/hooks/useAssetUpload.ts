import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoryAsset, AssetType } from '@/types'

const BUCKET_NAME = 'story-assets'
const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

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

/** Magic number signatures for file type validation */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP starts with RIFF)
  'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp at offset 4
  'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // EBML
  'video/quicktime': [[0x00, 0x00, 0x00]], // MOV also uses ftyp
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
}

/**
 * Validates file content by checking magic number signatures
 * @returns true if file content matches its declared MIME type
 */
async function validateFileSignature(file: File): Promise<boolean> {
  const signatures = FILE_SIGNATURES[file.type]
  if (!signatures) return true // No signature check for unknown types (will fail MIME check anyway)

  const headerSize = Math.max(...signatures.map(s => s.length), 12) // Read enough for all checks
  const buffer = await file.slice(0, headerSize).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Special handling for MP4/MOV which have ftyp at offset 4
  if (file.type === 'video/mp4' || file.type === 'video/quicktime') {
    // Check for ftyp at offset 4
    const ftypSignature = [0x66, 0x74, 0x79, 0x70]
    const hasFtyp = ftypSignature.every((byte, i) => bytes[i + 4] === byte)
    if (hasFtyp) return true
  }

  // Check standard signatures
  for (const signature of signatures) {
    const matches = signature.every((byte, i) => bytes[i] === byte)
    if (matches) return true
  }

  return false
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
        const err = `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
        setError(err)
        throw new Error(err)
      }

      // Validate file content matches declared type (magic number check)
      const isValidContent = await validateFileSignature(file)
      if (!isValidContent) {
        const err = `File content does not match its type. Please upload a valid ${assetType} file.`
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

        // Validate path belongs to current user/story (defense in depth)
        const expectedPrefix = `${userId}/${storyId}/`
        if (!filePath.startsWith(expectedPrefix)) {
          throw new Error('Unauthorized: Cannot delete files outside your story')
        }

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
    [userId, storyId]
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
