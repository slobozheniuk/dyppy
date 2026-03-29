import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { supabase } from './supabaseClient.js';

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
      try {
        const { data, error } = await supabase
          .from('Tournament')
          .select(`
            id, nwtfvId, date, name, type, place, numberOfParticipants,
            rounds:Round(
              id, type,
              placements:Placement(
                rank,
                player1:Player!Placement_player1Id_fkey(id, nwtfvId, name, surname, avatarUrl, clubs),
                player2:Player!Placement_player2Id_fkey(id, nwtfvId, name, surname, avatarUrl, clubs)
              ),
              divisions:Division(
                id, skillLevel,
                gameStages:GameStage(
                  id, name,
                  games:Game(
                    id, scores, createdAt,
                    t1Player1:Player!Game_t1Player1Id_fkey(id, nwtfvId, name, surname, avatarUrl),
                    t1Player2:Player!Game_t1Player2Id_fkey(id, nwtfvId, name, surname, avatarUrl),
                    t2Player1:Player!Game_t2Player1Id_fkey(id, nwtfvId, name, surname, avatarUrl),
                    t2Player2:Player!Game_t2Player2Id_fkey(id, nwtfvId, name, surname, avatarUrl)
                  )
                )
              )
            )
          `)
          .eq('nwtfvId', parseInt(nwtfvId, 10))
          .single();

        if (error) {
          setError(`Tournament not found`);
          setLoading(false);
          return;
        }
        setTournament(data);
      } catch (err) {
        console.error('Failed to fetch tournament:', err);
        setError('Network error: Failed to connect to Supabase');
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
      <main className="relative z-10 pt-24 pb-32 page-container">
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
                    <div className="white-card">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="bg-surface-container-low/30 border-b border-surface-container text-tertiary">
                            <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest w-1/2">Team 1</th>
                            <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-center">Score</th>
                            <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-right w-1/2">Team 2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {division.gameStages?.flatMap((stage) => {
                            const games = stage.games || [];
                            if (games.length === 0) return [];

                            const stageRow = (
                              <tr key={`stage-${stage.name}`} className="bg-surface-container-lowest border-b border-surface-container/50">
                                <td colSpan={3} className="px-6 md:px-8 py-3 text-[10px] font-black uppercase tracking-widest text-primary border-l-4 border-primary bg-primary/5">
                                  {stage.name}
                                </td>
                              </tr>
                            );

                            const matchRows = games.map((game, gIdx) => {
                              const scores = game.scores || [];
                              const scoreDisplay = scores.map(s => `${s.score1}:${s.score2}`).join(' | ') || '—';
                              const t1Name = game.t1Player2
                                ? `${game.t1Player1.surname} / ${game.t1Player2.surname}`
                                : `${game.t1Player1.name} ${game.t1Player1.surname}`;
                              const t2Name = game.t2Player2
                                ? `${game.t2Player1.surname} / ${game.t2Player2.surname}`
                                : `${game.t2Player1.name} ${game.t2Player1.surname}`;

                              return (
                                <tr key={`${stage.name}-${gIdx}`} className="hover:bg-surface-variant/30 transition-colors border-b border-surface-container/50 last:border-b-0">
                                  <td className="px-6 md:px-8 py-5 font-bold">{t1Name}</td>
                                  <td className="px-6 md:px-8 py-5 text-center font-black">{scoreDisplay}</td>
                                  <td className="px-6 md:px-8 py-5 font-semibold text-right">{t2Name}</td>
                                </tr>
                              );
                            });

                            return [stageRow, ...matchRows];
                          })}
                          {division.gameStages?.every(s => !s.games?.length) && (
                            <tr>
                              <td colSpan={3} className="px-6 py-8 text-center text-zinc-400">No games recorded</td>
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
                <div className="white-card">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-surface-container-low/30 border-b border-surface-container text-tertiary">
                        <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest">Pos</th>
                        <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest">Player</th>
                        <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-right">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topQual.map((placement, index) => {
                        const team = getTeamInfo(placement);
                        const isTop = index === 0;
                        return (
                          <tr key={index} className="hover:bg-surface-variant/30 transition-colors border-b border-surface-container/50 last:border-b-0">
                            <td className={`px-6 md:px-8 py-5 font-bold ${isTop ? 'text-primary' : (index === 3 ? 'text-tertiary' : '')}`}>
                              Q{index + 1}
                            </td>
                            <td className="px-6 md:px-8 py-5 font-semibold truncate max-w-[120px]">
                              {formatTeamName(team)}
                            </td>
                            <td className="px-6 md:px-8 py-5 text-right font-black">
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
                    <div className="white-card">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="bg-surface-container-low/30 border-b border-surface-container text-tertiary">
                            <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest w-1/2">Team 1</th>
                            <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-center">Score</th>
                            <th className="px-6 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-right w-1/2">Team 2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {division.gameStages?.flatMap((stage) => {
                            const games = stage.games || [];
                            if (games.length === 0) return [];

                            const stageRow = (
                              <tr key={`stage-${stage.name}`} className="bg-surface-container-lowest border-b border-surface-container/50">
                                <td colSpan={3} className="px-6 md:px-8 py-3 text-[10px] font-black uppercase tracking-widest text-primary border-l-4 border-primary bg-primary/5">
                                  {stage.name}
                                </td>
                              </tr>
                            );

                            const matchRows = games.map((game, gIdx) => {
                              const scores = game.scores || [];
                              const scoreDisplay = scores.map(s => `${s.score1}:${s.score2}`).join(' | ') || '—';
                              const t1Name = game.t1Player2
                                ? `${game.t1Player1.surname} / ${game.t1Player2.surname}`
                                : `${game.t1Player1.name} ${game.t1Player1.surname}`;
                              const t2Name = game.t2Player2
                                ? `${game.t2Player1.surname} / ${game.t2Player2.surname}`
                                : `${game.t2Player1.name} ${game.t2Player1.surname}`;

                              return (
                                <tr key={`${stage.name}-${gIdx}`} className="hover:bg-surface-variant/30 transition-colors border-b border-surface-container/50 last:border-b-0">
                                  <td className="px-6 md:px-8 py-5 font-bold">{t1Name}</td>
                                  <td className="px-6 md:px-8 py-5 text-center font-black">{scoreDisplay}</td>
                                  <td className="px-6 md:px-8 py-5 font-semibold text-right">{t2Name}</td>
                                </tr>
                              );
                            });

                            return [stageRow, ...matchRows];
                          })}
                          {division.gameStages?.every(s => !s.games?.length) && (
                            <tr>
                              <td colSpan={3} className="px-6 py-8 text-center text-zinc-400">No games recorded</td>
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
