import { useState, useId } from 'react'
import { useAuth } from '../AuthContext'

// Password strength validation
const MIN_PASSWORD_LENGTH = 12
const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
}

function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { isValid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }
  }
  if (!PASSWORD_REQUIREMENTS.hasUppercase.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!PASSWORD_REQUIREMENTS.hasLowercase.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!PASSWORD_REQUIREMENTS.hasNumber.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }
  return { isValid: true, message: '' }
}

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

function LinkedInIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export function AuthForm() {
  const { signIn, signUp, signInWithLinkedIn, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)

  // Generate unique IDs for accessibility
  const errorId = useId()
  const passwordDescriptionId = useId()

  const handleLinkedInClick = async () => {
    setError(null)
    setIsLinkedInLoading(true)
    try {
      await signInWithLinkedIn()
    } catch {
      // Error is already set in context
      setIsLinkedInLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const trimmedEmail = email.trim()

      if (!trimmedEmail) {
        throw new Error('Email is required')
      }
      if (!validateEmail(trimmedEmail)) {
        throw new Error('Please enter a valid email address')
      }
      if (!password) {
        throw new Error('Password is required')
      }

      // Only validate password strength on sign up
      if (isSignUp) {
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.message)
        }
      }

      if (isSignUp) {
        await signUp(trimmedEmail, password)
      } else {
        await signIn(trimmedEmail, password)
      }
      // onAuthStateChange will handle the redirect via authUser state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  const displayError = error || authError
  const hasError = !!displayError

  return (
    <div className="w-full max-w-sm">
      {/* LinkedIn OAuth button */}
      <button
        onClick={handleLinkedInClick}
        disabled={isLinkedInLoading || isLoading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLinkedInLoading ? (
          'Connecting...'
        ) : (
          <>
            <LinkedInIcon />
            Continue with LinkedIn
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Email/Password form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-describedby={hasError ? errorId : undefined}
        noValidate
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
            aria-required="true"
            aria-invalid={hasError}
            autoComplete="email"
            disabled={isLoading || isLinkedInLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Your password'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
            aria-required="true"
            aria-invalid={hasError}
            aria-describedby={isSignUp ? passwordDescriptionId : undefined}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
            disabled={isLoading || isLinkedInLoading}
          />
          {isSignUp && (
            <p id={passwordDescriptionId} className="text-xs text-gray-500 mt-1">
              Must be at least {MIN_PASSWORD_LENGTH} characters with uppercase, lowercase, and numbers
            </p>
          )}
        </div>

        {displayError && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3"
          >
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isLinkedInLoading}
          aria-busy={isLoading}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        <p className="text-center text-gray-600 text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            className="text-blue-600 hover:underline font-medium"
            disabled={isLoading || isLinkedInLoading}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  )
}
