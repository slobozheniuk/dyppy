# AGENTS.md — Developer & AI Guide

This document provides a comprehensive overview of the **Dyppy** foosball tournament application for developers and AI agents.

## 🚀 Quick Start

1.  **Environment**: Copy `.env.example` to `.env` and provide your Supabase/PostgreSQL connection string.
2.  **Database**: Run `npm run db:push` to sync the Prisma schema and `npm run db:generate` to update the client.
3.  **Seed**: Run `npm run db:seed -- --force --limit=10` to ingest initial tournament data and calculate ELO ratings.
4.  **Run**: Open two terminals:
    -   `npm run server` (Backend API on port 3001)
    -   `npm run dev` (Frontend on port 5173)

---

## 🏗 Project Architecture

The project is a monorepo-style structure with a shared Prisma schema.

### 📁 `src/data-parser` (Data Ingestion)
- **`tournaments.ts`**: Core logic for scraping/parsing HTML from nwtfv.com.
- **`players.ts`**: Fetches player details from the NWTFV JSON API.
- **`seed-database.ts`**: Main CLI script to populate the database and run the ELO recalculation pass.
- **`tests/`**: Vitest integration tests with saved HTML snapshots.

### 📁 `src/server` (Backend)
- **`index.ts`**: Express server entry point.
- **`api.ts`**: Prisma query layer (replaces direct JSON imports).
- **`elo-calculator.ts`**: Pure math module for ELO ratings (1v1, 2v2, DYP).
- **`elo-transaction.ts`**: Atomic database operations for game creation and rating updates.

<h3>📁 `src/components` & Root `src/` (Frontend)</h3>
- **`MainPage.jsx`**, **`PlayerPage.jsx`**, **`TournamentsPage.jsx`**: Main application views.
- **Tailwind CSS**: Used for styling with a custom theme (see `tailwind.config.js`).
- **Fetch API**: Frontend calls the local Express server on port 3001.

---

## 🛠 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Starts the React frontend. |
| `npm run server` | `tsx --watch src/server/index.ts` | Starts the Express API with hot-reload. |
| `npm run db:seed` | `tsx src/data-parser/seed-database.ts` | Seeds DB from NWTFV. Supports `--force`, `--limit=N`, and `--skip-elo`. |
| `npm run db:push` | `prisma db push` | Syncs schema to the database (Supabase). |
| `npm run test` | `vitest` | Runs the full test suite. |
| `npm run db:studio` | `prisma studio` | Opens a GUI to explore database records. |

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
- `totalElo` calculations always use the `totalElo` values as inputs to prevent contamination.

---

## 💡 Important Context for Agents

- **External IDs**: `nwtfvId` is the primary identifier from the source website. The internal `id` is a Prisma `cuid`.
- **Tournament Mapping**: Use `tournamentTypeToGameType()` in `elo-calculator.ts` to map nwtfv strings to internal `single|double|dyp` types.
- **Skeleton Players**: The scraper creates "skeleton" players (with a hashed `nwtfvId`) if a player mentioned in a match isn't found in the main rankings list.
- **CORS**: The server is configured to allow requests from `http://localhost:5173`.

---

## 🛠 Maintenance & Rules

To maintain codebase health, all contributors (including AI agents) must follow these rules:

1.  **Always Run Tests**: Before submitting any change, run the full test suite (`npm run test`).
2.  **Update Tests**: If you add new functionality or change existing logic, you **must** update existing tests or add new ones (e.g., in `src/server/elo-calculator.test.ts` or `src/data-parser/tests/`).
3.  **Update Documentation**: If you add, change, or remove any feature, script, or architectural component, you **must** update this `AGENTS.md` file and any relevant inline documentation.
