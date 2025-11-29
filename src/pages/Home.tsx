import { Link } from 'react-router-dom'
import { ROUTES } from '../lib/constants'

export function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Level2.bio</h1>
      <p className="text-xl text-gray-600 mb-8 text-center max-w-md">
        Your resume's second layer — a private space to explain your work in depth.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Get Started
      </Link>
    </div>
  )
}
