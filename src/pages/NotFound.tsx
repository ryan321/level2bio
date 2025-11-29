import { Link } from 'react-router-dom'
import { ROUTES } from '../lib/constants'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to={ROUTES.HOME}
        className="text-blue-600 hover:underline"
      >
        Go home
      </Link>
    </div>
  )
}
