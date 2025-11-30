import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ShareLink } from '@/types'

export const SHARE_LINK_QUERY_KEY = ['shareLink']

export function useShareLink(userId: string | undefined) {
  return useQuery({
    queryKey: [...SHARE_LINK_QUERY_KEY, userId],
    queryFn: async (): Promise<ShareLink | null> => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to fetch share link: ${error.message}`)
      }

      return data
    },
    enabled: !!userId,
  })
}
