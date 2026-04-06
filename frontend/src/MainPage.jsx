import React from 'react';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import PlayerSearch from './components/PlayerSearch.jsx';
import TopPlayers from './components/TopPlayers.jsx';

const Hero = () => (
  <section className="relative z-20 px-6 pt-6 pb-12">
    <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight text-on-background">
        The Pulse of <span className="text-primary italic">NRW Foosball</span>
      </h1>

      <PlayerSearch />
    </div>
  </section>
);




const FeatureCard = ({ feature }) => (
  <div className={`bg-surface-container-lowest p-8 rounded-3xl group transition-all duration-100 ${feature.hoverBg} hover:text-on-primary`}>
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
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full will-change-[filter] transform-gpu"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full will-change-[filter] transform-gpu"></div>
      </div>
      <Header />
      <main className="relative z-10 pt-24">
        <Hero />
        <TopPlayers />
      </main>
      <Footer />
    </div>
  );
}
