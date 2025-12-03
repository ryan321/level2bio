# Security Checklist for Level2.bio

> Comprehensive security audit checklist for React + Vercel + Supabase applications

This document provides an exhaustive list of security concerns to evaluate. Each item should be checked, tested, and documented with its current status. Use this as a living document for ongoing security assessments.

**Legend:**
- [ ] Not checked
- [x] Checked and secure
- [!] Checked and needs remediation
- [~] Partially addressed
- [N/A] Not applicable

---

## Table of Contents

1. [OWASP Top 10 (2021)](#1-owasp-top-10-2021)
2. [Authentication & Session Management](#2-authentication--session-management)
3. [Authorization & Access Control](#3-authorization--access-control)
4. [Input Validation & Injection Prevention](#4-input-validation--injection-prevention)
5. [Cross-Site Scripting (XSS) Prevention](#5-cross-site-scripting-xss-prevention)
6. [Cross-Site Request Forgery (CSRF)](#6-cross-site-request-forgery-csrf)
7. [React-Specific Security](#7-react-specific-security)
8. [Supabase-Specific Security](#8-supabase-specific-security)
9. [Vercel-Specific Security](#9-vercel-specific-security)
10. [API Security](#10-api-security)
11. [Data Protection & Privacy](#11-data-protection--privacy)
12. [Cryptographic Security](#12-cryptographic-security)
13. [File Upload Security](#13-file-upload-security)
14. [Client-Side Security](#14-client-side-security)
15. [Infrastructure & Network Security](#15-infrastructure--network-security)
16. [Third-Party Dependencies](#16-third-party-dependencies)
17. [Business Logic Security](#17-business-logic-security)
18. [Logging, Monitoring & Incident Response](#18-logging-monitoring--incident-response)
19. [Static Analysis (SAST)](#19-static-analysis-sast)
20. [Dynamic Analysis (DAST)](#20-dynamic-analysis-dast)
21. [Penetration Testing](#21-penetration-testing)
22. [Security Headers](#22-security-headers)
23. [Compliance & Privacy Regulations](#23-compliance--privacy-regulations)

---

## 1. OWASP Top 10 (2021)

### A01:2021 - Broken Access Control

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A01.01 | Principle of least privilege | Users should only access resources they explicitly need | [ ] |
| A01.02 | Deny by default | Access should be denied unless explicitly granted | [ ] |
| A01.03 | Centralized access control | Single mechanism for access control, not scattered checks | [ ] |
| A01.04 | Record ownership validation | Verify user owns record before CRUD operations | [ ] |
| A01.05 | IDOR prevention | Insecure Direct Object References - can users access others' data by changing IDs? | [ ] |
| A01.06 | Path traversal prevention | Can users access files outside intended directories? | [ ] |
| A01.07 | Forced browsing prevention | Can users access admin/restricted pages directly? | [ ] |
| A01.08 | HTTP method restrictions | Are dangerous methods (PUT, DELETE) properly restricted? | [ ] |
| A01.09 | CORS misconfiguration | Is Access-Control-Allow-Origin properly restrictive? | [x] |
| A01.10 | JWT validation | Are JWTs properly validated (signature, expiration, issuer)? | [ ] |
| A01.11 | Role escalation prevention | Can users elevate their own privileges? | [ ] |
| A01.12 | Metadata manipulation | Can users modify hidden fields, JWTs, or cookies to escalate access? | [ ] |
| A01.13 | API endpoint authorization | Are all API endpoints checking authorization? | [ ] |
| A01.14 | Multi-tenancy isolation | Are users properly isolated from other users' data? | [ ] |
| A01.15 | Feature flag bypass | Can users access disabled features by direct API calls? | [ ] |

### A02:2021 - Cryptographic Failures

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A02.01 | Data classification | Is sensitive data identified and classified? | [ ] |
| A02.02 | Data at rest encryption | Is sensitive data encrypted in database? | [ ] |
| A02.03 | Data in transit encryption | Is all traffic over TLS 1.2+? | [ ] |
| A02.04 | Sensitive data caching | Is sensitive data cached in browser or CDN? | [ ] |
| A02.05 | Password hashing | Are passwords hashed with bcrypt/argon2 (not MD5/SHA1)? | [ ] |
| A02.06 | Key management | Are encryption keys properly managed and rotated? | [ ] |
| A02.07 | Deprecated algorithms | Are weak algorithms (DES, RC4, MD5 for security) avoided? | [ ] |
| A02.08 | Random number generation | Is crypto.getRandomValues() used instead of Math.random()? | [ ] |
| A02.09 | Certificate validation | Are TLS certificates properly validated? | [ ] |
| A02.10 | Sensitive data exposure | Is sensitive data returned in API responses unnecessarily? | [ ] |
| A02.11 | PII in URLs | Are passwords, tokens, or PII ever in URLs/query strings? | [ ] |
| A02.12 | Autocomplete for sensitive fields | Is autocomplete disabled for password/credit card fields? | [ ] |

### A03:2021 - Injection

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A03.01 | SQL injection | Are all database queries parameterized? | [ ] |
| A03.02 | NoSQL injection | Are NoSQL queries properly sanitized? | [ ] |
| A03.03 | Command injection | Is user input ever passed to system commands? | [ ] |
| A03.04 | LDAP injection | Is user input used in LDAP queries? | [ ] |
| A03.05 | XPath injection | Is user input used in XML/XPath queries? | [ ] |
| A03.06 | Template injection | Is user input used in server-side templates? | [ ] |
| A03.07 | Header injection | Can users inject CRLF or headers? | [ ] |
| A03.08 | Log injection | Can users inject fake log entries or CRLF? | [ ] |
| A03.09 | Email header injection | Can users inject CC/BCC via email forms? | [ ] |
| A03.10 | ORM injection | Are ORM queries safe from injection via raw queries? | [ ] |
| A03.11 | Expression Language injection | Is user input used in expression evaluation? | [ ] |
| A03.12 | GraphQL injection | Are GraphQL queries depth-limited and validated? | [ ] |

### A04:2021 - Insecure Design

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A04.01 | Threat modeling | Has threat modeling been performed? | [ ] |
| A04.02 | Secure design patterns | Are security design patterns used? | [ ] |
| A04.03 | Defense in depth | Are multiple security layers implemented? | [ ] |
| A04.04 | Fail securely | Does the system fail to a secure state? | [ ] |
| A04.05 | Rate limiting | Are all sensitive operations rate-limited? | [ ] |
| A04.06 | Resource limits | Are memory, CPU, connections limited? | [ ] |
| A04.07 | Business logic validation | Are business rules validated server-side? | [ ] |
| A04.08 | Anti-automation | Are CAPTCHAs or similar used for sensitive forms? | [ ] |
| A04.09 | Plausibility checks | Are impossible values rejected (negative prices, future birthdates)? | [ ] |
| A04.10 | User enumeration prevention | Do error messages prevent username/email enumeration? | [ ] |
| A04.11 | Timing attack prevention | Are responses constant-time for auth operations? | [ ] |
| A04.12 | Recovery process security | Is password/account recovery secure? | [ ] |

### A05:2021 - Security Misconfiguration

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A05.01 | Default credentials | Are all default credentials changed? | [ ] |
| A05.02 | Unnecessary features | Are unused features, ports, services disabled? | [ ] |
| A05.03 | Error handling | Do errors reveal stack traces or internal info? | [ ] |
| A05.04 | Security headers | Are all security headers properly configured? | [ ] |
| A05.05 | Directory listing | Is directory listing disabled? | [ ] |
| A05.06 | Debug mode | Is debug mode disabled in production? | [ ] |
| A05.07 | Admin interfaces | Are admin panels restricted/hidden? | [ ] |
| A05.08 | Cloud storage permissions | Are S3/storage buckets properly locked down? | [ ] |
| A05.09 | Database permissions | Does the app use least-privilege DB user? | [ ] |
| A05.10 | HTTPS enforcement | Is HTTP redirected to HTTPS? | [ ] |
| A05.11 | Patch management | Are all systems patched and updated? | [ ] |
| A05.12 | Segmentation | Is the network properly segmented? | [ ] |
| A05.13 | XML external entities | Is XXE processing disabled? | [ ] |
| A05.14 | Environment isolation | Are dev/staging/prod properly isolated? | [ ] |

### A06:2021 - Vulnerable and Outdated Components

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A06.01 | Dependency inventory | Is there a complete list of all dependencies? | [ ] |
| A06.02 | Version tracking | Are component versions documented? | [ ] |
| A06.03 | Vulnerability scanning | Are dependencies scanned for known CVEs? | [ ] |
| A06.04 | Update policy | Is there a policy for updating dependencies? | [ ] |
| A06.05 | Unused dependencies | Are unused dependencies removed? | [ ] |
| A06.06 | Dependency sources | Are dependencies from trusted sources only? | [ ] |
| A06.07 | Lock files | Are package lock files committed? | [ ] |
| A06.08 | Sub-dependency risks | Are transitive dependencies also scanned? | [ ] |
| A06.09 | License compliance | Are dependency licenses compatible? | [ ] |
| A06.10 | End-of-life components | Are EOL components replaced? | [ ] |
| A06.11 | Automated alerts | Is there automated alerting for new CVEs? | [ ] |

### A07:2021 - Identification and Authentication Failures

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A07.01 | Password strength | Are strong passwords required? | [ ] |
| A07.02 | Credential stuffing protection | Is there protection against credential stuffing? | [ ] |
| A07.03 | Brute force protection | Is there account lockout or rate limiting? | [ ] |
| A07.04 | MFA available | Is multi-factor authentication available? | [ ] |
| A07.05 | Password recovery | Is password reset secure (time-limited tokens)? | [ ] |
| A07.06 | Session management | Are sessions properly managed? | [ ] |
| A07.07 | Session timeout | Do sessions timeout after inactivity? | [ ] |
| A07.08 | Session invalidation | Are sessions invalidated on logout? | [ ] |
| A07.09 | Session fixation | Is session fixation prevented? | [ ] |
| A07.10 | Secure session IDs | Are session IDs long, random, and unpredictable? | [ ] |
| A07.11 | OAuth security | Are OAuth flows implemented securely? | [ ] |
| A07.12 | Token storage | Are tokens stored securely (not localStorage for sensitive)? | [ ] |
| A07.13 | Remember me security | Is "remember me" implemented securely? | [ ] |
| A07.14 | Account enumeration | Do login/register forms prevent user enumeration? | [ ] |
| A07.15 | Password change security | Is current password required for password changes? | [ ] |

### A08:2021 - Software and Data Integrity Failures

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A08.01 | CI/CD security | Is the CI/CD pipeline secured? | [ ] |
| A08.02 | Code signing | Are commits/releases signed? | [ ] |
| A08.03 | Dependency integrity | Are dependencies verified (checksums, signatures)? | [ ] |
| A08.04 | Update mechanism | Are auto-updates verified before applying? | [ ] |
| A08.05 | Deserialization safety | Is untrusted data deserialized safely? | [ ] |
| A08.06 | Integrity verification | Are critical files integrity-checked? | [ ] |
| A08.07 | SRI for external resources | Is Subresource Integrity used for CDN resources? | [ ] |
| A08.08 | Pipeline tampering | Can the build pipeline be tampered with? | [ ] |
| A08.09 | Source code protection | Is source code access properly controlled? | [ ] |

### A09:2021 - Security Logging and Monitoring Failures

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A09.01 | Audit logging | Are security-relevant events logged? | [ ] |
| A09.02 | Log integrity | Are logs protected from tampering? | [ ] |
| A09.03 | Log format | Are logs in a format suitable for analysis? | [ ] |
| A09.04 | Log retention | Are logs retained for adequate period? | [ ] |
| A09.05 | Sensitive data in logs | Is PII/sensitive data excluded from logs? | [ ] |
| A09.06 | Real-time alerting | Are there alerts for suspicious activity? | [ ] |
| A09.07 | Incident response plan | Is there an incident response plan? | [ ] |
| A09.08 | Log monitoring | Are logs actively monitored? | [ ] |
| A09.09 | Login attempt logging | Are failed login attempts logged? | [ ] |
| A09.10 | Access logging | Are access to sensitive resources logged? | [ ] |
| A09.11 | Error logging | Are application errors logged appropriately? | [ ] |
| A09.12 | Log injection prevention | Are logs protected from injection attacks? | [ ] |

### A10:2021 - Server-Side Request Forgery (SSRF)

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| A10.01 | URL validation | Are user-supplied URLs validated? | [ ] |
| A10.02 | Allowlist enforcement | Is there an allowlist for external requests? | [ ] |
| A10.03 | Internal network protection | Are requests to internal IPs blocked? | [ ] |
| A10.04 | Protocol restrictions | Are dangerous protocols (file://, gopher://) blocked? | [ ] |
| A10.05 | Redirect following | Are redirects to internal resources blocked? | [ ] |
| A10.06 | DNS rebinding | Is DNS rebinding prevented? | [ ] |
| A10.07 | Response handling | Is SSRF response data properly handled? | [ ] |
| A10.08 | Cloud metadata | Is access to cloud metadata endpoints blocked (169.254.169.254)? | [ ] |

---

## 2. Authentication & Session Management

### 2.1 Password Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| AUTH.01 | Minimum length | Passwords require 12+ characters | [ ] |
| AUTH.02 | Complexity requirements | Mixed case, numbers, special chars encouraged | [ ] |
| AUTH.03 | Common password check | Passwords checked against breach databases | [ ] |
| AUTH.04 | Password history | Users cannot reuse recent passwords | [ ] |
| AUTH.05 | Password expiration | Password rotation policy (if required) | [ ] |
| AUTH.06 | Secure transmission | Passwords only sent over HTTPS | [ ] |
| AUTH.07 | Client-side hashing | Passwords NOT hashed client-side (server handles) | [ ] |
| AUTH.08 | Timing attacks | Password comparison is constant-time | [ ] |
| AUTH.09 | Password visibility toggle | Show/hide password is implemented securely | [ ] |
| AUTH.10 | Paste allowed | Password paste is allowed (accessibility) | [ ] |

### 2.2 Session Management

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SESS.01 | Session ID entropy | Session IDs have sufficient entropy (128+ bits) | [ ] |
| SESS.02 | Session regeneration | Session ID regenerated after authentication | [ ] |
| SESS.03 | Secure cookie flags | HttpOnly, Secure, SameSite flags set | [ ] |
| SESS.04 | Session timeout | Idle timeout implemented (15-30 min for sensitive) | [ ] |
| SESS.05 | Absolute timeout | Maximum session lifetime enforced | [ ] |
| SESS.06 | Logout functionality | Complete session destruction on logout | [ ] |
| SESS.07 | Concurrent sessions | Policy for multiple simultaneous sessions | [ ] |
| SESS.08 | Session binding | Session bound to client (IP, User-Agent heuristics) | [ ] |
| SESS.09 | Cross-tab logout | Logout propagates to all tabs | [ ] |
| SESS.10 | Session in URL | Session ID never appears in URL | [ ] |

### 2.3 OAuth & Social Login

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| OAUTH.01 | State parameter | CSRF protection via state parameter | [ ] |
| OAUTH.02 | Redirect URI validation | Redirect URIs strictly validated | [ ] |
| OAUTH.03 | PKCE implementation | PKCE used for public clients | [ ] |
| OAUTH.04 | Token storage | OAuth tokens stored securely | [ ] |
| OAUTH.05 | Scope minimization | Only necessary scopes requested | [ ] |
| OAUTH.06 | Token validation | ID tokens fully validated | [ ] |
| OAUTH.07 | Provider verification | OAuth provider responses verified | [ ] |
| OAUTH.08 | Account linking | Secure process for linking OAuth accounts | [ ] |
| OAUTH.09 | Nonce validation | Nonce used to prevent replay attacks | [ ] |
| OAUTH.10 | Open redirect prevention | OAuth callback doesn't allow open redirects | [ ] |

### 2.4 Multi-Factor Authentication

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| MFA.01 | MFA availability | MFA option available for users | [ ] |
| MFA.02 | MFA for sensitive ops | MFA required for sensitive operations | [ ] |
| MFA.03 | Recovery codes | Secure backup codes provided | [ ] |
| MFA.04 | TOTP implementation | Time-based OTP properly implemented | [ ] |
| MFA.05 | Rate limiting | MFA attempts are rate-limited | [ ] |
| MFA.06 | Bypass prevention | MFA cannot be bypassed via API | [ ] |
| MFA.07 | Device trust | Trusted device management | [ ] |

---

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RBAC.01 | Role definition | Roles clearly defined with minimal privileges | [ ] |
| RBAC.02 | Role assignment | Secure process for assigning roles | [ ] |
| RBAC.03 | Role validation | Role checked on every request | [ ] |
| RBAC.04 | Default role | New users get minimal default role | [ ] |
| RBAC.05 | Role separation | Separation of duties enforced | [ ] |
| RBAC.06 | Admin access | Admin access properly restricted | [ ] |
| RBAC.07 | Role escalation | Users cannot escalate own role | [ ] |

### 3.2 Resource-Level Authorization

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RES.01 | Ownership verification | Resource ownership checked before access | [ ] |
| RES.02 | Horizontal access control | Users cannot access peers' resources | [ ] |
| RES.03 | Vertical access control | Users cannot access higher-privilege resources | [ ] |
| RES.04 | Reference validation | All object references validated | [ ] |
| RES.05 | Batch operation auth | Batch operations check auth for each item | [ ] |
| RES.06 | Indirect references | Indirect references used where appropriate | [ ] |

### 3.3 Function-Level Authorization

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| FUNC.01 | UI vs API consistency | Same auth for UI and API endpoints | [ ] |
| FUNC.02 | Hidden feature protection | Hidden features still protected | [ ] |
| FUNC.03 | Admin function protection | Admin functions require admin auth | [ ] |
| FUNC.04 | HTTP method auth | Authorization checked for all HTTP methods | [ ] |
| FUNC.05 | Endpoint enumeration | API endpoints not easily enumerable | [ ] |

---

## 4. Input Validation & Injection Prevention

### 4.1 General Input Validation

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| INPUT.01 | Server-side validation | All input validated server-side | [ ] |
| INPUT.02 | Allowlist validation | Input validated against allowlist (not blocklist) | [ ] |
| INPUT.03 | Type validation | Input type strictly validated | [ ] |
| INPUT.04 | Length validation | Input length limits enforced | [ ] |
| INPUT.05 | Range validation | Numeric ranges validated | [ ] |
| INPUT.06 | Format validation | Format patterns validated (email, phone, etc.) | [ ] |
| INPUT.07 | Encoding validation | Character encoding validated | [ ] |
| INPUT.08 | Null byte handling | Null bytes stripped or rejected | [ ] |
| INPUT.09 | Unicode normalization | Unicode input normalized | [ ] |
| INPUT.10 | Canonicalization | Input canonicalized before validation | [ ] |
| INPUT.11 | Business rule validation | Business logic constraints validated | [ ] |

### 4.2 SQL Injection Prevention

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SQLI.01 | Parameterized queries | All queries use parameterization | [ ] |
| SQLI.02 | ORM safety | ORM used safely (no raw queries with user input) | [ ] |
| SQLI.03 | Stored procedures | Stored procedures use parameters | [ ] |
| SQLI.04 | Error messages | SQL errors don't expose schema info | [ ] |
| SQLI.05 | Least privilege | DB user has minimal privileges | [ ] |
| SQLI.06 | Schema hardening | Unused stored procedures removed | [ ] |
| SQLI.07 | Second-order injection | Stored data re-validated before query use | [ ] |
| SQLI.08 | Dynamic table/column names | Table/column names from allowlist only | [ ] |

### 4.3 Output Encoding

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| OUTPUT.01 | Context-appropriate encoding | Output encoded for specific context | [ ] |
| OUTPUT.02 | HTML encoding | HTML special chars encoded | [ ] |
| OUTPUT.03 | JavaScript encoding | JS special chars encoded in JS context | [ ] |
| OUTPUT.04 | URL encoding | URLs properly encoded | [ ] |
| OUTPUT.05 | CSS encoding | CSS values properly encoded | [ ] |
| OUTPUT.06 | JSON encoding | JSON output properly escaped | [ ] |
| OUTPUT.07 | XML encoding | XML output properly encoded | [ ] |

---

## 5. Cross-Site Scripting (XSS) Prevention

### 5.1 Reflected XSS

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RXSS.01 | URL parameter encoding | URL parameters encoded before display | [ ] |
| RXSS.02 | Form input encoding | Form inputs encoded before display | [ ] |
| RXSS.03 | Header reflection | HTTP headers not reflected unsafely | [ ] |
| RXSS.04 | Error message encoding | Error messages don't reflect input | [ ] |
| RXSS.05 | Search result encoding | Search queries encoded in results | [ ] |

### 5.2 Stored XSS

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SXSS.01 | User content encoding | All user content encoded on display | [ ] |
| SXSS.02 | Rich text sanitization | Rich text HTML sanitized | [ ] |
| SXSS.03 | File name encoding | Uploaded file names encoded | [ ] |
| SXSS.04 | Profile data encoding | User profile fields encoded | [ ] |
| SXSS.05 | Comment encoding | Comments and messages encoded | [ ] |
| SXSS.06 | Admin panel encoding | Admin views also encode content | [ ] |

### 5.3 DOM-Based XSS

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DXSS.01 | innerHTML avoidance | innerHTML avoided (use textContent) | [ ] |
| DXSS.02 | document.write avoidance | document.write not used | [ ] |
| DXSS.03 | eval avoidance | eval() and similar not used | [ ] |
| DXSS.04 | Safe DOM methods | Safe DOM manipulation methods used | [ ] |
| DXSS.05 | URL fragment handling | Location.hash handled safely | [ ] |
| DXSS.06 | postMessage validation | postMessage origin validated | [ ] |
| DXSS.07 | JSON.parse safety | JSON parsing doesn't execute code | [ ] |
| DXSS.08 | Template literal safety | Template literals don't include user input | [ ] |

### 5.4 XSS Defense Mechanisms

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| XDEF.01 | Content-Security-Policy | CSP header properly configured | [ ] |
| XDEF.02 | X-XSS-Protection | Legacy XSS protection (or CSP instead) | [ ] |
| XDEF.03 | HTTPOnly cookies | Cookies marked HTTPOnly | [ ] |
| XDEF.04 | Framework auto-escaping | Framework's auto-escaping enabled | [ ] |
| XDEF.05 | Trusted Types | Trusted Types API considered | [ ] |

---

## 6. Cross-Site Request Forgery (CSRF)

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| CSRF.01 | CSRF tokens | Anti-CSRF tokens on state-changing requests | [ ] |
| CSRF.02 | Token validation | CSRF tokens validated server-side | [ ] |
| CSRF.03 | SameSite cookies | SameSite cookie attribute set | [ ] |
| CSRF.04 | Origin/Referer check | Origin header validated for sensitive ops | [ ] |
| CSRF.05 | Double submit cookies | Double submit pattern used (if applicable) | [ ] |
| CSRF.06 | Custom headers | Custom headers required for API calls | [ ] |
| CSRF.07 | GET safety | GET requests don't modify state | [ ] |
| CSRF.08 | JSON content type | JSON APIs require proper Content-Type | [ ] |
| CSRF.09 | Login CSRF | Login form protected against CSRF | [ ] |
| CSRF.10 | Logout CSRF | Logout protected against CSRF | [ ] |

---

## 7. React-Specific Security

### 7.1 JSX Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| REACT.01 | dangerouslySetInnerHTML | dangerouslySetInnerHTML avoided or sanitized | [ ] |
| REACT.02 | href javascript: | Links don't allow javascript: protocol | [ ] |
| REACT.03 | Dynamic attribute names | Attribute names not from user input | [ ] |
| REACT.04 | Spread props safety | Spread props don't include dangerous attributes | [ ] |
| REACT.05 | Event handler safety | Event handlers don't execute user input | [ ] |
| REACT.06 | Style injection | Inline styles don't include user input | [ ] |
| REACT.07 | SVG injection | SVG content sanitized | [ ] |

### 7.2 State Management Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RSTATE.01 | Sensitive state exposure | Sensitive data not in Redux/global state | [ ] |
| RSTATE.02 | State persistence | Persisted state doesn't contain secrets | [ ] |
| RSTATE.03 | DevTools in production | Redux DevTools disabled in production | [ ] |
| RSTATE.04 | URL state safety | URL-synced state properly validated | [ ] |

### 7.3 React Router Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| ROUTE.01 | Protected routes | Auth required for protected routes | [ ] |
| ROUTE.02 | Route parameter validation | Route params validated | [ ] |
| ROUTE.03 | Redirect validation | Redirects don't allow open redirect | [ ] |
| ROUTE.04 | 404 handling | Unknown routes handled properly | [ ] |

### 7.4 Third-Party React Components

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RCOMP.01 | Markdown renderer | Markdown renderer configured safely | [ ] |
| RCOMP.02 | Rich text editor | WYSIWYG editor sanitizes output | [ ] |
| RCOMP.03 | Form libraries | Form libraries handle input safely | [ ] |
| RCOMP.04 | Authentication libraries | Auth libraries configured securely | [ ] |

### 7.5 Build & Deployment

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RBUILD.01 | Source maps | Source maps disabled in production | [ ] |
| RBUILD.02 | Environment variables | Secrets not in VITE_ (public) variables | [ ] |
| RBUILD.03 | Bundle analysis | Bundle analyzed for exposed secrets | [ ] |
| RBUILD.04 | Dead code elimination | Unused code removed in production build | [ ] |
| RBUILD.05 | Console statements | console.log removed in production | [ ] |

---

## 8. Supabase-Specific Security

### 8.1 Row Level Security (RLS)

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RLS.01 | RLS enabled | RLS enabled on all tables | [ ] |
| RLS.02 | Force RLS | FORCE ROW LEVEL SECURITY set on tables | [ ] |
| RLS.03 | Policy coverage | Policies exist for SELECT, INSERT, UPDATE, DELETE | [ ] |
| RLS.04 | WITH CHECK clauses | INSERT/UPDATE policies use WITH CHECK | [ ] |
| RLS.05 | USING clauses | SELECT/UPDATE/DELETE use USING properly | [ ] |
| RLS.06 | Policy testing | RLS policies tested for bypass | [ ] |
| RLS.07 | Join security | RLS applies correctly across joins | [ ] |
| RLS.08 | View security | Views don't bypass RLS | [ ] |
| RLS.09 | Function security | Functions don't bypass RLS unintentionally | [ ] |
| RLS.10 | Default deny | No policy = no access (not open access) | [ ] |

### 8.2 Database Functions

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DBFN.01 | SECURITY DEFINER usage | SECURITY DEFINER used only when necessary | [x] |
| DBFN.02 | Search path setting | SET search_path = public on DEFINER functions | [x] |
| DBFN.03 | Input validation | Function inputs validated | [ ] |
| DBFN.04 | Dynamic SQL prevention | No dynamic SQL with user input | [ ] |
| DBFN.05 | Return value safety | Functions don't leak sensitive data | [ ] |
| DBFN.06 | Function permissions | EXECUTE permissions properly restricted | [ ] |
| DBFN.07 | Trigger security | Triggers don't bypass security | [ ] |

### 8.3 Supabase Auth

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SAUTH.01 | Email confirmation | Email confirmation required (or intentionally disabled) | [ ] |
| SAUTH.02 | Password requirements | Supabase password requirements configured | [ ] |
| SAUTH.03 | OAuth providers | Only necessary OAuth providers enabled | [ ] |
| SAUTH.04 | Redirect URLs | Redirect URLs strictly configured | [ ] |
| SAUTH.05 | JWT expiration | JWT expiration appropriate | [ ] |
| SAUTH.06 | Refresh token rotation | Refresh token rotation enabled | [ ] |
| SAUTH.07 | Rate limiting | Auth rate limiting configured | [ ] |
| SAUTH.08 | MFA support | MFA enabled if required | [ ] |
| SAUTH.09 | User metadata | User metadata validated | [ ] |
| SAUTH.10 | Custom claims | Custom JWT claims validated | [ ] |

### 8.4 Supabase Storage

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| STOR.01 | Bucket policies | Storage bucket policies configured | [ ] |
| STOR.02 | Public vs private | Buckets correctly marked public/private | [ ] |
| STOR.03 | Path restrictions | Users can only access own folders | [ ] |
| STOR.04 | File type restrictions | Allowed file types restricted | [ ] |
| STOR.05 | File size limits | Max file size configured | [ ] |
| STOR.06 | Signed URLs | Signed URLs used for private files | [ ] |
| STOR.07 | URL expiration | Signed URL expiration appropriate | [ ] |

### 8.5 Supabase API Keys

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SKEY.01 | Anon key exposure | Anon key only used for public operations | [ ] |
| SKEY.02 | Service role protection | Service role key never in frontend | [ ] |
| SKEY.03 | Key rotation | Keys can be rotated if compromised | [ ] |
| SKEY.04 | Environment variables | Keys in environment variables, not code | [ ] |

### 8.6 PostgREST Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| PREST.01 | Schema exposure | Only public schema exposed | [ ] |
| PREST.02 | Function exposure | RPC functions intentionally exposed | [ ] |
| PREST.03 | Table exposure | Only intended tables accessible | [ ] |
| PREST.04 | Aggregate restrictions | Aggregate functions restricted | [ ] |
| PREST.05 | Row limits | Max rows per request configured | [ ] |

### 8.7 Realtime Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| REAL.01 | Channel authorization | Realtime channels properly authorized | [ ] |
| REAL.02 | Broadcast security | Broadcast messages validated | [ ] |
| REAL.03 | Presence security | Presence information appropriate | [ ] |
| REAL.04 | RLS in Realtime | RLS applies to realtime subscriptions | [ ] |

---

## 9. Vercel-Specific Security

### 9.1 Environment Variables

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| VENV.01 | Secret classification | Secrets marked as secret (not plain) | [ ] |
| VENV.02 | Environment separation | Different secrets per environment | [ ] |
| VENV.03 | Preview env security | Preview deployments don't expose prod secrets | [ ] |
| VENV.04 | Build vs runtime | Build-time vs runtime variables correct | [ ] |

### 9.2 Deployment Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| VDEP.01 | Preview protection | Preview URLs password protected (if needed) | [ ] |
| VDEP.02 | Branch protection | Only protected branches deploy to prod | [ ] |
| VDEP.03 | Build logs | Build logs don't contain secrets | [ ] |
| VDEP.04 | Deployment rollback | Ability to quickly rollback compromised deploy | [ ] |

### 9.3 Vercel Headers & Routing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| VHEAD.01 | Security headers | Security headers in vercel.json | [x] |
| VHEAD.02 | Cache headers | Cache-Control appropriate per route | [x] |
| VHEAD.03 | Rewrites safety | Rewrites don't expose internal paths | [x] |
| VHEAD.04 | Redirects safety | Redirects don't allow open redirect | [x] |

### 9.4 Serverless Functions

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| VFUNC.01 | Function timeout | Appropriate timeout configured | [ ] |
| VFUNC.02 | Memory limits | Memory limits appropriate | [ ] |
| VFUNC.03 | Cold start security | Cold starts don't leak info | [ ] |
| VFUNC.04 | Function auth | Functions require authentication | [ ] |

### 9.5 Edge & Middleware

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| VEDGE.01 | Middleware auth | Auth checks in middleware | [ ] |
| VEDGE.02 | Geo restrictions | Geo-blocking if required | [ ] |
| VEDGE.03 | Rate limiting | Edge-level rate limiting | [ ] |
| VEDGE.04 | Request validation | Request validation at edge | [ ] |

---

## 10. API Security

### 10.1 API Authentication

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| APIA.01 | Auth on all endpoints | All endpoints require authentication | [ ] |
| APIA.02 | Token validation | Tokens validated on every request | [ ] |
| APIA.03 | Token expiration | Short-lived tokens used | [ ] |
| APIA.04 | Token revocation | Tokens can be revoked | [ ] |

### 10.2 API Authorization

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| APIZ.01 | Endpoint authorization | Authorization checked per endpoint | [ ] |
| APIZ.02 | Resource authorization | Resource ownership verified | [ ] |
| APIZ.03 | Batch authorization | Batch ops check each item | [ ] |
| APIZ.04 | GraphQL authorization | GraphQL resolvers check auth | [ ] |

### 10.3 API Rate Limiting

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RATE.01 | Global rate limits | Overall API rate limits | [ ] |
| RATE.02 | Per-user limits | Rate limits per authenticated user | [ ] |
| RATE.03 | Per-endpoint limits | Sensitive endpoints have stricter limits | [ ] |
| RATE.04 | Rate limit headers | Rate limit info in response headers | [ ] |
| RATE.05 | Retry-After header | Retry-After sent when limited | [ ] |

### 10.4 API Input/Output

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| APIO.01 | Content-Type validation | Content-Type header validated | [ ] |
| APIO.02 | Request size limits | Max request body size enforced | [ ] |
| APIO.03 | Response filtering | Sensitive fields filtered from responses | [ ] |
| APIO.04 | Error standardization | Errors don't leak internal info | [ ] |
| APIO.05 | Pagination limits | Max page size enforced | [ ] |
| APIO.06 | Deep query prevention | Nested query depth limited | [ ] |

---

## 11. Data Protection & Privacy

### 11.1 Data Classification

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DATA.01 | PII identification | All PII identified and documented | [ ] |
| DATA.02 | Sensitive data marking | Sensitive fields marked in schema | [ ] |
| DATA.03 | Data flow mapping | Data flows documented | [ ] |

### 11.2 Data Minimization

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DMIN.01 | Collection minimization | Only necessary data collected | [ ] |
| DMIN.02 | Retention limits | Data retention periods defined | [ ] |
| DMIN.03 | Anonymization | Data anonymized where possible | [ ] |
| DMIN.04 | Pseudonymization | Identifiers pseudonymized | [ ] |

### 11.3 Data Access

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DACC.01 | Access logging | Access to PII logged | [ ] |
| DACC.02 | Export functionality | Users can export their data | [ ] |
| DACC.03 | Deletion capability | Users can delete their data | [ ] |
| DACC.04 | Access controls | PII access restricted to necessary roles | [ ] |

### 11.4 Data Breach Preparation

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DBREACH.01 | Breach notification | Process for breach notification | [ ] |
| DBREACH.02 | Data inventory | Inventory of all data stores | [ ] |
| DBREACH.03 | Encryption at rest | Sensitive data encrypted at rest | [ ] |
| DBREACH.04 | Backup security | Backups encrypted and secured | [ ] |

---

## 12. Cryptographic Security

### 12.1 Algorithm Selection

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| CRYPT.01 | Approved algorithms | Only approved algorithms used | [ ] |
| CRYPT.02 | Key sizes | Adequate key sizes (AES-256, RSA-2048+) | [ ] |
| CRYPT.03 | Deprecated avoidance | MD5, SHA1, DES not used for security | [ ] |
| CRYPT.04 | Mode selection | Appropriate encryption modes (GCM, not ECB) | [ ] |

### 12.2 Key Management

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| KEYM.01 | Key generation | Keys generated securely | [ ] |
| KEYM.02 | Key storage | Keys stored securely (HSM/KMS ideally) | [ ] |
| KEYM.03 | Key rotation | Key rotation process defined | [ ] |
| KEYM.04 | Key separation | Different keys for different purposes | [ ] |

### 12.3 Random Number Generation

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RAND.01 | CSPRNG usage | Cryptographic RNG used (not Math.random) | [ ] |
| RAND.02 | Entropy sources | Adequate entropy for generation | [ ] |
| RAND.03 | Token generation | Tokens generated with sufficient entropy | [ ] |

---

## 13. File Upload Security

### 13.1 Upload Validation

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| UPLD.01 | File type validation | File types validated by magic bytes | [ ] |
| UPLD.02 | Extension validation | File extensions validated against allowlist | [ ] |
| UPLD.03 | Size limits | Max file size enforced | [ ] |
| UPLD.04 | Filename sanitization | Filenames sanitized | [ ] |
| UPLD.05 | Path traversal prevention | Filenames can't escape directories | [ ] |
| UPLD.06 | Content scanning | Files scanned for malware | [ ] |

### 13.2 Upload Storage

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| UPST.01 | Storage location | Files stored outside webroot | [ ] |
| UPST.02 | Access control | Upload access properly controlled | [ ] |
| UPST.03 | No execution | Uploaded files cannot execute | [ ] |
| UPST.04 | Separate domain | Uploads served from separate domain | [ ] |

### 13.3 Upload Serving

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| UPSV.01 | Content-Type | Content-Type set correctly, not sniffed | [ ] |
| UPSV.02 | Content-Disposition | Content-Disposition: attachment for downloads | [ ] |
| UPSV.03 | X-Content-Type-Options | nosniff header set | [ ] |
| UPSV.04 | Access authorization | Authorization checked on file access | [ ] |

---

## 14. Client-Side Security

### 14.1 Sensitive Data Exposure

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| CLIE.01 | LocalStorage | Sensitive data not in localStorage | [ ] |
| CLIE.02 | SessionStorage | Sensitive data handled appropriately | [ ] |
| CLIE.03 | IndexedDB | IndexedDB doesn't store secrets | [ ] |
| CLIE.04 | Cookies | Sensitive cookies have proper flags | [ ] |
| CLIE.05 | URL exposure | Sensitive data not in URLs | [ ] |
| CLIE.06 | Console output | No secrets logged to console | [ ] |
| CLIE.07 | Error messages | Errors don't expose sensitive info | [ ] |

### 14.2 JavaScript Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| JSEC.01 | eval avoidance | eval() and similar avoided | [ ] |
| JSEC.02 | Safe JSON parsing | JSON parsed safely | [ ] |
| JSEC.03 | Prototype pollution | Prototype pollution prevented | [ ] |
| JSEC.04 | postMessage security | postMessage origin validated | [ ] |
| JSEC.05 | Third-party scripts | Third-party scripts reviewed | [ ] |

### 14.3 Browser Feature Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| BROW.01 | Geolocation | Geolocation used appropriately | [ ] |
| BROW.02 | Camera/Mic | Media devices requested minimally | [ ] |
| BROW.03 | Notifications | Push notification security | [ ] |
| BROW.04 | Clipboard | Clipboard access appropriate | [ ] |
| BROW.05 | Service Workers | Service workers secure | [ ] |

---

## 15. Infrastructure & Network Security

### 15.1 TLS Configuration

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| TLS.01 | TLS version | TLS 1.2+ required | [ ] |
| TLS.02 | Cipher suites | Strong cipher suites only | [ ] |
| TLS.03 | Certificate validity | Valid, non-expired certificates | [ ] |
| TLS.04 | Certificate chain | Complete certificate chain | [ ] |
| TLS.05 | HSTS | Strict-Transport-Security enabled | [ ] |
| TLS.06 | HSTS preload | HSTS preload list (if applicable) | [ ] |

### 15.2 DNS Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DNS.01 | DNSSEC | DNSSEC enabled (if possible) | [ ] |
| DNS.02 | CAA records | CAA records configured | [ ] |
| DNS.03 | DNS hijacking | Protection against DNS hijacking | [ ] |

### 15.3 CDN & Edge Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| CDN.01 | Origin protection | Origin server protected | [ ] |
| CDN.02 | Cache poisoning | Cache poisoning prevented | [ ] |
| CDN.03 | WAF rules | WAF rules configured | [ ] |
| CDN.04 | DDoS protection | DDoS protection enabled | [ ] |

---

## 16. Third-Party Dependencies

### 16.1 Dependency Management

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DEP.01 | Dependency audit | Regular dependency audits | [ ] |
| DEP.02 | Lock files | Lock files committed | [ ] |
| DEP.03 | Version pinning | Dependencies version-pinned | [ ] |
| DEP.04 | Minimal dependencies | Only necessary dependencies | [ ] |
| DEP.05 | Trusted sources | Dependencies from trusted sources | [ ] |

### 16.2 Vulnerability Management

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| VULN.01 | Automated scanning | Automated vulnerability scanning | [ ] |
| VULN.02 | CVE monitoring | CVE monitoring for dependencies | [ ] |
| VULN.03 | Update process | Process for security updates | [ ] |
| VULN.04 | Patch timeline | Critical patches applied quickly | [ ] |

### 16.3 Supply Chain Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SUPPLY.01 | Package integrity | Package integrity verified | [ ] |
| SUPPLY.02 | Maintainer trust | Package maintainers reviewed | [ ] |
| SUPPLY.03 | Typosquatting | Protection against typosquatting | [ ] |
| SUPPLY.04 | Dependency confusion | Namespace protection | [ ] |

---

## 17. Business Logic Security

### 17.1 Transaction Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| BIZL.01 | Race conditions | Race conditions prevented | [ ] |
| BIZL.02 | Double submission | Double submission prevented | [ ] |
| BIZL.03 | Transaction integrity | Transactions atomic | [ ] |
| BIZL.04 | Idempotency | Operations idempotent where needed | [ ] |

### 17.2 Workflow Security

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| WORK.01 | State validation | State transitions validated | [ ] |
| WORK.02 | Sequence enforcement | Operation sequence enforced | [ ] |
| WORK.03 | Bypass prevention | Workflow steps can't be skipped | [ ] |
| WORK.04 | Rollback security | Rollbacks properly authorized | [ ] |

### 17.3 Abuse Prevention

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| ABUSE.01 | Spam prevention | Anti-spam measures | [ ] |
| ABUSE.02 | Bot prevention | Bot detection/CAPTCHA | [ ] |
| ABUSE.03 | Scraping prevention | Anti-scraping measures | [ ] |
| ABUSE.04 | Resource abuse | Resource abuse limits | [ ] |

---

## 18. Logging, Monitoring & Incident Response

### 18.1 Security Logging

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| LOG.01 | Auth events | Login/logout/failure logged | [ ] |
| LOG.02 | Access events | Resource access logged | [ ] |
| LOG.03 | Admin actions | Administrative actions logged | [ ] |
| LOG.04 | Data changes | Data modifications logged | [ ] |
| LOG.05 | Errors | Application errors logged | [ ] |
| LOG.06 | Security events | Security-relevant events logged | [ ] |

### 18.2 Log Protection

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| LOGP.01 | Log injection | Log injection prevented | [ ] |
| LOGP.02 | PII in logs | PII excluded from logs | [ ] |
| LOGP.03 | Log integrity | Logs protected from tampering | [ ] |
| LOGP.04 | Log retention | Appropriate retention period | [ ] |
| LOGP.05 | Log access | Log access restricted | [ ] |

### 18.3 Monitoring & Alerting

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| MON.01 | Real-time monitoring | Real-time security monitoring | [ ] |
| MON.02 | Anomaly detection | Anomaly detection configured | [ ] |
| MON.03 | Alert thresholds | Alert thresholds defined | [ ] |
| MON.04 | Alert routing | Alerts routed to right team | [ ] |
| MON.05 | False positive tuning | False positives minimized | [ ] |

### 18.4 Incident Response

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| INC.01 | IR plan | Incident response plan exists | [ ] |
| INC.02 | Contact list | Security contacts documented | [ ] |
| INC.03 | Escalation path | Escalation procedures defined | [ ] |
| INC.04 | Communication plan | Breach communication planned | [ ] |
| INC.05 | Post-incident | Post-incident review process | [ ] |

---

## 19. Static Analysis (SAST)

### 19.1 Code Analysis

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SAST.01 | Linting | ESLint with security rules | [ ] |
| SAST.02 | Type checking | TypeScript strict mode | [ ] |
| SAST.03 | Security scanner | Security-focused SAST tool | [ ] |
| SAST.04 | Custom rules | Custom rules for app-specific issues | [ ] |

### 19.2 Secret Detection

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SECR.01 | Secret scanning | Automated secret scanning | [ ] |
| SECR.02 | Pre-commit hooks | Pre-commit secret detection | [ ] |
| SECR.03 | CI/CD scanning | Secret scanning in CI/CD | [ ] |
| SECR.04 | Historical scanning | Git history scanned for secrets | [ ] |

### 19.3 Dependency Analysis

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DEPA.01 | npm audit | npm audit in CI/CD | [x] |
| DEPA.02 | Snyk/Dependabot | Automated dependency scanning | [x] |
| DEPA.03 | License scanning | License compatibility checked | [ ] |
| DEPA.04 | Outdated deps | Outdated dependency alerting | [x] |

### 19.4 Recommended SAST Tools

| Tool | Purpose | Status |
|------|---------|--------|
| ESLint + eslint-plugin-security | JS/TS security linting | [x] |
| TypeScript strict | Type safety | [x] |
| Semgrep | Pattern-based scanning | [ ] |
| CodeQL | Semantic analysis | [ ] |
| Gitleaks | Secret detection | [ ] |
| Trivy | Container/dependency scanning | [ ] |
| npm audit / yarn audit | Dependency vulnerabilities | [x] |
| Snyk | Comprehensive scanning | [ ] |
| SonarQube | Code quality + security | [ ] |

---

## 20. Dynamic Analysis (DAST)

### 20.1 Automated Scanning

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DAST.01 | Spider/crawl | Full application crawled | [ ] |
| DAST.02 | Auth scanning | Authenticated scanning | [ ] |
| DAST.03 | API scanning | API endpoints scanned | [ ] |
| DAST.04 | Scheduled scans | Regular automated scans | [ ] |

### 20.2 Vulnerability Testing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| DVULN.01 | Injection testing | Automated injection testing | [ ] |
| DVULN.02 | XSS testing | Automated XSS testing | [ ] |
| DVULN.03 | CSRF testing | CSRF vulnerability testing | [ ] |
| DVULN.04 | Auth testing | Authentication bypass testing | [ ] |

### 20.3 Recommended DAST Tools

| Tool | Purpose | Status |
|------|---------|--------|
| OWASP ZAP | Web app scanning | [ ] |
| Burp Suite | Manual + automated testing | [ ] |
| Nuclei | Template-based scanning | [ ] |
| Nikto | Web server scanning | [ ] |
| SQLMap | SQL injection testing | [ ] |
| Wfuzz | Web fuzzing | [ ] |
| Postman + Newman | API testing | [ ] |

---

## 21. Penetration Testing

### 21.1 Reconnaissance

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| RECON.01 | Subdomain enumeration | All subdomains identified | [ ] |
| RECON.02 | Technology fingerprinting | Tech stack identified | [ ] |
| RECON.03 | Endpoint discovery | All endpoints mapped | [ ] |
| RECON.04 | Information disclosure | Sensitive info in public | [ ] |
| RECON.05 | OSINT | Open source intelligence review | [ ] |

### 21.2 Authentication Testing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| PAUTH.01 | Default credentials | Default creds tested | [ ] |
| PAUTH.02 | Brute force | Brute force resistance | [ ] |
| PAUTH.03 | Password policy bypass | Policy bypass attempts | [ ] |
| PAUTH.04 | Session fixation | Session fixation tested | [ ] |
| PAUTH.05 | Session hijacking | Session hijacking tested | [ ] |
| PAUTH.06 | OAuth bypass | OAuth flow bypass attempts | [ ] |
| PAUTH.07 | MFA bypass | MFA bypass attempts | [ ] |
| PAUTH.08 | Remember me abuse | Remember me security | [ ] |

### 21.3 Authorization Testing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| PAUTHZ.01 | IDOR testing | Object reference manipulation | [ ] |
| PAUTHZ.02 | Privilege escalation | Vertical escalation attempts | [ ] |
| PAUTHZ.03 | Horizontal escalation | Horizontal access attempts | [ ] |
| PAUTHZ.04 | Function level | Admin function access | [ ] |
| PAUTHZ.05 | Path traversal | Directory traversal tests | [ ] |

### 21.4 Injection Testing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| PINJ.01 | SQL injection | All input points tested | [ ] |
| PINJ.02 | XSS stored | Stored XSS attempts | [ ] |
| PINJ.03 | XSS reflected | Reflected XSS attempts | [ ] |
| PINJ.04 | XSS DOM | DOM-based XSS attempts | [ ] |
| PINJ.05 | Command injection | OS command injection | [ ] |
| PINJ.06 | Template injection | Template injection tests | [ ] |
| PINJ.07 | Header injection | HTTP header injection | [ ] |
| PINJ.08 | LDAP injection | LDAP injection tests | [ ] |
| PINJ.09 | XML injection | XXE and XML injection | [ ] |

### 21.5 Business Logic Testing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| PBIZ.01 | Workflow bypass | Workflow step skipping | [ ] |
| PBIZ.02 | Rate limit bypass | Rate limiting circumvention | [ ] |
| PBIZ.03 | Race conditions | Race condition exploitation | [ ] |
| PBIZ.04 | Parameter tampering | Hidden parameter manipulation | [ ] |
| PBIZ.05 | Price manipulation | Price/quantity tampering | [ ] |
| PBIZ.06 | Feature abuse | Feature misuse scenarios | [ ] |

### 21.6 Client-Side Testing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| PCLI.01 | Source code review | Exposed secrets in JS | [ ] |
| PCLI.02 | Local storage | Sensitive data in storage | [ ] |
| PCLI.03 | Postmessage | PostMessage vulnerabilities | [ ] |
| PCLI.04 | CORS | CORS misconfiguration | [ ] |
| PCLI.05 | Websocket | WebSocket security | [ ] |
| PCLI.06 | Client validation | Bypass client-side validation | [ ] |

### 21.7 API Testing

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| PAPI.01 | Endpoint discovery | Hidden endpoints found | [ ] |
| PAPI.02 | Method tampering | HTTP method manipulation | [ ] |
| PAPI.03 | Content-Type | Content-Type bypass | [ ] |
| PAPI.04 | Mass assignment | Mass assignment vulnerabilities | [ ] |
| PAPI.05 | GraphQL | GraphQL-specific tests | [ ] |
| PAPI.06 | API versioning | Old API version access | [ ] |

---

## 22. Security Headers

### 22.1 Required Headers

| ID | Header | Recommended Value | Status |
|----|--------|-------------------|--------|
| HDR.01 | Content-Security-Policy | Strict policy, no unsafe-inline | [ ] |
| HDR.02 | Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | [ ] |
| HDR.03 | X-Frame-Options | DENY | [ ] |
| HDR.04 | X-Content-Type-Options | nosniff | [ ] |
| HDR.05 | Referrer-Policy | strict-origin-when-cross-origin | [ ] |
| HDR.06 | Permissions-Policy | Restrictive policy | [ ] |
| HDR.07 | Cross-Origin-Opener-Policy | same-origin | [ ] |
| HDR.08 | Cross-Origin-Embedder-Policy | require-corp (if applicable) | [ ] |
| HDR.09 | Cross-Origin-Resource-Policy | same-site | [ ] |

### 22.2 Cookie Attributes

| ID | Attribute | Description | Status |
|----|-----------|-------------|--------|
| COOK.01 | Secure | Cookies only over HTTPS | [ ] |
| COOK.02 | HttpOnly | Cookies not accessible via JS | [ ] |
| COOK.03 | SameSite | SameSite=Strict or Lax | [ ] |
| COOK.04 | Path | Appropriate cookie path | [ ] |
| COOK.05 | Domain | Appropriate cookie domain | [ ] |
| COOK.06 | Expiration | Appropriate expiration | [ ] |

### 22.3 CSP Directives

| ID | Directive | Recommended Value | Status |
|----|-----------|-------------------|--------|
| CSP.01 | default-src | 'self' | [ ] |
| CSP.02 | script-src | 'self' (no unsafe-inline/eval) | [ ] |
| CSP.03 | style-src | 'self' 'unsafe-inline' (required for Tailwind CSS) | [~] |
| CSP.04 | img-src | Specific domains | [ ] |
| CSP.05 | font-src | 'self' or specific CDN | [ ] |
| CSP.06 | connect-src | Specific API domains | [ ] |
| CSP.07 | frame-src | 'none' or specific | [ ] |
| CSP.08 | frame-ancestors | 'none' | [ ] |
| CSP.09 | object-src | 'none' | [ ] |
| CSP.10 | base-uri | 'self' | [ ] |
| CSP.11 | form-action | 'self' | [ ] |
| CSP.12 | upgrade-insecure-requests | Present | [ ] |
| CSP.13 | report-uri / report-to | Configured for monitoring | [ ] |

---

## 23. Compliance & Privacy Regulations

### 23.1 GDPR (if applicable)

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| GDPR.01 | Lawful basis | Legal basis for processing | [ ] |
| GDPR.02 | Consent | Proper consent mechanisms | [ ] |
| GDPR.03 | Data subject rights | Access, rectification, erasure | [ ] |
| GDPR.04 | Data portability | Export functionality | [ ] |
| GDPR.05 | Privacy notices | Clear privacy policy | [ ] |
| GDPR.06 | DPA | Data Processing Agreements | [ ] |
| GDPR.07 | DPIA | Data Protection Impact Assessment | [ ] |
| GDPR.08 | Breach notification | 72-hour notification process | [ ] |

### 23.2 CCPA (if applicable)

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| CCPA.01 | Right to know | Disclose data collected | [ ] |
| CCPA.02 | Right to delete | Deletion mechanism | [ ] |
| CCPA.03 | Right to opt-out | Opt-out of data sale | [ ] |
| CCPA.04 | Non-discrimination | Equal service for opt-out | [ ] |
| CCPA.05 | Privacy notice | Updated privacy policy | [ ] |

### 23.3 SOC 2 (if applicable)

| ID | Check | Description | Status |
|----|-------|-------------|--------|
| SOC2.01 | Security | Security controls | [ ] |
| SOC2.02 | Availability | Uptime commitments | [ ] |
| SOC2.03 | Processing Integrity | Accurate processing | [ ] |
| SOC2.04 | Confidentiality | Data protection | [ ] |
| SOC2.05 | Privacy | Privacy practices | [ ] |

---

## Appendix A: Security Testing Schedule

| Test Type | Frequency | Last Performed | Next Due |
|-----------|-----------|----------------|----------|
| Dependency audit (npm audit) | Weekly (automated via Dependabot + CI) | 2025-12-02 | Automated |
| SAST scan | Per commit (ESLint + TypeScript in CI) | 2025-12-02 | Automated |
| DAST scan | Monthly | | |
| Penetration test | Annually | | |
| Security header check | Monthly | | |
| Access control review | Quarterly | | |
| RLS policy review | Quarterly | | |
| Third-party audit | Annually | | |

---

## Appendix B: Security Contacts

| Role | Name | Contact | Backup |
|------|------|---------|--------|
| Security Lead | | | |
| Incident Response | | | |
| Supabase Admin | | | |
| Vercel Admin | | | |

---

## Appendix C: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-02 | Claude | Initial comprehensive checklist |
| 1.1 | 2025-12-02 | Claude | Added CI/CD security pipeline, Dependabot, marked completed items |
| 1.2 | 2025-12-03 | Claude | Fixed CORS (Access-Control-Allow-Origin), documented style-src unsafe-inline as accepted |

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Vercel Security](https://vercel.com/docs/security)
- [React Security Best Practices](https://react.dev/reference/react-dom/components/form#preventing-cross-site-scripting)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
