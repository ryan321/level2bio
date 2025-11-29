import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser, AuthService } from './services/authService'
import { getAuthService } from './services/authService'
import type { User } from '@/types'

interface AuthContextValue {
  // Current authenticated user (from OAuth)
  authUser: AuthUser | null
  // User record from our database
  user: User | null
  // Loading state
  isLoading: boolean
  // Error state
  error: string | null
  // Actions
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authService, setAuthService] = useState<AuthService | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth service
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const service = await getAuthService()
        if (mounted) {
          setAuthService(service)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize auth')
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // Subscribe to auth state changes
  useEffect(() => {
    if (!authService) return

    const unsubscribe = authService.onAuthStateChange(async (newAuthUser) => {
      setAuthUser(newAuthUser)

      if (newAuthUser) {
        try {
          const userRecord = await authService.getOrCreateUserRecord(newAuthUser)
          setUser(userRecord)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to get user record')
        }
      } else {
        setUser(null)
      }

      setIsLoading(false)
    })

    return unsubscribe
  }, [authService])

  const signIn = useCallback(async () => {
    if (!authService) return

    setError(null)
    try {
      await authService.signIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }, [authService])

  const signOut = useCallback(async () => {
    if (!authService) return

    setError(null)
    try {
      await authService.signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }, [authService])

  const value: AuthContextValue = {
    authUser,
    user,
    isLoading,
    error,
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
