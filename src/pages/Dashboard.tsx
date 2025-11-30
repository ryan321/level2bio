import { memo, useMemo } from 'react'
import { useAuth } from '@/features/auth'
import { StoryList, useStories } from '@/features/stories'
import { ProfileManager } from '@/features/profile'

export default memo(function Dashboard() {
  const { user, authUser, signOut } = useAuth()
  const { data: stories } = useStories(user?.id)

  const allStories = useMemo(() => stories ?? [], [stories])
  const displayName = useMemo(
    () => user?.name || authUser?.name || 'User',
    [user?.name, authUser?.name]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{displayName}</span>
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {user && (
          <div className="space-y-8">
            <ProfileManager userId={user.id} stories={allStories} />
            <StoryList userId={user.id} />
          </div>
        )}
      </div>
    </div>
  )
})
