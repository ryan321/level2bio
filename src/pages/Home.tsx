import { Navigate } from 'react-router-dom'
import { useAuth, LoginButton, EmailAuthForm } from '@/features/auth'
import { ROUTES } from '@/lib/constants'

// Enable email auth (alternative to LinkedIn OAuth)
const emailAuthEnabled = import.meta.env.VITE_EMAIL_AUTH_ENABLED === 'true'

export default function Home() {
  const { authUser, isLoading } = useAuth()

  // If already logged in, redirect to dashboard
  if (!isLoading && authUser) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 md:py-32">
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-6 max-w-4xl">
          Your resume's second layer
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 text-center mb-8 max-w-2xl">
          A private space to explain the "why" and "how" behind your work.
          Share it only when you choose.
        </p>
        {emailAuthEnabled ? (
          <EmailAuthForm />
        ) : (
          <LoginButton className="bg-blue-600 text-white hover:bg-blue-700 text-lg" />
        )}
      </section>

      {/* Problem Section */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Your best work deserves more than a bullet point
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Resumes flatten your story</h3>
              <p className="text-gray-600">
                Complex, meaningful work gets compressed into one-line summaries that all look the same.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">7 seconds to make an impression</h3>
              <p className="text-gray-600">
                That's how long recruiters spend on your resume. No room for nuance or context.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Great candidates look average</h3>
              <p className="text-gray-600">
                Without brand-name companies or obvious keywords, strong talent gets overlooked.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Interviews barely scratch the surface</h3>
              <p className="text-gray-600">
                By the time you can explain your thinking, hours of everyone's time have been spent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need to stand out
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Structured storytelling meets privacy-first sharing.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Hero Feature - Work Stories */}
            <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-2xl">
              <div className="text-blue-200 text-sm font-medium mb-2">CORE FEATURE</div>
              <h3 className="text-2xl font-bold mb-3">Guided Work Stories</h3>
              <p className="text-blue-100 mb-6">
                Stop staring at a blank page. Our templates guide you through explaining
                what you did, why it mattered, and what you learned.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-sm">Project Deep-Dive</span>
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-sm">Role Highlight</span>
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-sm">Lessons Learned</span>
              </div>
            </div>

            {/* Private by Default */}
            <div className="bg-gray-900 text-white p-8 rounded-2xl">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Private by Default</h3>
              <p className="text-gray-400 text-sm">
                Nothing is public. Share via unique links you control. Revoke access anytime.
              </p>
            </div>

            {/* Minutes to Create */}
            <div className="bg-amber-50 p-8 rounded-2xl">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Minutes, Not Days</h3>
              <p className="text-gray-600 text-sm">
                Skip the portfolio rabbit hole. Go from blank page to shareable profile in one sitting.
              </p>
            </div>

            {/* Built for Hiring Managers */}
            <div className="md:col-span-2 bg-gray-100 p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Built for Skimming</h3>
                  <p className="text-gray-600 text-sm">
                    Hiring managers get the context they need in minutes. Clean layout,
                    clear sections, and optional video walkthroughs.
                  </p>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">2min</div>
                    <div className="text-xs text-gray-500">avg. read time</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">3x</div>
                    <div className="text-xs text-gray-500">more context</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why not just use...?
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center gap-4">
              <span className="font-semibold w-32 shrink-0">LinkedIn</span>
              <span className="text-gray-400 hidden md:block">→</span>
              <span className="text-gray-600">Too public, too shallow, too performative</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center gap-4">
              <span className="font-semibold w-32 shrink-0">Portfolio sites</span>
              <span className="text-gray-400 hidden md:block">→</span>
              <span className="text-gray-600">Too much effort to build and maintain</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center gap-4">
              <span className="font-semibold w-32 shrink-0">Loom videos</span>
              <span className="text-gray-400 hidden md:block">→</span>
              <span className="text-gray-600">Awkward, unstructured, no privacy controls</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center gap-4">
              <span className="font-semibold w-32 shrink-0">Notion pages</span>
              <span className="text-gray-400 hidden md:block">→</span>
              <span className="text-gray-600">Walls of text that hiring managers won't read</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to go beyond the bullet points?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create your first work story in minutes. Share it when you're ready.
          </p>
          <div className="flex justify-center">
            {emailAuthEnabled ? (
              <a
                href="#top"
                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started
              </a>
            ) : (
              <LoginButton className="bg-blue-600 text-white hover:bg-blue-700 text-lg" />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          Level2.bio — The missing layer between your resume and the interview.
        </div>
      </footer>
    </div>
  )
}
