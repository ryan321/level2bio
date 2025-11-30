import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WorkStoryInsert, WorkStoryUpdate } from '@/types'
import { STORIES_QUERY_KEY } from './useStories'
import type { TemplateType } from '../templates'

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
      // Get max display_order for this user
      const { data: existing } = await supabase
        .from('work_stories')
        .select('display_order')
        .eq('user_id', userId)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextOrder = existing && existing.length > 0
        ? existing[0].display_order + 1
        : 0

      const newStory: WorkStoryInsert = {
        user_id: userId,
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
        throw new Error(`Failed to create story: ${error.message}`)
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
      const { data, error } = await supabase
        .from('work_stories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update story: ${error.message}`)
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
      const { error } = await supabase
        .from('work_stories')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete story: ${error.message}`)
      }

      return { id, userId }
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: [...STORIES_QUERY_KEY, userId] })
    },
  })
}

