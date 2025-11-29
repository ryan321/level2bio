import { useAuth } from '@/features/auth'

export default function Dashboard() {
  const { user, authUser, signOut } = useAuth()

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {user?.name || authUser?.name || 'User'}
          </span>
          <button
            onClick={signOut}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <p className="text-gray-600">
        Your work stories will appear here.
      </p>
    </div>
  )
}
