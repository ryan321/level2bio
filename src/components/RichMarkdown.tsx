import { memo, useMemo } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'

interface RichMarkdownProps {
  children: string
}

/** Allowed protocols for links (security: prevent javascript: URLs) */
const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:']

/** Allowed protocols for images */
const ALLOWED_IMAGE_PROTOCOLS = ['https:', 'http:', 'data:']

/**
 * Validates URL has an allowed protocol
 */
function isAllowedProtocol(url: string, allowedProtocols: string[]): boolean {
  try {
    const parsed = new URL(url, 'https://example.com') // base URL for relative paths
    return allowedProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Markdown renderer that embeds YouTube videos inline
 * Memoized for performance - only re-renders when children change
 */
export const RichMarkdown = memo(function RichMarkdown({ children }: RichMarkdownProps) {
  // Memoize components object to prevent unnecessary re-renders
  const components = useMemo<Components>(() => ({
    // Custom link renderer - embed YouTube videos when link text is "YouTube"
    a: ({ href, children: linkChildren }) => {
      if (href) {
        // Security: validate protocol
        if (!isAllowedProtocol(href, ALLOWED_LINK_PROTOCOLS)) {
          return <span>{linkChildren}</span>
        }

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
            try {
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
            } catch {
              // Invalid video ID, fall through to regular link
            }
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
    // Make images responsive with lazy loading and aspect-ratio for CLS prevention
    img: ({ src, alt }) => {
      // Security: validate image source protocol
      if (src && !isAllowedProtocol(src, ALLOWED_IMAGE_PROTOCOLS)) {
        return <span>[Invalid image source]</span>
      }
      return (
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          decoding="async"
          className="max-w-full h-auto rounded-lg my-4"
          style={{ aspectRatio: 'auto' }}
        />
      )
    },
  }), [])

  return (
    <Markdown components={components}>
      {children}
    </Markdown>
  )
})
