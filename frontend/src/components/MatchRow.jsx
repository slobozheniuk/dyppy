import React from 'react';
import { useNavigate } from 'react-router-dom';

const MatchRow = ({ match }) => {
  const navigate = useNavigate();
  const isPositive = match.diffType === 'positive';
  const typeColorClass = match.type === 'Single' ? 'text-secondary bg-secondary/10' :
    match.type === 'DYP' ? 'text-secondary bg-secondary/10' :
      'text-primary bg-primary/10';
  const diffColorClass = isPositive ? 'text-secondary' : 'text-primary';
  const borderHoverClass = isPositive ? 'hover:border-secondary' : 'hover:border-primary';

  return (
    <div 
      onClick={() => match.tournamentNwtfvId && navigate(`/tournament/nwtfv/${match.tournamentNwtfvId}`)}
      className={`flex flex-col md:flex-row md:items-center bg-white border border-surface-container rounded-xl p-4 transition-colors gap-4 md:gap-0 ${match.tournamentNwtfvId ? 'cursor-pointer' : ''} ${borderHoverClass}`}
    >
      <div className="flex justify-between items-center md:block md:w-36 shrink-0 text-left border-b border-surface-container pb-3 md:border-b-0 md:pb-0">
        <div>
          <p className="text-[10px] font-bold text-tertiary tracking-tighter whitespace-nowrap">{match.tournamentType} in {match.tournamentPlace}</p>
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
            {match.team1[0].img && <img alt={match.team1[0].name} className="w-8 h-8 rounded-full border border-surface-container shrink-0" src={match.team1[0].img} />}
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
            {match.team2[0].img && <img alt={match.team2[0].name} className="w-8 h-8 rounded-full border border-surface-container shrink-0" src={match.team2[0].img} />}
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

export default MatchRow;
