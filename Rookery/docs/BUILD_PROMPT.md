# TAYAR — BUILD PROMPT (single source of truth for the AI agent)

Hackathon: Rookery (2026). Build from scratch today. Add no features beyond this document.
## 0. Rules of engagement (MANUAL MODE — no tools)
- You cannot run commands or edit files. Never output tool-call markup of any kind.
- Credits are limited. Keep replies under 10 lines outside code. Never re-send files you
  did not change.
- Files: for every file you create or change, put its relative path on the line above a
  fenced code block containing the COMPLETE file. I will create or apply it.
- Commands: give the exact PowerShell command in a code block, then stop. I will run it
  and paste the output (30 lines max). Diagnose from that output only.
- Secrets: never print, echo, hardcode or ask me to paste a secret. Use .env. If a variable
  is missing, tell me its NAME only.
- Environment: Windows + PowerShell. Use npm scripts and Node scripts, not bash-only commands.
- Per task: (1) name the task, (2) list the files, (3) give the files, (4) give the commands
  to run (`npm run lint --if-present`, `npm run build`, and from T3 `npm run smoke`),
  (5) give the commit command, (6) say "WAITING FOR OUTPUT" and stop.
- If my output shows a failure, fix it in at most 2 rounds, then stop and report in 10 lines.
- Never delete my files without asking.

## 1. Product
Tayar (तैयार) = "ready". A papers-first queue for small offices and clinics.
A citizen says what they need, sees the exact papers to bring, ticks what they have,
and gets a token ONLY when every paper is ticked. The clerk sees who is ready and who is
still gathering. Checklists are typed data entered by the office; the AI never generates
requirements. Its only job is mapping free text to one of the office's own services.

## 2. Scope
IN: citizen flow (service picker, optional need box, checklist with hints, token + wait),
clerk page (PIN, lanes, call next, done, send back, counters, QR, demo helpers),
Marathi/English toggle, demo-data banner, one AI call with mock + fallback,
memory store then Supabase store, deploy files.
OUT (do not build): user accounts/login, SMS/email, payments, voice/speech, analytics,
PDF generation, websockets, Hindi, admin UI (stretch only after everything else works).

## 3. Stack
- Node.js current LTS (check `node -v`; 22.x preferred).
- Next.js (App Router), TypeScript, Tailwind CSS — versions from `create-next-app@latest`,
  no src/ directory, npm, keep package-lock.json.
- @supabase/supabase-js (latest) used only server-side.
- QR code: one small npm library (credit it in README).
- AI: plain `fetch` to an OpenAI-compatible chat-completions endpoint. No SDK.

## 4. File tree
tayar/
  docs/BUILD_PROMPT.md   README.md   .env.example   .gitignore   .dockerignore
  Dockerfile   docker-compose.yml   next.config.(ts|mjs)   package.json
  .github/workflows/ci.yml
  supabase/schema.sql
  data/seed.json
  public/.gitkeep
  scripts/smoke.mjs   scripts/ai-check.mjs
  lib/types.ts  lib/i18n.ts  lib/wait.ts  lib/ai.ts  lib/security.ts
  lib/store/index.ts  lib/store/memory.ts  lib/store/supabase.ts
  components/ChecklistItem.tsx  TokenCard.tsx  LangToggle.tsx  QueueLanes.tsx  DemoBanner.tsx
  app/layout.tsx  app/page.tsx
  app/o/[office]/page.tsx
  app/o/[office]/checklist/[visitId]/page.tsx
  app/o/[office]/ticket/[visitId]/page.tsx
  app/clerk/[office]/page.tsx
  app/api/health/route.ts
  app/api/services/route.ts
  app/api/map-need/route.ts
  app/api/visits/route.ts
  app/api/visits/[id]/route.ts
  app/api/visits/[id]/ready/route.ts
  app/api/queue/route.ts
  app/api/clerk/call-next/route.ts
  app/api/clerk/done/route.ts
  app/api/clerk/send-back/route.ts
  app/api/clerk/reset/route.ts
  app/api/clerk/demo-visitors/route.ts

## 5. Data model
- Office: { id, name_mr, name_en }
- Service: { id, office_id, name_mr, name_en, duration_min, checklist: Item[] }
- Item: { id, label_mr, label_en, how_mr, how_en }   (how = "how to get it" hint)
- Visit: { id, office_id, service_id, items_checked: string[], status, token_no|null,
  sent_back_reason|null, created_at, ready_at|null }
- status: gathering | ready | serving | done | sent_back
- Token numbers are assigned when a visit becomes ready: per office, sequential from 1.
- Wait estimate (minutes) = sum of duration_min of visits in {ready, serving} whose
  token_no is lower than mine.

### data/seed.json (DEMO DATA — placeholders, not official requirements)
One office: id "demo-ward", name_en "Demo Ward Office".
Four services (id: name_en, duration_min): income-cert: Income certificate, 10;
birth-cert: Birth certificate, 8; ration-update: Ration card update, 12;
tax-copy: Property tax receipt copy, 6.
Each service has 4-5 generic items (id, label_en, how_en), for example: aadhaar-copy
"Aadhaar card (photocopy)" / how "Photocopy shop near the office"; photo "Passport-size photo";
declaration "Signed self-declaration form" / how "Ask at the help desk"; address-proof
"Address proof"; hospital-record "Hospital birth record" (birth-cert only).
Write natural Marathi for every _mr field. Add a top comment in the seed file:
"DEMO DATA. Marathi text needs native-speaker review. Replace with items copied from the
office's published list."
Every page shows DemoBanner: "Demo data — verify requirements with your office."

## 6. API (all JSON; errors are { "error": "<code>" } with correct HTTP status)
- GET  /api/health -> { ok:true, store:"memory|supabase", mock:true|false }
- GET  /api/services?office_id= -> Service[]
- POST /api/map-need { office_id, text } -> { service_id|null, confidence:0..1, source:"ai|mock|fallback" }
- POST /api/visits { office_id, service_id } -> { visit_id }
- GET  /api/visits/:id -> Visit + { wait_min|null, ahead:number }
- PATCH /api/visits/:id { items_checked: string[] } -> Visit (ignore unknown item ids)
- POST /api/visits/:id/ready -> { token_no, wait_min }   (400 not_all_ready unless every
  checklist item id of that service is ticked; calling again returns the same token)
- GET  /api/queue?office_id= -> { serving: Visit|null, ready: Visit[] (by token_no),
  gathering: Visit[] (hide those older than 6h), counters: { served_ready, sent_back } }
- Clerk routes require header x-clerk-pin == CLERK_PIN (else 401):
  - POST /api/clerk/call-next { office_id } -> Visit now "serving"
    (409 no_ready_visits if none; 409 finish_current_first if someone is serving)
  - POST /api/clerk/done { visit_id } -> counters.served_ready +1
  - POST /api/clerk/send-back { visit_id, reason } -> reason 1..120 chars (400 otherwise);
    status sent_back; counters.sent_back +1
  - POST /api/clerk/reset { office_id } -> clears visits, reseeds
  - POST /api/clerk/demo-visitors { office_id } -> creates 3 visits
    (1 gathering with 2 items ticked, 2 ready)

## 7. AI contract (lib/ai.ts, route /api/map-need)
- Normalize: trim, max 200 chars (400 if empty).
- Use the live call only if MOCK_MODE=false AND live calls so far < AI_MAX_CALLS.
  Otherwise use mock keyword matching (match words against service names/ids; return
  source "mock"); if nothing matches return service_id:null.
- Live call: POST `${KIMI_API_BASE}/chat/completions`, header Authorization: Bearer KIMI_API_KEY,
  body { model: KIMI_MODEL, max_tokens: AI_MAX_TOKENS, messages: [system, user] }.
  Do not send parameters you do not need (proxy support is unverified).
  System message: list the allowed service ids and names; "Reply with JSON only:
  {\"service_id\": \"<one allowed id or null>\", \"confidence\": <0 to 1>}".
- Parse the first {...} in the reply. If service_id is not in the allowed list -> null.
- Timeout AI_TIMEOUT_MS. On any error/timeout -> { service_id:null, source:"fallback" }.
- Cache results in memory by lowercase text. Never render model output as HTML.
- The UI always asks "We understood: <service>. Is this right?" before continuing.

## 8. Screens (mobile-first, large text, high contrast, tap targets >= 44px)
Every string goes through lib/i18n.ts (mr/en); fall back to en if mr is missing.
- /  redirects to /o/DEFAULT_OFFICE_ID.
- S1 /o/[office]: office name, language toggle, DemoBanner, text box "What do you need?"
  + Find button, then one button per service. After Find: confirm card with [Yes] [No, show all].
  Choosing a service creates a visit and opens the checklist.
- S2 checklist/[visitId]: service name, progress "3 of 5 ready", a large checkbox row per paper,
  unticked rows show "How to get it: ...", "Get token" disabled until all ticked.
  Ticking calls PATCH (debounced) and survives refresh.
- S3 ticket/[visitId]: huge token number, status chip (Ready / Now serving / Done / Sent back),
  wait "about N min" polled every 4 seconds; if sent back show the reason + "Start again".
- S4 /clerk/[office]: PIN gate (PIN kept in sessionStorage, sent as x-clerk-pin).
  Now serving (big); lanes Ready (by token) and Gathering (count + progress);
  buttons Call next, Done, Send back (asks for a reason); counters; QR of the citizen URL
  (from NEXT_PUBLIC_APP_URL); small buttons "Load demo visitors" and "Reset". Poll every 4 seconds.
- Polling only, no websockets. Friendly empty/loading/error states. Never show stack traces.

## 9. Security and credit protection
- Secrets only in server code (app/api/**, lib/**). Never NEXT_PUBLIC_ for secrets.
- PIN compared in constant time; 5 wrong PINs per IP in 5 minutes -> 429 (in-memory limiter).
- /api/map-need rate limit 10/min per IP.
- Supabase: row-level security enabled on all tables with no policies; server uses the
  service-role key only.
- Memory store lives on globalThis so dev hot-reload does not wipe it. It does NOT persist on
  Vercel serverless; the deployed demo must use STORE_DRIVER=supabase.
- With STORE_DRIVER=supabase, seed offices/services on first request if the offices table is empty.
- Token numbering in Supabase: max(token_no)+1 per office (a race is acceptable for the demo).

## 10. Scripts
package.json scripts to add:
  "smoke": "node --env-file=.env scripts/smoke.mjs"
  "ai-check": "node --env-file=.env scripts/ai-check.mjs"
scripts/smoke.mjs (BASE_URL default http://localhost:3000, uses CLERK_PIN) asserts in order:
  4 services; ready before ticking -> 400; tick all then ready -> token 1; a second visit -> token 2;
  call-next -> serving token 1; done -> counters.served_ready 1; send-back without reason -> 400;
  wrong PIN -> 401. Exit non-zero on any failure.
scripts/ai-check.mjs: ONE direct fetch to KIMI_API_BASE with a tiny fixed prompt; print status,
  latency and the first 200 characters of the reply. Never print the key.

## 11. Deploy files (create exactly)

### next.config (merge with the scaffold's file type)
  output: "standalone"

### .gitignore (must include, before the first commit)
  .env
  .env.*
  !.env.example
  node_modules
  .next

### .env.example
(Create it with exactly these lines.)
  STORE_DRIVER=memory
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  CLERK_PIN=
  MOCK_MODE=true
  KIMI_API_BASE=
  KIMI_API_KEY=
  KIMI_MODEL=kimi-k3
  AI_TIMEOUT_MS=8000
  AI_MAX_TOKENS=800
  AI_MAX_CALLS=30
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  DEFAULT_OFFICE_ID=demo-ward
  BASE_URL=http://localhost:3000
  PORT=3000

### supabase/schema.sql
```sql
create table offices (id text primary key, name_mr text, name_en text);
create table services (
  id text primary key,
  office_id text references offices(id),
  name_mr text not null, name_en text not null,
  duration_min int not null default 10,
  checklist jsonb not null
);
create table visits (
  id uuid primary key default gen_random_uuid(),
  office_id text references offices(id),
  service_id text references services(id),
  items_checked jsonb not null default '[]',
  status text not null default 'gathering'
    check (status in ('gathering','ready','serving','done','sent_back')),
  token_no int,
  sent_back_reason text,
  created_at timestamptz default now(),
  ready_at timestamptz
);
create index on visits(office_id, status);
alter table offices enable row level security;
alter table services enable row level security;
alter table visits enable row level security;
```

### Dockerfile
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
services:
  web:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    restart: unless-stopped
```

### .dockerignore
```
node_modules
.next
.git
.env
```

### .github/workflows/ci.yml
```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run build
        env: { MOCK_MODE: "true", STORE_DRIVER: memory, CLERK_PIN: "000000" }
```

## 12. Tasks
T1 Scaffold. Create the Next.js app per section 3 (if create-next-app refuses because of existing
   files, scaffold in a temp folder and move the files in). Add .gitignore (section 11) BEFORE
   the first commit, .env.example, public/.gitkeep, output "standalone", home page "Tayar".
   Done when: dev server renders; `git check-ignore .env` prints .env.
T2 Core data. lib/types.ts, data/seed.json, lib/store/index.ts + memory.ts, lib/i18n.ts,
   lib/wait.ts, lib/security.ts, GET /api/services, GET /api/health.
   Done when: /api/services?office_id=demo-ward returns 4 services.
T3 Visits + clerk API. All routes in section 6 except map-need, plus scripts/smoke.mjs and the
   npm script. Done when: `npm run smoke` passes.
T4 Citizen UI. S1 (without AI: the Find button shows all services), S2, S3, DemoBanner,
   LangToggle, polling. Done when: in the browser, ticking all items + "Get token" shows a token page.
   >>> STOP and wait for me (Round 1 checkpoint).
T5 Clerk UI. S4 including QR and demo helpers.
   Done when: two tabs show a citizen's token appearing on the clerk board.
T6 AI mapper. lib/ai.ts, /api/map-need, the confirm step in S1, scripts/ai-check.mjs.
   Done when: with MOCK_MODE=true a Marathi or English phrase maps to a service; with an invalid
   key and MOCK_MODE=false the UI falls back to buttons without crashing.
T7 Polish. i18n coverage, loading/error states, page titles, 360px-wide layout check.
   Done when: build passes and no raw error text reaches the UI.
   >>> STOP and wait for me.
T8 Supabase store. lib/store/supabase.ts, STORE_DRIVER switch, first-request seeding.
   >>> STOP first: I must create the Supabase project, run schema.sql, and fill .env.
   Done when: with STORE_DRIVER=supabase the smoke test passes and a server restart keeps the visits.
T9 Deploy files. Dockerfile, docker-compose.yml, .dockerignore, ci.yml (section 11).
   Done when: `npm run build` passes (docker build only if Docker is installed).
T10 README. Create README.md as a clean merge of this document: problem, features,
   architecture, setup, env variable names, deploy steps, demo script, credits (every library),
   a clearly marked [TEAM QUOTE] placeholder. Done when: README.md exists.

## 13. Final report (after the last task)
List: what works, what is mocked, what is unverified, and every env var I must set.