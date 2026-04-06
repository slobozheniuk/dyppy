import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

const PlayerPage = lazy(() => import('./PlayerPage.jsx'));
const MainPage = lazy(() => import('./MainPage.jsx'));
const TournamentsPage = lazy(() => import('./TournamentsPage.jsx'));
const TournamentDetailsPage = lazy(() => import('./TournamentDetailsPage.jsx'));

const Loading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-primary font-bold animate-pulse">Loading DYPPY...</div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/player/:id" element={<PlayerPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournament/nwtfv/:nwtfvId" element={<TournamentDetailsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
