// Auth service abstraction
// Allows swapping between mock auth (dev) and real OAuth (prod)

import type { User } from '@/types'

export interface AuthUser {
  id: string
  email: string | null
  name: string
  headline: string | null
  profilePhotoUrl: string | null
}

export interface AuthService {
  // Get current session/user
  getCurrentUser(): Promise<AuthUser | null>

  // Sign in (redirects to OAuth provider or shows mock UI)
  signIn(): Promise<void>

  // Sign out
  signOut(): Promise<void>

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void

  // Get or create the user record in our users table
  getOrCreateUserRecord(authUser: AuthUser): Promise<User>
}

// Factory function to get the appropriate auth service
let authServiceInstance: AuthService | null = null

export async function getAuthService(): Promise<AuthService> {
  if (authServiceInstance) {
    return authServiceInstance
  }

  const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

  if (useMockAuth) {
    const { MockAuthService } = await import('./mockAuth')
    authServiceInstance = new MockAuthService()
  } else {
    const { LinkedInAuthService } = await import('./linkedinAuth')
    authServiceInstance = new LinkedInAuthService()
  }

  return authServiceInstance
}
