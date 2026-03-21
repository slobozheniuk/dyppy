import React from 'react';

// Mock Data
const profileData = {
  name: 'Lukas "The Wall" Weber',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvKAbfM71PPwdp5ozzqR8Yfo0MTJcr6CIDUt1kaRyybjE8201mODnxQ4tFnk4ZB-IAp1rGwh3No9Ujro_CC_kI9OoKgo71MQL0_np9g7nawLh1iN6vx41wjIciUEC0A3GPgtzVU--8RM9NVIvSOg5eRpmQwRvfBYZ8GOBQMB2CvoGAwnZA1fL0wqW_aCGI_srlLV1lAZFo3o7pjubiNUadAjQjWXtNIZVihgYD-rowUp8CNJdjD4lU4REDPPdOkqjlSSbLnrRgUA',
  tier: 'Pro Tier',
  rankingTitle: 'Top 10 NRW',
  arena: 'Rhein-Westphalia Arena',
  elo: {
    main: '1,892',
    rank: 4,
    winRate: 74,
    dyp: { score: '1,482', diff: '+12' },
    single: { score: '1,540', diff: '-5' },
    pair: { score: '1,721', diff: '+42' }
  },
  trend: {
    peak: '1,910 Elo',
    growth: '+2.4% / mo'
  },
  events: [
    { title: 'West Masters', time: 'Starts in 3 days' }
  ],
  matches: [
    {
      id: 1,
      date: 'Oct 24, 2024',
      type: 'Single',
      diff: '+14',
      diffType: 'positive',
      score: '10 - 7',
      team1: [{ name: 'Lukas Weber', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvKAbfM71PPwdp5ozzqR8Yfo0MTJcr6CIDUt1kaRyybjE8201mODnxQ4tFnk4ZB-IAp1rGwh3No9Ujro_CC_kI9OoKgo71MQL0_np9g7nawLh1iN6vx41wjIciUEC0A3GPgtzVU--8RM9NVIvSOg5eRpmQwRvfBYZ8GOBQMB2CvoGAwnZA1fL0wqW_aCGI_srlLV1lAZFo3o7pjubiNUadAjQjWXtNIZVihgYD-rowUp8CNJdjD4lU4REDPPdOkqjlSSbLnrRgUA' }],
      team2: [{ name: 'Marcus Klein', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfEwsxcnlab3a2g2aX4__L2jpmfrQkQ_5jN_QDtez0KEZEQSNw1JtLP2ssIHgMDi-CQplSYpZ_GEF1krAuXD4mkHAqiuUDnNGZcRMwfNqEZA4OLgqpOtM_jG9z1plEuCyOfdXzJ6MeS1hbpQtRF7ypm9SfLfsbE6BV3VBzN_2DG-Q78M8DX5vovGNAzDIdiGir8BbPOUZhlqRkGrke0cfx0-DuBffA-GpuYoW6stvku05i3CFPf7rMpa3TQq5PiZwDyzNi6aELvQ' }]
    },
    {
      id: 2,
      date: 'Oct 22, 2024',
      type: 'DYP',
      diff: '+8',
      diffType: 'positive',
      score: '10 - 4',
      team1: [
        { name: 'Lukas Weber', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvKAbfM71PPwdp5ozzqR8Yfo0MTJcr6CIDUt1kaRyybjE8201mODnxQ4tFnk4ZB-IAp1rGwh3No9Ujro_CC_kI9OoKgo71MQL0_np9g7nawLh1iN6vx41wjIciUEC0A3GPgtzVU--8RM9NVIvSOg5eRpmQwRvfBYZ8GOBQMB2CvoGAwnZA1fL0wqW_aCGI_srlLV1lAZFo3o7pjubiNUadAjQjWXtNIZVihgYD-rowUp8CNJdjD4lU4REDPPdOkqjlSSbLnrRgUA' },
        { name: 'Elena Fischer', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfP2q0FTAMpcSrFC6OYV4Hd0EfSumAVovbCcrme7dE0IqUv9llKTBiDDw5EJlsXvmQoXw4AFZd_f6WsjrYxWZnnLZqOIp8Z0PFgTUukng-A7ZNuRa4Pp-vKqwOq-1qHd-oT9vttqu5GRsbtsh313x80Y-lXmAmyPR5ruHV03r1tr-If0snhRjbVCvrUQe6kJnGwLRr3vZrhD2WH6o3BgpuORb8rsSeSMTW_tAQ7Ay_5gm09yM51IbgWY5M2l7ygRwQ54iv2rZZYw' }
      ],
      team2: [
        { name: 'S. Baum', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOOzz_L93sQZI33xZiy9KKZCiJ-ddJMkZEqIm3ZAa538zKEyZ7DZfO8mz-M0WFLPeneNgqrHIBExo-gaTDfCqmGieZMo71Wx69XbqkUycXin60xnkJ7vkIcs9LcrZS3zbPFFYvz6GATz0jYQzOnv22xGB4BzbzfNgWSEorrD8eD5P6ZsMvS6ghw7L-SaekTal-MwPW2vAys4j_FpktK933f1DLKTCt0T0tdhaJ4dlZlfFEEebK0HT63kQwXyo1Gm22j_DiJUO_Pw' },
        { name: 'M. Klein', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfEwsxcnlab3a2g2aX4__L2jpmfrQkQ_5jN_QDtez0KEZEQSNw1JtLP2ssIHgMDi-CQplSYpZ_GEF1krAuXD4mkHAqiuUDnNGZcRMwfNqEZA4OLgqpOtM_jG9z1plEuCyOfdXzJ6MeS1hbpQtRF7ypm9SfLfsbE6BV3VBzN_2DG-Q78M8DX5vovGNAzDIdiGir8BbPOUZhlqRkGrke0cfx0-DuBffA-GpuYoW6stvku05i3CFPf7rMpa3TQq5PiZwDyzNi6aELvQ' }
      ]
    },
    {
      id: 3,
      date: 'Oct 20, 2024',
      type: 'Double',
      diff: '-12',
      diffType: 'negative',
      score: '8 - 10',
      team1: [
        { name: 'Lukas Weber', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvKAbfM71PPwdp5ozzqR8Yfo0MTJcr6CIDUt1kaRyybjE8201mODnxQ4tFnk4ZB-IAp1rGwh3No9Ujro_CC_kI9OoKgo71MQL0_np9g7nawLh1iN6vx41wjIciUEC0A3GPgtzVU--8RM9NVIvSOg5eRpmQwRvfBYZ8GOBQMB2CvoGAwnZA1fL0wqW_aCGI_srlLV1lAZFo3o7pjubiNUadAjQjWXtNIZVihgYD-rowUp8CNJdjD4lU4REDPPdOkqjlSSbLnrRgUA' },
        { name: 'Partner X', img: '' }
      ],
      team2: [
        { name: 'Stefan Baum', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7DO_B9lsqV9rcrn4uBAw5U8wH_3u22XifYUb0XNl6EBvDiu0e34f4E6qK_adYirKOKOImiMojKFIMLwUYPu9JzTcEOK12IXdU19yt-uTW452ZIozgYQcH0lYT-i9SJ_TyHB1kOEpmys__uz3glEwzK_uNmrlTpo9q2BejHDohfZLpKqwuwjszVC8i76N-Qywj5tyH9s-qElypGBv8TXOy-k-3liiP_Pi-GBp-UcfDYyWGKoTCRvOz74NAWg0e8R_zU1znDmdzYQ' },
        { name: 'Opponent 2', img: '' }
      ]
    }
  ]
};

// Components
const Header = () => (
  <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
    <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-8">
        <span className="text-2xl font-black italic text-red-700 dark:text-red-500 uppercase font-headline tracking-tight">DYPPY</span>
        <nav className="hidden md:flex gap-6">
          <a className="text-slate-600 dark:text-slate-400 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors" href="#">Tournaments</a>
          <a className="text-slate-600 dark:text-slate-400 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors" href="#">Rankings</a>
          <a className="text-slate-600 dark:text-slate-400 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors" href="#">Clubs</a>
          <a className="text-red-700 dark:text-red-500 border-b-2 border-red-700 dark:border-red-500 pb-1 font-medium" href="#">My Profile</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <input className="bg-surface-container-low border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary w-64" placeholder="Search players..." type="text" />
        </div>
        <button className="p-2 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-slate-600">notifications</span>
        </button>
        <button className="p-2 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-slate-600">settings</span>
        </button>
        <img alt="User" className="w-10 h-10 rounded-full object-cover border-2 border-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOOzz_L93sQZI33xZiy9KKZCiJ-ddJMkZEqIm3ZAa538zKEyZ7DZfO8mz-M0WFLPeneNgqrHIBExo-gaTDfCqmGieZMo71Wx69XbqkUycXin60xnkJ7vkIcs9LcrZS3zbPFFYvz6GATz0jYQzOnv22xGB4BzbzfNgWSEorrD8eD5P6ZsMvS6ghw7L-SaekTal-MwPW2vAys4j_FpktK933f1DLKTCt0T0tdhaJ4dlZlfFEEebK0HT63kQwXyo1Gm22j_DiJUO_Pw" />
      </div>
    </div>
  </header>
);

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

const Footer = () => (
  <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 mt-12">
    <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 gap-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col items-center md:items-start gap-2">
        <span className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 dark:text-white">THE KINETIC ARENA</span>
        <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">© 2024 The Kinetic Arena. Professional Foosball Circuit.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        <a className="text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:underline transition-all text-sm" href="#">Contact Support</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:underline transition-all text-sm" href="#">Tournament Rules</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:underline transition-all text-sm" href="#">Privacy Policy</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:underline transition-all text-sm" href="#">Terms of Service</a>
      </div>
      <div className="flex gap-4">
        <span className="text-green-700 dark:text-green-500 material-symbols-outlined">sports_soccer</span>
        <span className="text-green-700 dark:text-green-500 material-symbols-outlined">workspace_premium</span>
      </div>
    </div>
  </footer>
);

export default function Screen1() {
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
