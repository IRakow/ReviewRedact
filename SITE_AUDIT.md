# ReviewRedact / BTS Solutions — Full Site Audit

**Date:** 2026-03-26
**Auditor:** Claude Opus 4.6
**Site:** reviewredact.com
**Stack:** Next.js (App Router), Supabase (Postgres + Auth), Resend (email), Outscraper (scraping), Valor Pay (payments)

---

## Section 1: Route Inventory

### Public Routes (No Auth Required)

| Path | Method | Description |
|------|--------|-------------|
| `/` | GET | Landing page — 3D vault room (Three.js) with login panel |
| `/pay/[token]` | GET | Client payment page — accessed via invoice email link |

### Auth API Routes

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/api/auth/login` | POST | None | Login with name + 6-digit PIN; returns JWT session |
| `/api/auth/logout` | POST | None | Clears session cookie |
| `/api/auth/reset-pin` | POST | None | Self-service PIN reset by name; emails new code |

### Dashboard Routes (Reseller + Salesperson)

| Path | Method | Role Access | Description |
|------|--------|-------------|-------------|
| `/dashboard` | GET | Reseller, Salesperson | Client list with search/filter (owners redirect to /owner) |
| `/dashboard/clients/new` | GET | Reseller, Salesperson | Add new client form |
| `/dashboard/clients/[id]` | GET | Reseller, Salesperson | Client detail — reviews, contracts, scraping |
| `/dashboard/invoices` | GET | Reseller, Salesperson | Invoice list for user's clients |
| `/dashboard/prospect` | GET | All roles | Sales prospect tool — paste Google URL, analyze live |
| `/dashboard/prospects` | GET | All roles | Saved prospects/leads list |
| `/dashboard/prospects/[id]` | GET | All roles | Prospect detail |
| `/dashboard/settings` | GET | Reseller only | Manage salespeople, commission plans, rates |
| `/dashboard/settings/salespeople/new` | GET | Reseller only | Add new salesperson form |
| `/dashboard/portal` | GET | Salesperson only | Salesperson portal — personal stats |
| `/dashboard/portal/pricing` | GET | Salesperson only | Pricing information for salesperson |

### Document Signing

| Path | Method | Role Access | Description |
|------|--------|-------------|-------------|
| `/sign` | GET | Reseller, Salesperson | W-9/1099 + Contractor Agreement signing flow (redirects if already signed) |

### Owner Panel Routes

| Path | Method | Role Access | Description |
|------|--------|-------------|-------------|
| `/owner` | GET | Owner only | Owner dashboard — stats, revenue, recent invoices, activity |
| `/owner/resellers` | GET | Owner only | All resellers list |
| `/owner/resellers/[id]` | GET | Owner only | Reseller detail — edit rates, commission, status, view SPs |
| `/owner/salespeople` | GET | Owner only | All salespeople list |
| `/owner/salespeople/[id]` | GET | Owner only | Salesperson detail — edit rates, plan, commission, status |
| `/owner/salespeople/new` | GET | Owner only | Add new owner-direct salesperson |
| `/owner/clients` | GET | Owner only | All clients list |
| `/owner/clients/[id]` | GET | Owner only | Client detail (owner view) |
| `/owner/clients/new` | GET | Owner only | Add client (owner) |
| `/owner/invoices` | GET | Owner only | All invoices |
| `/owner/payments` | GET | Owner only | All payments |
| `/owner/documents` | GET | Owner only | All signed documents (W-9, contractor agreements) |
| `/owner/reports` | GET | Owner only | Reports dashboard — charts, revenue trends |
| `/owner/reports/builder` | GET | Owner only | Custom report builder |
| `/owner/reports/resellers` | GET | Owner only | Per-reseller reports |
| `/owner/reports/resellers/[id]` | GET | Owner only | Individual reseller report detail |
| `/owner/reports/salespeople` | GET | Owner only | Per-salesperson reports |
| `/owner/overrides` | GET | Owner only | Rate override management |
| `/owner/time-machine` | GET | Owner only | Time machine hub — database + codebase snapshots |
| `/owner/time-machine/database` | GET | Owner only | Database snapshot timeline |
| `/owner/time-machine/database/[id]` | GET | Owner only | Database snapshot detail |
| `/owner/time-machine/database/diff` | GET | Owner only | Database snapshot comparison |
| `/owner/time-machine/codebase` | GET | Owner only | Codebase commit timeline |
| `/owner/time-machine/codebase/[sha]` | GET | Owner only | Codebase commit detail |

### Admin Routes (Legacy)

| Path | Method | Role Access | Description |
|------|--------|-------------|-------------|
| `/admin` | GET | Owner only | Legacy admin panel |
| `/admin/resellers/[id]` | GET | Owner only | Legacy reseller detail |
| `/admin/resellers/new` | GET | Owner only | Legacy add reseller |

### API Routes (Authenticated)

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/api/scrape` | POST | Any session | Scrape Google reviews for a client |
| `/api/contracts/generate` | POST | Any session | Generate DRMC contract PDF |
| `/api/email` | POST | Any session | Email contract PDF to client |
| `/api/owner/team-options` | GET | Owner only | Fetch resellers + salespeople for dropdown menus |

### Cron Routes (Server-to-server)

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/api/cron/scrape` | GET | CRON_SECRET | 3x daily — scrape in_progress reviews, detect removals, auto-invoice |
| `/api/cron/late-payments` | GET | CRON_SECRET | Daily — mark overdue invoices, send reminders |
| `/api/cron/backup` | GET | CRON_SECRET | Daily 3 AM — full database backup to GCS |

---

## Section 2: Role-by-Role Walkthrough

### Owner (role: "owner" in resellers table)

**Login flow:** Enter name + PIN at `/` vault. Redirected to `/owner`.

**What they see after login:**
- Owner Dashboard with aggregate stats: reseller count, salesperson count, total clients, reviews removed, revenue, pending/overdue invoices
- Recent invoices panel and recent activity (notifications) panel
- Full sidebar: Dashboard, Resellers, Salespeople, Clients, Invoices, Payments, Documents, Reports, Rate Overrides, Time Machine

**Pages accessible:**
- All `/owner/*` routes (10+ pages)
- `/dashboard/*` routes (redirects to /owner from main dashboard)
- `/dashboard/prospect` and `/dashboard/prospects` (sales tools)

**Actions available:**
- View/edit any reseller: rates, commission plan, active status, **reset PIN**
- View/edit any salesperson: rates, plan, commission, active status, **reset PIN**
- Create owner-direct salespeople
- View all clients, invoices, payments, documents
- Run reports (overview, per-reseller, per-salesperson, custom builder)
- Set rate overrides for any reseller or salesperson on any client
- Browse Time Machine: database snapshots with diff comparison, codebase commit history
- Use prospect/sales tools

### Reseller (role: "reseller" in resellers table)

**Login flow:** Enter name + PIN at `/`. If documents not signed, redirected to `/sign`. Otherwise `/dashboard`.

**What they see after login:**
- Client list filtered to their own clients (and their salespeople's clients)
- Sidebar: Clients, Prospect, Leads, Salespeople, Invoices

**Pages accessible:**
- `/dashboard` — client list
- `/dashboard/clients/new` — add client
- `/dashboard/clients/[id]` — client detail (must belong to them)
- `/dashboard/invoices` — invoices for their clients
- `/dashboard/prospect` — sales prospect tool
- `/dashboard/prospects` — saved leads
- `/dashboard/settings` — manage salespeople, commission plans
- `/dashboard/settings/salespeople/new` — add salesperson

**Actions available:**
- Add/manage clients
- Scrape Google reviews for clients
- Generate DRMC contracts
- Email contracts to clients
- Create salespeople (assigned to them)
- Edit salesperson rates, commission plans
- Toggle salesperson active/inactive
- **Reset salesperson PINs** (new feature)
- Set deal-level rate overrides for salespeople
- Use prospect/sales tools

### Salesperson (under reseller; parent_type: "reseller")

**Login flow:** Enter name + PIN at `/`. If documents not signed, redirected to `/sign`. Otherwise `/dashboard`.

**What they see after login:**
- Client list filtered to their assigned clients only
- Sidebar: Clients, Prospect, Leads, Invoices

**Pages accessible:**
- `/dashboard` — their clients only
- `/dashboard/clients/new` — add client (assigned to them + their reseller)
- `/dashboard/clients/[id]` — client detail (must be theirs)
- `/dashboard/invoices` — their invoices
- `/dashboard/prospect` — sales prospect tool
- `/dashboard/prospects` — saved leads
- `/dashboard/portal` — personal stats portal
- `/dashboard/portal/pricing` — pricing info

**Actions available:**
- Add/manage their own clients
- Scrape reviews, generate contracts, email contracts
- Use prospect/sales tools
- View their personal stats and pricing

### Owner-Direct Salesperson (parent_type: "owner", no reseller_id)

Same as reseller-salesperson but created directly by owners. Uses Plan A ($750 flat) or Plan B ($1K+ base). No parent reseller to manage their settings.

---

## Section 3: Issues Found & Fixed

### Issue 1: No PIN Reset Mechanism
- **What was wrong:** Users who forgot their 6-digit access code had no way to recover it. Required manual owner intervention.
- **What was fixed:** Built complete PIN reset system:
  - Self-service "Forgot your access code?" on login page
  - API route `/api/auth/reset-pin` that generates new PIN and emails it
  - Owner can reset any reseller's or salesperson's PIN from their detail page
  - Reseller can reset their salespeople's PINs from settings page
  - All resets generate unique PINs and send email notifications
  - Owner notification email sent on self-service resets
- **Current status:** Working. All four reset paths implemented.

---

## Section 4: Feature Inventory

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| 3D Vault Room login | Working | Three.js rendered, dark/clandestine aesthetic |
| PIN-based authentication | Working | 6-digit codes, JWT sessions, 7-day expiry |
| PIN reset (self-service) | Working | New — via login page |
| PIN reset (owner admin) | Working | New — on reseller/SP detail pages |
| PIN reset (reseller admin) | Working | New — on settings SP table |
| Role-based routing | Working | Owner/reseller/salesperson separation |
| Document signing (W-9 + Contractor Agreement) | Working | Required before dashboard access |
| Client management | Working | Add, view, edit clients |
| Google review scraping | Working | Via Outscraper API, manual + cron |
| Review tracking | Working | Status: active, in_progress, removed, waiting_for_payment, paid, failed |
| DRMC contract generation | Working | PDF generation with review details |
| Contract email to client | Working | Via Resend with PDF attachment |
| Automated removal detection | Working | Cron scrapes 3x daily, detects removals |
| Per-review invoicing | Working | Auto-generated when review removed |
| Invoice email to client | Working | With PDF attachment and pay link |
| Client payment page | Working | `/pay/[token]` — credit card / ACH via Valor Pay |
| Late payment detection | Working | Daily cron marks overdue, sends reminders |
| Owner notification emails | Working | Invoice sent, payment received, overdue alerts |
| Reseller/SP notification emails | Working | Review removed, payment received |
| Commission plan management | Working | Fixed, base+split, percentage, flat fee |
| Rate override system | Working | Owner and reseller can set per-deal rates |
| Prospect/sales tool | Working | Paste Google URL, analyze reviews live |
| Saved leads/prospects | Working | Prospect list with status tracking |
| Reports dashboard | Working | Overview charts, revenue trends |
| Per-reseller reports | Working | Drill-down with charts |
| Per-salesperson reports | Working | Aggregate performance |
| Custom report builder | Working | Configurable report generation |
| Database time machine | Working | Full snapshots with diff comparison |
| Codebase time machine | Working | Git commit history browser |
| Database backup cron | Working | Daily to GCS with retention tiers |
| Salesperson portal | Working | Personal stats for salespeople |
| Commission splits | Working | BTS/reseller/salesperson calculated per deal |

### Admin (Legacy)

| Feature | Status | Notes |
|---------|--------|-------|
| Legacy admin panel | Partial | `/admin` exists but superseded by `/owner` panel |

---

## Section 5: Security Audit

### Authentication & Sessions

| Aspect | Assessment | Details |
|--------|------------|---------|
| Auth mechanism | Acceptable | 6-digit PIN + name (case-insensitive ilike match). Not passwords. |
| PIN storage | Concern | PINs stored in plaintext in Supabase. Not hashed. |
| Session tokens | Good | JWT signed with HS256, SESSION_SECRET env var required |
| Session expiry | Good | 7-day max age, httpOnly + secure cookies |
| Session cookie | Good | httpOnly, secure in production, sameSite: lax |
| PIN reset security | Good | Always returns success (doesn't reveal if account exists) |
| PIN uniqueness | Good | generateUniquePinCode checks both tables, 20 attempts |

### Authorization Boundaries

| Boundary | Assessment | Details |
|----------|------------|---------|
| Owner layout guard | Good | `/owner/layout.tsx` checks `session.user_type !== "owner"` and redirects |
| Dashboard layout guard | Good | `/dashboard/layout.tsx` requires valid session |
| Dashboard page guard | Good | Owners redirected to `/owner`, reseller settings check role |
| Client access control | Good | `canAccessClient()` in `lib/auth.ts` checks ownership chain |
| Salesperson ownership | Good | Reseller settings actions verify `sp.reseller_id === session.user_id` |
| API route guards | Good | All authenticated API routes check `getSession()` |
| Cron route protection | Good | Backup route checks CRON_SECRET bearer token |

### Cross-Role Access

| Scenario | Protected? | Details |
|----------|-----------|---------|
| Reseller accessing another reseller's clients | Yes | Filtered by `reseller_id` in queries |
| SP accessing another SP's clients | Yes | Filtered by `salesperson_id` in queries |
| Reseller accessing another reseller's SPs | Yes | Ownership verified in settings actions |
| SP accessing settings page | Yes | Role check redirects non-resellers |
| Non-owner accessing owner panel | Yes | Layout-level redirect |
| Owner reseller PIN reset | Yes | Checks `session.user_type === "owner"` |
| Reseller SP PIN reset | Yes | Checks reseller role + SP ownership |

### Potential Concerns

1. **Plaintext PINs:** PIN codes are stored as plaintext in the `resellers` and `salespeople` tables. While the login route does not expose them (only matched server-side), a database breach would expose all PINs. Consider hashing with bcrypt.

2. **PIN entropy:** 6-digit numeric codes have 1,000,000 possible values. No rate limiting is visible in the login route. An attacker who knows a name could brute-force the PIN. Consider adding rate limiting (e.g., max 5 attempts per name per hour).

3. **Name as identifier:** Login uses case-insensitive name matching. If two users share the same name, only the first match from each table is returned. The `ilike` + `single()` query would error if duplicates exist. This is handled by the PIN being unique, but name collisions could cause confusion.

4. **Self-service PIN reset by name:** The reset endpoint finds users by name (ilike). If someone knows a user's name, they can trigger a PIN reset. The new PIN goes to the user's email, so the attacker doesn't get it. However, this does invalidate the user's current PIN. Consider adding email confirmation before resetting.

5. **No CSRF protection on auth routes:** The login and reset-pin POST routes don't check for CSRF tokens. The `sameSite: lax` cookie setting provides some protection, but dedicated CSRF tokens would strengthen this.

6. **Cron routes:** The scrape and late-payments crons don't appear to check CRON_SECRET (only the backup route does). They rely on not being publicly known. Consider adding CRON_SECRET verification to all cron routes.

---

## Section 6: Recommendations

### High Priority

1. **Hash PINs:** Store PIN codes as bcrypt hashes rather than plaintext. Update the login flow to use `bcrypt.compare()`.

2. **Rate limit login attempts:** Add IP-based or name-based rate limiting to `/api/auth/login` and `/api/auth/reset-pin`. Something like 5 failed attempts per 15 minutes.

3. **Protect all cron routes:** Add CRON_SECRET verification to `/api/cron/scrape` and `/api/cron/late-payments` to match the backup route's pattern.

### Medium Priority

4. **Email confirmation for self-service PIN reset:** Instead of immediately resetting the PIN, send a confirmation link. Only reset after the user clicks the link from their email.

5. **Audit logging:** Log all PIN resets, login attempts, and admin actions to a dedicated audit table. This helps with security forensics and accountability.

6. **Middleware-level auth:** The app currently lacks a `middleware.ts` file (the git status shows it as modified but it doesn't exist at the expected path). Consider adding Next.js middleware to enforce auth at the edge for all `/dashboard/*` and `/owner/*` routes.

7. **Two-factor consideration:** For owner accounts that have access to all data, consider adding a second factor (email OTP) on login.

### Low Priority / UX

8. **Salesperson self-service settings:** Salespeople cannot update their own profile (email, phone). Consider adding a settings page for them.

9. **Notification center:** The app stores notifications in a `notifications` table but there's no in-app notification UI. Users only see notifications via email.

10. **Client portal:** Clients currently only interact via the payment page. Consider a lightweight client portal where they can see their review status and invoices.

11. **Search on owner pages:** The owner resellers/salespeople/clients list pages don't appear to have search/filter. The dashboard client list has `ClientSearch` but the owner-level lists could benefit from the same.

12. **Legacy admin cleanup:** The `/admin` routes appear to be superseded by `/owner`. Consider removing them to reduce confusion and attack surface.

13. **Mobile responsiveness:** The sidebar-based layout uses fixed widths (w-56). Verify mobile responsiveness across all pages.

---

## Appendix: Database Tables

Based on type definitions and queries observed:

| Table | Purpose |
|-------|---------|
| `resellers` | Owners + resellers (differentiated by `role` column) |
| `salespeople` | All salespeople (reseller-owned + owner-direct) |
| `clients` | Business clients with Google URLs |
| `reviews` | Individual reviews scraped from Google |
| `snapshots` | Review aggregate snapshots (rating/count over time) |
| `contracts` | DRMC contracts linking clients to selected reviews |
| `invoices` | Per-review invoices with payment tracking |
| `payments` | Payment records (credit card / ACH) |
| `payouts` | Commission payout records |
| `documents` | W-9 and contractor agreement signing records |
| `notifications` | System notifications with email send status |
| `rate_overrides` | Per-deal rate overrides set by owners or resellers |
| `prospects` | Sales leads/prospects with review snapshots |

---

## Appendix: Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `SESSION_SECRET` | JWT signing key for session tokens |
| `RESEND_API_KEY` | Resend email service API key |
| `CRON_SECRET` | Bearer token for cron route authentication |
| Supabase vars | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc. |
| Outscraper vars | API key for Google review scraping |
| Valor Pay vars | Payment processor credentials |
| GCS vars | Google Cloud Storage for database backups |
