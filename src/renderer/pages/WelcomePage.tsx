import React from 'react';

interface WelcomePageProps {
  onNext: () => void;
}

function WelcomePage({ onNext }: WelcomePageProps) {
  return (
    <div
      className="welcome-container"
      style={{
        textAlign: 'center',
        padding: '3em',
        maxWidth: '480px',
        margin: '3em auto',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}
    >
      <h1 style={{ marginBottom: '0.5em', fontWeight: 700, fontSize: '2.2em' }}>
        GoatSetups
      </h1>
      <p style={{ marginBottom: '1.2em', fontSize: '1.1em', color: '#333' }}>
        Welcome to GoatSetups!
        <br />
        Easily organize and save your Assetto Corsa Competizione car setups.
      </p>
      <div style={{ marginBottom: '1.2em' }}>
        <strong>Features coming soon:</strong>
        <ul
          style={{
            display: 'inline-block',
            textAlign: 'left',
            margin: '0.5em auto 0 auto',
            fontSize: '1em',
            color: '#444',
            paddingLeft: '1.2em',
          }}
        >
          <li>Browse all your setups by car and track</li>
          <li>Search setups quickly</li>
          <li>Share setups with friends</li>
          <li>More setup management tools</li>
        </ul>
      </div>
      <button
        type="button"
        style={{
          marginTop: '1em',
          padding: '0.75em 2em',
          fontSize: '1.1em',
          borderRadius: '8px',
          border: 'none',
          background: '#4caf50',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  );
}

export default WelcomePage;
