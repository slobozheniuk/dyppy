# Dyppy — Foosball League App

A foosball tournament tracker for the NWTFV league. Displays player rankings, ELO ratings, and tournament results.

## Structure

```
dyppy/
├── frontend/       React + Vite app (queries Supabase directly)
└── nwtfv-sync/     NWTFV scraper + Supabase data pipeline
```

The two modules are fully independent and share no code.

## Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

Requires `frontend/.env`:
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Data Pipeline

```bash
cd nwtfv-sync
npm install
npm run db:push        # sync schema to Supabase
npm run db:generate    # regenerate Prisma client
npm run db:seed        # scrape NWTFV and populate DB
npm run test           # run 54 Vitest tests
```

Requires `nwtfv-sync/.env`:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

See [AGENTS.md](./AGENTS.md) for full architecture details, RLS setup, and ELO system documentation.
