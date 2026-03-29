import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategoryName } from '../data-parser/players.js';
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
  const tier = getCategoryName(player.category);
  const elo = Math.round(player.mainElo);

  return (
    <Link to={`/player/${player.nwtfvId}`} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 py-4 bg-surface-container-lowest rounded-2xl mb-2 shadow-sm transition-[transform,shadow] duration-150 ease-out hover:scale-[1.01] hover:shadow-xl active:scale-[0.98] cursor-pointer will-change-transform transform-gpu">
      <div className="col-span-1 flex items-center">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black leading-none ${rankStyle}`}>
          {rank}
        </span>
      </div>

      <div className="col-span-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant">
          <img className="w-full h-full object-cover" alt={displayName} src={player.avatarUrl || ''} />
        </div>
        <div>
          <div className="font-bold text-lg">{displayName}</div>
          <div className={`text-xs ${isTop ? 'text-secondary' : 'text-zinc-500'} font-semibold uppercase tracking-tighter`}>{tier}</div>
        </div>
      </div>

      <div className="col-span-4 flex items-center">
        <span className="text-on-surface-variant font-medium">{arena}</span>
      </div>

      <div className="col-span-2 text-right">
        <span className="text-2xl font-black text-primary tracking-tighter">{elo}</span>
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
    <section className="px-6 max-w-screen-xl mx-auto relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <span className="text-primary font-bold tracking-widest uppercase text-xs">Hall of Fame</span>
          <h2 className="text-4xl font-extrabold tracking-tight mt-2">Top Players</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-surface-container-low rounded-3xl overflow-hidden p-2">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-4">Club</div>
            <div className="col-span-2 text-right">Elo Score</div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-zinc-400 animate-pulse">Loading top players...</div>
          ) : players.length > 0 ? (
            players.map((player, index) => <PlayerRow key={player.nwtfvId} player={player} rank={index + 1} />)
          ) : (
            <div className="text-center py-8 text-zinc-400">No ELO data available yet. Play some games first!</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TopPlayers;
