import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, WorkStory } from '@/types'

export const PROFILES_QUERY_KEY = ['profiles']

export interface ProfileWithStories extends Profile {
  stories: WorkStory[]
}

export function useProfiles(userId: string | undefined) {
  return useQuery({
    queryKey: [...PROFILES_QUERY_KEY, userId],
    queryFn: async (): Promise<ProfileWithStories[]> => {
      if (!userId) return []

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
      }

      if (!profiles || profiles.length === 0) {
        return []
      }

      // Fetch profile_stories with work_stories for all profiles
      const profileIds = profiles.map((p) => p.id)
      const { data: profileStories, error: psError } = await supabase
        .from('profile_stories')
        .select(`
          profile_id,
          display_order,
          work_story:work_stories(*)
        `)
        .in('profile_id', profileIds)
        .order('display_order', { ascending: true })

      if (psError) {
        throw new Error(`Failed to fetch profile stories: ${psError.message}`)
      }

      // Map stories to profiles
      const profileStoriesMap = new Map<string, WorkStory[]>()
      for (const ps of profileStories || []) {
        const stories = profileStoriesMap.get(ps.profile_id) || []
        if (ps.work_story) {
          stories.push(ps.work_story as unknown as WorkStory)
        }
        profileStoriesMap.set(ps.profile_id, stories)
      }

      return profiles.map((profile) => ({
        ...profile,
        stories: profileStoriesMap.get(profile.id) || [],
      }))
    },
    enabled: !!userId,
  })
}

export function useProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async (): Promise<ProfileWithStories | null> => {
      if (!profileId) return null

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (profileError) {
        throw new Error(`Failed to fetch profile: ${profileError.message}`)
      }

      // Fetch stories for this profile
      const { data: profileStories, error: psError } = await supabase
        .from('profile_stories')
        .select(`
          display_order,
          work_story:work_stories(*)
        `)
        .eq('profile_id', profileId)
        .order('display_order', { ascending: true })

      if (psError) {
        throw new Error(`Failed to fetch profile stories: ${psError.message}`)
      }

      const stories = (profileStories || [])
        .map((ps) => ps.work_story as unknown as WorkStory)
        .filter(Boolean)

      return {
        ...profile,
        stories,
      }
    },
    enabled: !!profileId,
  })
}
