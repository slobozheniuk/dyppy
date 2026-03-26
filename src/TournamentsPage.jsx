import React, { useState } from 'react';
import tournamentsData from './data/tournaments.json';
import playersData from './data/players.json';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { getCategoryName } from './data-parser/players';

const TournamentRow = ({ tournament }) => {
  const getWinner = () => {
    const firstPlace = tournament.mainRound?.finalPlacements?.find(p => p.rank === 1);
    if (!firstPlace) return null;
    
    const comp = firstPlace.competitor;
    if (comp.type === 'player') {
      const player = playersData.find(p => p.id === comp.player.nwtfvId);
      return {
        name: comp.player.name.split(', ').reverse().join(' '),
        avatar: player?.avatarUrl || ''
      };
    } else if (comp.type === 'team') {
      const p1 = playersData.find(p => p.id === comp.player1.nwtfvId);
      const p2 = playersData.find(p => p.id === comp.player2.nwtfvId);
      return {
        name: `${comp.player1.name.split(',').pop().trim()} / ${comp.player2.name.split(',').pop().trim()}`,
        avatars: [p1?.avatarUrl, p2?.avatarUrl].filter(Boolean)
      };
    }
    return null;
  };

  const winner = getWinner();
  const isLive = tournament.date === new Date().toLocaleDateString('de-DE');

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 py-4 bg-surface-container-lowest rounded-2xl mb-2 transition-transform hover:scale-[1.01] cursor-pointer ${isLive ? 'border-l-4 border-primary' : ''}`}>
      <div className="col-span-3">
        <div className="flex flex-col items-start">
          <div className={`text-sm font-bold ${isLive ? 'text-primary flex items-center gap-1' : 'text-zinc-400'}`}>
            {tournament.date}
            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>}
          </div>
          <span className={`mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
            tournament.type?.includes('Monster') ? 'bg-surface-variant text-on-surface-variant' : 'bg-secondary/10 text-secondary'
          }`}>
            {tournament.type || 'Standard'}
          </span>
        </div>
      </div>
      
      <div className="col-span-4">
        <div className="font-headline text-lg font-extrabold text-on-surface group-hover:text-primary transition-colors">
          {tournament.name}
        </div>
        <div className="text-sm text-zinc-500 font-medium">{tournament.place}</div>
      </div>

      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-sm">groups</span>
          <span className="text-sm font-bold text-on-surface">{tournament.numberOfParticipants || 0}</span>
        </div>
      </div>

      <div className="col-span-3 text-right">
        {winner ? (
          <div className="inline-flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-transparent group-hover:border-primary/20">
            <div className="flex -space-x-2">
              {winner.avatars ? (
                winner.avatars.map((av, i) => (
                  <img key={i} alt="Winner" className="h-8 w-8 rounded-full border-2 border-surface-container-lowest bg-surface-variant" src={av || ''} />
                ))
              ) : (
                <img alt="Winner" className="h-8 w-8 rounded-full border-2 border-surface-container-lowest bg-surface-variant" src={winner.avatar || ''} />
              )}
            </div>
            <span className="text-sm font-bold text-on-surface line-clamp-1">{winner.name}</span>
          </div>
        ) : (
          <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">Upcoming</span>
        )}
      </div>
    </div>
  );
};

const TournamentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTournaments = tournamentsData
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.place.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">
      <Header />
      
      <main className="pt-48 pb-20 max-w-7xl mx-auto px-6">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface mb-2 font-headline bg-red-100">Tournament Arena</h1>
              <p className="text-zinc-500 max-w-lg text-lg">Browse the official competitive circuit. From local DYPs to Master series championships.</p>
            </div>
          </div>
        </header>

        <section className="mb-12 bg-surface-container-low p-6 rounded-2xl flex flex-wrap gap-6 items-end border border-outline-variant/30">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-headline">Search Tournaments</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">search</span>
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                placeholder="Search by name or city..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-headline">City / Location</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">location_on</span>
              <select className="w-full bg-surface-container-lowest border-none rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 appearance-none outline-none">
                <option>All Cities</option>
                {[...new Set(tournamentsData.map(t => t.place))].sort().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-headline">Tournament Type</label>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-secondary text-on-secondary rounded-full text-xs font-bold">ALL</button>
              <button className="px-4 py-2 bg-surface-container-lowest text-zinc-500 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">OS</button>
              <button className="px-4 py-2 bg-surface-container-lowest text-zinc-500 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">DYP</button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-surface-container-low rounded-3xl overflow-hidden p-2">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest">
              <div className="col-span-3">Date & Format</div>
              <div className="col-span-4">Tournament Name</div>
              <div className="col-span-2">Draw</div>
              <div className="col-span-3 text-right">Last Winners</div>
            </div>

            {filteredTournaments.map(tournament => (
              <TournamentRow key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>

        <div className="p-8 flex justify-center mt-6">
          <button className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-8 py-3 rounded-xl font-bold hover:bg-white transition-all active:scale-95">
            Load More Tournaments
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};


export default TournamentsPage;
