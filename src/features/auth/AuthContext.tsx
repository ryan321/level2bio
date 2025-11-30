import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
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

// Type guard for string values
const isString = (val: unknown): val is string => typeof val === 'string' && val.length > 0

// Helper: Extract user info from Supabase session with proper type validation
function sessionToAuthUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  const metadata = user.user_metadata || {}

  const getName = (): string => {
    if (isString(metadata.name)) return metadata.name
    if (isString(metadata.full_name)) return metadata.full_name
    return user.email?.split('@')[0] || 'User'
  }

  const getProfilePhoto = (): string | null => {
    if (isString(metadata.avatar_url)) return metadata.avatar_url
    if (isString(metadata.picture)) return metadata.picture
    return null
  }

  return {
    id: user.id,
    email: user.email ?? null,
    name: getName(),
    headline: isString(metadata.headline) ? metadata.headline : null,
    profilePhotoUrl: getProfilePhoto(),
  }
}

// Sanitize error messages to prevent information leakage
function getPublicErrorMessage(error: Error | { message: string }): string {
  const message = error.message.toLowerCase()

  // Prevent email enumeration
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email may already exist. Try signing in instead.'
  }
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'Invalid email or password'
  }
  if (message.includes('user not found')) {
    return 'Invalid email or password'
  }
  // Hide database errors
  if (message.includes('database') || message.includes('db') || message.includes('sql')) {
    return 'Something went wrong. Please try again.'
  }
  // Hide internal errors
  if (message.includes('internal') || message.includes('server')) {
    return 'Something went wrong. Please try again.'
  }

  return error.message
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
            logger.error('Failed to update user id', updateError)
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
        logger.error('Failed to create user record', insertError)
        return null
      }

      return newUser
    } catch (err) {
      logger.error('Error syncing user record', err)
      return null
    }
  }, [])

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)
  const isSyncingRef = useRef(false)

  // Subscribe to auth state changes
  useEffect(() => {
    isMountedRef.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) return

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const authUser = sessionToAuthUser(session.user)
          setAuthUser(authUser)

          // Prevent duplicate syncs using ref (persists across renders)
          if (isSyncingRef.current) return
          isSyncingRef.current = true

          // Defer DB operations to avoid blocking the auth state callback
          queueMicrotask(async () => {
            try {
              const userRecord = await syncUserRecord(authUser)
              if (isMountedRef.current) {
                setUser(userRecord)
                if (!userRecord) {
                  setError('Failed to load user profile. Please try again.')
                }
              }
            } catch (err) {
              if (isMountedRef.current) {
                setError('Failed to load user profile. Please try again.')
              }
            } finally {
              if (isMountedRef.current) {
                setIsLoading(false)
              }
              isSyncingRef.current = false
            }
          })
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null)
          setUser(null)
          setIsLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refresh succeeded - no action needed
        } else {
          setIsLoading(false)
        }
      }
    )

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [syncUserRecord])

  // Sign in with LinkedIn OAuth
  const signInWithLinkedIn = useCallback(async () => {
    setError(null)
    // Use hardcoded origin for security - prevents open redirect attacks
    const allowedOrigin = import.meta.env.VITE_APP_URL || window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${allowedOrigin}/dashboard`,
      },
    })
    if (error) {
      const publicMessage = getPublicErrorMessage(error)
      setError(publicMessage)
      throw new Error(publicMessage)
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
      const publicMessage = getPublicErrorMessage(error)
      setError(publicMessage)
      throw new Error(publicMessage)
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
      const publicMessage = getPublicErrorMessage(error)
      setError(publicMessage)
      throw new Error(publicMessage)
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      const publicMessage = getPublicErrorMessage(error)
      setError(publicMessage)
      throw new Error(publicMessage)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders in consumers
  const value = useMemo<AuthContextValue>(() => ({
    authUser,
    user,
    isLoading,
    error,
    signInWithLinkedIn,
    signUp,
    signIn,
    signOut,
  }), [authUser, user, isLoading, error, signInWithLinkedIn, signUp, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
