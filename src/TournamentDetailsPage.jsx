import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

const API_BASE = 'http://localhost:3001';

const getPlayerDisplayName = (player) => {
  if (!player) return '—';
  return `${player.name} ${player.surname}`;
};

const getTeamInfo = (placement) => {
  const p1 = placement.player1;
  const p2 = placement.player2;
  if (p2) {
    return [
      { name: getPlayerDisplayName(p1), img: p1?.avatarUrl || '', club: p1?.clubs?.[0] || '' },
      { name: getPlayerDisplayName(p2), img: p2?.avatarUrl || '', club: p2?.clubs?.[0] || '' }
    ];
  }
  return [{ name: getPlayerDisplayName(p1), img: p1?.avatarUrl || '', club: p1?.clubs?.[0] || '' }];
};

const formatTeamName = (team) => {
  if (team.length === 1) return team[0].name;
  return `${team[0].name.split(' ').pop()} / ${team[1]?.name.split(' ').pop()}`;
};

const formatTeamClub = (team) => {
  if (team.length === 1) return team[0].club;
  if (team[0].club === team[1]?.club) return team[0].club;
  return `${team[0].club || 'Independent'} / ${team[1]?.club || 'Independent'}`;
};

export default function TournamentDetailsPage() {
  const { nwtfvId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournament = async () => {
      setLoading(true);
      console.log('Fetching tournament with NWTFV ID:', nwtfvId);
      try {
        const url = `${API_BASE}/api/tournament/nwtfv/${nwtfvId}`;
        console.log('Fetch URL:', url);
        const res = await fetch(url);
        if (!res.ok) {
          console.error('Fetch failed with status:', res.status);
          setError(`Tournament not found (Status ${res.status})`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTournament(data);
      } catch (err) {
        console.error('Failed to fetch tournament:', err);
        setError('Network error: Failed to connect to server');
      }
      setLoading(false);
    };
    fetchTournament();
  }, [nwtfvId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body antialiased flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="text-xl text-zinc-400 animate-pulse">Loading tournament...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container pb-0 overflow-x-hidden relative font-body antialiased flex flex-col">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full"></div>
        </div>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <h1 className="text-3xl font-bold">Tournament not found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const mainRound = tournament.rounds?.find(r => r.type === 'Main');
  const qualRound = tournament.rounds?.find(r => r.type === 'Qualifying');

  const mainPlacements = mainRound?.placements || [];
  const top4Main = mainPlacements.slice(0, 4);

  const qualPlacements = qualRound?.placements || [];
  const topQual = qualPlacements.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container pb-0 overflow-x-hidden relative font-body antialiased">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full"></div>
      </div>
      <Header />
      <main className="relative z-10 pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Tournament Hero Header */}
        <section className="mb-12 relative overflow-hidden rounded-[2rem] bg-surface-container-low p-8 md:p-12">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <img className="w-full h-full object-cover" alt="tournament banner" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZnWkUeLBdfXTkiExoXTsXAXTjJkqadcsnLkuEJfnHEurEAhcKCFAvxoSaRO-KkxgGBOnSua-JRSradDVs7KT29RCXQVo50aVXCQ7Fn7ShISY8oShdZhmule4h7IzY612ciWqqvuvfL6ejGOSfYEuDHER7OjfkkWngZbDkY5B-yM2Au4fsGicTmhk_fnzFIRdIyLJhwtqkGQgEPvyKjb5fH6NPg5eZ5DKaggvVzrXn3u9vvKZTxKG1UsH24AwM-Z-6E6WiARPOQw" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary text-on-primary text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                {tournament.type || 'Open Double'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter text-on-surface mb-6">
              {tournament.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-tertiary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <span className="font-semibold">{tournament.place}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <span className="font-semibold">{tournament.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group</span>
                <span className="font-semibold">{tournament.numberOfParticipants || 0} Teams</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Round Section */}
        {mainPlacements.length > 0 && (
        <section className="mb-20">
          <h2 className="text-3xl font-black font-headline tracking-tighter mb-8 border-l-4 border-primary pl-4">Main Round</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Final Standings */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold font-headline tracking-tight">Final Standings</h3>
                <span className="text-[10px] font-bold text-primary uppercase">Top 4</span>
              </div>
              <div className="space-y-3">
                {top4Main.map((placement, index) => {
                  const team = getTeamInfo(placement);
                  const isWinner = index === 0;
                  const rankStyles = [
                    'bg-secondary text-on-secondary shadow-lg shadow-secondary/10',
                    'bg-surface-container-lowest border border-outline-variant/10',
                    'bg-surface-container-lowest border border-outline-variant/10',
                    'bg-surface-container-lowest border border-outline-variant/10'
                  ];
                  const rankStyle = rankStyles[index] || rankStyles[3];

                  const numberStyles = [
                    'opacity-40 text-on-secondary',
                    'text-tertiary',
                    'text-tertiary',
                    'text-tertiary'
                  ];
                  const numberStyle = numberStyles[index] || numberStyles[3];

                  const labels = ['Winner', 'Finalist', 'Semi-Final', 'Semi-Final'];
                  const label = labels[index] || '';

                  return (
                    <div key={index} className={`${rankStyle} p-4 rounded-2xl flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-black italic ${numberStyle}`}>
                          0{index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm truncate max-w-[120px]">{formatTeamName(team)}</p>
                          <p className="text-[9px] opacity-70 uppercase tracking-wider truncate max-w-[120px]">{formatTeamClub(team)}</p>
                        </div>
                      </div>
                      {isWinner ? (
                        <span className="material-symbols-outlined scale-90" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                      ) : (
                        <span className="text-[10px] font-bold text-tertiary">{label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Game stages from divisions */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-extrabold font-headline tracking-tight">Main Round Games</h3>
              </div>
              {mainRound?.divisions?.map((division, divIdx) => (
                <div key={divIdx} className="mb-8">
                  <h4 className="text-sm font-bold text-tertiary uppercase tracking-wider mb-4">{division.skillLevel} Division</h4>
                  <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-surface-container-high/50 font-black uppercase tracking-widest text-tertiary">
                          <th className="px-6 py-4">Stage</th>
                          <th className="px-6 py-4">Team 1</th>
                          <th className="px-6 py-4 text-center">Score</th>
                          <th className="px-6 py-4">Team 2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 bg-surface-container-lowest">
                        {division.gameStages?.flatMap((stage) =>
                          stage.games?.map((game, gIdx) => {
                            const scores = game.scores || [];
                            const scoreDisplay = scores.map(s => `${s.score1}:${s.score2}`).join(' | ') || '—';
                            const t1Name = game.t1Player2
                              ? `${game.t1Player1.surname} / ${game.t1Player2.surname}`
                              : `${game.t1Player1.name} ${game.t1Player1.surname}`;
                            const t2Name = game.t2Player2
                              ? `${game.t2Player1.surname} / ${game.t2Player2.surname}`
                              : `${game.t2Player1.name} ${game.t2Player1.surname}`;

                            return (
                              <tr key={`${stage.name}-${gIdx}`} className="hover:bg-surface-container-low/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-tertiary">{stage.name}</td>
                                <td className="px-6 py-4 font-bold">{t1Name}</td>
                                <td className="px-6 py-4 text-center font-black">{scoreDisplay}</td>
                                <td className="px-6 py-4 font-semibold">{t2Name}</td>
                              </tr>
                            );
                          }) || []
                        )}
                        {division.gameStages?.every(s => !s.games?.length) && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-zinc-400">No games recorded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Qualifying Round Section */}
        {qualPlacements.length > 0 && (
        <section>
          <h2 className="text-3xl font-black font-headline tracking-tighter mb-8 border-l-4 border-primary pl-4">Qualifying Round</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Qualifying Rank */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold font-headline tracking-tight">Qualifying Rank</h3>
                <button className="text-[10px] font-bold text-tertiary hover:text-primary transition-colors">VIEW ALL</button>
              </div>
              <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/5">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-surface-container-high/50 font-black uppercase tracking-widest text-tertiary">
                      <th className="px-4 py-3">Pos</th>
                      <th className="px-2 py-3">Player</th>
                      <th className="px-4 py-3 text-right">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {topQual.map((placement, index) => {
                      const team = getTeamInfo(placement);
                      const isTop = index === 0;
                      return (
                        <tr key={index}>
                          <td className={`px-4 py-3 font-bold ${isTop ? 'text-primary' : (index === 3 ? 'text-tertiary' : '')}`}>
                            Q{index + 1}
                          </td>
                          <td className="px-2 py-3 font-semibold truncate max-w-[120px]">
                            {formatTeamName(team)}
                          </td>
                          <td className="px-4 py-3 text-right font-black">
                            #{placement.rank}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Qualifying Games */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-extrabold font-headline tracking-tight">Qualifying Games</h3>
              </div>
              {qualRound?.divisions?.map((division, divIdx) => (
                <div key={divIdx} className="mb-8">
                  <h4 className="text-sm font-bold text-tertiary uppercase tracking-wider mb-4">{division.skillLevel} Division</h4>
                  <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-surface-container-high/50 font-black uppercase tracking-widest text-tertiary">
                          <th className="px-6 py-4">Stage</th>
                          <th className="px-6 py-4">Team 1</th>
                          <th className="px-6 py-4 text-center">Score</th>
                          <th className="px-6 py-4">Team 2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 bg-surface-container-lowest">
                        {division.gameStages?.flatMap((stage) =>
                          stage.games?.map((game, gIdx) => {
                            const scores = game.scores || [];
                            const scoreDisplay = scores.map(s => `${s.score1}:${s.score2}`).join(' | ') || '—';
                            const t1Name = game.t1Player2
                              ? `${game.t1Player1.surname} / ${game.t1Player2.surname}`
                              : `${game.t1Player1.name} ${game.t1Player1.surname}`;
                            const t2Name = game.t2Player2
                              ? `${game.t2Player1.surname} / ${game.t2Player2.surname}`
                              : `${game.t2Player1.name} ${game.t2Player1.surname}`;

                            return (
                              <tr key={`${stage.name}-${gIdx}`} className="hover:bg-surface-container-low/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-tertiary">{stage.name}</td>
                                <td className="px-6 py-4 font-bold">{t1Name}</td>
                                <td className="px-6 py-4 text-center font-black">{scoreDisplay}</td>
                                <td className="px-6 py-4 font-semibold">{t2Name}</td>
                              </tr>
                            );
                          }) || []
                        )}
                        {division.gameStages?.every(s => !s.games?.length) && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-zinc-400">No games recorded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
