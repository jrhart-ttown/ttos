# TTOS — T-Town Pristine Clean Lead Management System

A Next.js-based lead management system for a Tulsa commercial cleaning company. Built to minimize owner time investment through intelligent research, deduplication, and approval workflows.

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (on Railway or local)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `DATABASE_URL` — PostgreSQL connection string from Railway
   - `APP_PASSWORD` — your dashboard login password
   - `INSTANTLY_API_KEY` — v2 API key from Instantly
   - `INSTANTLY_WEBHOOK_SECRET` — random string for webhook validation
   - `INSTANTLY_CAMPAIGN_BASE_HIT` — campaign ID for base-hit outreach
   - `INSTANTLY_CAMPAIGN_WHALE` — campaign ID for whale accounts

3. **Initialize database:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Visit:** http://localhost:3000

### CSV Import

To import your existing spreadsheet:

```bash
npm run import:csv path/to/your/file.csv
```

The script will:
- Auto-detect column headers (fuzzy matching)
- Ask for confirmation before importing
- Run dedup checks
- Print summary of imported/flagged/duplicated records

## Architecture

### Stack
- **Frontend:** Next.js 14 (App Router, React 18)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Simple password-based (APP_PASSWORD env var)
- **Deployment:** Railway

### Core Models
- **Company** — central entity with territory, tier, stage, financials
- **Contact** — emails, names, titles; per-company
- **Interaction** — relationship ledger (calls, meetings, emails)
- **Draft** — outreach awaiting approval (status: PENDING/APPROVED/PUSHED/REJECTED)
- **WhaleMilestone** — tracks advancement of strategic accounts
- **TriggerEvent** — hiring, expansion, sponsorship, etc.
- **InstantlySync** — audit log of pushes to Instantly
- **WebhookEvent** — inbound webhook log from Instantly

## Pages (Phase 1)

- **Pipeline** (`/pipeline`) — table view, filterable by stage/tier/territory/segment, inline stage changes
- **Company Detail** (`/companies/:id`) — full company view, contacts, relationship ledger, interaction logging
- **Login** (`/login`) — password-protected dashboard access

## API Routes (Phase 1)

- `POST /api/auth/login` — password authentication
- `PATCH /api/companies/:id/stage` — change company stage
- `POST /api/companies/:id/interactions` — log interaction
- `POST /api/webhooks/instantly` — inbound webhooks (logs only; processing in Phase 2)

## CLI Scripts

- `npm run import:csv <path>` — import CSV spreadsheet
- `npm run prisma:migrate` — manage database migrations
- `npm run prisma:studio` — open Prisma Studio (visual DB explorer)

## Core Functions (lib/leads.ts)

- `upsertProspect(data)` — insert or return existing company (with dedup logic)
- `createDraft(companyId, contactId, data)` — create pending draft
- `logInteraction(companyId, contactId, data)` — log company interaction
- `createDedupKey(name, domain, address)` — generate dedup key

## Deduplication Rules

1. **Exact match** on `dedupKey` → reject as duplicate
2. **Fuzzy check** (same domain OR similar name + same city) → flag for review
3. **Re-engagement** — LOST accounts with passed `reengageDate` → surface as "eligible for re-engagement"

## Next: Phase 2

- Draft approval workflow
- Instantly push integration
- Campaign mapping + settings page
- Approval Queue page

## Next: Phase 3

- Webhook processing (replies, bounces → auto-stage-update)
- Today/Briefing page
- Whales page
- Territories page

## Reference

See `BUILD_SPEC.md` for the full technical specification and `CLAUDE.md` for operational guidelines.
