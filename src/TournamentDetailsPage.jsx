import React from 'react';
import { useParams, Link } from 'react-router-dom';
import tournamentsData from './data/tournaments.json';
import playersData from './data/players.json';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

const getPlayerInfo = (nwtfvId, fallbackName) => {
  if (nwtfvId) {
    const p = playersData.find(x => x.id === nwtfvId);
    if (p) {
      return { name: `${p.name} ${p.surname}`, img: p.avatarUrl || '', club: p.clubs?.[0] || '' };
    }
  }
  // Fallback
  const [surname, name] = fallbackName?.split(',').map(s => s.trim()) || [];
  return { name: name ? `${name} ${surname}` : fallbackName, img: '', club: '' };
};

const getTeamInfo = (competitor) => {
  if (competitor.type === 'player') {
    return [getPlayerInfo(competitor.player.nwtfvId, competitor.player.name)];
  } else if (competitor.type === 'team') {
    return [
      getPlayerInfo(competitor.player1.nwtfvId, competitor.player1.name),
      getPlayerInfo(competitor.player2?.nwtfvId, competitor.player2?.name)
    ];
  }
  return [];
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
  const { id } = useParams();
  const numericId = parseInt(id, 10);

  const tournament = tournamentsData.find(t => t.id === numericId);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-surface font-body text-on-surface antialiased pb-0 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24">
          <h1 className="text-3xl font-bold">Tournament not found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const mainPlacements = tournament.mainRound?.finalPlacements || [];
  const top4Main = mainPlacements.slice(0, 4);

  const qualPlacements = tournament.qualifyingRound?.finalPlacements || [];
  const topQual = qualPlacements.slice(0, 4);

  return (
    <div className="min-h-screen bg-background font-body text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Tournament Hero Header */}
        <section className="mb-12 relative overflow-hidden rounded-[2rem] bg-surface-container-low p-8 md:p-12">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <img className="w-full h-full object-cover" alt="dynamic close-up of professional foosball players silhouettes and fast moving ball under dramatic red stadium lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZnWkUeLBdfXTkiExoXTsXAXTjJkqadcsnLkuEJfnHEurEAhcKCFAvxoSaRO-KkxgGBOnSua-JRSradDVs7KT29RCXQVo50aVXCQ7Fn7ShISY8oShdZhmule4h7IzY612ciWqqvuvfL6ejGOSfYEuDHER7OjfkkWngZbDkY5B-yM2Au4fsGicTmhk_fnzFIRdIyLJhwtqkGQgEPvyKjb5fH6NPg5eZ5DKaggvVzrXn3u9vvKZTxKG1UsH24AwM-Z-6E6WiARPOQw" />
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
                  const team = getTeamInfo(placement.competitor);
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

            {/* Right Column: Main Round Bracket */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-extrabold font-headline tracking-tight">Main Round Bracket</h3>
              </div>
              <div className="overflow-x-auto hide-scrollbar pb-8">
                <div className="inline-flex items-center gap-8 min-w-[700px]">
                  {/* Quarter Finals */}
                  <div className="space-y-6">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-tertiary text-center mb-4">Quarterfinals</h4>
                    <div className="relative">
                      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm w-48 overflow-hidden">
                        <div className="px-3 py-1.5 bg-secondary/5 text-[9px] font-bold text-secondary">MATCH 12</div>
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between items-center"><span className="text-xs font-bold truncate">Schmidt / W.</span><span className="text-xs font-black text-primary">2</span></div>
                          <div className="flex justify-between items-center opacity-40"><span className="text-xs font-medium truncate">Klein / G.</span><span className="text-xs font-bold">0</span></div>
                        </div>
                      </div>
                      <div className="absolute -right-8 top-1/2 w-8 h-[1px] bg-outline-variant/30"></div>
                    </div>
                    <div className="relative">
                      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm w-48 overflow-hidden">
                        <div className="px-3 py-1.5 bg-secondary/5 text-[9px] font-bold text-secondary">MATCH 13</div>
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between items-center opacity-40"><span className="text-xs font-medium truncate">Meyer / S.</span><span className="text-xs font-bold">1</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-bold truncate">Wagner / B.</span><span className="text-xs font-black text-primary">2</span></div>
                        </div>
                      </div>
                      <div className="absolute -right-8 top-1/2 w-8 h-[1px] bg-outline-variant/30"></div>
                    </div>
                  </div>

                  {/* Semi Finals */}
                  <div className="space-y-16">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-tertiary text-center mb-4">Semifinals</h4>
                    <div className="relative">
                      <div className="absolute -left-8 top-[-30px] bottom-[-30px] w-[1px] bg-outline-variant/30"></div>
                      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-md w-56 overflow-hidden ring-1 ring-primary/5">
                        <div className="flex justify-between items-center px-4 py-2 bg-primary/5">
                          <span className="text-[9px] font-bold text-primary">MATCH 15</span>
                          <span className="text-[9px] font-bold text-tertiary italic">LIVE</span>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold">Schmidt / Weber</span>
                            <div className="flex gap-1">
                              <span className="w-5 h-5 flex items-center justify-center bg-surface-container text-[9px] font-bold rounded">5</span>
                              <span className="w-5 h-5 flex items-center justify-center bg-primary text-on-primary text-[9px] font-bold rounded shadow-sm">1</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold">Wagner / Becker</span>
                            <div className="flex gap-1">
                              <span className="w-5 h-5 flex items-center justify-center bg-surface-container text-[9px] font-bold rounded">3</span>
                              <span className="w-5 h-5 flex items-center justify-center bg-surface-container-highest text-[9px] font-bold rounded">0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -right-8 top-1/2 w-8 h-[1px] bg-outline-variant/30"></div>
                    </div>
                  </div>

                  {/* Final Round */}
                  <div className="pt-8">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary text-center mb-4">Grand Final</h4>
                    <div className="bg-surface-container-lowest rounded-2xl border-2 border-primary/10 shadow-xl w-64 overflow-hidden p-1">
                      <div className="bg-gradient-to-br from-primary to-primary-container p-5 rounded-xl text-on-primary text-center">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-4 block">CHAMPIONSHIP</span>
                        <div className="space-y-3">
                          <div className="py-1 border-b border-white/10">
                            <p className="text-[10px] font-bold opacity-70">Winner SF1</p>
                          </div>
                          <div className="font-black text-xl italic py-1">VS</div>
                          <div className="py-1 border-t border-white/10">
                            <p className="text-[10px] font-bold opacity-70">Winner SF2</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                      <th className="px-2 py-3">Team</th>
                      <th className="px-4 py-3 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {topQual.map((placement, index) => {
                      const team = getTeamInfo(placement.competitor);
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
                            {1500 - (index * 45)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Qualifying Games Table */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-extrabold font-headline tracking-tight">Qualifying Highlights</h3>
              </div>
              <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-surface-container-high/50 font-black uppercase tracking-widest text-tertiary">
                      <th className="px-6 py-4">Table</th>
                      <th className="px-6 py-4">Home Team</th>
                      <th className="px-6 py-4 text-center">Score</th>
                      <th className="px-6 py-4">Away Team</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 bg-surface-container-lowest">
                    {/* Placeholder Rows based on design syntax */}
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-tertiary">Table 4</td>
                      <td className="px-6 py-4 font-bold">Hoffmann / W.</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-black text-primary text-sm">7</span>
                          <span className="text-tertiary opacity-30">—</span>
                          <span className="font-black text-sm">4</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">Jung / Krüger</td>
                      <td className="px-6 py-4 text-right"><span className="bg-secondary/10 text-secondary text-[9px] font-bold px-2 py-0.5 rounded">FT</span></td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-tertiary">Table 1</td>
                      <td className="px-6 py-4 font-semibold">Lange / Schulz</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-black text-sm">5</span>
                          <span className="text-tertiary opacity-30">—</span>
                          <span className="font-black text-primary text-sm">7</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">Richter / K.</td>
                      <td className="px-6 py-4 text-right"><span className="bg-secondary/10 text-secondary text-[9px] font-bold px-2 py-0.5 rounded">FT</span></td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-tertiary">Table 6</td>
                      <td className="px-6 py-4 font-bold">Schmidt / W.</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-black text-sm">2</span>
                          <span className="text-tertiary opacity-30">—</span>
                          <span className="font-black text-sm">1</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">Müller / F.</td>
                      <td className="px-6 py-4 text-right"><span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded italic">LIVE</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}
