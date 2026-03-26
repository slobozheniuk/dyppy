import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PlayerPage from './PlayerPage.jsx';
import MainPage from './MainPage.jsx';
import TournamentsPage from './TournamentsPage.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
