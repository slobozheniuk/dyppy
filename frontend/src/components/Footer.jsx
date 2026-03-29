import React from 'react';

const Footer = () => (
  <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 mt-8">
    <div className="flex flex-col md:flex-row justify-between items-center px-8 py-4 gap-4 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 dark:text-white">DYPPY</span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">Get your foosball stats</p>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        <span className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">No cookies here!</span>
      </div>
      <div className="flex gap-4">
        <span className="text-green-700 dark:text-green-500 material-symbols-outlined text-xl">sports_soccer</span>
        <span className="text-green-700 dark:text-green-500 material-symbols-outlined text-xl">workspace_premium</span>
      </div>
    </div>
  </footer>
);

export default Footer;
