/**
 * Extracts YouTube video ID from various URL formats.
 * Supports:
 * - Standard URLs: youtube.com/watch?v=...
 * - Short URLs: youtu.be/...
 * - Embed URLs: youtube.com/embed/...
 *
 * @param url - YouTube URL
 * @returns Extracted video ID or null if invalid
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Validates if a string is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}

/**
 * Generates a YouTube embed URL from a video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}
