import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PROFILES_QUERY_KEY } from './useProfiles'
import type { ProfileInsert, ProfileUpdate } from '@/types'

// URL-safe characters for short tokens (no ambiguous chars like 0/O, 1/l/I)
const TOKEN_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
const TOKEN_LENGTH = 8

// Generate a short, URL-friendly, cryptographically random token
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => TOKEN_CHARS[byte % TOKEN_CHARS.length]).join('')
}

export interface CreateProfileInput {
  userId: string
  name: string
  headline?: string
  bio?: string
  storyIds?: string[]
  expiresAt?: string
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      name,
      headline,
      bio,
      storyIds = [],
      expiresAt,
    }: CreateProfileInput) => {
      const token = generateToken()

      // Create the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          name,
          headline,
          bio,
          share_token: token,
          is_active: true,
          expires_at: expiresAt,
        } satisfies ProfileInsert)
        .select()
        .single()

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      // Add stories to the profile if provided
      if (storyIds.length > 0) {
        const profileStories = storyIds.map((storyId, index) => ({
          profile_id: profile.id,
          work_story_id: storyId,
          display_order: index,
        }))

        const { error: psError } = await supabase
          .from('profile_stories')
          .insert(profileStories)

        if (psError) {
          throw new Error(`Failed to add stories to profile: ${psError.message}`)
        }
      }

      return profile
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...PROFILES_QUERY_KEY, variables.userId],
      })
    },
  })
}

export interface UpdateProfileInput {
  profileId: string
  userId: string
  name?: string
  headline?: string | null
  bio?: string | null
  expiresAt?: string | null
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      name,
      headline,
      bio,
      expiresAt,
    }: UpdateProfileInput) => {
      const updates: ProfileUpdate = {
        updated_at: new Date().toISOString(),
      }

      if (name !== undefined) updates.name = name
      if (headline !== undefined) updates.headline = headline
      if (bio !== undefined) updates.bio = bio
      if (expiresAt !== undefined) updates.expires_at = expiresAt

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...PROFILES_QUERY_KEY, variables.userId],
      })
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.profileId],
      })
    },
  })
}

export function useToggleProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      isActive,
    }: {
      profileId: string
      isActive: boolean
      userId: string
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to toggle profile: ${error.message}`)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...PROFILES_QUERY_KEY, variables.userId],
      })
    },
  })
}

export function useRegenerateProfileToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
    }: {
      profileId: string
      userId: string
    }) => {
      const newToken = generateToken()

      const { data, error } = await supabase
        .from('profiles')
        .update({
          share_token: newToken,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to regenerate token: ${error.message}`)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...PROFILES_QUERY_KEY, variables.userId],
      })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
    }: {
      profileId: string
      userId: string
    }) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)

      if (error) {
        throw new Error(`Failed to delete profile: ${error.message}`)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...PROFILES_QUERY_KEY, variables.userId],
      })
    },
  })
}

export interface UpdateProfileStoriesInput {
  profileId: string
  userId: string
  storyIds: string[]
}

export function useUpdateProfileStories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ profileId, storyIds }: UpdateProfileStoriesInput) => {
      // Delete existing profile_stories
      const { error: deleteError } = await supabase
        .from('profile_stories')
        .delete()
        .eq('profile_id', profileId)

      if (deleteError) {
        throw new Error(`Failed to update profile stories: ${deleteError.message}`)
      }

      // Insert new profile_stories if any
      if (storyIds.length > 0) {
        const profileStories = storyIds.map((storyId, index) => ({
          profile_id: profileId,
          work_story_id: storyId,
          display_order: index,
        }))

        const { error: insertError } = await supabase
          .from('profile_stories')
          .insert(profileStories)

        if (insertError) {
          throw new Error(`Failed to update profile stories: ${insertError.message}`)
        }
      }

      // Update profile timestamp
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', profileId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...PROFILES_QUERY_KEY, variables.userId],
      })
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.profileId],
      })
    },
  })
}
