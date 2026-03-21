import React from 'react';

// Mock Data
const playersData = [
  {
    rank: 1,
    name: 'Lukas Schneider',
    tier: 'Pro Elite',
    club: 'BVB Kickers Dortmund',
    elo: '2,842',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQSsyce35dAcfbEunPxXFnW_VfKcKLbDbGTEn6D6MB55mrv6OrfhKudSpbM-k9bUDCfNXsklSq5uOcbW_W96Z2C-epBye6bfCjtRqsciB1QT9-2a2OV7dlibqsm3XK1s9pDXtSF4dBJuv3uPIYMRn6o4_khNx7HC8giBW6klErImvtB_JHyoNUWuQszJmvkQdStxTk0YyeRH8CAulaEmLWKg6yVL7zZrG2ixPSZAq3JJ5Tmf9vixPPNO3zx2DuM45uwKt4TKpVqg',
    isTop: true
  },
  {
    rank: 2,
    name: 'Sarah Müller',
    tier: 'Pro Elite',
    club: 'Köln Kicker Zunft',
    elo: '2,795',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrFNAm2D0R3PwxEzFG7VG0WhIBEulcbIEdtCpQdQpwBrPvOtUteIrQUT1mi8p2AdlX9_XdlN_kMMlevL1j6gwtdiRJdETMWEieKzbvtD5RXH3PYbdf-9apMaZ2Dkh60li-c-vfQs7BWPMcljhLmwrCtU1r-YrCmYMdfFd1D8DKTJfnlEzvRK6yeuZ7ZwvVkNJiA_K1wiJgFI-ZyParvgyxe0Eyh4Q_JaT51QYE_f0C9WM7bTZ3UIPqUEpuO1pMrqz9wNGucEq2rg',
    isTop: false
  },
  {
    rank: 3,
    name: 'Marc Weber',
    tier: 'Elite',
    club: 'Tischfussball Münster',
    elo: '2,751',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDshEuNCNx7Uju0Rn_o_h4hKYKpVrcCTxpKFhtQNaTGahM-XNwD62dSAk84WtU9d1pH_IiGyFFocZBuSyPCwcxw7CgtdzGXHwiZumHbWgh5jZunHIMLbug9QfaUhpqw4Onu5RhoqcmGPv_adKpaqUvYdnjqGK0x-KurUO2gTQlfJVNLQZ73WuuPQx66rVUftgSDcGtmA2pRG6y5h5tuo9r-8ukkjzbnbVYl6MWqdAxexpuMHNBLi0zivDpPtcoryPiuqfYxmh8tGg',
    isTop: false
  },
  {
    rank: 4,
    name: 'Elena Fischer',
    tier: 'Elite',
    club: 'Düsseldorf Table Soccer',
    elo: '2,688',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcv-2iFkMYucURUO6Y9aoyspvkj--BMmhOv9QtOb1RlcPlxUcVsoKpfK7sUqpQ3qQz_7Fwr7_lfabN9DWtbXpb_lNDNbIfJNYlHysWfrlO8gC46U-ILUnzbYXuVSp4tXO1UiM1CtWs-j2nHVUqzZ19zXfQyG7mMLdwqkgeIsmejw3NlGpE5m9_4QnoEOeocNFLSFhQZEfknPWJcm4dLvwH5Xkkyy735EvUGRspQp-mkYlJNoKyDHwwAzsxTIUnanftbLHebrjfgA',
    isTop: false
  },
  {
    rank: 5,
    name: 'Jan Hoffmann',
    tier: 'Elite',
    club: 'Essen Kickers 04',
    elo: '2,642',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ-Gnt_K-owmvnkc937kBdtjKOQ7_kCxwqzbyrLzjhCtw9bZfuIgQ6I8Zk7M8GNSYkDRrn3V4LMF2menmZ84kX1YKyDzAm_3pjA_B6vKGJgZd57HiQ8hKf2d9mPzpOe5mfeNnm9LQN9smanRSbfKyopC4TN-KmyjHNRMJQDU7uvjOuNP2bjqhvww49hQSoz5tYNLQFXATpCeZCenCgsJR2tg4hjVq84Gt-b3fKMm3D5EFXDzsH8AVrwr_KMApvOR9tNJ-T69IYhQ',
    isTop: false
  }
];

const featuresData = [
  {
    title: 'Real-time Elo updates',
    desc: 'Experience instant ranking adjustments after every sanctioned match. Our proprietary algorithm ensures fair competition metrics across the NRW region.',
    icon: 'update',
    hoverBg: 'hover:bg-primary',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10'
  },
  {
    title: 'Regional Rankings',
    desc: 'Compare your skills against your local peers. Break down standings by city, club, or age group to see exactly where you stand in the federation.',
    icon: 'leaderboard',
    hoverBg: 'hover:bg-secondary',
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10'
  },
  {
    title: 'Tournament History',
    desc: 'Access a comprehensive archive of your competitive journey. Review past brackets, match scores, and performance trends over the seasons.',
    icon: 'history',
    hoverBg: 'hover:bg-zinc-900',
    iconColor: 'text-zinc-900',
    iconBg: 'bg-zinc-100'
  }
];

// Components
const NavBar = () => (
  <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
    <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
      <div className="text-2xl font-black italic text-red-700 dark:text-red-500 tracking-tighter">
        The Kinetic Arena
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a className="text-zinc-600 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-500 transition-colors font-['Plus_Jakarta_Sans'] font-bold tracking-tight" href="#">Tournaments</a>
        <a className="text-red-700 dark:text-red-500 border-b-2 border-red-700 dark:border-red-500 pb-1 font-['Plus_Jakarta_Sans'] font-bold tracking-tight" href="#">Rankings</a>
        <a className="text-zinc-600 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-500 transition-colors font-['Plus_Jakarta_Sans'] font-bold tracking-tight" href="#">Clubs</a>
        <a className="text-zinc-600 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-500 transition-colors font-['Plus_Jakarta_Sans'] font-bold tracking-tight" href="#">Live Scores</a>
      </div>
      <div className="flex items-center gap-4">
        <button className="transition-all duration-300 ease-out active:scale-95 px-6 py-2 bg-primary text-on-primary rounded-lg font-bold">
          Sign In
        </button>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative px-6 py-20 md:py-32 overflow-hidden">
    <div className="absolute inset-0 -z-10 opacity-10">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary blur-[120px] rounded-full"></div>
    </div>
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight text-on-background">
        The Pulse of <span className="text-primary italic">NRW Foosball</span>
      </h1>

      <div className="relative max-w-2xl mx-auto group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-outline">search</span>
        </div>
        <input
          className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary text-lg shadow-xl shadow-primary/5 placeholder:text-zinc-400 transition-all"
          placeholder="Find your rank. Search players, clubs, or tournaments"
          type="text"
        />
        <div className="absolute inset-y-2 right-2">
          <button className="h-full px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95">
            Search
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-4">
        <span className="px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-bold border border-secondary/20">Active Tournaments: 12</span>
        <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold border border-primary/20">Live Matches: 48</span>
      </div>
    </div>
  </section>
);

const PlayerRow = ({ player }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 py-4 bg-surface-container-lowest rounded-2xl mb-2 transition-transform hover:scale-[1.01] cursor-pointer">
    <div className="col-span-1 flex items-center">
      <span className={`w-8 h-8 rounded-full ${player.isTop ? 'bg-primary text-on-primary' : 'bg-zinc-200 text-zinc-600'} flex items-center justify-center font-black italic`}>
        {player.rank}
      </span>
    </div>

    <div className="col-span-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant">
        <img className="w-full h-full object-cover" alt={player.name} src={player.img} />
      </div>
      <div>
        <div className="font-bold text-lg">{player.name}</div>
        <div className={`text-xs ${player.isTop ? 'text-secondary' : 'text-zinc-500'} font-semibold uppercase tracking-tighter`}>{player.tier}</div>
      </div>
    </div>

    <div className="col-span-4 flex items-center">
      <span className="text-on-surface-variant font-medium">{player.club}</span>
    </div>

    <div className="col-span-2 text-right">
      <span className="text-2xl font-black text-primary tracking-tighter">{player.elo}</span>
    </div>
  </div>
);

const TopPlayers = () => (
  <section className="px-6 py-12 max-w-screen-xl mx-auto">
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

        {playersData.map(player => <PlayerRow key={player.rank} player={player} />)}
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

const Features = () => (
  <section className="px-6 py-20 bg-surface-container-low mt-20">
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-16 max-w-2xl">
        <h2 className="text-4xl font-extrabold tracking-tight mb-4">Master the Arena</h2>
        <p className="text-on-surface-variant text-lg leading-relaxed">The North Rhine-Westphalia official federation platform provides professional-grade tools for players of every skill level.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featuresData.map((feature, i) => <FeatureCard key={i} feature={feature} />)}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="px-6 py-20 overflow-hidden">
    <div className="max-w-screen-xl mx-auto bg-zinc-900 rounded-[3rem] p-12 md:p-20 relative text-center">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary blur-[80px]"></div>
      </div>
      <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-tight">
        Ready to Join the <br/><span className="text-primary italic">NRW Circuit?</span>
      </h2>
      <div className="flex flex-col md:flex-row justify-center gap-6">
        <button className="px-10 py-5 bg-primary text-white rounded-2xl font-extrabold text-xl shadow-2xl shadow-primary/20 transition-transform active:scale-95">Register Player</button>
        <button className="px-10 py-5 bg-white text-zinc-900 rounded-2xl font-extrabold text-xl transition-transform active:scale-95">Find a Club</button>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="w-full border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900">
    <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-12 gap-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">The Kinetic Arena</div>
        <div className="font-['Inter'] text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md">
          © 2024 The Kinetic Arena. Built for the North Rhine-Westphalia Foosball Federation.
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        <a className="font-['Inter'] text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-opacity duration-200 hover:opacity-80 hover:text-green-600 dark:hover:text-green-400 underline decoration-2 underline-offset-4" href="#">Privacy Policy</a>
        <a className="font-['Inter'] text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-opacity duration-200 hover:opacity-80 hover:text-green-600 dark:hover:text-green-400 underline decoration-2 underline-offset-4" href="#">Terms of Service</a>
        <a className="font-['Inter'] text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-opacity duration-200 hover:opacity-80 hover:text-green-600 dark:hover:text-green-400 underline decoration-2 underline-offset-4" href="#">Regional Rules</a>
        <a className="font-['Inter'] text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-opacity duration-200 hover:opacity-80 hover:text-green-600 dark:hover:text-green-400 underline decoration-2 underline-offset-4" href="#">Contact Support</a>
      </div>
    </div>
  </footer>
);

export default function Screen2() {
  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container pb-0">
      <NavBar />
      <main className="pt-24">
        <Hero />
        <TopPlayers />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
