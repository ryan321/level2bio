import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

// Auth user from Supabase Auth (OAuth or email)
export interface AuthUser {
  id: string
  email: string | null
  name: string
  headline: string | null
  profilePhotoUrl: string | null
}

interface AuthContextValue {
  // Current authenticated user (from Supabase Auth)
  authUser: AuthUser | null
  // User record from our database
  user: User | null
  // Loading state
  isLoading: boolean
  // Error state
  error: string | null
  // Sign in with LinkedIn OAuth (production)
  signInWithLinkedIn: () => Promise<void>
  // Sign up with email and password
  signUp: (email: string, password: string) => Promise<void>
  // Sign in with email and password
  signIn: (email: string, password: string) => Promise<void>
  // Sign out
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

// Helper: Extract user info from Supabase session
function sessionToAuthUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    name: (user.user_metadata?.name as string) ??
          (user.user_metadata?.full_name as string) ??
          'User',
    headline: (user.user_metadata?.headline as string) ?? null,
    profilePhotoUrl: (user.user_metadata?.avatar_url as string) ??
                     (user.user_metadata?.picture as string) ?? null,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch or create user record in our database
  const syncUserRecord = useCallback(async (authUser: AuthUser): Promise<User | null> => {
    try {
      // First, check if user exists by id (the happy path)
      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (userById) {
        return userById
      }

      // Check if user exists by email (id mismatch from recreated auth user)
      if (authUser.email) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (userByEmail) {
          // Update the id to match current auth user
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ id: authUser.id })
            .eq('email', authUser.email)
            .select()
            .single()

          if (updateError) {
            console.error('Failed to update user id:', updateError)
            return userByEmail // Return existing user even if update failed
          }
          return updatedUser
        }
      }

      // Create new user record
      const defaultName = authUser.name !== 'User'
        ? authUser.name
        : authUser.email?.split('@')[0] || 'User'

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          linkedin_id: `auth_${authUser.id}`,
          email: authUser.email,
          name: defaultName,
          headline: authUser.headline,
          profile_photo_url: authUser.profilePhotoUrl,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create user record:', insertError)
        return null
      }

      return newUser
    } catch (err) {
      console.error('Error syncing user record:', err)
      return null
    }
  }, [])

  // Subscribe to auth state changes
  useEffect(() => {
    let isSyncing = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const authUser = sessionToAuthUser(session.user)
          setAuthUser(authUser)

          // Prevent duplicate syncs
          if (isSyncing) return
          isSyncing = true

          // Defer DB operations to avoid blocking the auth state callback
          setTimeout(async () => {
            const userRecord = await syncUserRecord(authUser)
            setUser(userRecord)
            setIsLoading(false)
            isSyncing = false
          }, 0)
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null)
          setUser(null)
          setIsLoading(false)
        } else {
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [syncUserRecord])

  // Sign in with LinkedIn OAuth
  const signInWithLinkedIn = useCallback(async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      throw error
    }
  }, [])

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string) => {
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      setError(error.message)
      throw error
    }
    // With email confirmation disabled, user is immediately signed in
    // onAuthStateChange will handle setting authUser
  }, [])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
      throw error
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
      throw error
    }
  }, [])

  const value: AuthContextValue = {
    authUser,
    user,
    isLoading,
    error,
    signInWithLinkedIn,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
