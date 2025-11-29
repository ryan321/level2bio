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
- [ ] Architecture
- [ ] Implementation
- [ ] Verification
- [ ] Ship
