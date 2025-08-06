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

// Page to browse available ACC setups
function BrowseSetupsPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Browse ACC Setups</h2>
      <p>Coming soon...</p>
    </div>
  );
}

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
        <span role="img" aria-label="upload">
          ⬆️
        </span>
      </Link>
      <Link
        to="/search"
        className={`side-nav-link${
          location.pathname === '/search' ? ' active' : ''
        }`}
        title="Search Setup"
      >
        <span role="img" aria-label="search">
          🔍
        </span>
      </Link>
      <Link
        to="/browse"
        className={`side-nav-link${location.pathname === '/browse' ? ' active' : ''}`}
        title="Browse Setups"
      >
        <span role="img" aria-label="browse">
          📂
        </span>
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
