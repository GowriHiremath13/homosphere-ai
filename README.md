# HomeSphere AI

An intelligent household dashboard for the TV, built for an **Amazon Fire TV / Vega OS**
hackathon. The TV shows weather, an AI daily briefing, today's schedule, and household tasks —
fully navigable with a D-pad remote. A phone can pair with the TV over Wi-Fi (via QR code) and
act as a second-screen controller: add tasks, ask the AI, control a timer, and even use it as a
remote.

> **Demo Mode is on by default.** The whole app — weather, AI, phone pairing — works with zero
> external services or API keys. See [Demo Mode](#demo-mode).

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Folder structure](#folder-structure)
5. [Installation](#installation)
6. [Environment variables](#environment-variables)
7. [Running locally](#running-locally)
8. [TV testing (keyboard / D-pad)](#tv-testing-keyboard--d-pad)
9. [Phone pairing](#phone-pairing)
10. [Demo Mode](#demo-mode)
11. [Amazon Fire TV / Vega OS notes](#amazon-fire-tv--vega-os-notes)
12. [Testing checklist](#testing-checklist)
13. [Known limitations](#known-limitations)
14. [Hackathon demo flow](#hackathon-demo-flow)

---

## Features

- **TV-first UI** at `/tv` — a fixed 1920×1080, 10-foot-readable dashboard, scaled to fit any
  screen, with dark, high-contrast, minimal-clutter styling.
- **Full D-pad / keyboard remote navigation** — Up/Down/Left/Right, Select (Enter), Back
  (Escape) — via a custom spatial-navigation engine (`useTVNavigation`), no mouse required.
- **AI Assistant** — daily briefing, evening/study planning, task prioritization, and
  "before the rain" contextual suggestions. AI always returns **validated structured JSON**; if
  structured output fails, it gracefully falls back to plain text instead of breaking the UI.
- **Phone controller** at `/mobile` — pairs via a **QR code with a 6-character, expiring code**,
  then can add tasks, ask the AI, control the TV's timer, and drive the TV like a remote.
- **Real-time sync** over Socket.IO — phone actions (add task, complete task, ask AI, start
  timer) appear on the TV instantly, and vice versa.
- **REST API + PostgreSQL via Prisma** (with an automatic in-memory fallback so the app still
  runs with zero setup) for tasks, schedule, weather, AI, and device pairing, with proper
  relations between a single household `User` and their `Task`/`Schedule`/`Device`/
  `AiConversation` rows.
- **Demo Mode** — mock weather, sample tasks/schedule, and deterministic AI responses, so the
  whole product works for a hackathon video with no external accounts.
- **Friendly error and loading states**, safe input validation/sanitization, hashed pairing
  tokens, and expiring pairing codes.

---

## Architecture

```
┌──────────────────┐        REST /api/*        ┌───────────────────────┐
│   TV  (/tv)       │◄─────────────────────────►│                       │
│  React + Vite      │      Socket.IO (WS)       │   Express + Socket.IO │
│  Spatial nav        │◄─────────────────────────►│        server         │
└──────────────────┘                            │                       │
                                                  │  ┌─────────────────┐  │
┌──────────────────┐        REST /api/*          │  │  PostgreSQL      │  │
│ Phone (/mobile)   │◄────────────────────────────┤  │  (via Prisma) /  │  │
│  React + Vite      │      Socket.IO (WS)         │  │  in-memory store │  │
│  QR pairing         │◄────────────────────────────┤  └─────────────────┘  │
└──────────────────┘                            │  ┌─────────────────┐  │
                                                  │  │ AI service        │  │
                                                  │  │ (LLM or Demo AI)  │  │
                                                  │  └─────────────────┘  │
                                                  │  ┌─────────────────┐  │
                                                  │  │ Weather service   │  │
                                                  │  │ (Open-Meteo/Mock) │  │
                                                  │  └─────────────────┘  │
                                                  └───────────────────────┘
```

- The **client** is a single Vite/React app with two independent layouts: `/tv/*` (TV, spatial
  nav, 1920×1080 canvas) and `/mobile` (phone, tab bar, touch-first). They share components
  (`AIResultView`, `Icon`) but have separate CSS (`tv.css` / `mobile.css`).
- The **server** exposes a REST API (`/api/...`) for CRUD-style operations and a Socket.IO layer
  for real-time phone↔TV events. Both talk to the same service layer (`server/services/`), so
  business logic (task sorting, AI validation, pairing) lives in one place.
- **AI responses are never trusted as-is.** `server/services/aiSchema.js` validates the model's
  JSON against a strict shape before it reaches the client; anything invalid becomes a plain-text
  fallback (`type: "text"`).
- **Storage** is PostgreSQL via **Prisma** when `DATABASE_URL` is set, the Prisma Client has been
  generated, and the database is reachable and migrated; otherwise the server automatically falls
  back to an in-memory store with the exact same interface (`server/services/repositories/`), so
  the app still runs (data just doesn't persist restarts). This app is single-household: one
  `User` row is created automatically on first run, and every `Task`, `Schedule`, `Device`, and
  `AiConversation` row is linked to it via a real foreign key (see
  `server/prisma/schema.prisma`) — not just stored loose.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, React Router, plain CSS (no framework), `qrcode.react`, `lucide-react` |
| Backend   | Node.js, Express, Socket.IO |
| Database  | PostgreSQL + Prisma ORM (with in-memory fallback for zero-setup demos) |
| AI        | Pluggable: Anthropic Messages API or any OpenAI-compatible `/chat/completions` endpoint, called **only from the backend** |
| Weather   | Open-Meteo (free, no key) or a built-in mock provider |

---

## Folder structure

```
homesphere-ai/
├── client/
│   ├── src/
│   │   ├── components/         # Shared TV components (cards, buttons, icons)
│   │   │   └── mobile/         # Phone-only components (tabs, D-pad, pairing)
│   │   ├── context/            # SocketContext, TVContext (connection + state)
│   │   ├── hooks/               # useTVNavigation, useStageScale, useNow, ...
│   │   ├── pages/               # TVApp + 6 TV screens, MobilePage
│   │   ├── services/            # api.js (REST), socket.js, storage.js
│   │   ├── styles/               # base.css, tv.css, mobile.css
│   │   ├── utils/                # spatialNavigation.js, format.js, backStack.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── controllers/             # Thin request/response glue
│   ├── routes/                   # Express routers
│   ├── prisma/
│   │   ├── schema.prisma          # User, Task, Schedule, Device, AiConversation + relations
│   │   ├── seed.js                # Demo data seed script (npm run prisma:seed)
│   │   └── migrations/            # Created by `npm run prisma:migrate` (see PostgreSQL setup)
│   ├── services/                 # Business logic (tasks, schedule, AI, weather, devices, demo data)
│   │   └── repositories/          # postgresRepo.js (Prisma) + memoryRepo.js (same interface)
│   ├── middleware/                # error handling, validation, rate limiting
│   ├── sockets/                   # Socket.IO event handlers + in-memory presence
│   ├── utils/                     # config, prisma client, validators, time helpers, sanitizer
│   ├── tests/                     # node:test unit tests (AI schema, validators, time)
│   └── server.js                  # Entry point
│
├── docs/
│   └── FRICTION_LOG.md
├── README.md
├── .env.example
└── package.json                   # npm workspaces root
```

---

## Installation

Requires **Node.js 18.17+** (uses native `fetch`, ES modules) and npm 9+.

```bash
git clone <this-repo>
cd homesphere-ai
npm run install:all       # installs root + client + server via npm workspaces
```

## Environment variables

Copy the example file and edit as needed:

```bash
cp .env.example .env
```

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | No | `4000` | Backend port |
| `CLIENT_URL` | No | `http://localhost:5173` | Used to build the phone-pairing QR URL. `localhost` is auto-swapped for your LAN IP so phones can reach it |
| `DATABASE_URL` | No | *(empty)* | PostgreSQL connection string (`postgresql://USER:PASSWORD@HOST:PORT/DATABASE`), used by Prisma. Empty = in-memory store (demo-friendly, data lost on restart) |
| `REQUIRE_DB` | No | `false` | Set `true` to refuse to start if PostgreSQL is unreachable or not migrated |
| `AI_API_KEY` | No* | *(empty)* | Backend-only. Required for live AI; without it, Demo Mode is forced on |
| `AI_PROVIDER` | No | `anthropic` | `anthropic` or `openai` (or any OpenAI-compatible API) |
| `AI_MODEL` | No | `claude-sonnet-5` / `gpt-4o-mini` | Override the model name |
| `DEMO_MODE` | No | auto (`true` if no `AI_API_KEY`) | Force Demo Mode on/off |
| `WEATHER_PROVIDER` | No | `open-meteo` | `open-meteo` (free, no key) or `mock` |
| `WEATHER_LAT` / `WEATHER_LON` / `WEATHER_LOCATION_NAME` | No | Bengaluru | Used by the weather service |
| `DEVICE_NAME` | No | `Living Room TV` | Shown on the phone after pairing |
| `PAIRING_TTL_MINUTES` | No | `10` | How long a QR pairing code stays valid |

**The AI API key is never sent to the frontend** — all AI calls happen in
`server/services/aiService.js` on the backend only.

### Frontend setup

No extra steps beyond `npm run install:all` above — `client/.env` is not required; the client
reads `VITE_API_BASE` / `VITE_SERVER_URL` only if you need to point it at a different backend
origin than the one Vite is proxying to (see `client/vite.config.js`).

### Backend setup

Configure `.env` at the repo root as above. The backend auto-detects your LAN IP for the QR code;
override with an explicit `CLIENT_URL` if auto-detection picks the wrong network interface (see
`docs/FRICTION_LOG.md`, Entry 3).

### PostgreSQL setup

The database is **optional for a first run** — leave `DATABASE_URL` empty and the app runs
immediately with a volatile in-memory store (perfect for a quick demo; data resets on restart).
Follow the steps below whenever you want data (tasks, schedule, devices, AI history) to actually
persist, backed by real Prisma-managed relations.

#### 1. Installing PostgreSQL

Pick whichever is easiest for your machine — any recent PostgreSQL (13+) works.

- **macOS (Homebrew):**
  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```
- **Ubuntu/Debian:**
  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql
  ```
- **Windows:** install via the [official installer](https://www.postgresql.org/download/windows/),
  or use WSL2 + the Ubuntu instructions above.
- **Docker (any OS, no local install needed):**
  ```bash
  docker run --name homesphere-postgres -e POSTGRES_PASSWORD=homesphere \
    -p 5432:5432 -d postgres:16
  ```
- **Hosted (zero local setup):** a free-tier project on [Neon](https://neon.tech),
  [Supabase](https://supabase.com), or [Railway](https://railway.app) gives you a ready-made
  `DATABASE_URL` — skip straight to step 4 if you go this route.

#### 2. Creating the database

Connect with `psql` (adjust user/host for your setup — Docker example shown):

```bash
psql -h localhost -U postgres
```

Then, inside `psql`:

```sql
CREATE DATABASE homesphere;
```

#### 3. Creating the database user

Still inside `psql` (skip this if you're using a hosted provider — they create the user for you):

```sql
CREATE USER homesphere WITH ENCRYPTED PASSWORD 'homesphere';
GRANT ALL PRIVILEGES ON DATABASE homesphere TO homesphere;
-- PostgreSQL 15+ also needs schema-level privileges:
\c homesphere
GRANT ALL ON SCHEMA public TO homesphere;
```

#### 4. Configuring `DATABASE_URL`

In `.env` at the repo root:

```bash
DATABASE_URL="postgresql://homesphere:homesphere@localhost:5432/homesphere"
```

Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`. For a hosted provider, paste the
connection string they give you (usually includes `?sslmode=require` — keep that suffix).

#### 5. Running Prisma migrations

This creates the actual tables (`users`, `tasks`, `schedule_entries`, `devices`,
`ai_conversations`) from `server/prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

(Runs `prisma migrate dev` in the `server` workspace. It'll prompt for a migration name the
first time — `init` is a good choice. This both creates `server/prisma/migrations/` and applies
it to your database.)

For a production deploy where you don't want the interactive prompt, use
`npm run prisma:deploy` instead (`prisma migrate deploy` — applies existing migrations only, never
creates new ones).

#### 6. Generating Prisma Client

```bash
npm run prisma:generate
```

This runs automatically after `npm install` too (via the `server` workspace's `postinstall`
script), but re-run it manually any time you edit `schema.prisma`.

#### 7. Seeding demo data

```bash
npm run prisma:seed
```

Creates one demo user, 6 household tasks, a 6-entry schedule for today, one demo TV device, and
4 AI conversation messages — safe to re-run any time (it clears and recreates just this demo
user's own rows, so it won't duplicate data on repeated runs).

#### 8. Starting the backend

```bash
npm run dev        # or: npm run build && npm start
```

Watch the startup log — it tells you which storage is active:

```
[db] Connected to PostgreSQL via Prisma.
  Mode: DEMO | Storage: postgresql | AI: not configured
```

If instead you see `Storage: memory`, something above didn't complete — check the warning lines
just above that log for what to fix (usually: migrations not run, or Prisma Client not generated).

Want to browse the data visually while developing? `npm run prisma:studio` opens Prisma Studio, a
local GUI for viewing/editing every table.

#### 9. Troubleshooting common PostgreSQL connection errors

| Error | Likely cause | Fix |
|---|---|---|
| `Can't reach database server at ...` | PostgreSQL isn't running, or wrong host/port | Confirm the service is started (`brew services list`, `systemctl status postgresql`, or `docker ps`); check the host/port in `DATABASE_URL` |
| `password authentication failed for user` | Wrong username/password in `DATABASE_URL` | Re-check step 3's `CREATE USER` command matches what's in `.env` exactly |
| `database "homesphere" does not exist` | Step 2 wasn't run, or ran against the wrong server | Re-run the `CREATE DATABASE` command, confirming you're connected to the right host |
| `@prisma/client did not initialize yet. Please run "prisma generate"` | Client wasn't generated after install/schema changes | Run `npm run prisma:generate` |
| `The table 'public.tasks' does not exist` (or similar) | Migrations haven't been applied yet | Run `npm run prisma:migrate` |
| `permission denied for schema public` (Postgres 15+) | New default-privilege behavior in Postgres 15+ | Run the `GRANT ALL ON SCHEMA public TO homesphere;` line from step 3 |
| App logs `Storage: memory` even though `DATABASE_URL` is set | Any of the above — the app **always** falls back to in-memory storage instead of crashing when Postgres isn't ready, by design | Check the `[db]`/`[prisma]` warning lines right above that log line for the specific cause |
| `self-signed certificate` / SSL errors on a hosted provider | Provider requires SSL but the connection string is missing it | Append `?sslmode=require` to `DATABASE_URL` |

Whatever goes wrong above, the app keeps running in Demo Mode on the in-memory store rather than
crashing — fix the database at your own pace and restart when ready.

### AI setup

1. Get an API key from Anthropic (or an OpenAI-compatible provider).
2. Set `AI_API_KEY` (and `AI_PROVIDER` if not Anthropic) in `.env`.
3. Set `DEMO_MODE=false` (or leave it unset — it auto-detects based on the key).
4. Restart the server.

Without a key, the app **automatically stays in Demo Mode** and uses deterministic local AI logic
(`server/services/demoAI.js`) instead — no crash, no missing feature.

---

## Running locally

```bash
npm run dev
```

This runs the backend (`server/`, auto-restart via `node --watch`) and the frontend (`client/`,
Vite dev server) concurrently.

- TV: **http://localhost:5173/tv/dashboard**
- Phone: **http://localhost:5173/mobile** (or scan the QR code from TV → Settings)
- API health check: **http://localhost:4000/api/health**

To run only one side: `npm run dev:server` or `npm run dev:client`.

### Production-style run (single port)

```bash
npm run build        # builds client/dist
npm start             # Express serves the API AND the built client on one port
```

Then open `http://localhost:4000/tv/dashboard` (or your LAN IP) — this is the closest setup to
how the app would run inside a Fire TV WebView, since everything is on one origin.

---

## TV testing (keyboard / D-pad)

With no physical remote, use a keyboard — the mapping matches a typical remote:

| Key | Action |
|---|---|
| `↑ ↓ ← →` | Move focus between cards / buttons |
| `Enter` | Select / activate the focused item |
| `Escape` or `Backspace` | Back (closes a modal, or returns to the previous screen) |

The currently focused element always has a bright amber outline, a subtle scale-up, and a glow —
visible from across the room. Focus never gets "lost": if the focused element disappears (e.g. you
delete a task, or a screen changes), focus automatically recovers to the first focusable item.

## Phone pairing

1. On the TV, go to **Settings** — a QR code and a 6-character code are shown, refreshed
   automatically before they expire (10 minutes by default).
2. On a phone **on the same Wi-Fi network**, scan the QR code (or open `/mobile` and type the
   code manually).
3. The phone shows **CONNECTED TO HOMESPHERE TV** with the device name, then drops into 5 tabs:
   **Status, Tasks, Ask AI, Remote, Timer.**
4. Anything done on the phone (add a task, ask the AI, start a timer) appears on the TV instantly
   over Socket.IO, without a page refresh.

If you don't have a second physical device, **Settings → Simulate phone connection** (visible in
Demo Mode) fakes a phone joining, adding a task, and asking the AI — useful for a solo demo run.

## Demo Mode

Demo Mode is **on by default** whenever no `AI_API_KEY` is configured, and can be toggled anytime
from **TV → Settings**. With it on:

- Weather returns realistic mock data instantly (no network call).
- The AI Assistant uses `server/services/demoAI.js` — deterministic logic that reads your actual
  tasks/schedule and produces a real plan, priority list, or "before the rain" suggestion (not
  hardcoded text), so it still looks and feels like a live AI in the demo video.
- **Settings → Reset demo data** repopulates sample tasks and a sample schedule at any time.
- **Settings → Simulate phone connection** shows a second phone joining without a real second
  device.

Turning Demo Mode off requires a valid `AI_API_KEY` server-side; the toggle is disabled otherwise.

## Amazon Fire TV / Vega OS notes

This build was developed and tested as a standard web app (desktop Chrome for the TV layout,
mobile Chrome/Safari for the phone layout) — **not on physical Fire TV / Vega OS hardware**.
Everything under [`docs/FRICTION_LOG.md`](docs/FRICTION_LOG.md) marked "UNVERIFIED" needs
confirming on real hardware before relying on it, especially:

- Exact D-pad/remote key codes the WebView emits (Entry 1).
- Viewport/scaling behavior in the actual TV WebView (Entry 2).
- Packaging/deployment steps for Vega OS specifically (Entry 4) — none are claimed here; consult
  Amazon's official documentation.

For the hackathon demo itself, the safest path is: run `npm run build && npm start`, then open the
server's LAN URL in the Fire TV's browser (or any WebView-based shell) and use a keyboard/phone
remote fallback if native D-pad key codes don't match on the first try.

---

## Testing checklist

- [ ] Arrow key navigation moves focus sensibly in all 4 directions on every screen
- [ ] Enter activates the focused button/card
- [ ] Escape/Backspace closes a modal if open, else goes to the previous screen
- [ ] Focused element always has a visible outline/glow (never invisible)
- [ ] Create a task (from TV is not exposed by design — verify via phone) and see it appear on TV
- [ ] Mark a task complete on the TV; verify it updates on the phone too
- [ ] Delete a task on the TV
- [ ] Ask the AI Assistant a sample prompt on the TV; verify a structured response renders
- [ ] Trigger an AI failure (e.g. stop the server briefly) and confirm a friendly error, not a crash
- [ ] Socket.IO reconnects automatically after a server restart (header status flips back to Connected)
- [ ] Scan the QR code from a real phone and confirm pairing + "CONNECTED TO HOMESPHERE TV"
- [ ] Add a task from the phone; confirm it appears on the TV within ~1s
- [ ] Start/pause/reset a timer from the TV; confirm the phone's Timer tab mirrors it live
- [ ] Start a timer from the phone; confirm the TV updates
- [ ] Load `/tv/dashboard` at exactly 1920×1080 and confirm no clipped content
- [ ] Confirm all interactive elements keep at least 40–50px from the screen edges (safe zone)

## Known limitations

- No authentication beyond the pairing-code/token flow — anyone on the same Wi-Fi network with the
  code can pair. Fine for a single-household hackathon demo; not intended as a multi-tenant product.
- The in-memory storage fallback loses all data on server restart — set up PostgreSQL (see
  "PostgreSQL setup" above) for anything that needs to persist.
- AI responses are constrained to a fixed JSON schema (plan/briefing/priorities/suggestion/text) by
  design, to keep the UI predictable — this intentionally limits how "creative" the assistant can be.
- Fire TV / Vega OS-specific behavior (remote key codes, packaging) is unverified — see
  `docs/FRICTION_LOG.md`.
- Weather forecasting beyond the current conditions/next-6-hours rain probability is not implemented.

## Hackathon demo flow

A suggested ~3-minute run-through:

1. **Open `/tv/dashboard`** — point out the greeting, clock, weather, AI briefing, schedule, and
   tasks all visible at once, readable from a sofa.
2. **Navigate with a keyboard/remote** — arrow through the nav rail into **Tasks**, show the
   focus glow, mark a task complete.
3. **Go to Settings** — show the QR code, then either scan it with a real phone or click
   **Simulate phone connection** for a one-device demo.
4. **On the phone** (or via the simulation), **add a task** — watch it appear on the TV instantly.
5. **Go to AI Assistant** on the TV, select **"Plan my evening."** — show the structured plan
   render live.
6. **Go to Planner** — show the AI-generated plan now sitting in the timeline.
7. **Go to Timer**, start a 1-minute timer, show the phone's Timer tab mirroring it.
8. Wrap up on **Settings**, mentioning Demo Mode is what made the whole thing possible without any
   external accounts.
