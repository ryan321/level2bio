// Input validation utilities

export const VALIDATION_LIMITS = {
  profileName: { min: 1, max: 100 },
  headline: { max: 200 },
  bio: { max: 2000 },
  storyTitle: { min: 1, max: 200 },
  storyResponse: { max: 10000 },
  // Array and count limits (match database constraints)
  maxAssetsPerStory: 50,
  maxStoriesPerProfile: 100,
  maxProfilesPerUser: 50,
  maxStoriesPerUser: 500,
  maxResponseFieldsPerStory: 20,
  // Other limits
  emailMaxLength: 320, // RFC 5321
  shareTokenLength: 16,
} as const

// Regex patterns
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9]{16}$/

/**
 * Remove dangerous characters from text input
 * - Null bytes (can cause truncation in some systems)
 * - Zero-width characters (can hide malicious content)
 */
export function sanitizeTextInput(input: string): string {
  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateProfileName(name: string): ValidationResult {
  const trimmed = name.trim()

  if (trimmed.length < VALIDATION_LIMITS.profileName.min) {
    return { valid: false, error: 'Profile name is required' }
  }

  if (trimmed.length > VALIDATION_LIMITS.profileName.max) {
    return {
      valid: false,
      error: `Profile name must be ${VALIDATION_LIMITS.profileName.max} characters or less`
    }
  }

  return { valid: true }
}

export function validateHeadline(headline: string | undefined | null): ValidationResult {
  if (!headline) return { valid: true }

  if (headline.length > VALIDATION_LIMITS.headline.max) {
    return {
      valid: false,
      error: `Headline must be ${VALIDATION_LIMITS.headline.max} characters or less`
    }
  }

  return { valid: true }
}

export function validateBio(bio: string | undefined | null): ValidationResult {
  if (!bio) return { valid: true }

  if (bio.length > VALIDATION_LIMITS.bio.max) {
    return {
      valid: false,
      error: `Bio must be ${VALIDATION_LIMITS.bio.max} characters or less`
    }
  }

  return { valid: true }
}

export function validateStoryTitle(title: string): ValidationResult {
  const trimmed = title.trim()

  if (trimmed.length < VALIDATION_LIMITS.storyTitle.min) {
    return { valid: false, error: 'Story title is required' }
  }

  if (trimmed.length > VALIDATION_LIMITS.storyTitle.max) {
    return {
      valid: false,
      error: `Story title must be ${VALIDATION_LIMITS.storyTitle.max} characters or less`
    }
  }

  return { valid: true }
}

export function validateStoryResponse(response: string | undefined | null): ValidationResult {
  if (!response) return { valid: true }

  if (response.length > VALIDATION_LIMITS.storyResponse.max) {
    return {
      valid: false,
      error: `Response must be ${VALIDATION_LIMITS.storyResponse.max} characters or less`
    }
  }

  return { valid: true }
}

export function validateStoryResponses(
  responses: Record<string, string>
): ValidationResult {
  const keys = Object.keys(responses)

  // Check number of response fields
  if (keys.length > VALIDATION_LIMITS.maxResponseFieldsPerStory) {
    return {
      valid: false,
      error: `Too many response fields. Maximum ${VALIDATION_LIMITS.maxResponseFieldsPerStory} allowed.`
    }
  }

  for (const [key, value] of Object.entries(responses)) {
    const result = validateStoryResponse(value)
    if (!result.valid) {
      return { valid: false, error: `${key}: ${result.error}` }
    }
  }
  return { valid: true }
}

/**
 * Validate share token format (16 alphanumeric characters)
 */
export function validateShareToken(token: string | undefined): ValidationResult {
  if (!token) {
    return { valid: false, error: 'Token is required' }
  }

  // Sanity check for excessively long tokens (DoS prevention)
  if (token.length > 100) {
    return { valid: false, error: 'Invalid token format' }
  }

  if (!SHARE_TOKEN_PATTERN.test(token)) {
    return { valid: false, error: 'Invalid token format' }
  }

  return { valid: true }
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): ValidationResult {
  if (!id) {
    return { valid: false, error: 'ID is required' }
  }

  if (!UUID_PATTERN.test(id)) {
    return { valid: false, error: 'Invalid ID format' }
  }

  return { valid: true }
}

/**
 * Validate array of UUIDs (e.g., story IDs)
 */
export function validateUUIDArray(ids: string[], maxLength: number): ValidationResult {
  if (!Array.isArray(ids)) {
    return { valid: false, error: 'Expected an array' }
  }

  if (ids.length > maxLength) {
    return { valid: false, error: `Too many items. Maximum ${maxLength} allowed.` }
  }

  for (const id of ids) {
    const result = validateUUID(id)
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}

/**
 * Validate email format and length
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }

  if (email.length > VALIDATION_LIMITS.emailMaxLength) {
    return { valid: false, error: 'Email address is too long' }
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  return { valid: true }
}

/**
 * Sanitize user name from OAuth providers
 * Removes HTML-like characters that could be used for XSS
 */
export function sanitizeUserName(name: string): string {
  return sanitizeTextInput(name)
    .replace(/[<>"']/g, '') // Remove HTML-like characters
    .trim()
    .slice(0, 100) // Enforce max length
}
