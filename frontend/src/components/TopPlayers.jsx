import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategoryName } from '../utils/categoryName.js';
import { supabase } from '../supabaseClient.js';

const PlayerRow = ({ player, rank }) => {
  const isTop = rank === 1;

  let rankStyle = '';
  if (rank === 1) {
    rankStyle = 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 shadow-md shadow-yellow-500/30 ring-1 ring-yellow-400';
  } else if (rank === 2) {
    rankStyle = 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 shadow-md shadow-slate-400/30 ring-1 ring-slate-300';
  } else if (rank === 3) {
    rankStyle = 'bg-gradient-to-br from-orange-400 to-amber-700 text-orange-950 shadow-md shadow-amber-600/30 ring-1 ring-orange-400';
  } else {
    rankStyle = 'bg-surface-variant text-zinc-500';
  }

  const displayName = `${player.name} ${player.surname}`;
  const arena = player.clubs && player.clubs.length > 0 ? player.clubs[0] : 'Independent';
  const tier = getCategoryName(player.category).toUpperCase();
  const elo = Math.round(player.mainElo);

  const formattedElo = elo.toLocaleString('en-US');

  return (
    <Link to={`/player/${player.nwtfvId}`} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 md:px-8 py-5 border-b border-surface-container last:border-b-0 hover:bg-surface-variant/30 transition-colors group cursor-pointer block">
      <div className="col-span-1 flex items-center">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black leading-none ${rankStyle}`}>
          {rank}
        </span>
      </div>

      <div className="col-span-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-surface-container">
          {player.avatarUrl ? (
            <img className="w-full h-full object-cover" alt={displayName} src={player.avatarUrl} />
          ) : (
            <div className="w-full h-full bg-surface-variant flex items-center justify-center text-on-surface-variant font-bold">
              {player.name[0]}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <div className="font-bold text-base text-on-surface group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">
            {displayName}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2 py-0.5 rounded font-bold tracking-wider ${isTop || rank === 2 ? 'bg-[#e5f5ec] text-[#0a7a43]' : 'bg-surface-variant text-zinc-500'}`}>
              {tier}
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-4 flex items-center">
        <span className="text-on-surface-variant text-sm">{arena}</span>
      </div>

      <div className="col-span-2 text-right">
        <span className="text-xl font-bold text-primary">{formattedElo}</span>
      </div>
    </Link>
  );
};

const TopPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('Player')
      .select('id, nwtfvId, name, surname, avatarUrl, category, clubs, totalElo')
      .order('totalElo', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch top players:', error);
        } else {
          setPlayers(data.map(p => ({ ...p, mainElo: p.totalElo })));
        }
        setLoading(false);
      });
  }, []);

  return (
    <section className="relative z-10 mt-12 mb-24 page-container">
      <div className="white-card">
        {/* Header */}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-surface-container">
          <div>
            <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-1 block">Hall of Fame</span>
            <h2 className="text-4xl font-headline font-black tracking-tight text-on-surface">Top Players</h2>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex flex-col">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 md:px-8 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest border-b border-surface-container bg-surface-container-low/30">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-4">Club</div>
            <div className="col-span-2 text-right">Elo Score</div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-400 animate-pulse">Loading top players...</div>
          ) : players.length > 0 ? (
            players.map((player, index) => <PlayerRow key={player.nwtfvId} player={player} rank={index + 1} />)
          ) : (
            <div className="text-center py-12 text-zinc-400">No ELO data available yet. Play some games first!</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TopPlayers;
