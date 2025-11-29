import { Navigate } from 'react-router-dom'
import { useAuth, LoginButton } from '@/features/auth'
import { ROUTES } from '@/lib/constants'

export default function Home() {
  const { authUser, isLoading } = useAuth()

  // If already logged in, redirect to dashboard
  if (!isLoading && authUser) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Level2.bio</h1>
      <p className="text-xl text-gray-600 mb-8 text-center max-w-md">
        Your resume's second layer — a private space to explain your work in depth.
      </p>
      <LoginButton className="bg-blue-600 text-white hover:bg-blue-700" />
    </div>
  )
}
