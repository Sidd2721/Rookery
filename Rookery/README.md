# Tayar — तैयार

> _तैयार_ (tayar) = "ready" in Marathi/Hindi.

A papers-first queue for small offices and clinics. Citizens see the exact documents to bring, tick what they have, and get a token **only when every paper is ready**. Clerks see who is ready and who is still gathering — eliminating the #1 source of counter delays.

---

## Problem

> [TEAM QUOTE] — *"Roughly X in Y people who reach the counter are missing at least one paper."* — [Name, Role, Office]

The citizen who stands in line for an hour only to be sent back for a missing photocopy. This costs clerks time, citizens dignity, and offices throughput. Tayar solves it before the citizen leaves home.

## How it works

1. **Citizen opens the link** (QR from clerk's screen or a shared URL)
2. **Types or selects what they need** — AI maps free text to one of the office's own services
3. **Sees the exact checklist** — with hints on how to get each document
4. **Ticks items** as they gather them; progress saves on every tick
5. **Gets a token only when all items are ticked** — the gate is enforced server-side
6. **Watches their token** on a polling ticket page (updates every 4 s)
7. **Clerk calls next** from the board — can see who is ready vs gathering

The AI's only job is mapping free text → service. All checklists are typed data entered by the office. The AI **never generates requirements**.

---

## Features (v1 scope)

- Citizen flow: service picker → checklist with hints → token + wait estimate
- Clerk page: PIN gate, call next, done, send back (with reason), counters, QR, demo helpers
- Marathi / English toggle, persisted per device
- Demo-data banner on every page
- One AI call (Kimi-compatible endpoint) with mock fallback
- Memory store (dev) → Supabase (production)
- Deploy: Docker + docker-compose + standalone Next.js + GitHub Actions CI

**Out of scope:** user accounts/login, SMS/email, payments, voice/speech, analytics, PDF, websockets, Hindi, admin UI.

---

## Architecture

```
app/
  o/[office]/           → S1 service picker (citizen)
  o/[office]/checklist/ → S2 checklist (citizen)
  o/[office]/ticket/    → S3 token + wait (citizen)
  clerk/[office]/       → S4 clerk board (clerk)
  api/                  → REST API (all server-side)
lib/
  ai.ts         mock keyword match + live OpenAI-compatible call
  store/        memory (dev) | supabase (prod)
  types.ts      Office, Service, Item, Visit
  i18n.ts       mr/en field picker
  wait.ts       wait-time estimator
  security.ts   constant-time PIN check + rate limiting
data/seed.json  demo office + 4 services (see banner — not official)
```

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Node 22**

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd <repo>
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|---|---|---|
| `STORE_DRIVER` | no | `memory` (default) or `supabase` |
| `SUPABASE_URL` | T8 only | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | T8 only | Service-role key (server only) |
| `CLERK_PIN` | **yes** | PIN for clerk board (any string) |
| `MOCK_MODE` | no | `true` skips live AI calls |
| `KIMI_API_BASE` | for live AI | e.g. `https://api.moonshot.cn/v1` |
| `KIMI_API_KEY` | for live AI | Your Kimi / OpenAI-compatible key |
| `KIMI_MODEL` | no | default `kimi-k3` |
| `AI_TIMEOUT_MS` | no | default 8000 |
| `AI_MAX_TOKENS` | no | default 800 |
| `AI_MAX_CALLS` | no | default 30 |
| `NEXT_PUBLIC_APP_URL` | no | Public URL for QR code |
| `DEFAULT_OFFICE_ID` | no | default `demo-ward` |
| `BASE_URL` | no | For smoke script, default `http://localhost:3000` |

### 3. Run dev

```bash
npm run dev
```

Open `http://localhost:3000` — redirects to `/o/demo-ward`.

Clerk board: `http://localhost:3000/clerk/demo-ward` (use the PIN you set).

### 4. Verify

```bash
npm run smoke       # API smoke test (8 assertions)
npm run ai-check    # one live AI call — prints status + latency
```

---

## Demo script (golden path)

1. Open `/o/demo-ward` on a phone or narrow browser window
2. Type "income certificate" → click Find → confirm "Income certificate"
3. Go through the checklist: tick all 4 items — progress bar fills
4. Click **Get token** → ticket page shows a large token number
5. In another tab open `/clerk/demo-ward` → enter PIN
6. Click **Call next** — token appears as "Now serving" on clerk board
7. On the citizen tab: status chip flips to "Now serving" within 4 s
8. Clerk clicks **Done** — counter increments

**Demo modes:**
- `MOCK_MODE=true` — no AI credits, identical UX (keyword matching)
- Bad API key + `MOCK_MODE=false` — falls back to buttons, no crash
- No network — friendly error, recovers on reconnect

---

## Deploy

### Docker

```bash
docker build -t tayar .
docker run -p 3000:3000 --env-file .env tayar
# or
docker compose up
```

### Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars from `.env.example`
4. Set `STORE_DRIVER=supabase` and fill Supabase vars
5. Deploy — `output: "standalone"` is already set in `next.config.ts`

### Supabase (T8)

1. Create a new Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Copy Project URL + service-role key into `.env`
4. Set `STORE_DRIVER=supabase`
5. On first request, offices/services are seeded automatically

---

## Libraries & credits

| Library | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.x | App framework (App Router) |
| [React](https://react.dev) | 19.x | UI |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Styling |
| [uuid](https://github.com/uuidjs/uuid) | 14.x | Generating visit IDs |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Type safety |
| [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) | latest | Database (T8) |

QR code: URL displayed as text for v1; a library will be added in T5+ (candidate: `qrcode` — MIT license).

---

## What works / what is mocked / what is unverified

| Item | State |
|---|---|
| Citizen S1–S3 | ✅ Works |
| Clerk S4 | ✅ Works |
| API all routes | ✅ Works |
| AI map-need MOCK_MODE=true | ✅ Works (keyword match) |
| AI map-need live call | ⚠️ Unverified — needs KIMI_API_KEY |
| Supabase store | ⚠️ Stub — activated in T8 |
| QR code image | ⚠️ Shows URL text only — library TBD |
| Marathi text | ⚠️ Needs native-speaker review |

---

*Built in one day at Rookery Hackathon 2026.*
