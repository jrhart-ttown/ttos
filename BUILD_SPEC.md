# T-Town Pristine Clean — Lead Management System (TTOS)
## Build Specification for Claude Code

This document is the complete build brief. Read it fully before writing code. The companion file `CLAUDE.md` contains the business operating system and must be placed at the repo root — it governs how Claude Code behaves in future working sessions inside this repo.

---

## 1. What We're Building

A lead management system for a Tulsa commercial cleaning company, operated by a solo owner who works a full-time job elsewhere. The system must minimize his daily time investment (target: 30–45 min/day).

Core loop:
1. Owner runs a Claude Code session: "research 15 dental offices in Broken Arrow"
2. Claude Code researches prospects (web search), dedupes against the database, scores them, drafts a personalization line + email draft per company, inserts them as `queued`
3. Owner reviews/edits drafts in the dashboard, clicks Approve
4. Approved leads push to Instantly via API (bulk add endpoint) with the personalization as a merge field
5. Instantly webhooks update pipeline stages automatically on reply/bounce
6. Dashboard surfaces a Daily Briefing: follow-ups due, drafts awaiting approval, whale next-actions, territory coverage

**Hard rule: nothing is ever sent or pushed to Instantly without explicit human approval.** The approval gate is the single most important feature.

---

## 2. Stack

- **App**: Next.js (App Router, TypeScript), deployed on Railway
- **Database**: PostgreSQL on Railway
- **ORM**: Prisma
- **Styling**: Tailwind. Clean, dense, professional — this is an internal ops tool for a CPA. Tables over cards. No marketing fluff.
- **Auth**: Single-user. Protect all routes and API endpoints with a shared secret (env var `APP_PASSWORD`) via middleware — simple cookie session after a password page. Webhook endpoint excluded from auth but protected by its own secret (see §6).
- **Scripts**: `scripts/` directory with tsx CLI scripts for import and sync (also callable from API routes).

Keep dependencies minimal. No queue systems, no Redis, no background workers — Railway cron or manual triggers are sufficient at this scale (hundreds of leads, not millions).

---

## 3. Database Schema (Prisma)

Use these models. Field names matter — CLAUDE.md references them.

### Company (the central entity)
- `id` (cuid)
- `name` (string)
- `nameNormalized` (string) — lowercased, punctuation/suffixes stripped (LLC, Inc, PLLC, PC, DDS)
- `website` (string, nullable)
- `domain` (string, nullable) — extracted from website or email domain
- `address`, `city`, `state` (default "OK"), `zip` (all nullable)
- `territory` (enum: SOUTH_TULSA, JENKS, BROKEN_ARROW, BIXBY, MIDTOWN_TULSA, OWASSO, SAND_SPRINGS, SAPULPA, OTHER)
- `industry` (string) — free text, e.g. "Dental", "Wealth Management", "Machine Shop"
- `segment` (enum: BASE_HIT, WHALE)
- `tier` (enum: A, B, C, UNSCORED)
- `stage` (enum: NEW, RESEARCHED, QUEUED, CONTACTED, REPLIED, WALKTHROUGH_SCHEDULED, PROPOSAL_SENT, WON, LOST, NURTURE)
- `lostReason` (string, nullable)
- `reengageDate` (date, nullable) — required when stage = LOST (enforce in app logic: default +9 months)
- `estMonthlyValue` (int, nullable) — dollars
- `sqftEstimate` (int, nullable)
- `locationsCount` (int, default 1)
- `whyTheyFit` (text, nullable) — research summary
- `dedupKey` (string, **unique**) — see §4
- `source` (string) — "csv_import", "claude_research", "referral", "manual"
- `nextActionDate` (date, nullable), `nextAction` (string, nullable)
- `createdAt`, `updatedAt`

### Contact
- `id`, `companyId` (FK)
- `firstName`, `lastName` (nullable — office emails often have no name)
- `title` (nullable)
- `email` (nullable), `phone` (nullable)
- `contactType` (enum: DECISION_MAKER, OFFICE_MANAGER, PRACTICE_ADMIN, OPERATIONS_MANAGER, GENERAL_OFFICE, CONTACT_FORM)
- `isPrimary` (boolean)
- Unique constraint on (`companyId`, `email`) where email is not null

### Interaction (the Relationship Ledger)
- `id`, `companyId` (FK), `contactId` (FK, nullable)
- `date`, `channel` (enum: EMAIL, CALL, MEETING, WALKTHROUGH, EVENT, OTHER)
- `summary` (text)
- `painPoints` (text, nullable)
- `contractTiming` (string, nullable) — e.g. "renews October 2026"
- `referralsDiscussed` (text, nullable)
- `nextSteps` (text, nullable)
- `followUpDate` (date, nullable)

### Draft (outreach awaiting approval)
- `id`, `companyId` (FK), `contactId` (FK)
- `personalization` (text) — the company-specific opener; this is what merges into Instantly
- `emailBody` (text) — full draft for owner reference / whale bespoke emails
- `subjectLine` (string, nullable)
- `status` (enum: PENDING, APPROVED, PUSHED, REJECTED)
- `campaignId` (string, nullable) — target Instantly campaign
- `pushedAt` (timestamp, nullable)
- `instantlyResponse` (json, nullable) — store API response for audit

### WhaleMilestone
- `id`, `companyId` (FK)
- `milestone` (enum: INTRODUCTION_SECURED, COFFEE_MEETING, EVENT_ATTENDANCE, SITE_VISIT, PROPOSAL_REQUESTED, BUDGET_TIMING_IDENTIFIED)
- `date`, `notes` (text, nullable)

### TriggerEvent
- `id`, `companyId` (FK)
- `type` (enum: NEW_OFFICE, RELOCATION, EXPANSION, HIRING_GROWTH, LEADERSHIP_CHANGE, ADMIN_TURNOVER, CONSTRUCTION, RENOVATION, AWARD, SPONSORSHIP, ANNOUNCEMENT, OTHER)
- `description` (text), `sourceUrl` (string, nullable), `eventDate` (date, nullable)
- `usedInOutreach` (boolean, default false)

### InstantlySync (audit log)
- `id`, `draftId` (FK), `companyId` (FK)
- `campaignId` (string), `instantlyLeadEmail` (string)
- `pushedAt`, `status` (enum: SUCCESS, FAILED), `errorMessage` (nullable)

### WebhookEvent (raw inbound log)
- `id`, `receivedAt`, `eventType` (string), `leadEmail` (string, nullable), `payload` (json), `processed` (boolean)

---

## 4. Deduplication

`dedupKey` = `nameNormalized + "|" + (domain ?? "") + "|" + normalized street address (lowercased, abbreviations expanded: st→street, ave→avenue, etc.)`.

On any insert (import script, Claude research, manual add):
1. Exact match on `dedupKey` → reject as duplicate, return the existing record
2. Fuzzy check: same `domain` OR (similar `nameNormalized` via trigram similarity > 0.6 AND same city) → flag as `possible_duplicate`, require human confirmation before insert (in CLI: prompt; in API: return 409 with the candidate match)
3. Otherwise insert as net new

Enable the `pg_trgm` Postgres extension for the fuzzy match.

Re-engagement rule: if a matched record has stage LOST and `reengageDate` has passed, do not create a new record — surface the existing one as "eligible for re-engagement."

---

## 5. CSV Import

`scripts/import-csv.ts` — imports the owner's existing spreadsheet. Requirements:
- Tolerant of missing fields (some rows have only company + website; others have full contact info)
- Flexible header mapping (case-insensitive, fuzzy match common header names; print the mapping and ask for confirmation before running)
- Runs every row through the dedup logic in §4
- Prints a summary: X imported, Y duplicates skipped, Z flagged for review
- Imported rows get `stage = NEW`, `tier = UNSCORED`, `source = "csv_import"`

---

## 6. Instantly Integration

API version: **v2 only**. Base URL `https://api.instantly.ai/api/v2`. Auth: `Authorization: Bearer ${INSTANTLY_API_KEY}` (a v2-scoped key — v1 keys do not work). Required scopes for the key: `leads:create` at minimum.

### 6a. Push (on draft approval)
Endpoint: `POST /api/v2/leads/add`
- Accepts up to 1,000 leads per call; we'll batch approved drafts
- Body per lead: `email`, `first_name`, `last_name`, `company_name`, `website`, `phone`, `personalization` (the draft's personalization text), and `custom_variables` (flat object, primitive values only — include `industry`, `territory`, `tier`)
- Must provide `campaign_id` (we always push to a campaign, not a list)
- Instantly validates emails and checks its own blocklists/duplicates server-side — treat its skip responses as informational, log them in `InstantlySync`

Flow: owner clicks Approve on drafts in dashboard → "Push to Instantly" action collects all APPROVED drafts for a chosen campaign → single bulk call → on success, mark drafts PUSHED, set company `stage = CONTACTED`, write `InstantlySync` rows, and create an `Interaction` record (channel EMAIL, summary auto-generated from the draft).

Campaign mapping: store campaign IDs in a simple `Setting` key-value table (or env vars) — at minimum `INSTANTLY_CAMPAIGN_BASE_HIT` and `INSTANTLY_CAMPAIGN_WHALE`. Build a small settings page to edit these. Whale outreach defaults to NOT pushing to Instantly (bespoke, sent manually) unless the owner explicitly chooses a campaign.

### 6b. Webhooks (inbound)
Route: `POST /api/webhooks/instantly?secret=${INSTANTLY_WEBHOOK_SECRET}` — reject if secret mismatch. Log every event raw to `WebhookEvent` first, then process.

Handle at minimum:
- **reply received** → match lead email to Contact → set company `stage = REPLIED`, create Interaction, set `nextActionDate = today` so it tops the briefing
- **bounce** → flag the contact (`email` invalid note), log Interaction
- Unknown event types: log and mark processed=false for review

Instantly's webhook event names should be confirmed against their current docs at build time (developer.instantly.ai) — write the handler with a switch on event type and tolerant parsing.

### 6c. Failure handling
All Instantly calls: wrap in try/catch, log failures to `InstantlySync` with `errorMessage`, never crash the approval flow. If the push fails, drafts stay APPROVED (not PUSHED) so retry is safe and idempotent — before pushing, skip any draft whose (companyId, campaignId) already has a SUCCESS sync row.

---

## 7. Dashboard (pages)

1. **Today (home)** — the Daily Executive Briefing, generated from live data:
   - Follow-ups due today/overdue (from `nextActionDate` and Interaction `followUpDate`)
   - Drafts pending approval (count + quick link)
   - Replies awaiting response (stage REPLIED, sorted by date)
   - Top whale next-actions (whales with no milestone activity in 21+ days)
   - LOST accounts whose `reengageDate` has arrived
   - Territory coverage snapshot
2. **Pipeline** — table view of all companies, filterable by stage/tier/territory/segment, inline stage changes, sortable by `nextActionDate`. Include a stage-count summary bar.
3. **Approval Queue** — the most-used page. Pending drafts shown as: company name, tier, contact email, editable personalization line, expandable full email. Approve / Edit / Reject per row, "Approve all" with confirm, then "Push to Instantly" button showing target campaign. Optimize for scanning 20 drafts in 5 minutes.
4. **Company detail** — everything about one company: fields, contacts, trigger events, the full Relationship Ledger (interactions, newest first), drafts history, whale milestones if segment=WHALE. Inline "log interaction" form with the ledger fields from §3.
5. **Whales** — whale accounts with milestone progress visualization (which of the 6 milestones hit), last-touch date, next advancement action.
6. **Territories** — coverage by territory: total prospects, % contacted, % replied, walkthroughs, won. The "we have contacted X% of qualified prospects" report.
7. **Settings** — Instantly campaign IDs, webhook secret display, app password change.

---

## 8. API Routes (for Claude Code sessions)

Claude Code will primarily use Prisma directly via tsx scripts inside the repo (preferred — no HTTP hop). But also expose JSON endpoints the dashboard uses; keep business logic in `lib/` shared by both.

Required shared lib functions (`lib/leads.ts`, `lib/instantly.ts`, `lib/briefing.ts`):
- `upsertProspect(data)` — runs dedup, inserts or returns conflict
- `createDraft(companyId, contactId, {personalization, emailBody, subjectLine})`
- `logInteraction(...)`
- `pushApprovedDrafts(campaignId)`
- `getBriefing()` — returns the Today-page data structure
- `getTerritoryStats()`

---

## 9. Build Phases (commit at each phase boundary)

**Phase 1 — Foundation**: repo scaffold, Prisma schema + migration, auth middleware, CSV import script, Pipeline page, Company detail page with interaction logging.

**Phase 2 — Outreach engine**: Draft model flows, Approval Queue page, Instantly push integration, InstantlySync audit, Settings page.

**Phase 3 — Automation & intelligence**: webhook receiver + stage automation, Today/Briefing page, Whales page, Territories page.

After Phase 1, pause and have the owner run the CSV import against his real spreadsheet before continuing — schema adjustments are cheapest then.

---

## 10. Environment Variables

```
DATABASE_URL=            # Railway Postgres
APP_PASSWORD=            # dashboard login
INSTANTLY_API_KEY=       # v2 key, scopes: leads:create minimum
INSTANTLY_WEBHOOK_SECRET=# random string, also configured in Instantly webhook URL
INSTANTLY_CAMPAIGN_BASE_HIT=
INSTANTLY_CAMPAIGN_WHALE=
```

Never commit secrets. Include `.env.example`.

---

## 11. Non-Goals (do not build)

- Multi-user auth, roles, teams
- Email sending from this app (Instantly does all sending)
- Automatic outreach without approval — never
- Lead scraping/enrichment APIs (research happens in Claude Code sessions with web search; Apollo/ZoomInfo are manual)
- Mobile app (responsive web is enough)
