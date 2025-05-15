import React from 'react';
import './Leaderboard.css'; // Import the CSS

// --- Mock Data Placeholder ---
const mockLeaderboardData = [
  { rank: 1, name: 'Submission Alpha with a very long title to test wrapping capabilities', score: 9.5, competition: 'Best AI Tool and Platform for Global Innovation Challenges' },
  { rank: 2, name: 'Fluffy the Cat', score: 9.2, competition: 'Cutest Cat Photo Contest of the Year' },
  { rank: 3, name: 'Eco Bottle a sustainable solution', score: 8.8, competition: 'Top Eco-Friendly Product Design Awards' },
  { rank: 4, name: 'UserX\'s Song: A Melody for the Ages', score: 8.5, competition: 'New International Music Score Competition' },
  { rank: 5, name: 'Startup Idea Z - Revolutionizing the Market', score: 8.1, competition: 'Most Innovative Startup Idea for a Better Future' },
  { rank: 6, name: 'Another Very Long Submission Title That Might Cause Wrapping Issues if Not Handled', score: 8.0, competition: 'Competition with Exceptionally Long and Detailed Names' },
  { rank: 7, name: 'Project Omega: The Final Frontier of Research', score: 7.9, competition: 'Scientific Discoveries and Breakthroughs Annual Gala' },
  { rank: 10, name: 'Test Double Digit Rank', score: 7.5, competition: 'Testing Layouts' },
  { rank: 11, name: 'Another Test', score: 10.0, competition: 'More Layout Testing' },
];
// Set to empty array to test the placeholder text:
// const mockLeaderboardData = [];
// --- End Mock Data ---

function Leaderboard() {
  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-header">Leaderboard</h1>

      {mockLeaderboardData.length > 0 ? (
        <div className="leaderboard-scroll-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-col">Rank</th>                       {/* ADDED/MODIFIED CLASS */}
                <th className="wrappable-text-col">Submission/Entry</th>
                <th className="score-col">Score</th>                      {/* ADDED/MODIFIED CLASS */}
                <th className="wrappable-text-col">Competition</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboardData.map((entry) => (
                <tr key={entry.rank}>
                  <td className="rank-col">{entry.rank}</td>                {/* ADDED/MODIFIED CLASS */}
                  <td className="wrappable-text-col">{entry.name}</td>
                  <td className="score-col">{entry.score?.toFixed(1)}</td>  {/* ADDED/MODIFIED CLASS */}
                  <td className="wrappable-text-col">{entry.competition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="leaderboard-placeholder-text">
          The leaderboard is currently empty.
        </p>
      )}
    </div>
  );
}

export default Leaderboard;