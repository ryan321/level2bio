# Level2.bio

> Your resume's second layer — a private space to explain your work in depth and share it only when you choose.

## What is Level2.bio?

Level2.bio gives job seekers a private, structured way to tell the real story behind their work. Candidates create "work stories" that explain the *why* and *how* behind their experience, then share them via a single private link they control.

**For candidates**: Go deeper than bullet points. Explain your thinking, show your communication skills, and share things you couldn't put on LinkedIn — all privately.

**For hiring managers**: Get the context you wish you had before scheduling interviews. Understand a candidate's reasoning and impact in minutes, not hours.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd level2bio
   npm install
   ```

2. **Configure environment variables**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

   ```bash
   # Required: Get these from your Supabase project dashboard
   # (Settings > API)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

   # For local development, use mock auth (no real LinkedIn needed)
   VITE_USE_MOCK_AUTH=true
   ```

3. **Set up the database**

   In your Supabase dashboard, go to the SQL Editor and run the contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   Visit [http://localhost:5173](http://localhost:5173)

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Database**: PostgreSQL (via Supabase)
- **Auth**: LinkedIn OAuth (mock auth available for development)

## Project Status

- [x] Vision and product definition
- [x] Feature specification
- [x] Technical constraints
- [x] Architecture design
- [x] Implementation
- [x] Deployed to [level2.bio](https://level2.bio)

## Documentation

- [`docs/vision.md`](docs/vision.md) — Why this exists, who it's for
- [`docs/spec.md`](docs/spec.md) — Features, user flows, acceptance criteria
- [`docs/constraints.md`](docs/constraints.md) — Technical limits and privacy principles
- [`docs/architecture.md`](docs/architecture.md) — Technical architecture and decisions

## Development Workflow

This project uses spec-first development with Claude Code.

```bash
# Implement a feature from the spec
/implement [feature name]

# Review and commit changes
/commit

# Full project health check
/audit
```

## Claude Code Conversations

This entire project was built using [Claude Code](https://claude.com/claude-code). You can read the full conversation history to see how it was developed.

### Reading the Conversations

- **[User Prompts](docs/conversations/user-prompts.md)** — All user-typed messages in one document
- **[Detailed Conversations](docs/conversations/detailed/)** — Full conversations with tool calls and outputs

### Regenerating Conversation Exports

```bash
npx ts-node scripts/export-conversations.ts
```

### Token Usage

| Metric | Tokens |
|--------|--------|
| Input tokens | 264,150 |
| Output tokens | 488,474 |
| Cache creation | 8,451,138 |
| Cache read | 183,905,199 |
| **Total** | **~193 million** |

Estimated cost: ~$95 (based on Claude Sonnet pricing)

## License

TBD
