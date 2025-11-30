import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, WorkStory } from '@/types'

export const PROFILES_QUERY_KEY = ['profiles']

export interface ProfileWithStories extends Profile {
  stories: WorkStory[]
}

// Type for Supabase nested query response
interface ProfileStoryJoin {
  display_order: number
  work_stories: WorkStory | null
}

interface ProfileWithJoin extends Profile {
  profile_stories: ProfileStoryJoin[]
}

export function useProfiles(userId: string | undefined) {
  return useQuery({
    queryKey: [...PROFILES_QUERY_KEY, userId],
    queryFn: async (): Promise<ProfileWithStories[]> => {
      if (!userId) return []

      // Single query with join - more efficient than two separate queries
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_stories (
            display_order,
            work_stories (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch profiles: ${error.message}`)
      }

      if (!profiles || profiles.length === 0) {
        return []
      }

      // Transform the nested data structure
      return (profiles as ProfileWithJoin[]).map((profile) => {
        const { profile_stories, ...profileData } = profile

        // Sort by display_order and extract work_stories
        const stories = (profile_stories || [])
          .sort((a, b) => a.display_order - b.display_order)
          .map((ps) => ps.work_stories)
          .filter((story): story is WorkStory => story !== null)

        return {
          ...profileData,
          stories,
        }
      })
    },
    enabled: !!userId,
  })
}

export function useProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async (): Promise<ProfileWithStories | null> => {
      if (!profileId) return null

      // Single query with join
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_stories (
            display_order,
            work_stories (*)
          )
        `)
        .eq('id', profileId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`)
      }

      const profileWithJoin = profile as ProfileWithJoin
      const { profile_stories, ...profileData } = profileWithJoin

      // Sort by display_order and extract work_stories
      const stories = (profile_stories || [])
        .sort((a, b) => a.display_order - b.display_order)
        .map((ps) => ps.work_stories)
        .filter((story): story is WorkStory => story !== null)

      return {
        ...profileData,
        stories,
      }
    },
    enabled: !!profileId,
  })
}
