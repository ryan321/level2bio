import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PROFILES_QUERY_KEY } from './useProfiles'
import type { ProfileInsert, ProfileUpdate } from '@/types'

// URL-safe characters for short tokens (no ambiguous chars like 0/O, 1/l/I)
const TOKEN_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
const TOKEN_LENGTH = 16 // Increased from 8 to 16 for better security (~85 bits entropy)

// Generate a short, URL-friendly, cryptographically random token
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => TOKEN_CHARS[byte % TOKEN_CHARS.length]).join('')
}

// Helper to get authenticated user ID from session
async function getAuthUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }
  return session.user.id
}

// Verify the current user owns a profile
async function verifyProfileOwnership(profileId: string, authUserId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .single()

  if (!profile || profile.user_id !== authUserId) {
    throw new Error('Unauthorized: You do not own this profile')
  }
}

// Verify the current user owns all specified stories
async function verifyStoriesOwnership(storyIds: string[], authUserId: string): Promise<void> {
  if (storyIds.length === 0) return

  const { data: stories } = await supabase
    .from('work_stories')
    .select('id')
    .eq('user_id', authUserId)
    .in('id', storyIds)

  if (!stories || stories.length !== storyIds.length) {
    throw new Error('Unauthorized: One or more stories do not belong to you')
  }
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
      // Security: Verify the authenticated user matches the userId
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }

      // Security: Verify all stories belong to this user
      await verifyStoriesOwnership(storyIds, authUserId)

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
        throw new Error('Failed to create profile. Please try again.')
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
          throw new Error('Failed to add stories to profile. Please try again.')
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
      userId,
      name,
      headline,
      bio,
      expiresAt,
    }: UpdateProfileInput) => {
      // Security: Verify auth and ownership
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }
      await verifyProfileOwnership(profileId, authUserId)

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
        .eq('user_id', authUserId) // Double-check ownership in query
        .select()
        .single()

      if (error) {
        throw new Error('Failed to update profile. Please try again.')
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
      userId,
    }: {
      profileId: string
      isActive: boolean
      userId: string
    }) => {
      // Security: Verify auth and ownership
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }
      await verifyProfileOwnership(profileId, authUserId)

      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .eq('user_id', authUserId)
        .select()
        .single()

      if (error) {
        throw new Error('Failed to toggle profile. Please try again.')
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
      userId,
    }: {
      profileId: string
      userId: string
    }) => {
      // Security: Verify auth and ownership
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }
      await verifyProfileOwnership(profileId, authUserId)

      const newToken = generateToken()

      const { data, error } = await supabase
        .from('profiles')
        .update({
          share_token: newToken,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .eq('user_id', authUserId)
        .select()
        .single()

      if (error) {
        throw new Error('Failed to regenerate token. Please try again.')
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
      userId,
    }: {
      profileId: string
      userId: string
    }) => {
      // Security: Verify auth and ownership
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }
      await verifyProfileOwnership(profileId, authUserId)

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', authUserId)

      if (error) {
        throw new Error('Failed to delete profile. Please try again.')
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
    mutationFn: async ({ profileId, userId, storyIds }: UpdateProfileStoriesInput) => {
      // Security: Verify auth and ownership
      const authUserId = await getAuthUserId()
      if (authUserId !== userId) {
        throw new Error('Unauthorized')
      }

      // Security: Verify profile belongs to this user
      await verifyProfileOwnership(profileId, authUserId)

      // Security: Verify ALL stories belong to this user (CRITICAL)
      await verifyStoriesOwnership(storyIds, authUserId)

      // Delete existing profile_stories
      const { error: deleteError } = await supabase
        .from('profile_stories')
        .delete()
        .eq('profile_id', profileId)

      if (deleteError) {
        throw new Error('Failed to update profile stories. Please try again.')
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
          throw new Error('Failed to update profile stories. Please try again.')
        }
      }

      // Update profile timestamp
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', profileId)
        .eq('user_id', authUserId)
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
