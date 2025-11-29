export const APP_NAME = 'Level2.bio'

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  STORY_EDITOR: '/stories/:id',
  STORY_NEW: '/stories/new',
  PUBLIC_PROFILE: '/p/:token',
} as const

export const TEMPLATE_TYPES = {
  PROJECT: 'project',
  ROLE_HIGHLIGHT: 'role_highlight',
  LESSONS_LEARNED: 'lessons_learned',
} as const

export const STORY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const
