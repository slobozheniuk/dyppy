# AGENTS.md — Developer & AI Guide

This document provides a comprehensive overview of the **Dyppy** foosball tournament application for developers and AI agents.

## 🚀 Quick Start

### Frontend (`frontend/`)
1. Copy `frontend/.env.example` entries to `frontend/.env` and provide your Supabase URL and anon key.
2. `cd frontend && npm install`
3. `npm run dev` — React app on port 5173, queries Supabase directly.

### Data Pipeline (`nwtfv-sync/`)
1. Copy the relevant entries from `.env.example` to `nwtfv-sync/.env` and provide your Supabase connection strings.
2. `cd nwtfv-sync && npm install`
3. `npm run db:push` — sync the Prisma schema to Supabase.
4. `npm run db:generate` — regenerate the Prisma client.
5. `npm run db:seed -- --force --limit=10` — ingest tournament data and calculate ELO ratings.

---

## 🏗 Project Architecture

The repository is split into two completely independent modules that share no code between them.

```
dyppy/
├── frontend/       ← React + Vite webapp
└── nwtfv-sync/     ← NWTFV scraper + Supabase data pipeline
```

### 📁 `frontend/` (React App)

The frontend queries Supabase directly via `@supabase/supabase-js`. There is no intermediate API server.

- **`src/supabaseClient.js`**: Initialises the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **`src/MainPage.jsx`**, **`src/PlayerPage.jsx`**, **`src/TournamentsPage.jsx`**, **`src/TournamentDetailsPage.jsx`**: Main application views. All data is fetched via Supabase `.select()` queries.
- **`src/components/`**: Shared UI components (Header, Footer, PlayerSearch, TopPlayers, MatchRow).
- **`src/utils/categoryName.js`**: Maps NWTFV category codes (`H`, `D`, `J`, `S`) to display names.
- **`tests/MainPage.spec.ts`**: Playwright end-to-end test.
- **Tailwind CSS**: Used for styling with a custom theme.

#### Environment (`frontend/.env`)
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

#### Scripts (`frontend/`)
| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Starts the React app on port 5173. |
| `npm run build` | `vite build` | Production build. |
| `npm run preview` | `vite preview` | Preview the production build. |
| `npm run test` | `playwright test` | Runs the Playwright e2e suite. |
| `npm run lint` | `eslint .` | Lints the frontend source. |

---

### 📁 `nwtfv-sync/` (Data Pipeline)

Standalone Node.js module that scrapes nwtfv.com, parses tournaments, and uploads data to Supabase via Prisma.

- **`src/data-parser/tournaments.ts`**: Scrapes and parses HTML from nwtfv.com.
- **`src/data-parser/players.ts`**: Fetches player details from the NWTFV JSON API.
- **`src/data-parser/seed-database.ts`**: Main CLI entry point — populates the database and runs the ELO recalculation pass.
- **`src/data-parser/db-inserter.ts`**: Core database insertion logic for players, tournaments, and rounds.
- **`src/data-parser/elo-recalculator.ts`**: Batch-recalculates all ELO ratings from scratch.
- **`src/data-parser/seed-utils.ts`**: Shared utilities (e.g. hashed player IDs).
- **`src/server/elo-calculator.ts`**: Pure math module for ELO ratings (1v1, 2v2, DYP).
- **`src/server/elo-transaction.ts`**: Atomic database operations for game creation and rating updates.
- **`src/server/prisma.ts`**: Prisma client initialisation (PostgreSQL via PgBouncer).
- **`src/server/benchmark-elo.ts`**: Performance benchmarking utilities.
- **`scripts/admin-writer.js`**: Standalone Node script for admin writes using the service role key (bypasses RLS).
- **`tests/`**: Full Vitest suite — 54 tests covering ELO math, parsing, and DB insertion.
- **`prisma/schema.prisma`**: Shared database schema.

#### Environment (`nwtfv-sync/.env`)
```
DATABASE_URL=postgresql://...          # PgBouncer connection (runtime)
DIRECT_URL=postgresql://...            # Direct connection (migrations)
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

#### Scripts (`nwtfv-sync/`)
| Script | Command | Description |
|--------|---------|-------------|
| `npm run test` | `vitest` | Runs the full Vitest suite (54 tests). |
| `npm run db:seed` | `tsx src/data-parser/seed-database.ts` | Seeds DB from NWTFV. Supports `--force`, `--limit=N`, `--skip-elo`. |
| `npm run db:push` | `prisma db push` | Syncs the Prisma schema to Supabase. |
| `npm run db:generate` | `prisma generate` | Regenerates the Prisma client. |
| `npm run db:studio` | `prisma studio` | Opens Prisma Studio GUI. |
| `node scripts/admin-writer.js` | — | Runs the admin write script (service role). |

---

## 🔐 Supabase RLS Setup

The database is **public read, no writes from the frontend**. After running `db:push` on a new project, execute the following in the Supabase SQL Editor:

```sql
-- Grant schema access to the anon role
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT on all tables
GRANT SELECT ON "Player", "PlayerRanking", "Tournament", "Round",
               "Division", "GameStage", "Game", "Placement", "EloHistory"
  TO anon, authenticated;

-- Enable RLS and add public read policies
ALTER TABLE "Player"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayerRanking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tournament"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Round"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Division"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameStage"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Game"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Placement"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EloHistory"    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON "Player"        FOR SELECT USING (true);
CREATE POLICY "public read" ON "PlayerRanking" FOR SELECT USING (true);
CREATE POLICY "public read" ON "Tournament"    FOR SELECT USING (true);
CREATE POLICY "public read" ON "Round"         FOR SELECT USING (true);
CREATE POLICY "public read" ON "Division"      FOR SELECT USING (true);
CREATE POLICY "public read" ON "GameStage"     FOR SELECT USING (true);
CREATE POLICY "public read" ON "Game"          FOR SELECT USING (true);
CREATE POLICY "public read" ON "Placement"     FOR SELECT USING (true);
CREATE POLICY "public read" ON "EloHistory"    FOR SELECT USING (true);
```

All three steps (GRANT USAGE, GRANT SELECT, RLS policy) are required — newer Supabase projects revoke schema and table grants by default.

---

## 📈 ELO Rating System

Players track **4 distinct ratings**:
- `singleElo`: Updated during 1v1 (Einzel) matches.
- `doubleElo`: Updated during 2v2 (Doppel) matches.
- `dypElo`: Updated during 2v2 (DYP) matches.
- `totalElo`: Updated after **every** match (universal tracker).

**Calculation Details:**
- Uses the standard ELO formula ($K=32$).
- For doubles, team rating is the average of both players' game-specific ELOs.
- `totalElo` calculations always use `totalElo` values as inputs to prevent contamination.

---

## 💡 Important Context for Agents

- **External IDs**: `nwtfvId` is the primary identifier from the source website. The internal `id` is a Prisma `cuid`.
- **Tournament Mapping**: Use `tournamentTypeToGameType()` in `nwtfv-sync/src/server/elo-calculator.ts` to map nwtfv strings to internal `single|double|dyp` types.
- **Skeleton Players**: The scraper creates "skeleton" players (with a hashed `nwtfvId`) if a player mentioned in a match isn't found in the main rankings list.
- **No Express server**: The frontend queries Supabase directly. There is no intermediate API server.
- **Table names**: Prisma model names are PascalCase (`Player`, `Tournament`, etc.) and map directly to PostgreSQL table names — use quoted identifiers in raw SQL.

---

## 🛠 Maintenance & Rules

To maintain codebase health, all contributors (including AI agents) must follow these rules:

1. **Always Run Tests**: Before submitting any change to `nwtfv-sync/`, run `npm run test` inside that directory.
2. **Update Tests**: If you add new functionality or change existing logic, update existing tests or add new ones under `nwtfv-sync/tests/`.
3. **No Cross-Module Imports**: `frontend/` and `nwtfv-sync/` must remain fully independent. Never import from one module into the other.
4. **Update Documentation**: If you add, change, or remove any feature, script, or architectural component, update this `AGENTS.md` file and any relevant inline documentation.
