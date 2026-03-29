import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { supabase } from './supabaseClient.js';

const TournamentRow = ({ tournament }) => {
  const navigate = useNavigate();

  const getWinner = () => {
    // Find the Main round's rank-1 placement
    const mainRound = tournament.rounds?.find(r => r.type === 'Main');
    const firstPlace = mainRound?.placements?.find(p => p.rank === 1);
    if (!firstPlace) return null;

    const p1 = firstPlace.player1;
    const p2 = firstPlace.player2;

    if (p2) {
      // Team
      return {
        name: `${p1.name} / ${p2.name}`,
        avatars: [p1.avatarUrl, p2.avatarUrl].filter(Boolean)
      };
    } else {
      // Singles
      return {
        name: `${p1.name} ${p1.surname}`,
        avatar: p1.avatarUrl || ''
      };
    }
  };

  const winner = getWinner();
  const isLive = tournament.date === new Date().toLocaleDateString('de-DE');

  return (
    <tr
      onClick={() => navigate(`/tournament/nwtfv/${tournament.nwtfvId}`)}
      className={`group hover:bg-white transition-all cursor-pointer ${isLive ? 'border-l-4 border-primary' : ''}`}
    >
      <td className="px-8 py-6">
        <div className="flex items-center gap-6">
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
      </td>
      <td className="px-8 py-6">
        <div className="font-headline text-lg font-extrabold text-on-surface group-hover:text-primary transition-colors">
          {tournament.name}
        </div>
        <div className="text-sm text-zinc-500 font-medium">{tournament.place}</div>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-sm">groups</span>
          <span className="text-sm font-bold text-on-surface">{tournament.numberOfParticipants || 0}</span>
        </div>
      </td>
      <td className="px-8 py-6 text-right">
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
            <span className="text-sm font-bold text-on-surface">{winner.name}</span>
          </div>
        ) : (
          <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">Upcoming</span>
        )}
      </td>
    </tr>
  );
};

const TournamentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('Tournament')
          .select(`
            id, nwtfvId, date, name, type, place, numberOfParticipants,
            rounds:Round(
              type,
              placements:Placement(
                rank,
                player1:Player!Placement_player1Id_fkey(name, surname, avatarUrl),
                player2:Player!Placement_player2Id_fkey(name, surname, avatarUrl)
              )
            )
          `)
          .order('date', { ascending: false })
          .limit(20);

        if (searchTerm.trim()) {
          query = query.or(`name.ilike.%${searchTerm}%,place.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setTournaments(data);
      } catch (err) {
        console.error('Failed to fetch tournaments:', err);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchTournaments, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get unique cities from loaded tournaments for the filter dropdown
  const cities = [...new Set(tournaments.map(t => t.place))].sort();

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container pb-0 overflow-x-hidden relative font-body antialiased">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full"></div>
      </div>
      <Header />
      
      <main className="relative z-10 pt-32 pb-20 max-w-7xl mx-auto px-6">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface mb-2 font-headline ">Tournament Arena</h1>
              <p className="text-zinc-500 max-w-lg text-lg">Browse the official competitive circuit. From local DYPs to Master series championships.</p>
            </div>
          </div>
        </header>

        <section className="mb-12 bg-surface-container-low p-6 rounded-2xl flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Search</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">search</span>
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20"
                placeholder="Search by name or city..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">City / Location</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">location_on</span>
              <select className="w-full bg-surface-container-lowest border-none rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 appearance-none">
                <option>All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tournament Type</label>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-secondary text-on-secondary rounded-full text-xs font-bold">OS</button>
              <button className="px-4 py-2 bg-surface-container-lowest text-zinc-500 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">OD</button>
              <button className="px-4 py-2 bg-surface-container-lowest text-zinc-500 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors">DYP</button>
            </div>
          </div>
        </section>

        <div className="bg-surface-container rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="px-8 py-5 text-xs font-black text-zinc-400 uppercase tracking-widest">Date & Format</th>
                  <th className="px-8 py-5 text-xs font-black text-zinc-400 uppercase tracking-widest">Tournament Name</th>
                  <th className="px-8 py-5 text-xs font-black text-zinc-400 uppercase tracking-widest">Draw</th>
                  <th className="px-8 py-5 text-xs font-black text-zinc-400 uppercase tracking-widest text-right">Last Winners</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-zinc-400 animate-pulse">Loading tournaments...</td>
                  </tr>
                ) : tournaments.length > 0 ? (
                  tournaments.map(tournament => (
                    <TournamentRow key={tournament.id} tournament={tournament} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-zinc-400">No tournaments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-surface-container-high/30 flex justify-center">
            <button className="bg-surface-container-lowest border border-zinc-200 text-on-surface px-8 py-3 rounded-xl font-bold hover:bg-white transition-all active:scale-95">
              Load More Tournaments
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};


export default TournamentsPage;
