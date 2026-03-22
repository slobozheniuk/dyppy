import React from 'react';
import { useParams } from 'react-router-dom';

import profilesData from './data/profileData.json';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

const HeroSection = ({ data }) => (
  <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
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
          <h2 className="text-6xl font-black font-headline tracking-tighter text-primary">{data.elo.main}</h2>
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] font-bold uppercase text-tertiary">
            <span>Rank: #{data.elo.rank}</span>
            <span className="w-[1px] h-2 bg-surface-container"></span>
            <span>Win Rate: {data.elo.winRate}%</span>
          </div>
        </div>

        <div className="w-full md:w-48 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-tertiary font-medium">DYP Elo</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">{data.elo.dyp.score}</span>
              <span className="text-secondary text-[10px] font-bold flex items-center">{data.elo.dyp.diff}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-tertiary font-medium">Single Elo</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">{data.elo.single.score}</span>
              <span className="text-primary text-[10px] font-bold flex items-center">{data.elo.single.diff}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-tertiary font-medium">Pair Elo</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">{data.elo.pair.score}</span>
              <span className="text-secondary text-[10px] font-bold flex items-center">{data.elo.pair.diff}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const MatchRow = ({ match }) => {
  const isPositive = match.diffType === 'positive';
  const typeColorClass = match.type === 'Single' ? 'text-secondary bg-secondary/10' :
                         match.type === 'DYP' ? 'text-secondary bg-secondary/10' :
                         'text-primary bg-primary/10';
  const diffColorClass = isPositive ? 'text-secondary' : 'text-primary';
  const borderHoverClass = isPositive ? 'hover:border-secondary' : 'hover:border-primary';

  return (
    <div className={`flex flex-col md:flex-row md:items-center bg-white border border-surface-container rounded-xl p-4 transition-colors gap-4 md:gap-0 ${borderHoverClass}`}>
      <div className="flex justify-between items-center md:block md:w-24 shrink-0 text-left border-b border-surface-container pb-3 md:border-b-0 md:pb-0">
        <div>
          <p className="text-[10px] font-bold text-tertiary uppercase tracking-tighter">{match.date}</p>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${typeColorClass}`}>{match.type}</span>
        </div>
        <div className="md:hidden">
          <span className={`${diffColorClass} font-black text-sm`}>{match.diff}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 items-center gap-4">
        {match.team1.length === 1 ? (
          <div className="flex items-center justify-end gap-3">
            <span className="font-bold text-[13px] md:text-sm text-right">{match.team1[0].name}</span>
            <img alt={match.team1[0].name} className="w-8 h-8 rounded-full border border-surface-container shrink-0" src={match.team1[0].img} />
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[10px] md:text-xs">{match.team1[0].name}</span>
              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {match.team1[0].img && <img alt={match.team1[0].name} className="w-full h-full object-cover" src={match.team1[0].img} />}
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              <span className="font-bold text-[10px] md:text-xs">{match.team1[1].name}</span>
              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {match.team1[1].img && <img alt={match.team1[1].name} className="w-full h-full object-cover" src={match.team1[1].img} />}
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <span className={`inline-block bg-surface-container-low px-3 md:px-4 py-1.5 rounded-full font-headline font-black text-base md:text-lg ${!isPositive ? 'text-primary' : ''}`}>
            {match.score}
          </span>
        </div>

        {match.team2.length === 1 ? (
          <div className="flex items-center justify-start gap-3 text-tertiary">
            <img alt={match.team2[0].name} className="w-8 h-8 rounded-full border border-surface-container shrink-0" src={match.team2[0].img} />
            <span className="font-bold text-[13px] md:text-sm text-on-surface">{match.team2[0].name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {match.team2[0].img && <img alt={match.team2[0].name} className="w-full h-full object-cover" src={match.team2[0].img} />}
              </div>
              <span className="font-bold text-[10px] md:text-xs">{match.team2[0].name}</span>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {match.team2[1].img && <img alt={match.team2[1].name} className="w-full h-full object-cover" src={match.team2[1].img} />}
              </div>
              <span className="font-bold text-[10px] md:text-xs">{match.team2[1].name}</span>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block md:w-16 shrink-0 text-right">
        <span className={`${diffColorClass} font-black text-sm`}>{match.diff}</span>
      </div>
    </div>
  );
};

const MatchesSection = ({ matches }) => (
  <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
    <div className="p-6 flex justify-between items-center border-b border-surface-container">
      <h3 className="font-headline font-bold text-xl">Recent Matches</h3>
      <button className="text-secondary text-sm font-bold hover:underline">View All History</button>
    </div>
    <div className="p-4 space-y-3">
      {matches.map(match => <MatchRow key={match.id} match={match} />)}
    </div>
  </div>
);

const TrendAside = ({ trend, events }) => (
  <aside className="space-y-6">
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
      <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">trending_up</span>
        Performance Trend
      </h3>
      <div className="space-y-6">
        <div className="w-full">
          <div className="relative h-28 w-full bg-surface-container-low rounded-lg p-2 flex flex-col justify-end overflow-hidden">
            <div className="absolute inset-0 p-2">
              <svg className="w-full h-full preserve-aspect-ratio-none overflow-visible" viewBox="0 0 100 100">
                <path d="M0 80 Q 20 75, 40 60 T 60 40 T 80 45 T 100 20" fill="none" stroke="#af101a" strokeWidth="3"></path>
                <circle cx="100" cy="20" fill="#af101a" r="4"></circle>
              </svg>
            </div>
            <div className="flex justify-between text-[8px] font-bold text-tertiary uppercase mt-1 relative z-10">
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span className="text-primary">Now</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-surface-container">
          <div className="flex justify-between items-center">
            <span className="text-sm text-tertiary">Season Peak</span>
            <span className="font-bold text-on-surface">{trend.peak}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-tertiary">Average Growth</span>
            <span className="font-bold text-secondary">{trend.growth}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-container">
          <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-2">Upcoming Events</p>
          {events.map((event, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded text-primary">
                <span className="material-symbols-outlined text-base">event</span>
              </div>
              <div>
                <p className="text-xs font-bold">{event.title}</p>
                <p className="text-[10px] text-tertiary">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </aside>
);



export default function PlayerPage() {
  const { id } = useParams();
  
  const sortedProfiles = [...profilesData].sort((a, b) => {
    const eloA = parseInt(a.elo.main.replace(/,/g, ''), 10);
    const eloB = parseInt(b.elo.main.replace(/,/g, ''), 10);
    return eloB - eloA;
  });
  
  const profileIndex = sortedProfiles.findIndex(p => p.id === id);
  const profileData = profileIndex >= 0 ? {
    ...sortedProfiles[profileIndex],
    elo: {
      ...sortedProfiles[profileIndex].elo,
      rank: profileIndex + 1
    }
  } : null;

  if (!profileData) {
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
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased pb-0">
      <Header />
      <main className="pt-24 pb-12 px-6 max-w-screen-2xl mx-auto space-y-8">
        <HeroSection data={profileData} />

        <div className="asymmetric-grid">
          <div className="space-y-8">
            <MatchesSection matches={profileData.matches} />
          </div>
          <TrendAside trend={profileData.trend} events={profileData.events} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
