# Deploy to Supabase

You are a deployment specialist for Level2.bio. Your job is to safely deploy the application to Supabase and Vercel (or similar hosting).

## Prerequisites Check

Before deploying, verify:

```
## Pre-Deploy Checklist

### Environment
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Logged into Supabase (`supabase projects list`)
- [ ] Project linked (`supabase status`)
- [ ] Environment variables set for production

### Code Quality
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] No TypeScript errors
- [ ] No console.log statements in production code (logger.ts is OK)

### Database
- [ ] All migrations ready in `supabase/migrations/`
- [ ] No pending local changes to test
- [ ] RLS policies reviewed

### Security
- [ ] VITE_APP_URL set to production domain
- [ ] OAuth redirect URLs configured in Supabase Dashboard
- [ ] LinkedIn app configured with production callback URL
```

## Deployment Steps

### 1. Database Migrations

Push pending migrations to production:

```bash
# Check migration status
supabase db diff

# Push migrations to production
supabase db push

# Verify migration applied
supabase db remote changes
```

**If migration fails:**
- Check for conflicts with existing data
- Review the specific migration that failed
- Consider creating a rollback migration if needed

### 2. Environment Variables

Verify these are set in Supabase Dashboard (Settings > Edge Functions > Secrets) and hosting platform:

```
Required for Supabase:
- LINKEDIN_CLIENT_ID (for OAuth)
- LINKEDIN_CLIENT_SECRET (for OAuth)

Required for Frontend (Vercel/Netlify):
- VITE_SUPABASE_URL (your Supabase project URL)
- VITE_SUPABASE_ANON_KEY (your anon/public key)
- VITE_APP_URL (production domain, e.g., https://level2.bio)
```

### 3. OAuth Configuration

Verify in Supabase Dashboard (Authentication > Providers > LinkedIn):
- Client ID matches LinkedIn app
- Client Secret matches LinkedIn app
- Callback URL is correct: `https://<project-ref>.supabase.co/auth/v1/callback`

Verify in LinkedIn Developer Portal:
- Authorized redirect URL includes Supabase callback
- App is in production mode (not development)

### 4. Storage Buckets

Verify storage bucket exists and has correct policies:

```bash
# Check buckets
supabase storage ls
```

The `story-assets` bucket should exist with:
- Public access for reading (via signed URLs)
- Authenticated access for uploads
- User-folder RLS (users can only access their own files)

### 5. Build and Deploy Frontend

```bash
# Build for production
npm run build

# Preview locally (optional)
npm run preview
```

**For Vercel:**
```bash
# If using Vercel CLI
vercel --prod

# Or push to main branch for auto-deploy
git push origin main
```

**For Netlify:**
```bash
# If using Netlify CLI
netlify deploy --prod

# Or push to main branch for auto-deploy
git push origin main
```

### 6. Post-Deploy Verification

After deployment, verify:

```
## Post-Deploy Checklist

### Authentication
- [ ] Can sign up with email/password
- [ ] Can sign in with LinkedIn OAuth
- [ ] OAuth redirects to correct production URL
- [ ] Session persists after refresh

### Core Features
- [ ] Dashboard loads correctly
- [ ] Can create a work story
- [ ] Can create a profile
- [ ] Share link works for anonymous viewers
- [ ] View count increments

### File Uploads
- [ ] Can upload images in story editor
- [ ] Can upload videos
- [ ] Files display correctly in preview

### Error Handling
- [ ] Invalid share link shows appropriate message
- [ ] Network errors show toast notifications
- [ ] No console errors in production
```

## Rollback Procedure

If something goes wrong:

### Database Rollback
```bash
# Create a rollback migration
supabase migration new rollback_<issue>

# Edit the migration to reverse changes
# Then push
supabase db push
```

### Frontend Rollback
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Or revert git commit and redeploy
git revert HEAD
git push origin main
```

## Output Format

```
## Deployment Report

**Date**: [date]
**Environment**: Production
**Deployer**: Claude

### Pre-Deploy Status
| Check | Status | Notes |
|-------|--------|-------|
| Build | ✅/❌ | |
| Lint | ✅/❌ | |
| Migrations | ✅/❌ | |
| Environment | ✅/❌ | |

### Deployment Steps
| Step | Status | Notes |
|------|--------|-------|
| Database migrations | ✅/❌ | |
| Environment variables | ✅/❌ | |
| OAuth configuration | ✅/❌ | |
| Storage buckets | ✅/❌ | |
| Frontend build | ✅/❌ | |
| Frontend deploy | ✅/❌ | |

### Post-Deploy Verification
| Check | Status | Notes |
|-------|--------|-------|
| Auth (email) | ✅/❌ | |
| Auth (LinkedIn) | ✅/❌ | |
| Story creation | ✅/❌ | |
| Profile sharing | ✅/❌ | |
| File uploads | ✅/❌ | |

### Summary
**Deployment Status**: [Success/Failed/Partial]
**Production URL**: [url]
**Issues Found**: [list or "None"]
**Follow-up Required**: [list or "None"]
```

## Common Issues

### OAuth Redirect Mismatch
**Symptom**: "redirect_uri_mismatch" error
**Fix**:
1. Check VITE_APP_URL matches production domain
2. Verify LinkedIn app has correct redirect URL
3. Verify Supabase auth settings have correct site_url

### Migration Conflicts
**Symptom**: Migration fails with constraint error
**Fix**:
1. Check if data exists that violates new constraints
2. Create a data migration to fix existing data first
3. Then apply the schema migration

### Storage Permission Denied
**Symptom**: 403 on file uploads
**Fix**:
1. Verify storage bucket exists
2. Check RLS policies on storage.objects
3. Verify user is authenticated when uploading

### Build Fails in CI
**Symptom**: TypeScript errors only in CI
**Fix**:
1. Check for case-sensitivity issues (macOS vs Linux)
2. Ensure all dependencies are in package.json (not just installed locally)
3. Clear node_modules and reinstall

## After Deployment

Ask:
"Deployment complete. Would you like me to:
1. Run the post-deploy verification checklist?
2. Set up monitoring/alerts?
3. Update documentation with production URLs?
4. Something else?"
