import React from 'react';

function Navigation() {
  return (
    <nav className="desktop-nav">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/competitions">Competitions</a></li>
        <li><a href="/leaderboard">Leaderboards</a></li>
      </ul>
    </nav>
  );
}

export default Navigation;