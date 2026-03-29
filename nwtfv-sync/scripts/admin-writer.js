/**
 * Admin Write Script (Standalone)
 *
 * Uses the Supabase service role key, which bypasses Row Level Security (RLS).
 * Never expose this key in the frontend or commit it to version control.
 *
 * Usage:
 *   node scripts/admin-writer.js
 *
 * Requires the following environment variables (set in .env or exported):
 *   SUPABASE_URL             — your project URL (https://<ref>.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY — service role key from Supabase Dashboard → Settings → API
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ─── Example: Insert a Tournament ────────────────────────────────────────────

async function insertExampleTournament() {
  const { data, error } = await supabase
    .from('Tournament')
    .insert({
      nwtfvId: 99999,
      tournamentGroupID: 1,
      date: '01.01.2026',
      name: 'Example DYP Bonn',
      type: 'DYP',
      place: 'Bonn',
      numberOfParticipants: 16,
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error.message);
    return;
  }

  console.log('Inserted tournament:', data);
}

// ─── Example: Update a Player's ELO ──────────────────────────────────────────

async function updatePlayerElo(nwtfvId, newTotalElo) {
  const { data, error } = await supabase
    .from('Player')
    .update({ totalElo: newTotalElo })
    .eq('nwtfvId', nwtfvId)
    .select('id, name, surname, totalElo')
    .single();

  if (error) {
    console.error('Update failed:', error.message);
    return;
  }

  console.log('Updated player:', data);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

await insertExampleTournament();
// await updatePlayerElo(12345, 1650);
