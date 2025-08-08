import React from 'react';
import './WelcomePage.css';

interface WelcomePageProps {
  onNext: () => void;
}

function WelcomePage({ onNext }: WelcomePageProps) {
  return (
    <div className="welcome-container">
      <h1 className="welcome-title">GoatSetups</h1>

      <p className="welcome-subtitle">
        Welcome to GoatSetups!
        <br />
        Easily organize and save your Assetto Corsa Competizione car setups.
      </p>

      <div className="welcome-features">
        <strong className="welcome-features-title">
          Features coming soon:
        </strong>
        <ul className="feature-list">
          <li>Browse all your setups by car and track</li>
          <li>Search setups quickly</li>
          <li>Share setups with friends</li>
          <li>More setup management tools</li>
        </ul>
      </div>

      <div className="welcome-actions">
        <button
          type="button"
          className="welcome-btn"
          onClick={onNext}
          title="Continue"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
