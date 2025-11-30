# Level2.bio

> Your resume's second layer — a private space to explain your work in depth and share it only when you choose.

## Quick Start

This project uses spec-first development. Code is generated from specifications, not written ad-hoc.

**Key commands:**
- `/interview-project` - Start a new project (run this first)
- `/implement` - Implement a feature from spec
- `/commit` - Review and commit changes
- `/audit` - Full project health check

## Documentation

All specs live in `/docs`. Consult before making changes:
- `docs/vision.md` - Why this exists, who it's for
- `docs/spec.md` - What it does (features, requirements)
- `docs/constraints.md` - Hard limits and non-negotiables
- `docs/architecture.md` - How it's structured

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Database**: PostgreSQL (via Supabase)
- **File Storage**: Supabase Storage (videos, images)
- **Auth**: LinkedIn OAuth (primary), GitHub OAuth (optional, for repo verification)
- **Hosting**: TBD (Vercel or similar)

## Conventions

### Code Style
- TypeScript for all code
- Functional components with hooks
- Keep components small and focused
- Colocate related files (component + styles + tests)

### Naming
- Components: PascalCase (`WorkStoryCard.tsx`)
- Utilities/hooks: camelCase (`useAuth.ts`)
- Constants: UPPER_SNAKE_CASE
- Database tables: snake_case

### Architecture Principles
- Keep it simple — no premature abstraction
- Security-first — validate inputs, sanitize outputs
- Performance-conscious — lazy load, minimize re-renders
- Privacy by default — nothing public unless explicitly shared

### Git
- Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- Small, focused commits
- PR descriptions reference the spec

## Current Phase

- [x] Discovery (vision, spec, constraints)
- [x] Architecture
- [x] Implementation (in progress)
- [ ] Verification
- [ ] Ship

### Implementation Progress

**Completed:**
- Project scaffolding (Vite + React + TypeScript)
- Database schema (users, work_stories, profiles, profile_stories)
- Supabase client setup with typed queries
- Authentication system (email/password + LinkedIn OAuth via Supabase Auth)
- Protected routes and auth context
- Marketing homepage with features grid
- Work Stories CRUD (create, edit, delete)
- Dashboard with story list and profile management
- Story templates (Project, Role Highlight, Lessons Learned)
- Auto-save for story editing
- Accessible dialog components (replaced native alert/confirm)
- Error boundary for graceful error handling
- Password strength validation
- **Curated Profiles** (create, edit, delete, toggle active/inactive)
- **Profile share links** (unique tokens, regeneration, copy to clipboard)
- **Profile expiration** (optional date/time, expired badge)
- **Public profile viewer** (clean design, avatar fallback, intro text)
- **View count analytics** (atomic increment, view count display)
- **Security hardening** (RLS policies, atomic view counting, CSP headers)
- **Performance optimization** (React.memo, database indexes, code splitting)
- **Code quality** (shared utilities for dates, YouTube, validation)
- **Component splitting** (ProfileManager split into smaller files)
- **Markdown rendering** (react-markdown with Tailwind Typography)
- **Asset uploads** (images, videos, PDFs via Supabase Storage)
- **Inline file uploads** (drag-drop, paste, attach button in editor)
- **YouTube embeds** (inline video embedding with `[YouTube](url)` syntax)
- **Editor preview pane** (side-by-side on desktop, stacked on mobile)
- **Toast notifications** (user-friendly error messages)
- **Formatting help popup** (markdown syntax, YouTube embeds, file uploads)
- **Security improvements** (file magic number validation, URL protocol validation, videoId validation)
- **Accessibility** (ARIA labels, proper form associations, keyboard navigation)

**Next up:**
- Story reordering within profiles
- Profile headline/bio overrides
