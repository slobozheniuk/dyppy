import React from 'react';
import { Link } from 'react-router-dom';

import profilesData from './data/profileData.json';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

const Hero = () => (
  <section className="relative px-6 pt-6 pb-12">
    <div className="absolute inset-0 z-0 opacity-10">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full"></div>
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full"></div>
    </div>
    <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight text-on-background">
        The Pulse of <span className="text-primary italic">NRW Foosball</span>
      </h1>

      <div className="relative max-w-2xl mx-auto group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-outline">search</span>
        </div>
        <input
          className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary text-lg shadow-xl shadow-primary/5 placeholder:text-zinc-400 transition-all"
          placeholder="Find your rank. Search players."
          type="text"
        />
        <div className="absolute inset-y-2 right-2">
          <button className="h-full px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95">
            Search
          </button>
        </div>
      </div>
    </div>
  </section>
);

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

  return (
    <Link to={`/player/${player.id}`} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 py-4 bg-surface-container-lowest rounded-2xl mb-2 transition-transform hover:scale-[1.01] cursor-pointer">
      <div className="col-span-1 flex items-center">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black leading-none ${rankStyle}`}>
          {rank}
        </span>
      </div>

      <div className="col-span-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant">
          <img className="w-full h-full object-cover" alt={player.name} src={player.avatar} />
        </div>
        <div>
          <div className="font-bold text-lg">{player.name}</div>
          <div className={`text-xs ${isTop ? 'text-secondary' : 'text-zinc-500'} font-semibold uppercase tracking-tighter`}>{player.tier}</div>
        </div>
      </div>

      <div className="col-span-4 flex items-center">
        <span className="text-on-surface-variant font-medium">{player.arena}</span>
      </div>

      <div className="col-span-2 text-right">
        <span className="text-2xl font-black text-primary tracking-tighter">{player.elo.main}</span>
      </div>
    </Link>
  );
};

const TopPlayers = () => (
  <section className="px-6 max-w-screen-xl mx-auto relative z-10">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
      <div>
        <span className="text-primary font-bold tracking-widest uppercase text-xs">Hall of Fame</span>
        <h2 className="text-4xl font-extrabold tracking-tight mt-2">Top Players</h2>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest">Open Rankings</button>
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

        {[...profilesData]
          .sort((a, b) => {
            const eloA = parseInt(a.elo.main.replace(/,/g, ''), 10);
            const eloB = parseInt(b.elo.main.replace(/,/g, ''), 10);
            return eloB - eloA;
          })
          .map((player, index) => <PlayerRow key={player.id} player={player} rank={index + 1} />)}
      </div>
    </div>
  </section>
);

const FeatureCard = ({ feature }) => (
  <div className={`bg-surface-container-lowest p-8 rounded-3xl group transition-all ${feature.hoverBg} hover:text-on-primary`}>
    <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20`}>
      <span className={`material-symbols-outlined ${feature.iconColor} text-3xl group-hover:text-white`}>{feature.icon}</span>
    </div>
    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
    <p className="text-on-surface-variant group-hover:text-white/80">{feature.desc}</p>
  </div>
);



export default function MainPage() {
  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container pb-0 overflow-x-hidden relative">
      <Header />
      <main className="pt-24">
        <Hero />
        <TopPlayers />
      </main>
      <Footer />
    </div>
  );
}
