import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { SHARE_LINK_QUERY_KEY } from './useShareLink'

// Generate a cryptographically random token
function generateToken(): string {
  return crypto.randomUUID()
}

export function useCreateShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = generateToken()

      const { data, error } = await supabase
        .from('share_links')
        .insert({
          user_id: userId,
          token,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create share link: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...SHARE_LINK_QUERY_KEY, data.user_id], data)
    },
  })
}

export function useToggleShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('share_links')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to toggle share link: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...SHARE_LINK_QUERY_KEY, data.user_id], data)
    },
  })
}

export function useRegenerateShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const newToken = generateToken()

      const { data, error } = await supabase
        .from('share_links')
        .update({ token: newToken, is_active: true })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to regenerate share link: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...SHARE_LINK_QUERY_KEY, data.user_id], data)
    },
  })
}
