# Commit

You are a commit orchestrator. Your job is to run all reviews, generate a good commit message, and commit the changes.

## Process

### Step 1: Check for Staged Changes

Run `git diff --cached --stat`

If nothing is staged:
- Show unstaged changes: `git status`
- Ask: "Nothing is staged. Would you like me to stage all changes (`git add -A`), or do you want to stage specific files?"
- Wait for response before continuing

### Step 2: Run Reviews in Parallel

Spawn subagents to run these reviews simultaneously:
1. **Alignment Review** - Does this match vision/spec?
2. **Security Review** - Any vulnerabilities?
3. **Performance Review** - Any performance issues?
4. **Best Practices Review** - Code quality check

### Step 3: Synthesize Results

Collect results from all reviews and categorize:

**Blocking Issues** (must fix before commit):
- Any ❌ Misaligned from alignment review
- Any Critical/High from security review
- Any High from performance that violates stated constraints
- Any Must Fix from best practices

**Non-Blocking Issues** (note but allow commit):
- Everything else

### Step 4: Handle Blocking Issues

If there are blocking issues:

```
## Review Results: Issues Found

### Blocking Issues (must fix)

[List each blocking issue with location and brief description]

### Non-Blocking Issues (consider addressing)

[List if any]

---

Cannot commit until blocking issues are resolved. Would you like me to attempt auto-fixes for any of these?
```

If user wants auto-fixes, attempt to fix and re-run the affected review(s).

### Step 5: Generate Commit Message

If no blocking issues (or after they're resolved):

Analyze the diff to generate a commit message following conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**: feat | fix | refactor | docs | test | chore | perf | security
**Scope**: Module or area affected (optional but preferred)
**Subject**: Imperative mood, lowercase, no period, under 50 chars
**Body**: What changed and why (not how). Wrap at 72 chars.
**Footer**: Breaking changes, issue references

Examples:
- `feat(auth): add biometric login support`
- `fix(sync): prevent duplicate uploads on retry`
- `refactor(api): extract validation into middleware`
- `docs: update API endpoint documentation`

### Step 6: Present Summary

```
## Ready to Commit

### Review Summary
- Alignment: ✅ Passed
- Security: ✅ Passed (2 low-severity notes)
- Performance: ✅ Passed
- Best Practices: ✅ Passed (1 suggestion)

### Non-Blocking Notes
[Any issues that were noted but not blocking]

### Changes
[Brief summary of what's being committed]

### Commit Message
```
[generated message]
```

Commit with this message? (yes / no / edit)
```

### Step 7: Commit

Based on response:
- **yes**: Run `git commit -m "<message>"`
- **no**: Abort, ask what they want to change
- **edit**: Ask for their preferred message, then commit with that

### Step 8: Confirm

After successful commit:

```
✅ Committed: [short hash] [subject line]

Next steps:
- Push with `git push`
- Continue with `/implement [next feature]`
- Run `/audit` for a comprehensive project review
```

## Quick Mode

If invoked as `/commit --quick` or `/commit -q`:
- Only run security review (non-blocking unless Critical)
- Skip other reviews
- Use for WIP commits or small fixes

## Amend Mode

If invoked as `/commit --amend`:
- Run full review
- Use `git commit --amend` instead of new commit
- Useful for fixing issues in the last commit
