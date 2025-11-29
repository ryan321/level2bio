// Mock auth service for development
// Provides instant login without needing real OAuth

import type { AuthService, AuthUser } from './authService'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'

const MOCK_USER_KEY = 'level2bio_mock_user'

// Default mock user for development
const DEFAULT_MOCK_USER: AuthUser = {
  id: 'mock-auth-id-12345',
  email: 'dev@level2.bio',
  name: 'Dev User',
  headline: 'Software Engineer',
  profilePhotoUrl: null,
}

export class MockAuthService implements AuthService {
  private listeners: Set<(user: AuthUser | null) => void> = new Set()
  private currentUser: AuthUser | null = null

  constructor() {
    // Restore user from localStorage on init
    const stored = localStorage.getItem(MOCK_USER_KEY)
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored)
      } catch {
        this.currentUser = null
      }
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser
  }

  async signIn(): Promise<void> {
    // In mock mode, just sign in as the default user immediately
    this.currentUser = DEFAULT_MOCK_USER
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(this.currentUser))
    this.notifyListeners()
  }

  async signOut(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem(MOCK_USER_KEY)
    this.notifyListeners()
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback)
    // Immediately call with current state
    callback(this.currentUser)
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  async getOrCreateUserRecord(authUser: AuthUser): Promise<User> {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (existingUser) {
      return existingUser
    }

    // Create new user record
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        auth_id: authUser.id,
        linkedin_id: `mock_${authUser.id}`, // Mock LinkedIn ID
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

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.currentUser))
  }
}
