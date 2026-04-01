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
      className="group hover:bg-surface-variant/30 transition-colors cursor-pointer border-b border-surface-container/50 last:border-b-0"
    >
      <td className={`px-6 md:px-8 py-5 ${isLive ? 'border-l-4 border-primary' : ''}`}>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-start gap-1">
            <div className={`text-base font-bold ${isLive ? 'text-primary flex items-center gap-2' : 'text-on-surface'}`}>
              {tournament.date}
              {isLive && <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>}
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
              tournament.type?.includes('Monster') ? 'bg-surface-variant text-zinc-500' : 'bg-[#e5f5ec] text-[#0a7a43]'
            }`}>
              {tournament.type || 'Standard'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 md:px-8 py-5">
        <div className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
          {tournament.name}
        </div>
        <div className="text-sm font-medium text-on-surface-variant mt-0.5">{tournament.place}</div>
      </td>
      <td className="px-6 md:px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-[20px]">groups</span>
          <span className="text-sm font-bold text-on-surface">{tournament.numberOfParticipants || 0}</span>
        </div>
      </td>
      <td className="px-6 md:px-8 py-5 text-right">
        {winner ? (
          <div className="inline-flex items-center gap-3">
            <div className="flex -space-x-2">
              {winner.avatars ? (
                winner.avatars.map((av, i) => (
                  <img key={i} alt="Winner" className="h-8 w-8 rounded-full border-2 border-surface-container-lowest bg-surface-variant object-cover" src={av || ''} />
                ))
              ) : (
                <img alt="Winner" className="h-8 w-8 rounded-full border-2 border-surface-container-lowest bg-surface-variant object-cover" src={winner.avatar || ''} />
              )}
            </div>
            <span className="text-sm font-bold text-on-surface text-left leading-tight max-w-[140px] truncate">{winner.name}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-surface-variant/50 px-3 py-1.5 rounded-full">Upcoming</span>
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


  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container pb-0 overflow-x-hidden relative font-body antialiased">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full"></div>
      </div>
      <Header />
      
      <main className="relative z-10 pt-32 pb-24 page-container space-y-8">
        <header className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface font-headline">Tournament Arena</h1>
        </header>

        <section className="white-card p-6 md:p-8">
          <div className="w-full">
            <label className="block text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3">Find a Tournament</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">search</span>
              <input 
                className="w-full bg-surface-container-lowest border border-surface-container rounded-xl py-3.5 pl-11 pr-4 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-zinc-500"
                placeholder="Search by tournament name, city, or club..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="white-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-surface-container">
                  <th className="px-6 md:px-8 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest whitespace-nowrap">Date & Format</th>
                  <th className="px-6 md:px-8 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest min-w-[200px]">Tournament Name</th>
                  <th className="px-6 md:px-8 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest">Draw</th>
                  <th className="px-6 md:px-8 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest text-right">Last Winners</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center">
                      <div className="inline-flex items-center gap-3 text-zinc-400 font-medium">
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Loading tournaments...
                      </div>
                    </td>
                  </tr>
                ) : tournaments.length > 0 ? (
                  tournaments.map(tournament => (
                    <TournamentRow key={tournament.id} tournament={tournament} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-zinc-500 font-medium">
                      No tournaments found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && tournaments.length > 0 && (
            <div className="p-6 border-t border-surface-container bg-surface-container-lowest flex justify-center">
              <button className="text-secondary font-bold text-sm hover:underline transition-all flex items-center gap-1">
                Load More Tournaments
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TournamentsPage;
