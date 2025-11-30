import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { User, WorkStory, Profile } from '@/types'

export interface PublicProfile {
  user: User
  profile: Profile
  stories: WorkStory[]
}

export function usePublicProfile(token: string | undefined) {
  return useQuery({
    queryKey: ['publicProfile', token],
    queryFn: async (): Promise<PublicProfile | null> => {
      if (!token) return null

      // First, find the profile and verify it's active and not expired
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('share_token', token)
        .maybeSingle()

      if (profileError) {
        throw new Error(`Failed to fetch profile: ${profileError.message}`)
      }

      // Profile doesn't exist or is inactive
      if (!profile || !profile.is_active) {
        return null
      }

      // Check if profile is expired
      if (profile.expires_at && new Date(profile.expires_at) < new Date()) {
        return null
      }

      // Increment view count atomically (fire and forget - don't block the profile load)
      void (async () => {
        try {
          await supabase.rpc('increment_profile_view', { p_share_token: token })
        } catch (err) {
          logger.error('Failed to update view count', err)
        }
      })()

      // Fetch user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', profile.user_id)
        .single()

      if (userError) {
        throw new Error(`Failed to fetch user: ${userError.message}`)
      }

      // Fetch stories for this profile via profile_stories join table
      // Select only needed columns to reduce payload size
      const { data: profileStories, error: psError } = await supabase
        .from('profile_stories')
        .select(`
          display_order,
          work_story:work_stories(
            id,
            title,
            template_type,
            responses,
            assets,
            video_url,
            created_at,
            updated_at
          )
        `)
        .eq('profile_id', profile.id)
        .order('display_order', { ascending: true })

      if (psError) {
        throw new Error(`Failed to fetch stories: ${psError.message}`)
      }

      // Extract stories from the join result
      const stories = (profileStories || [])
        .map((ps) => ps.work_story as unknown as WorkStory)
        .filter(Boolean)

      return {
        user,
        profile,
        stories,
      }
    },
    enabled: !!token,
    // Don't retry on 404-like scenarios
    retry: false,
  })
}
