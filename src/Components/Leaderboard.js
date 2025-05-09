import React from 'react';
import './Leaderboard.css'; // Import the CSS

// --- Mock Data Placeholder ---
const mockLeaderboardData = [
  { rank: 1, name: 'Submission Alpha', score: 9.5, competition: 'Best AI Tool' },
  { rank: 2, name: 'Fluffy the Cat', score: 9.2, competition: 'Cutest Cat' },
  { rank: 3, name: 'Eco Bottle', score: 8.8, competition: 'Top Eco-Friendly Product' },
  { rank: 4, name: 'UserX\'s Song', score: 8.5, competition: 'New Music Score' },
  { rank: 5, name: 'Startup Idea Z', score: 8.1, competition: 'Most Innovative Startup Idea' },
];
// Set to empty array to test the placeholder text:
// const mockLeaderboardData = [];
// --- End Mock Data ---

function Leaderboard() {
  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-header">Leaderboard</h1>

      {/* Placeholder for Filters/Selectors later */}
      {/* <div className="leaderboard-filters"> Filter Placeholder </div> */}

      {mockLeaderboardData.length > 0 ? (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Submission/Entry</th>
              <th>Score</th>
              <th>Competition</th>
              {/* Add other relevant columns later */}
            </tr>
          </thead>
          <tbody>
            {mockLeaderboardData.map((entry) => (
              // Ensure no extra whitespace between opening <tr> and first <td>
              // and between last </td> and closing </tr>
              <tr key={entry.rank}><td>{entry.rank}</td><td>{entry.name}</td><td>{entry.score?.toFixed(1)}</td><td>{entry.competition}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="leaderboard-placeholder-text">
          The leaderboard is currently empty.
        </p>
      )}
    </div>
  );
}

export default Leaderboard;