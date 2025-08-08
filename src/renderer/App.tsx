import React, { useEffect, useState } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';
import './App.css';
import SetupUploadPage from './pages/SetupUploadPage';
import WelcomePage from './pages/WelcomePage';
import BrowseSetupsPage from './pages/BrowseSetupsPage'; // <-- use real page

// Placeholder component for the search page
function SearchSetupPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Search for a Setup</h2>
      <p>Coming soon...</p>
    </div>
  );
}

// Side navigation component
function SideNav() {
  const location = useLocation();
  return (
    <nav className="side-nav">
      <Link
        to="/"
        className={`side-nav-link${location.pathname === '/' ? ' active' : ''}`}
        title="Upload Setup"
      >
        {/* Upload icon */}
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 20h14v-2H5v2zM12 4l5 5h-3v4h-4V9H7l5-5z" />
        </svg>
      </Link>

      <Link
        to="/search"
        className={`side-nav-link${
          location.pathname === '/search' ? ' active' : ''
        }`}
        title="Search Setup"
      >
        {/* Search icon */}
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M15.5 14h-.79l-.28-.28A6 6 0 1 0 14 15.5l.28.28v.79L20 21l1-1-5.5-5.5zM10 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
        </svg>
      </Link>

      <Link
        to="/browse"
        className={`side-nav-link${
          location.pathname === '/browse' ? ' active' : ''
        }`}
        title="Browse Setups"
      >
        {/* Folder/browse icon (same used elsewhere) */}
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
        </svg>
      </Link>
    </nav>
  );
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage for first visit
    const hasVisited = localStorage.getItem('goatsetups_has_visited');
    if (hasVisited) setShowWelcome(false);
  }, []);

  const handleNext = () => {
    localStorage.setItem('goatsetups_has_visited', 'true');
    setShowWelcome(false);
  };

  if (showWelcome) {
    return <WelcomePage onNext={handleNext} />;
  }

  return (
    <Router>
      <SideNav />
      <div style={{ marginLeft: '72px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<SetupUploadPage />} />
          <Route path="/search" element={<SearchSetupPage />} />
          <Route path="/browse" element={<BrowseSetupsPage />} />
        </Routes>
      </div>
    </Router>
  );
}
