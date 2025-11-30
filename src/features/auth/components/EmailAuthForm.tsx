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

export function EmailAuthForm() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Generate unique IDs for accessibility
  const errorId = useId()
  const emailDescriptionId = useId()
  const passwordDescriptionId = useId()

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

  const hasError = !!error

  return (
    <div className="w-full max-w-sm">
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
            aria-describedby={emailDescriptionId}
            autoComplete="email"
          />
          <span id={emailDescriptionId} className="sr-only">
            Enter your email address
          </span>
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
            aria-describedby={passwordDescriptionId}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
          />
          {isSignUp && (
            <p id={passwordDescriptionId} className="text-xs text-gray-500 mt-1">
              Must be at least {MIN_PASSWORD_LENGTH} characters with uppercase, lowercase, and numbers
            </p>
          )}
          {!isSignUp && (
            <span id={passwordDescriptionId} className="sr-only">
              Enter your password
            </span>
          )}
        </div>

        {error && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  )
}
