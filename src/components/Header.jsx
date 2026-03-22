import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => (
  <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none">
    <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-black italic text-red-700 dark:text-red-500 uppercase font-headline tracking-tight">DYPPY</Link>
        <nav className="hidden md:flex gap-6">
          <Link to="/" className="text-red-700 dark:text-red-500 border-b-2 border-red-700 dark:border-red-500 pb-1 font-medium">Players</Link>
        </nav>
      </div>
    </div>
  </header>
);

export default Header;
