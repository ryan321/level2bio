import { useParams } from 'react-router-dom'

export function PublicProfilePage() {
  const { token } = useParams<{ token: string }>()

  if (!token) {
    return <NotAvailable />
  }

  // TODO: Fetch profile by token
  return (
    <div className="min-h-screen p-8">
      <p className="text-gray-600">Loading profile...</p>
    </div>
  )
}

function NotAvailable() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Not Available</h1>
      <p className="text-gray-600 text-center max-w-md">
        This Level2.bio link is no longer available.
        The owner may have disabled or replaced it.
      </p>
    </div>
  )
}
