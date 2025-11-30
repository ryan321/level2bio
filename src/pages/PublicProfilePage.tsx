import { useParams } from 'react-router-dom'
import Markdown from 'react-markdown'
import { usePublicProfile } from '@/features/profile'
import { templates, type TemplateType } from '@/features/stories'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'
import type { WorkStory, StoryAsset } from '@/types'

export default function PublicProfilePage() {
  const { token } = useParams<{ token: string }>()
  const { data: publicProfile, isLoading, error } = usePublicProfile(token)

  if (!token) {
    return <NotAvailable />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    )
  }

  if (error || !publicProfile) {
    return <NotAvailable />
  }

  const { user, profile, stories } = publicProfile

  // Use profile overrides if present, otherwise fall back to user data
  const displayHeadline = profile.headline || user.headline
  const displayBio = profile.bio || user.bio

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            {user.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-semibold text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {displayHeadline && (
                <p className="text-gray-600">{displayHeadline}</p>
              )}
            </div>
          </div>
          {displayBio && (
            <p className="mt-4 text-gray-700">{displayBio}</p>
          )}
          <p className="mt-4 text-sm text-gray-500">
            {user.name.split(' ')[0]} has shared {stories.length === 1 ? 'this work story' : 'these work stories'} with you.
          </p>
        </div>
      </header>

      {/* Stories */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {stories.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No stories in this profile yet.
          </p>
        ) : (
          <div className="space-y-8">
            {stories.map((story) => (
              <StoryViewer key={story.id} story={story} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="max-w-3xl mx-auto px-6 text-center text-sm text-gray-500">
          Powered by{' '}
          <a
            href="/"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Level2.bio
          </a>
        </div>
      </footer>
    </div>
  )
}

function StoryViewer({ story }: { story: WorkStory }) {
  const template = templates[story.template_type as TemplateType]
  const responses = story.responses as Record<string, string>
  const assets = (story.assets as unknown as StoryAsset[]) || []

  return (
    <article className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {template?.name || story.template_type}
        </span>
        <h2 className="text-xl font-semibold mt-1">{story.title}</h2>
      </div>

      <div className="space-y-6">
        {template?.prompts.map((prompt) => {
          const response = responses[prompt.key]
          if (!response) return null

          return (
            <div key={prompt.key}>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {prompt.label}
              </h3>
              <div className="text-gray-600 prose prose-sm max-w-none">
                <Markdown>{response}</Markdown>
              </div>
            </div>
          )
        })}
      </div>

      {story.video_url && (
        <div className="mt-6">
          <VideoPlayer url={story.video_url} />
        </div>
      )}

      {assets.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Downloads</h3>
          <div className="space-y-2">
            {assets.map((asset) => (
              <AssetDownloadLink key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function AssetDownloadLink({ asset }: { asset: StoryAsset }) {
  const iconByType = {
    image: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    video: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    pdf: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  }

  return (
    <a
      href={asset.url}
      download={asset.name}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      <span className="text-gray-400">{iconByType[asset.type]}</span>
      <span className="truncate">{asset.name}</span>
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  )
}

function VideoPlayer({ url }: { url: string }) {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return null
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
      <iframe
        src={getYouTubeEmbedUrl(videoId)}
        title="Video walkthrough"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}

function NotAvailable() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Not Available</h1>
        <p className="text-gray-600">
          This Level2.bio link is no longer available.
          The owner may have disabled or replaced it.
        </p>
      </div>
    </div>
  )
}
