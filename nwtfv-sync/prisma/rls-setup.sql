-- RLS Setup for Dyppy
-- Grants public read access to the anon role.
-- Run automatically via: npm run db:push:reset
-- Or manually via:       npm run db:rls

-- Step 1: Grant schema visibility
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Step 2: Revoke all write privileges, then grant SELECT only
REVOKE ALL ON "Player"        FROM anon, authenticated;
REVOKE ALL ON "PlayerRanking" FROM anon, authenticated;
REVOKE ALL ON "Tournament"    FROM anon, authenticated;
REVOKE ALL ON "Round"         FROM anon, authenticated;
REVOKE ALL ON "Division"      FROM anon, authenticated;
REVOKE ALL ON "GameStage"     FROM anon, authenticated;
REVOKE ALL ON "Game"          FROM anon, authenticated;
REVOKE ALL ON "Placement"     FROM anon, authenticated;
REVOKE ALL ON "EloHistory"    FROM anon, authenticated;

GRANT SELECT ON "Player"        TO anon, authenticated;
GRANT SELECT ON "PlayerRanking" TO anon, authenticated;
GRANT SELECT ON "Tournament"    TO anon, authenticated;
GRANT SELECT ON "Round"         TO anon, authenticated;
GRANT SELECT ON "Division"      TO anon, authenticated;
GRANT SELECT ON "GameStage"     TO anon, authenticated;
GRANT SELECT ON "Game"          TO anon, authenticated;
GRANT SELECT ON "Placement"     TO anon, authenticated;
GRANT SELECT ON "EloHistory"    TO anon, authenticated;

-- Step 3: Enable RLS on all tables
ALTER TABLE "Player"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayerRanking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tournament"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Round"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Division"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameStage"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Game"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Placement"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EloHistory"    ENABLE ROW LEVEL SECURITY;

-- Step 4: Public read policies (DROP IF EXISTS so this is safe to re-run)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Player' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "Player" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'PlayerRanking' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "PlayerRanking" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Tournament' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "Tournament" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Round' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "Round" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Division' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "Division" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'GameStage' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "GameStage" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Game' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "Game" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Placement' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "Placement" FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'EloHistory' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON "EloHistory" FOR SELECT USING (true);
  END IF;
END $$;
