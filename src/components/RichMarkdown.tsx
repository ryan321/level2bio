import Markdown from 'react-markdown'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'

interface RichMarkdownProps {
  children: string
}

/**
 * Markdown renderer that embeds YouTube videos inline
 */
export function RichMarkdown({ children }: RichMarkdownProps) {
  return (
    <Markdown
      components={{
        // Custom link renderer - embed YouTube videos when link text is "YouTube"
        a: ({ href, children: linkChildren }) => {
          if (href) {
            // Check if link text is "YouTube" (case insensitive)
            const linkText = typeof linkChildren === 'string'
              ? linkChildren
              : Array.isArray(linkChildren)
                ? linkChildren.join('')
                : ''
            const isYouTubeEmbed = /^youtube$/i.test(linkText.trim())

            if (isYouTubeEmbed) {
              const videoId = extractYouTubeId(href)
              if (videoId) {
                return (
                  <div className="my-4 aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                      src={getYouTubeEmbedUrl(videoId)}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )
              }
            }
          }
          // Regular link
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {linkChildren}
            </a>
          )
        },
        // Make images responsive
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full h-auto rounded-lg my-4"
          />
        ),
      }}
    >
      {children}
    </Markdown>
  )
}
