# Constraints

> Hard limits and non-negotiables for Level2.bio

## Technical Constraints

### Platform

- **Web only** — No native iOS or Android apps for v1
- **Responsive** — Must work on mobile web (320px+) and desktop
- **Modern browsers** — Chrome, Firefox, Safari, Edge (last 2 versions)

### Technology Stack

- **Frontend**: React
- **Backend**: Supabase (Auth, Database, Storage)
- **Database**: PostgreSQL (via Supabase)
- **File Storage**: Supabase Storage (for videos and images)
- **Hosting**: TBD (Vercel, Netlify, or similar)

### Performance

- Viewer page loads in < 2 seconds on 3G connection
- Video playback starts within 1 second of click
- Dashboard interactions feel instant (< 200ms perceived)

### Security

- HTTPS only, no exceptions
- OAuth tokens stored securely (never in localStorage)
- Share tokens must be cryptographically unguessable (UUID v4 or similar)
- No sensitive data in URLs (except share tokens, which reveal nothing about identity)

## Business Constraints

### Timeline

- No fixed deadline — ship when ready
- Quality over speed

### Resources

- Solo developer
- Optimize for simplicity and maintainability
- Avoid over-engineering

### Legal/Compliance

- **GDPR compliance required**:
  - Users can request deletion of all their data
  - Clear consent before data collection
  - No data sold or shared with third parties
  - Privacy policy must be present
- **No invasive tracking** — No heatmaps, session recordings, or behavioral analytics
- **LinkedIn OAuth compliance** — Follow LinkedIn API terms of service

## Design Constraints

### User Experience

- **Privacy-first** — Default to private, never expose user data without explicit consent
- **No embarrassment** — Error states never reveal information that could reflect poorly on a candidate
- **Fail gracefully** — Always provide a path forward, never dead-ends
- **Mobile-friendly** — All core flows work on phone browsers

### Accessibility

- WCAG 2.1 AA compliance for core flows
- Keyboard navigable
- Screen reader compatible
- No autoplay video (explicit user action required)
- Text alternatives for all video content (story prompts serve this purpose)

### Privacy Principles

1. **Nothing is public** — No discovery, no feeds, no browsing profiles
2. **Candidate controls visibility** — They decide who sees their content
3. **Revocation is immediate** — Disabled links stop working instantly
4. **Neutral error messages** — Revoked links don't reveal that a profile ever existed
5. **No algorithmic judgment** — No scoring, ranking, or automated assessment

### Content Philosophy

- **Explaining, not exposing** — Help candidates describe impact without revealing confidential details
- **Guidance, not gatekeeping** — Templates help structure stories, not judge quality
- **Human judgment** — Hiring managers form their own opinions from candidate's own words

## Dependencies

### External Services

| Service | Purpose | Criticality |
|---------|---------|-------------|
| Supabase | Auth, database, storage | Critical |
| LinkedIn OAuth | User authentication | Critical |
| GitHub OAuth | Repo verification | Optional (v1.1+) |

### APIs

- **LinkedIn API**: OAuth 2.0 for authentication, basic profile data (name, headline, photo)
- **GitHub API**: OAuth for repo ownership verification (optional, future)

### Libraries

- Use established, well-maintained libraries
- Prefer libraries with good TypeScript support
- Avoid libraries with known security vulnerabilities
- Keep dependencies minimal to reduce attack surface

## Assumptions

> If these change, revisit related decisions.

- LinkedIn OAuth will remain available and stable
- Supabase free tier is sufficient for initial launch
- Video file sizes will be manageable with Supabase Storage limits
- Users have modern browsers (no IE11 support needed)
- Users prefer LinkedIn OAuth but email/password provides a fallback

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LinkedIn API changes or deprecation | Low | Medium | Email/password auth already available as backup |
| Video storage costs exceed budget | Medium | Medium | Implement file size limits, consider compression |
| Supabase outage | Low | High | Accept risk for v1; consider redundancy later |
| Share links get guessed/brute-forced | Very Low | High | Use 8-char alphanumeric tokens (~83 trillion combinations) |
| GDPR compliance missed | Low | High | Implement deletion flow before launch |

## Code Quality Standards

- Follow best practices for React and TypeScript
- Security-conscious coding (no XSS, injection vulnerabilities)
- Performance-conscious (no unnecessary re-renders, lazy load where appropriate)
- Keep it simple — avoid premature abstraction
- No over-engineering — build what's needed for v1, not hypothetical future features
