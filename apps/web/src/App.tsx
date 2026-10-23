import React from 'react';
import './App.css';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Weekend Ride</h1>
        <p>Motorcycle Meeting-Point Finder</p>
      </header>

      <div className="beta-disclaimer" role="note" aria-label="Beta Disclaimer">
        <strong>Notice:</strong> Motorcycle routes and arrival estimates are based on current provider data and traffic snapshots. Always verify road conditions and legal motorcycle access before riding.
      </div>

      <main>
        <section aria-labelledby="planner-heading">
          <h2 id="planner-heading" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Plan Your Meetup</h2>
          <p style={{ color: '#475569' }}>Enter Rider A, Rider B, and shared destination locations to calculate a fair meeting point.</p>
        </section>
      </main>
    </div>
  );
};

export default App;
