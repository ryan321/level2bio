import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WorkStory } from '@/types'

export const STORIES_QUERY_KEY = ['stories']

export function useStories(userId: string | undefined) {
  return useQuery({
    queryKey: [...STORIES_QUERY_KEY, userId],
    queryFn: async (): Promise<WorkStory[]> => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('work_stories')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch stories: ${error.message}`)
      }

      return data || []
    },
    enabled: !!userId,
  })
}

export function useStory(storyId: string | undefined) {
  return useQuery({
    queryKey: [...STORIES_QUERY_KEY, 'detail', storyId],
    queryFn: async (): Promise<WorkStory | null> => {
      if (!storyId) return null

      const { data, error } = await supabase
        .from('work_stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw new Error(`Failed to fetch story: ${error.message}`)
      }

      return data
    },
    enabled: !!storyId,
  })
}
