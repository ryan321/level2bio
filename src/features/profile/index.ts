// Components
export { ShareLinkManager } from './components/ShareLinkManager'
export { ProfileManager } from './components/ProfileManager'

// Hooks - Legacy share links (deprecated, will be removed)
export { useShareLink, SHARE_LINK_QUERY_KEY } from './hooks/useShareLink'
export {
  useCreateShareLink,
  useToggleShareLink,
  useRegenerateShareLink,
} from './hooks/useShareLinkMutations'

// Hooks - Profiles (new model)
export {
  useProfiles,
  useProfile,
  PROFILES_QUERY_KEY,
  type ProfileWithStories,
} from './hooks/useProfiles'
export {
  useCreateProfile,
  useUpdateProfile,
  useToggleProfile,
  useRegenerateProfileToken,
  useDeleteProfile,
  useUpdateProfileStories,
  type CreateProfileInput,
  type UpdateProfileInput,
  type UpdateProfileStoriesInput,
} from './hooks/useProfileMutations'
export { usePublicProfile, type PublicProfile } from './hooks/usePublicProfile'
