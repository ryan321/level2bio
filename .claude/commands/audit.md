# Full Project Audit

You are a comprehensive project auditor. Your job is to evaluate the overall health of the project, not just recent changes.

## When to Use

- Before major releases
- Periodically (weekly/monthly depending on project pace)
- When onboarding new team members
- When the project feels "off" somehow
- Before significant architectural changes

## Audit Scope

This audit covers:
1. Spec coverage (is everything implemented?)
2. Documentation freshness (do docs match reality?)
3. Architecture compliance (does code match architecture?)
4. Accumulated tech debt
5. Security posture (full codebase, not just changes)
6. Test coverage
7. Dependency health

## Process

### 1. Spec Coverage Audit

Compare docs/spec.md against actual implementation:

```
## Spec Coverage

### Implemented Features
| Feature | Status | Notes |
|---------|--------|-------|
| [Feature 1] | ✅ Complete | |
| [Feature 2] | ⚠️ Partial | [what's missing] |
| [Feature 3] | ❌ Not started | |

### Implementation without Spec
[Any code that does something not in the spec—potential scope creep or missing documentation]

### Acceptance Criteria Status
[For each feature, are all acceptance criteria met?]
```

### 2. Documentation Freshness

Check if documentation matches reality:

```
## Documentation Audit

### CLAUDE.md
- Tech stack accurate? [Yes/No - what's wrong]
- Conventions followed? [Yes/No - what's drifted]

### docs/architecture.md
- File structure matches? [Yes/No - what's different]
- Patterns followed? [Yes/No - what's drifted]
- New decisions undocumented? [List any]

### docs/constraints.md
- All constraints still respected? [Yes/No - what's violated]
- New constraints emerged? [List any]

### Code Comments
- Misleading comments? [List any]
- Missing documentation on complex logic? [List any]
```

### 3. Architecture Compliance

```
## Architecture Audit

### Layer/Module Violations
[Code in wrong places, inappropriate dependencies between layers]

### Pattern Consistency
[Are established patterns used consistently?]

### Coupling Assessment
[Any inappropriately tight coupling between modules?]

### Recommended Refactors
[Architectural improvements worth considering]
```

### 4. Tech Debt Assessment

```
## Tech Debt Inventory

### High Priority (address soon)
| Item | Location | Impact | Effort |
|------|----------|--------|--------|
| [Debt item] | [where] | [why it matters] | [S/M/L] |

### Medium Priority (address when convenient)
[Same format]

### Low Priority (nice to have)
[Same format]

### TODOs and FIXMEs
[Grep for TODO, FIXME, HACK, XXX and list them]
```

### 5. Security Posture

Run a security review on the entire codebase, not just changes:

```
## Security Audit

### Critical/High Issues
[Any serious vulnerabilities]

### Dependency Vulnerabilities
[Run security audit on dependencies]

### Secrets Management
[Any hardcoded secrets, API keys, etc.?]

### Authentication/Authorization
[Overall assessment of auth implementation]

### Data Handling
[How is sensitive data handled throughout?]
```

### 6. Test Coverage

```
## Test Audit

### Coverage Summary
[If metrics available, include them]

### Untested Critical Paths
[Important functionality without test coverage]

### Test Quality Assessment
[Are tests meaningful or just checking boxes?]

### Flaky Tests
[Any unreliable tests?]
```

### 7. Dependency Health

```
## Dependency Audit

### Outdated Dependencies
| Package | Current | Latest | Breaking Changes? |
|---------|---------|--------|-------------------|

### Unused Dependencies
[Dependencies that could be removed]

### Heavy Dependencies
[Large dependencies that might be replaceable with lighter alternatives]

### License Compliance
[Any license issues?]
```

## Output Format

```
## Project Audit Report

**Date**: [date]
**Project**: [name]
**Auditor**: Claude

---

### Executive Summary

**Overall Health**: [🟢 Good / 🟡 Needs Attention / 🔴 Concerning]

**Key Findings**:
- [Most important finding 1]
- [Most important finding 2]
- [Most important finding 3]

**Recommended Actions**:
1. [Highest priority action]
2. [Second priority action]
3. [Third priority action]

---

[Include all detailed sections from above]

---

### Next Audit

Recommend re-auditing in [timeframe] or after [milestone].
```

## After Audit

Ask:

"Audit complete. Would you like me to:
1. Create issues/tasks for the recommended actions?
2. Start addressing any specific finding?
3. Update documentation to match current reality?
4. Something else?"
