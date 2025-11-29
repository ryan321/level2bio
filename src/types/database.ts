// Database types - will be generated from Supabase CLI in production
// For now, manually defined based on our schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          linkedin_id: string
          email: string | null
          name: string
          headline: string | null
          bio: string | null
          profile_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          linkedin_id: string
          email?: string | null
          name: string
          headline?: string | null
          bio?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          linkedin_id?: string
          email?: string | null
          name?: string
          headline?: string | null
          bio?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      work_stories: {
        Row: {
          id: string
          user_id: string
          template_type: 'project' | 'role_highlight' | 'lessons_learned'
          title: string
          responses: Json
          video_url: string | null
          status: 'draft' | 'published'
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_type: 'project' | 'role_highlight' | 'lessons_learned'
          title: string
          responses?: Json
          video_url?: string | null
          status?: 'draft' | 'published'
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_type?: 'project' | 'role_highlight' | 'lessons_learned'
          title?: string
          responses?: Json
          video_url?: string | null
          status?: 'draft' | 'published'
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      share_links: {
        Row: {
          id: string
          user_id: string
          token: string
          is_active: boolean
          view_count: number
          last_viewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          is_active?: boolean
          view_count?: number
          last_viewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          is_active?: boolean
          view_count?: number
          last_viewed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type WorkStory = Database['public']['Tables']['work_stories']['Row']
export type WorkStoryInsert = Database['public']['Tables']['work_stories']['Insert']
export type WorkStoryUpdate = Database['public']['Tables']['work_stories']['Update']

export type ShareLink = Database['public']['Tables']['share_links']['Row']
export type ShareLinkInsert = Database['public']['Tables']['share_links']['Insert']
export type ShareLinkUpdate = Database['public']['Tables']['share_links']['Update']

// Story responses type (markdown per prompt)
export interface ProjectResponses {
  problem?: string
  approach?: string
  outcome?: string
  learnings?: string
}

export interface RoleHighlightResponses {
  role?: string
  impact?: string
  challenges?: string
}

export interface LessonsLearnedResponses {
  situation?: string
  lesson?: string
  application?: string
}

export type StoryResponses = ProjectResponses | RoleHighlightResponses | LessonsLearnedResponses
