# Specification

> Level2.bio — Your resume's second layer

## Overview

Level2.bio is a private, candidate-controlled space where job seekers can explain the "why" and "how" behind their work through structured stories and optional video. Candidates share a single private link with hiring managers, who get deeper context without needing an account.

## User Types

### Candidate (Primary)

- **Who**: Job seekers who want to stand out beyond their resume
- **Goals**: Create a compelling, private profile that explains their work in depth; control who sees it and when
- **Context**: During job searches, career transitions, or when asked for "more context" by recruiters

### Viewer (Secondary)

- **Who**: Hiring managers, recruiters, or anyone who receives a Level2 link
- **Goals**: Quickly understand a candidate's communication, reasoning, and impact before committing to an interview
- **Context**: Evaluating candidates before or after seeing their resume; deciding who to advance

## Features

### Core (Must Have for v1)

#### 1. Work Story Creation

- **Description**: A guided experience for candidates to explain a project or experience in depth, with structured prompts and optional video
- **User story**: As a candidate, I want to create a structured work story so that I can explain what I did, why it mattered, and what I learned.
- **Priority**: Must Have
- **Acceptance criteria**:
  - [x] Candidate can create a new work story from their dashboard
  - [x] Story includes guided prompts: problem, approach, outcome, learnings
  - [x] Candidate can write text responses to each prompt (with markdown formatting)
  - [x] Candidate can embed YouTube videos inline using `[YouTube](url)` syntax
  - [x] Candidate can upload images, videos, and PDFs (drag-drop, paste, or attach)
  - [x] Candidate can save drafts and return later (auto-save enabled)
  - [x] Candidate can edit stories
  - [x] All stories can be added to profiles for sharing
- **User flow**:
  1. Candidate clicks "Create Work Story"
  2. Selects a template (project, role highlight, or lessons learned)
  3. Fills in structured prompts with text
  4. Optionally uploads video
  5. Previews the story as a viewer would see it
  6. Publishes when ready
- **Error states**:
  - Video upload fails: Show "Upload failed — try again or skip for now"; allow saving without video
  - Session expires mid-edit: Auto-save drafts; restore on next login
- **Edge cases**:
  - Very long text responses: Allow but encourage conciseness via UI hints
  - No video: Story is still valid and shareable

#### 2. Curated Profiles

- **Description**: Candidates create curated profiles—collections of selected work stories tailored for specific audiences (e.g., "Backend Engineering", "Leadership Experience"). Each profile has its own shareable link.
- **User story**: As a candidate, I want to create multiple curated profiles so that I can tailor what I show to different audiences.
- **Priority**: Must Have
- **Acceptance criteria**:
  - [x] Candidate can create multiple profiles
  - [x] Each profile has a name (e.g., "Backend Focus", "Startup Role")
  - [x] Candidate selects which stories to include in each profile
  - [x] Stories can be reordered within a profile
  - [x] Same story can appear in multiple profiles
  - [x] Optional: Override headline/bio per profile
  - [x] Each profile has its own unique, unguessable share URL
  - [x] Candidate can toggle profile link on/off
  - [x] Candidate can regenerate a profile's link (old link stops working)
  - [x] Optional expiration date on profile links
  - [x] Dashboard shows all profiles with their links and view counts
- **User flow**:
  1. Candidate creates work stories
  2. Clicks "Create Profile"
  3. Names the profile (e.g., "Senior Backend Role")
  4. Selects which stories to include and orders them
  5. Optionally customizes headline/bio for this audience
  6. Gets shareable link
  7. Can create additional profiles for other audiences
- **Error states**:
  - Viewer opens revoked/expired link: Show "This Level2.bio link is no longer available. The owner may have disabled or replaced it."
  - Viewer opens malformed link: Show same neutral message (no distinction)
- **Edge cases**:
  - Profile with no stories: Show profile header but "No stories in this profile" message
  - All profiles deleted: Dashboard shows prompt to create first profile

#### 3. Viewer Experience

- **Description**: A clean, fast-loading page where hiring managers can view a candidate's profile and work stories
- **User story**: As a hiring manager, I want to quickly view a candidate's work stories so that I can understand their communication and reasoning before an interview.
- **Priority**: Must Have
- **Acceptance criteria**:
  - [x] Page loads quickly (< 2 seconds on reasonable connection)
  - [x] Clean, professional design that feels premium
  - [x] Shows candidate's basic info and headline at top
  - [x] Lists all work stories in the profile
  - [x] Each story is skimmable (text) with optional video
  - [x] Video plays on click (no autoplay)
  - [x] Works on mobile and desktop
  - [x] No login required
- **User flow**:
  1. Hiring manager receives link in email or application
  2. Clicks link, page loads immediately
  3. Sees candidate name, headline, intro
  4. Scrolls through work stories
  5. Optionally watches video for each story
  6. Forms opinion based on content
- **Error states**:
  - Video fails to load: Show "Tap to retry" or fallback to text-only view
  - Slow connection: Text loads first, video loads progressively
- **Edge cases**:
  - Device blocks autoplay: Show clear "Play video" button
  - Very long stories: Consider pagination or "read more" expansion

#### 4. Authentication

- **Description**: Candidates sign up and log in via email/password or LinkedIn OAuth
- **User story**: As a candidate, I want to sign up quickly so that I can get started creating my profile.
- **Priority**: Must Have
- **Acceptance criteria**:
  - [x] Candidate can sign up with email/password
  - [x] Candidate can sign up with LinkedIn OAuth
  - [x] Basic info (name, headline, profile photo) pre-filled from LinkedIn (when using OAuth)
  - [x] Password strength validation (12+ chars, mixed case, numbers)
  - [x] Session persists across browser restarts
  - [x] Candidate can log out
  - [x] Same-email accounts merge (OAuth and email/password can access same user)
  - [x] Combined auth form with both options visible
- **User flow**:
  1. Candidate lands on Level2.bio
  2. Clicks "Continue with LinkedIn" or enters email/password
  3. For LinkedIn: Authorizes on LinkedIn, redirected back with account created
  4. For email: Fills in form, creates account
  5. Sees dashboard (with pre-filled info for LinkedIn)
- **Error states**:
  - LinkedIn OAuth fails: Show "Something went wrong. Try again or contact support."
  - LinkedIn token expires: Prompt re-authentication
  - Invalid password: Show inline validation errors
- **Edge cases**:
  - Candidate uses LinkedIn then later tries email with same address: Accounts linked automatically
  - OAuth redirect URL manipulation: Validated against VITE_APP_URL

### Secondary (Should Have)

#### 5. Story Templates

- **Description**: Pre-built templates with different prompt structures for different story types
- **User story**: As a candidate, I want template options so that I can choose the right format for my story.
- **Priority**: Should Have
- **Acceptance criteria**:
  - [x] At least 3 templates: Project, Role Highlight, Lessons Learned
  - [x] Each template has role-appropriate prompts
  - ~~Candidate can switch templates while drafting~~ (removed from scope - templates are selected at creation time)
- **Templates**:
  - **Project**: What problem? What approach? What outcome? What learned?
  - **Role Highlight**: What was the role? What was your impact? What challenges did you overcome?
  - **Lessons Learned**: What happened? What did you learn? How did it change your approach?

#### 6. Profile Header

- **Description**: Basic info section at top of profile with name, headline, and optional short bio
- **User story**: As a candidate, I want a profile header so that viewers know who I am at a glance.
- **Priority**: Should Have
- **Acceptance criteria**:
  - [x] Shows name (from LinkedIn or editable)
  - [x] Shows headline (from LinkedIn or editable)
  - [x] Optional short bio (2-3 sentences)
  - [x] Optional profile photo (from LinkedIn or uploadable)

### Nice to Have (Could Have)

#### 7. Basic Analytics

- **Description**: Simple view count so candidates know if their link has been opened
- **User story**: As a candidate, I want to know if my link was viewed so that I can follow up appropriately.
- **Priority**: Could Have
- **Acceptance criteria**:
  - [x] Show total view count on dashboard
  - [x] Optionally show "last viewed" timestamp
  - [x] No invasive tracking (no identity, no session data)

#### 8. GitHub Authentication (for Repo Verification)

- **Description**: Optional GitHub OAuth to verify ownership of linked repositories
- **User story**: As a candidate, I want to verify I own a GitHub repo so that my claims are more credible.
- **Priority**: Could Have
- **Acceptance criteria**:
  - [ ] Candidate can connect GitHub account
  - [ ] Can link specific repos to work stories
  - [ ] Viewer sees "Verified owner" badge on linked repos

### Out of Scope (Won't Have)

- **Public profiles or discovery** — Privacy is core; no browsing other profiles
- **Job board or matching** — Not a marketplace
- **AI scoring or ranking** — No algorithmic judgment of candidates
- **Custom themes or drag-and-drop editing** — Not a portfolio builder
- **Comments, likes, or endorsements** — No social features
- **Recruiter accounts or dashboards** — Viewers don't need accounts in v1
- **Code hosting or analysis** — Not a GitHub alternative
- **Invasive analytics** — No heatmaps, session tracking, or behavioral data

## User Flows

### Flow 1: New Candidate Onboarding

**Trigger**: Candidate visits Level2.bio for the first time
**Actor**: Candidate
**Preconditions**: None
**Postconditions**: Account created, ready to create first story

1. Lands on homepage, sees value proposition
2. Clicks "Get Started" or "Sign up with LinkedIn"
3. Completes LinkedIn OAuth
4. Redirected to dashboard with pre-filled name/headline
5. Prompted to create first work story
6. Begins story creation flow

**Alternative paths**:
- Returning user: Goes directly to dashboard after OAuth

**Error paths**:
- OAuth fails: Show error, offer retry

### Flow 2: Creating a Work Story

**Trigger**: Candidate clicks "Create Work Story"
**Actor**: Candidate
**Preconditions**: Logged in
**Postconditions**: New story created (draft or published)

1. Selects template type
2. Sees structured prompts
3. Writes responses to each prompt
4. Optionally uploads video
5. Clicks "Preview" to see viewer experience
6. Clicks "Publish" when ready
7. Story appears on profile

**Alternative paths**:
- Save as draft: Can return later to finish
- Edit after publishing: Can update anytime

**Error paths**:
- Video upload fails: Option to retry or skip
- Session expires: Draft auto-saved, restored on login

### Flow 3: Sharing Profile

**Trigger**: Candidate wants to share their Level2 with someone
**Actor**: Candidate
**Preconditions**: At least one published story
**Postconditions**: Link copied, ready to share

1. Goes to dashboard
2. Clicks "Share" or sees share link section
3. Link is displayed (or prompted to activate)
4. Clicks "Copy link"
5. Pastes into resume, application, email, etc.

**Alternative paths**:
- Regenerate link: Old link stops working, new one issued

**Error paths**:
- No complete stories: Share button disabled with explanation

### Flow 4: Viewing a Profile (Hiring Manager)

**Trigger**: Hiring manager receives a Level2 link
**Actor**: Viewer (hiring manager, recruiter)
**Preconditions**: Valid, active link
**Postconditions**: Viewer has seen candidate's profile

1. Clicks link in email/application
2. Page loads quickly
3. Sees candidate header (name, headline)
4. Scrolls through work stories
5. Reads text summaries
6. Optionally plays videos
7. Forms impression, decides next steps

**Alternative paths**:
- Mobile view: Same content, responsive layout

**Error paths**:
- Link revoked: Neutral "not available" message
- Video won't load: Text content still visible

## Data Requirements

### User (Candidate)

- **Fields**: id, linkedin_id, email, name, headline, bio, profile_photo_url, created_at, updated_at
- **Constraints**: linkedin_id unique, email unique if provided
- **Relationships**: Has many WorkStories, has many Profiles

### WorkStory

- **Fields**: id, user_id, template_type, title, prompts_responses (JSON), video_url, status (draft/published), created_at, updated_at
- **Constraints**: user_id required, status required
- **Relationships**: Belongs to User, belongs to many Profiles (via ProfileStory)

### Profile

- **Fields**: id, user_id, name, headline (optional override), bio (optional override), share_token, is_active, expires_at (optional), view_count, last_viewed_at, created_at, updated_at
- **Constraints**: user_id required, share_token unique and unguessable
- **Relationships**: Belongs to User, has many WorkStories (via ProfileStory, ordered)

### ProfileStory (join table)

- **Fields**: id, profile_id, work_story_id, display_order
- **Constraints**: profile_id + work_story_id unique
- **Relationships**: Belongs to Profile, belongs to WorkStory

## Non-Functional Requirements

### Performance

- Viewer page loads in < 2 seconds on 3G connection
- Video starts playing within 1 second of click
- Dashboard actions feel instant (< 200ms perceived latency)

### Accessibility

- WCAG 2.1 AA compliance for core flows
- Keyboard navigable
- Screen reader compatible
- Video has text fallback (the story prompts serve this purpose)

### Privacy/Security

- All profile pages require valid share token
- Revoked tokens return no information about the profile
- GDPR compliant: users can delete their account and all data
- No data sold or shared with third parties
- HTTPS only
- OAuth tokens stored securely

### Compatibility

- Modern browsers: Chrome, Firefox, Safari, Edge (last 2 versions)
- Responsive: works on mobile (320px+) and desktop
- No native app required
