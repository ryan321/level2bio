// Input validation utilities

export const VALIDATION_LIMITS = {
  profileName: { min: 1, max: 100 },
  headline: { max: 200 },
  bio: { max: 2000 },
  storyTitle: { min: 1, max: 200 },
  storyResponse: { max: 10000 },
} as const

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
  for (const [key, value] of Object.entries(responses)) {
    const result = validateStoryResponse(value)
    if (!result.valid) {
      return { valid: false, error: `${key}: ${result.error}` }
    }
  }
  return { valid: true }
}
