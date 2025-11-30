# Findings & Bug Reports

## AUTH-001: Email/Password Auth Flow Hanging After Signup

**Date:** 2024-11-29

**Severity:** High - Complete auth flow failure

**Symptoms:**
- After successful email/password signup, user was redirected to dashboard
- Dashboard showed infinite loading spinner
- User record was never created in the `users` table
- Subsequent page refreshes continued showing the spinner

**Initial Investigation (Red Herrings):**
1. **RLS policies suspected** - Disabled RLS entirely, but issue persisted
2. **Column mismatch** - Previously had an `auth_id` column separate from `id`, suspected sync issues
3. **Query logic** - Added extensive logging, queries appeared correct but returned empty results

**Root Cause:**
Multiple interrelated issues:

1. **Supabase `onAuthStateChange` callback blocking:**
   - Calling Supabase database queries from within the `onAuthStateChange` callback caused the queries to hang indefinitely
   - The callback runs synchronously and Supabase client operations appeared to deadlock when called from within it
   - **Fix:** Defer database operations using `queueMicrotask()` to run them outside the callback context

2. **User ID mismatch between Supabase Auth and users table:**
   - When Supabase Auth users are deleted and recreated (e.g., during development/testing), they get new UUIDs
   - The `users` table still had records with old UUIDs, but the same email
   - Queries by `id` (the new auth UID) returned nothing, even though user existed by email
   - **Fix:** Added fallback logic to check by email and update the ID if mismatched:
     ```typescript
     // First check by id
     const { data: userById } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle()
     if (userById) return userById

     // Fallback: check by email and update id if found
     if (authUser.email) {
       const { data: userByEmail } = await supabase.from('users').select('*').eq('email', authUser.email).maybeSingle()
       if (userByEmail) {
         await supabase.from('users').update({ id: authUser.id }).eq('email', authUser.email)
         // ...
       }
     }
     ```

3. **Race conditions with duplicate sync attempts:**
   - Multiple `onAuthStateChange` events could fire in quick succession (INITIAL_SESSION + SIGNED_IN)
   - This caused duplicate `syncUserRecord` calls, sometimes with stale state
   - **Fix:** Added `useRef` flags to track sync state and prevent duplicate operations:
     ```typescript
     const isSyncingRef = useRef(false)
     // In callback:
     if (isSyncingRef.current) return
     isSyncingRef.current = true
     // ... after sync:
     isSyncingRef.current = false
     ```

**Why It Took Time to Debug:**
1. The hanging queries inside `onAuthStateChange` gave no error - they just never resolved
2. Console logs showed the queries were being made with correct parameters
3. Manual queries in Supabase dashboard worked fine
4. RLS being disabled didn't help, which ruled out the obvious suspect
5. The ID mismatch issue was masked by browser cookies persisting old auth state
6. Multiple issues compounded - fixing one revealed the next

**Schema Simplification:**
As part of the fix, removed the `auth_id` column entirely (migration `004_remove_auth_id.sql`). Now `users.id` directly equals `auth.uid()`, simplifying RLS policies:
```sql
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

**Lessons Learned:**
1. Never perform async Supabase operations directly inside `onAuthStateChange` - always defer them
2. During development, browser cookies and Supabase Auth state can persist across database resets
3. Test auth flows in private/incognito windows when debugging
4. Keep schema simple - having `id` match `auth.uid()` eliminates an entire class of sync bugs
5. Add logging that shows actual query results (not just "starting query...") to identify where things hang
