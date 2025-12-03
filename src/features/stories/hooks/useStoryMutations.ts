import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WorkStoryInsert, WorkStoryUpdate } from '@/types'
import { STORIES_QUERY_KEY } from './useStories'
import type { TemplateType } from '../templates'
import {
  validateStoryTitle,
  validateStoryResponses,
  VALIDATION_LIMITS,
} from '@/lib/validation'

// Helper to get authenticated user ID from session
async function getAuthUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }
  return session.user.id
}

// Verify the current user owns a story
async function verifyStoryOwnership(storyId: string, authUserId: string): Promise<void> {
  const { data: story } = await supabase
    .from('work_stories')
    .select('user_id')
    .eq('id', storyId)
    .single()

  if (!story || story.user_id !== authUserId) {
    throw new Error('Unauthorized: You do not own this story')
  }
}

interface CreateStoryInput {
  userId: string
  templateType: TemplateType
  title: string
}

interface UpdateStoryInput {
  id: string
  updates: WorkStoryUpdate
}

export function useCreateStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, templateType, title }: CreateStoryInput) => {
      // Security: Verify auth user matches userId
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }

      // Validation: Validate title
      const titleValidation = validateStoryTitle(title)
      if (!titleValidation.valid) {
        throw new Error(titleValidation.error)
      }

      // Get max display_order for this user
      const { data: existing } = await supabase
        .from('work_stories')
        .select('display_order')
        .eq('user_id', authUserId)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextOrder = existing && existing.length > 0
        ? existing[0].display_order + 1
        : 0

      const newStory: WorkStoryInsert = {
        user_id: authUserId,
        template_type: templateType,
        title,
        responses: {},
        display_order: nextOrder,
      }

      const { data, error } = await supabase
        .from('work_stories')
        .insert(newStory)
        .select()
        .single()

      if (error) {
        throw new Error('Failed to create story. Please try again.')
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate stories list
      queryClient.invalidateQueries({ queryKey: [...STORIES_QUERY_KEY, data.user_id] })
      // Pre-populate the story detail cache so it's available immediately after navigation
      queryClient.setQueryData([...STORIES_QUERY_KEY, 'detail', data.id], data)
    },
  })
}

export function useUpdateStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateStoryInput) => {
      // Security: Verify auth and ownership
      const authUserId = await getAuthUserId()
      await verifyStoryOwnership(id, authUserId)

      // Validation: Validate title if being updated
      if (updates.title !== undefined) {
        const titleValidation = validateStoryTitle(updates.title)
        if (!titleValidation.valid) {
          throw new Error(titleValidation.error)
        }
      }

      // Validation: Validate responses if being updated
      if (updates.responses !== undefined) {
        const responsesValidation = validateStoryResponses(updates.responses as Record<string, string>)
        if (!responsesValidation.valid) {
          throw new Error(responsesValidation.error)
        }
      }

      // Validation: Validate assets array if being updated
      if (updates.assets !== undefined) {
        const assets = updates.assets as unknown[]
        if (Array.isArray(assets) && assets.length > VALIDATION_LIMITS.maxAssetsPerStory) {
          throw new Error(`Too many assets. Maximum ${VALIDATION_LIMITS.maxAssetsPerStory} allowed.`)
        }
      }

      const { data, error } = await supabase
        .from('work_stories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', authUserId) // Double-check ownership in query
        .select()
        .single()

      if (error) {
        throw new Error('Failed to update story. Please try again.')
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...STORIES_QUERY_KEY, data.user_id] })
      queryClient.invalidateQueries({ queryKey: [...STORIES_QUERY_KEY, 'detail', data.id] })
    },
  })
}

export function useDeleteStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Security: Verify auth and ownership
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }
      await verifyStoryOwnership(id, authUserId)

      const { error } = await supabase
        .from('work_stories')
        .delete()
        .eq('id', id)
        .eq('user_id', authUserId) // Double-check ownership in query

      if (error) {
        throw new Error('Failed to delete story. Please try again.')
      }

      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: [...STORIES_QUERY_KEY, userId] })
    },
  })
}

