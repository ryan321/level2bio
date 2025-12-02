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

      // Fetch profile + user data via SECURITY DEFINER function
      // This prevents enumeration - only returns data if token is valid
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_public_profile', { p_share_token: token })
        .maybeSingle()

      if (profileError) {
        throw new Error(`Failed to fetch profile: ${profileError.message}`)
      }

      // Profile doesn't exist, is inactive, or is expired
      if (!profileData) {
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

      // Fetch stories via SECURITY DEFINER function
      const { data: storiesData, error: storiesError } = await supabase
        .rpc('get_public_profile_stories', { p_share_token: token })

      if (storiesError) {
        throw new Error(`Failed to fetch stories: ${storiesError.message}`)
      }

      // Transform RPC response to match existing types
      const user: User = {
        id: profileData.user_id,
        auth_id: null, // Not exposed publicly
        linkedin_id: '', // Not exposed publicly
        email: null, // Not exposed publicly
        name: profileData.user_name,
        headline: profileData.user_headline,
        bio: profileData.user_bio,
        profile_photo_url: profileData.user_profile_photo_url,
        created_at: profileData.created_at,
        updated_at: profileData.created_at, // Not returned by function
      }

      const profile: Profile = {
        id: profileData.id,
        user_id: profileData.user_id,
        name: profileData.name,
        headline: profileData.headline,
        bio: profileData.bio,
        share_token: profileData.share_token,
        is_active: true, // Must be true if returned
        expires_at: null, // Not returned, but must be valid if returned
        view_count: profileData.view_count,
        last_viewed_at: null, // Not returned by function
        created_at: profileData.created_at,
        updated_at: profileData.created_at, // Not returned by function
      }

      const stories: WorkStory[] = (storiesData || []).map((s) => ({
        id: s.id,
        user_id: profileData.user_id,
        title: s.title,
        template_type: s.template_type as WorkStory['template_type'],
        responses: s.responses,
        video_url: s.video_url,
        assets: s.assets,
        display_order: s.display_order,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))

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
