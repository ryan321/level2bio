# Architecture

> Technical architecture for Level2.bio

## Overview

Level2.bio is a React single-page application backed by Supabase (PostgreSQL, Auth, Storage). The frontend uses a feature-based folder structure with Tailwind CSS and shadcn/ui components. Authentication is handled via LinkedIn OAuth with a mock auth service for development and testing.

## Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│                     React SPA (Vite)                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │   Auth    │  │  Stories  │  │  Profile  │  │ Public View  │ │
│  │  Feature  │  │  Feature  │  │  Feature  │  │   Feature    │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
│        │              │              │               │          │
│        └──────────────┴──────────────┴───────────────┘          │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │   Shared Layer    │                        │
│                    │ (hooks, utils,    │                        │
│                    │  components, lib) │                        │
│                    └─────────┬─────────┘                        │
├──────────────────────────────┼──────────────────────────────────┤
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │  Supabase Client  │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  Database   │  │        Storage          │  │
│  │ (LinkedIn   │  │ (PostgreSQL)│  │  (Videos, Images)       │  │
│  │   OAuth)    │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Auth Feature
- **Purpose**: Handle user authentication (LinkedIn OAuth, session management)
- **Contains**: Login page, auth hooks, auth context, mock auth service
- **Depends on**: Supabase Auth, shared lib
- **Used by**: All protected routes

### Stories Feature
- **Purpose**: Create, edit, and manage work stories
- **Contains**: Story editor, story list, template selector, video upload
- **Depends on**: Auth, Supabase Database/Storage, shared components
- **Used by**: Dashboard

### Profile Feature
- **Purpose**: Manage user profile and share settings
- **Contains**: Profile editor, share link management, analytics display
- **Depends on**: Auth, Supabase Database
- **Used by**: Dashboard

### Public View Feature
- **Purpose**: Display candidate profile to viewers (hiring managers)
- **Contains**: Public profile page, story viewer, video player
- **Depends on**: Supabase Database (read-only, no auth required)
- **Used by**: Anyone with a valid share link

### Shared Layer
- **Purpose**: Reusable code across features
- **Contains**: UI components, hooks, utilities, types, Supabase client
- **Depends on**: External libraries only
- **Used by**: All features

## Key Decisions

### Feature-based folder structure
- **Status**: Accepted
- **Context**: Need an organization pattern that's maintainable solo and AI-friendly
- **Decision**: Organize by feature (auth, stories, profile, public) rather than by type (components, hooks, utils)
- **Alternatives considered**:
  - Type-based folders: Rejected—leads to jumping between folders for related code
  - Flat structure: Rejected—doesn't scale even to modest size
- **Consequences**: Related code stays together; easy to find everything for a feature

### Markdown for rich text
- **Status**: Accepted
- **Context**: Work story responses need formatting (bold, lists, headers)
- **Decision**: Store each prompt response as markdown string in JSONB
- **Alternatives considered**:
  - Block-based editor (Notion-style): Rejected—overkill for v1
  - Single freeform field: Rejected—loses guided template structure
- **Consequences**: Simple to implement, render, and migrate later if needed

### Mock auth for development
- **Status**: Accepted
- **Context**: LinkedIn OAuth has no test accounts; need to develop and test without real OAuth
- **Decision**: Create auth abstraction with mock implementation toggled by environment variable
- **Alternatives considered**:
  - Always use real OAuth: Rejected—painful for dev, impossible for CI
  - Email/password for dev only: Rejected—different code paths
- **Consequences**: Can develop offline; automated tests are simple; same code path in dev and prod

### Tailwind + shadcn/ui
- **Status**: Accepted
- **Context**: Need styling solution that's fast to build, easy to theme, AI-friendly
- **Decision**: Use Tailwind CSS with shadcn/ui components
- **Alternatives considered**:
  - CSS Modules: Rejected—more files, slower to iterate
  - Styled-components: Rejected—runtime overhead, less AI-friendly
- **Consequences**: Fast development; easy to swap themes; components live in our repo

### No Redux, simple state
- **Status**: Accepted
- **Context**: Need state management that's simple and AI-friendly
- **Decision**: Use React Query (TanStack Query) for server state, useState/useContext for UI state
- **Alternatives considered**:
  - Redux: Rejected—too much boilerplate for this scale
  - Zustand: Considered—would use if context gets unwieldy
- **Consequences**: Less code, simpler mental model, easy to understand

## Data Architecture

### Models

| Model | Purpose | Key Fields | Relationships |
|-------|---------|------------|---------------|
| User | Candidate account | id, linkedin_id, email, name, headline, bio, profile_photo_url | Has many WorkStories, has many Profiles |
| WorkStory | A single work story | id, user_id, template_type, title, responses (JSONB/markdown), video_url, status | Belongs to User, belongs to many Profiles |
| Profile | Curated collection of stories | id, user_id, name, headline, bio, share_token, is_active, expires_at, view_count | Belongs to User, has many WorkStories |
| ProfileStory | Join table for Profile-Story | id, profile_id, work_story_id, display_order | Belongs to Profile, belongs to WorkStory |

### Database Schema

```sql
-- users
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,  -- links to Supabase auth.users
  linkedin_id text unique not null,
  email text unique,
  name text not null,
  headline text,
  bio text,
  profile_photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- work_stories (no status column - all stories can be added to profiles)
create table work_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  template_type text not null check (template_type in ('project', 'role_highlight', 'lessons_learned')),
  title text not null,
  responses jsonb not null default '{}',
  video_url text,
  display_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- profiles (curated collections of stories for sharing)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  headline text,  -- optional override of user's headline
  bio text,       -- optional override of user's bio
  share_token text unique not null,
  is_active boolean default true,
  expires_at timestamptz,  -- optional expiration
  view_count int default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- profile_stories (join table: which stories in which profiles, with ordering)
create table profile_stories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  work_story_id uuid references work_stories(id) on delete cascade not null,
  display_order int not null default 0,
  unique(profile_id, work_story_id)
);

-- RPC function for atomic view count increment
create function increment_profile_view(p_share_token text)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set view_count = view_count + 1, last_viewed_at = now()
  where share_token = p_share_token
    and is_active = true
    and (expires_at is null or expires_at > now());
end;
$$;

-- indexes
create index work_stories_user_id_idx on work_stories(user_id);
create index work_stories_user_id_display_order_idx on work_stories(user_id, display_order);
create index profiles_user_id_idx on profiles(user_id);
create index profiles_share_token_idx on profiles(share_token);
create index profile_stories_profile_id_idx on profile_stories(profile_id);
create index profile_stories_display_order_idx on profile_stories(profile_id, display_order);
```

### Persistence
- **Storage**: Supabase PostgreSQL for structured data
- **Files**: Supabase Storage for videos and profile photos
- **Caching**: React Query handles client-side caching
- **Migration**: Supabase migrations for schema changes

### Data Flow

```
User Action → React Component → React Query mutation → Supabase Client → Database
                                                                            │
Database → Supabase Client → React Query cache → React Component → UI      ◄┘
```

## Error Handling Strategy

### Error Types
- **Validation errors**: Inline, next to the field that failed
- **Network errors**: Toast notification with retry option
- **Auth errors**: Redirect to login with message
- **Not found (revoked links)**: Neutral "not available" page

### User Feedback
- Toasts for transient errors (network failures, unexpected errors)
- Inline messages for form validation
- Full-page states for critical errors (auth required, link not found)

### Logging
- Console logging in development
- Consider Sentry or similar for production (v1.1)

## Testing Strategy

### Unit Tests
- **Scope**: Utility functions, data transformations
- **Location**: Colocated (`*.test.ts` next to source)
- **Tooling**: Vitest

### Integration Tests
- **Scope**: React components with mocked Supabase
- **Location**: Colocated (`*.test.tsx` next to source)
- **Tooling**: Vitest + React Testing Library

### Functional Tests (later in v1)
- **Scope**: Critical user flows (auth, create story, share link)
- **Location**: `/tests/e2e/`
- **Tooling**: Playwright

### Coverage Goals
- Pragmatic: test critical paths, don't chase percentages
- Must test: auth flow, story CRUD, share link generation/revocation

## File Structure

```
level2bio/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── LoginButton.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   ├── authService.ts      # Auth abstraction
│   │   │   │   ├── linkedinAuth.ts     # Real LinkedIn OAuth
│   │   │   │   └── mockAuth.ts         # Mock for dev/test
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── stories/
│   │   │   ├── components/
│   │   │   │   ├── StoryEditor.tsx
│   │   │   │   ├── StoryList.tsx
│   │   │   │   ├── StoryCard.tsx
│   │   │   │   ├── TemplateSelector.tsx
│   │   │   │   └── VideoUpload.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useStories.ts
│   │   │   │   └── useStoryMutations.ts
│   │   │   └── templates.ts            # Template definitions
│   │   │
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   │   ├── ProfileManager.tsx      # Main orchestrator
│   │   │   │   ├── ProfileCard.tsx         # Individual profile display
│   │   │   │   ├── CreateProfileForm.tsx   # Profile creation form
│   │   │   │   └── ShareLinkManager.tsx
│   │   │   └── hooks/
│   │   │       ├── useProfiles.ts
│   │   │       ├── useProfileMutations.ts
│   │   │       └── usePublicProfile.ts
│   │   │
│   │   └── public-view/
│   │       ├── components/
│   │       │   ├── PublicProfile.tsx
│   │       │   ├── StoryViewer.tsx
│   │       │   └── VideoPlayer.tsx
│   │       └── hooks/
│   │           └── usePublicProfile.ts
│   │
│   ├── components/                     # Shared UI components
│   │   └── ui/                         # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ...
│   │
│   ├── hooks/                          # Shared hooks
│   │   └── useToast.ts
│   │
│   ├── lib/                            # Shared utilities
│   │   ├── supabase.ts                 # Supabase client
│   │   ├── utils.ts                    # General utilities
│   │   ├── constants.ts
│   │   ├── dateUtils.ts                # Date formatting utilities
│   │   ├── youtube.ts                  # YouTube URL parsing
│   │   └── validation.ts               # Input validation utilities
│   │
│   ├── types/                          # TypeScript types
│   │   ├── database.ts                 # Generated from Supabase
│   │   └── index.ts
│   │
│   ├── pages/                          # Route pages
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── StoryEditorPage.tsx
│   │   ├── PublicProfilePage.tsx
│   │   └── NotFound.tsx
│   │
│   ├── App.tsx                         # Root component + routing
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Global styles + Tailwind
│
├── tests/
│   └── e2e/                            # Playwright tests (later)
│       └── auth.spec.ts
│
├── supabase/
│   ├── migrations/                     # Database migrations
│   │   └── 001_initial_schema.sql
│   └── config.toml
│
├── public/
│   └── ...
│
├── .env.example
├── .env.local                          # Local env (gitignored)
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Dependencies

### External Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| react | UI framework | |
| react-router-dom | Routing | |
| @tanstack/react-query | Server state management | |
| @supabase/supabase-js | Supabase client | |
| tailwindcss | Styling | |
| @radix-ui/* | Accessible primitives (via shadcn/ui) | |
| react-markdown | Render markdown content | |
| clsx + tailwind-merge | Class name utilities | |
| vite | Build tool | |
| typescript | Type safety | |
| vitest | Testing | |
| @testing-library/react | Component testing | |
| playwright | E2E testing (later) | |

## Security Architecture

- **Authentication**: Supabase Auth with LinkedIn OAuth provider
- **Authorization**: Row Level Security (RLS) policies in Supabase
  - Users can only read/write their own data
  - Public profiles readable via share token (no auth)
- **Data protection**:
  - OAuth tokens managed by Supabase (not stored in app)
  - Share tokens are UUID v4 (unguessable)
  - HTTPS only
- **Privacy**:
  - Revoked links return neutral message (no info leak)
  - No tracking beyond simple view count

## Performance Considerations

- **Initial load**: Code-split by route (React lazy loading)
- **Videos**: Stream from Supabase Storage, don't load until played
- **Images**: Use appropriate sizes, lazy load below fold
- **Queries**: React Query caching prevents redundant fetches
- **No premature optimization**: Measure first if issues arise
