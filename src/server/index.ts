/**
 * Express API Server for Dyppy
 * 
 * Lightweight REST API that serves data from PostgreSQL via Prisma.
 * Replaces the JSON stub imports in the React frontend.
 * 
 * Run with: npm run server
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import {
  getPlayerProfile,
  getPlayerByNwtfvId,
  getPlayerEloHistory,
  searchPlayers,
  getTopPlayers,
  getTournamentsList,
  getTournamentDetails,
  getTournamentByNwtfvId,
} from './api.js';
import { createGameWithEloUpdate } from './elo-transaction.js';
import type { EloType } from '../generated/prisma/client.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({ origin: 'http://localhost:5173' })); // Vite dev server
app.use(express.json());

// ─── Player Routes ────────────────────────────────────────────────────────────

// GET /api/players/search?q=tobias
app.get('/api/players/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 5;
    const players = await searchPlayers(query, limit);
    res.json(players);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

// GET /api/players/top?limit=5
app.get('/api/players/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const players = await getTopPlayers(limit);
    res.json(players);
  } catch (error) {
    console.error('Top players error:', error);
    res.status(500).json({ error: 'Failed to fetch top players' });
  }
});

// GET /api/player/nwtfv/:nwtfvId
app.get('/api/player/nwtfv/:nwtfvId', async (req, res) => {
  try {
    const nwtfvId = parseInt(req.params.nwtfvId, 10);
    const player = await getPlayerByNwtfvId(nwtfvId);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(player);
  } catch (error) {
    console.error('Player by NWTFV ID error:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// GET /api/player/:id
app.get('/api/player/:id', async (req, res) => {
  try {
    const player = await getPlayerProfile(req.params.id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(player);
  } catch (error) {
    console.error('Player profile error:', error);
    res.status(500).json({ error: 'Failed to fetch player profile' });
  }
});

// GET /api/player/:id/elo?type=main
app.get('/api/player/:id/elo', async (req, res) => {
  try {
    const eloType = req.query.type as EloType | undefined;
    const history = await getPlayerEloHistory(req.params.id, eloType);
    res.json(history);
  } catch (error) {
    console.error('ELO history error:', error);
    res.status(500).json({ error: 'Failed to fetch ELO history' });
  }
});

// ─── Tournament Routes ────────────────────────────────────────────────────────

// GET /api/tournaments?search=bonn&city=Bonn&type=DYP&skip=0&take=20
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await getTournamentsList({
      search: req.query.search as string,
      city: req.query.city as string,
      type: req.query.type as string,
      skip: parseInt(req.query.skip as string) || 0,
      take: parseInt(req.query.take as string) || 20,
    });
    res.json(tournaments);
  } catch (error) {
    console.error('Tournaments list error:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// GET /api/tournament/nwtfv/:nwtfvId
app.get('/api/tournament/nwtfv/:nwtfvId', async (req, res) => {
  console.log('--- TOURNAMENT NWTFV REQ ---');
  console.log('Params:', req.params);
  const nwtfvIdRaw = req.params.nwtfvId;
  const nwtfvId = parseInt(nwtfvIdRaw, 10);
  console.log('Parsed nwtfvId:', nwtfvId, 'Type:', typeof nwtfvId);

  if (isNaN(nwtfvId)) {
    console.log('   ❌ Invalid NWTFV ID (NaN)');
    res.status(400).json({ error: 'Invalid tournament ID format' });
    return;
  }

  try {
    const tournament = await getTournamentByNwtfvId(nwtfvId);
    if (!tournament) {
      console.log(`   ❌ Tournament with NWTFV ID ${nwtfvId} not found`);
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    console.log(`   ✅ Tournament found: ${tournament.name}`);
    res.json(tournament);
  } catch (error: any) {
    console.error('   🔥 Tournament by NWTFV ID error:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// GET /api/tournament/:id
app.get('/api/tournament/:id', async (req, res) => {
  console.log(`GET /api/tournament/${req.params.id}`);
  try {
    const tournament = await getTournamentDetails(req.params.id);
    if (!tournament) {
      console.log(`   Tournament with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }
    res.json(tournament);
  } catch (error) {
    console.error('Tournament details error:', error);
    res.status(500).json({ error: 'Failed to fetch tournament details' });
  }
});

// ─── Game / ELO Transaction Route ─────────────────────────────────────────────

// POST /api/games
app.post('/api/games', async (req, res) => {
  try {
    const result = await createGameWithEloUpdate(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Game creation error:', error);
    res.status(500).json({ error: 'Failed to create game with ELO update' });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🏓 Dyppy API running at http://localhost:${PORT}`);
  console.log(`   CORS enabled for http://localhost:5173`);
  console.log(`   Routes:`);
  console.log(`     GET  /api/players/search?q=`);
  console.log(`     GET  /api/players/top`);
  console.log(`     GET  /api/player/:id`);
  console.log(`     GET  /api/player/:id/elo?type=main`);
  console.log(`     GET  /api/player/nwtfv/:nwtfvId`);
  console.log(`     GET  /api/tournaments`);
  console.log(`     GET  /api/tournament/nwtfv/:nwtfvId`);
  console.log(`     GET  /api/tournament/:id`);
  console.log(`     POST /api/games`);
});
