// LinkedIn OAuth service using Supabase Auth
// Used in production when VITE_USE_MOCK_AUTH is false

import type { AuthService, AuthUser } from './authService'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'

export class LinkedInAuthService implements AuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Map Supabase user to our AuthUser type
    return {
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'User',
      headline: user.user_metadata?.headline ?? null,
      profilePhotoUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    }
  }

  async signIn(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      throw new Error(`LinkedIn sign in failed: ${error.message}`)
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`)
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email ?? null,
            name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? 'User',
            headline: session.user.user_metadata?.headline ?? null,
            profilePhotoUrl: session.user.user_metadata?.avatar_url ?? session.user.user_metadata?.picture ?? null,
          }
          callback(authUser)
        } else {
          callback(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }

  async getOrCreateUserRecord(authUser: AuthUser): Promise<User> {
    // Check if user already exists by auth_id
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (existingUser) {
      return existingUser
    }

    // Create new user record
    // Note: linkedin_id comes from the OAuth metadata
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        auth_id: authUser.id,
        linkedin_id: authUser.id, // Use auth_id as linkedin_id for now
        email: authUser.email,
        name: authUser.name,
        headline: authUser.headline,
        profile_photo_url: authUser.profilePhotoUrl,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return newUser
  }
}
