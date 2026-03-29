import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { getCategoryName } from './utils/categoryName.js';
import MatchRow from './components/MatchRow.jsx';
import { supabase } from './supabaseClient.js';
function tournamentTypeToGameType(tournamentType) {
  const t = tournamentType.toLowerCase();
  if (t.includes('einzel')) return 'single';
  if (t.includes('dyp')) return 'dyp';
  return 'double';
}

const HeroSection = ({ data }) => {
  return (
    <section className="white-card p-8">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-center">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-[1.2] border-b lg:border-b-0 lg:border-r border-surface-container pb-8 lg:pb-0 lg:pr-8">
          <div className="relative shrink-0">
            <img alt="Profile" className="w-32 h-32 rounded-full object-cover ring-4 ring-offset-2 ring-primary" src={data.avatar} />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{data.tier}</span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{data.rankingTitle}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-headline text-on-surface tracking-tight mb-2">{data.name}</h1>
            <a className="flex items-center justify-center md:justify-start gap-2 text-secondary hover:underline font-medium text-sm transition-all" href="#">
              <span className="material-symbols-outlined text-base">stadium</span>
              {data.arena}
            </a>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row items-center gap-8 md:gap-12 pl-0 lg:pl-8">
          <div className="text-center">
            <p className="text-tertiary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Main Elo Score</p>
            <h2 className="text-6xl font-black font-headline tracking-tighter text-primary">{data.elo?.main || '—'}</h2>
            <div className="flex items-center justify-center gap-3 mt-2 text-[10px] font-bold uppercase text-tertiary">
              <span>Rank: {data.elo?.rank || 'N/A'}</span>
              <span className="w-[1px] h-2 bg-surface-container"></span>
              <span>Win Rate: {data.elo?.winRate || '—'}</span>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="flex items-baseline gap-4 text-sm">
              <span className="text-tertiary font-medium w-24 shrink-0">National ID</span>
              <span className="font-bold text-on-surface">{data.nationalNumber || '—'}</span>
            </div>
            <div className="flex items-baseline gap-4 text-sm">
              <span className="text-tertiary font-medium w-24 shrink-0">Organisation</span>
              <span className="font-bold text-on-surface leading-tight">{data.organisations?.[0] || '—'}</span>
            </div>
            {data.eloByType?.dyp != null && (
              <div className="flex items-baseline gap-4 text-sm pt-2 border-t border-surface-container border-opacity-30">
                <span className="text-tertiary font-medium w-24 shrink-0">DYP Elo</span>
                <span className="font-bold text-on-surface">{Math.round(data.eloByType.dyp)}</span>
              </div>
            )}
            {data.eloByType?.single != null && (
              <div className="flex items-baseline gap-4 text-sm">
                <span className="text-tertiary font-medium w-24 shrink-0">Single Elo</span>
                <span className="font-bold text-on-surface">{Math.round(data.eloByType.single)}</span>
              </div>
            )}
            {data.eloByType?.double != null && (
              <div className="flex items-baseline gap-4 text-sm">
                <span className="text-tertiary font-medium w-24 shrink-0">Double Elo</span>
                <span className="font-bold text-on-surface">{Math.round(data.eloByType.double)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};


const MatchesSection = ({ matches }) => (
  <div className="white-card">
    <div className="p-6 flex justify-between items-center border-b border-surface-container">
      <h3 className="font-headline font-bold text-xl">Recent Matches</h3>
    </div>
    <div className="p-4 space-y-3">
      {matches.length > 0 ? (
        matches.map(match => <MatchRow key={match.id} match={match} />)
      ) : (
        <div className="text-center py-8 text-zinc-400">No match history found.</div>
      )}
    </div>
  </div>
);

const TrendAside = ({ eloHistory }) => (
  <aside className="space-y-6">
    <div className="white-card p-6">
      <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">trending_up</span>
        Performance Trend
      </h3>
      <div className="space-y-6">
        <div className="w-full">
          <div className="relative h-28 w-full bg-surface-container-low rounded-lg p-2 flex flex-col justify-end overflow-hidden">
            {eloHistory.length > 0 ? (
              <div className="flex items-end gap-[2px] h-full">
                {eloHistory.slice(-20).map((entry, i) => {
                  const min = Math.min(...eloHistory.slice(-20).map(e => e.eloValueTotal));
                const max = Math.max(...eloHistory.slice(-20).map(e => e.eloValueTotal));
                const range = max - min || 1;
                const barHeight = ((entry.eloValueTotal - min) / range) * 80 + 20;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/40 hover:bg-primary/70 rounded-t transition-colors"
                      style={{ height: `${barHeight}%` }}
                      title={`${Math.round(entry.eloValueTotal)} (${new Date(entry.date).toLocaleDateString()})`}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-[10px] font-bold text-tertiary uppercase mb-4 relative z-10">No ELO history yet</p>
            )}
          </div>
        </div>

        {eloHistory.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-surface-container">
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">Peak</span>
              <span className="font-bold text-on-surface">{Math.round(Math.max(...eloHistory.map(e => e.eloValueTotal)))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">Current</span>
              <span className="font-bold text-secondary">{Math.round(eloHistory[eloHistory.length - 1]?.eloValueTotal || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-tertiary">Games</span>
              <span className="font-bold text-on-surface">{eloHistory.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  </aside>
);



export default function PlayerPage() {
  const { id } = useParams();
  const [playerData, setPlayerData] = useState(null);
  const [eloHistory, setEloHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try fetching by NWTFV ID first, fallback to internal ID
        const numericId = parseInt(id, 10);
        const playerSelect = `
          id, nwtfvId, name, surname, totalElo, avatarUrl, category, clubs,
          organisations, nationalNumber,
          rankings:PlayerRanking(id, name, year, rank, totalRankedPlayers),
          eloHistory:EloHistory(type, eloValue, eloValueTotal, date),
          gamesAsT1P1:Game!Game_t1Player1Id_fkey(
            id, scores, createdAt, t1Player1Id, t1Player2Id, t2Player1Id, t2Player2Id,
            tournament:Tournament(type, date, place),
            t1Player1:Player!Game_t1Player1Id_fkey(id, name, surname, avatarUrl),
            t1Player2:Player!Game_t1Player2Id_fkey(id, name, surname, avatarUrl),
            t2Player1:Player!Game_t2Player1Id_fkey(id, name, surname, avatarUrl),
            t2Player2:Player!Game_t2Player2Id_fkey(id, name, surname, avatarUrl),
            eloHistory:EloHistory(playerId, change)
          ),
          gamesAsT1P2:Game!Game_t1Player2Id_fkey(
            id, scores, createdAt, t1Player1Id, t1Player2Id, t2Player1Id, t2Player2Id,
            tournament:Tournament(type, date, place),
            t1Player1:Player!Game_t1Player1Id_fkey(id, name, surname, avatarUrl),
            t1Player2:Player!Game_t1Player2Id_fkey(id, name, surname, avatarUrl),
            t2Player1:Player!Game_t2Player1Id_fkey(id, name, surname, avatarUrl),
            t2Player2:Player!Game_t2Player2Id_fkey(id, name, surname, avatarUrl),
            eloHistory:EloHistory(playerId, change)
          ),
          gamesAsT2P1:Game!Game_t2Player1Id_fkey(
            id, scores, createdAt, t1Player1Id, t1Player2Id, t2Player1Id, t2Player2Id,
            tournament:Tournament(type, date, place),
            t1Player1:Player!Game_t1Player1Id_fkey(id, name, surname, avatarUrl),
            t1Player2:Player!Game_t1Player2Id_fkey(id, name, surname, avatarUrl),
            t2Player1:Player!Game_t2Player1Id_fkey(id, name, surname, avatarUrl),
            t2Player2:Player!Game_t2Player2Id_fkey(id, name, surname, avatarUrl),
            eloHistory:EloHistory(playerId, change)
          ),
          gamesAsT2P2:Game!Game_t2Player2Id_fkey(
            id, scores, createdAt, t1Player1Id, t1Player2Id, t2Player1Id, t2Player2Id,
            tournament:Tournament(type, date, place),
            t1Player1:Player!Game_t1Player1Id_fkey(id, name, surname, avatarUrl),
            t1Player2:Player!Game_t1Player2Id_fkey(id, name, surname, avatarUrl),
            t2Player1:Player!Game_t2Player1Id_fkey(id, name, surname, avatarUrl),
            t2Player2:Player!Game_t2Player2Id_fkey(id, name, surname, avatarUrl),
            eloHistory:EloHistory(playerId, change)
          )
        `;

        let rawPlayer = null;

        if (!isNaN(numericId)) {
          const { data } = await supabase
            .from('Player')
            .select(playerSelect)
            .eq('nwtfvId', numericId)
            .single();
          rawPlayer = data;
        }

        if (!rawPlayer) {
          const { data } = await supabase
            .from('Player')
            .select(playerSelect)
            .eq('id', id)
            .single();
          rawPlayer = data;
        }

        if (!rawPlayer) {
          setError('Player not found');
          setLoading(false);
          return;
        }

        // Fetch ELO history (ordered ascending for chart)
        const { data: eloData } = await supabase
          .from('EloHistory')
          .select('eloValue, eloValueTotal, date, type, playerId, gameId')
          .eq('playerId', rawPlayer.id)
          .order('date', { ascending: true });
        setEloHistory(eloData ?? []);

        // Merge game relations into a single sorted list (same as server-side api.ts)
        const allGames = [
          ...(rawPlayer.gamesAsT1P1 ?? []),
          ...(rawPlayer.gamesAsT1P2 ?? []),
          ...(rawPlayer.gamesAsT2P1 ?? []),
          ...(rawPlayer.gamesAsT2P2 ?? []),
        ]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);

        rawPlayer = { ...rawPlayer, recentGames: allGames };

        // Build display data
        const latestRanking = rawPlayer.rankings?.find(r => r.year === 2026 && r.name === 'Herren') ||
                              rawPlayer.rankings?.[0];

        // Build ELO by type from eloHistory (latest per type)
        const eloByType = {};
        if (rawPlayer.eloHistory) {
          for (const entry of rawPlayer.eloHistory) {
            eloByType[entry.type] = entry.eloValue;
          }
        }

        const mainElo = rawPlayer.totalElo || (eloData ?? [])[eloData?.length - 1]?.eloValueTotal;

        const playerDetails = {
          ...rawPlayer,
          name: `${rawPlayer.name} ${rawPlayer.surname}`,
          avatar: rawPlayer.avatarUrl || '',
          tier: getCategoryName(rawPlayer.category),
          rankingTitle: latestRanking ? `Rank #${latestRanking.rank} in ${latestRanking.name} (${latestRanking.year})` : 'Unranked',
          arena: rawPlayer.clubs?.[0] || 'Independent',
          elo: {
            main: mainElo ? Math.round(mainElo) : '—',
            rank: latestRanking?.rank || 'N/A',
            winRate: '—'
          },
          eloByType,
          matches: []
        };

        // Build matches from recentGames (if present)
        if (rawPlayer.recentGames) {
          playerDetails.matches = rawPlayer.recentGames.map((g) => {
            const isT1 = g.t1Player1Id === rawPlayer.id || g.t1Player2Id === rawPlayer.id;
            const scores = g.scores || [];
            const firstScore = scores[0] || { score1: 0, score2: 0 };
            const myScore = isT1 ? firstScore.score1 : firstScore.score2;
            const oppScore = isT1 ? firstScore.score2 : firstScore.score1;
            const win = myScore > oppScore;

            // Determine game type (Single, Double, DYP)
            const typeLower = tournamentTypeToGameType(g.tournament?.type || '');
            const displayType = typeLower.charAt(0).toUpperCase() + typeLower.slice(1);

            const team1 = [g.t1Player1, g.t1Player2].filter(Boolean).map(p => ({
              name: `${p.name} ${p.surname}`,
              img: p.avatarUrl || ''
            }));

            const team2 = [g.t2Player1, g.t2Player2].filter(Boolean).map(p => ({
              name: `${p.name} ${p.surname}`,
              img: p.avatarUrl || ''
            }));

            const myEloEntry = g.eloHistory?.find(e => e.playerId === rawPlayer.id);
            const eloChange = myEloEntry?.change || 0;
            const diffPrefix = eloChange > 0 ? '+' : '';
            const diffType = eloChange >= 0 ? 'positive' : 'negative';

            return {
              id: g.id,
              date: g.tournament?.date || 'N/A',
              tournamentType: g.tournament?.type || 'N/A',
              tournamentPlace: g.tournament?.place || 'N/A',
              type: displayType,
              diff: `${diffPrefix}${eloChange}`,
              diffType,
              score: `${myScore} - ${oppScore}`,
              team1: isT1 ? team1 : team2,
              team2: isT1 ? team2 : team1
            };
          }).slice(0, 10);
        }

        setPlayerData(playerDetails);
      } catch (err) {
        console.error('Failed to fetch player:', err);
        setError('Failed to load player');
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface font-body text-on-surface antialiased pb-0 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="text-xl text-zinc-400 animate-pulse">Loading player...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="min-h-screen bg-surface font-body text-on-surface antialiased pb-0 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <h1 className="text-3xl font-bold">Player not found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container pb-0 overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full"></div>
      </div>
      <Header />
      <main className="relative z-10 pt-24 pb-12 px-6 max-w-screen-2xl mx-auto space-y-8">
        <HeroSection data={playerData} />

        <div className="asymmetric-grid">
          <div className="space-y-8">
            <MatchesSection matches={playerData.matches} />
          </div>
          <TrendAside eloHistory={eloHistory} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
