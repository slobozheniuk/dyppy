import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import profilesData from '../data/profileData.json';

const PlayerSearch = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 1000);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    const matches = profilesData.filter(p => 
      p.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    setResults(matches);
    setIsOpen(true);
    setFocusedIndex(-1);
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < results.length) {
        handleSelect(results[focusedIndex].id);
      } else if (results.length > 0) {
        handleSelect(results[0].id);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (playerId) => {
    navigate(`/player/${playerId}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative max-w-2xl mx-auto group text-left z-20">
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-outline">search</span>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        className="w-full pl-14 pr-32 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary text-lg shadow-xl shadow-primary/5 placeholder:text-zinc-400 transition-all outline-none"
        placeholder="Find your rank. Search players."
        type="text"
      />
      <div className="absolute inset-y-2 right-2">
        <button 
          onClick={() => setDebouncedQuery(query)}
          className="h-full px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95"
        >
          Search
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute top-[110%] left-0 right-0 bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden py-2 z-50">
          {results.map((player, idx) => (
            <li 
              key={player.id}
              onClick={() => handleSelect(player.id)}
              onMouseEnter={() => setFocusedIndex(idx)}
              className={`px-6 py-3 cursor-pointer flex items-center gap-4 transition-colors ${idx === focusedIndex ? 'bg-surface-container-low' : 'hover:bg-surface-container-lowest'}`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-variant">
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface text-lg truncate">{player.name}</p>
                <p className="text-zinc-500 font-normal text-sm truncate">{player.arena}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlayerSearch;
