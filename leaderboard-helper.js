// Helper file for leaderboard management
const fs = require('fs');
const path = require('path');

// File to store leaderboard data
const LEADERBOARD_FILE = path.join(__dirname, 'data', 'leaderboards.json');
// File to store user votes data
const USER_VOTES_FILE = path.join(__dirname, 'data', 'user_votes.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize leaderboards file if it doesn't exist
function initLeaderboardsFile() {
  ensureDataDirectory();
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    const initialData = {
      competitions: {}
    };
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(initialData, null, 2));
  }
  // Initialize user votes file if it doesn't exist
  if (!fs.existsSync(USER_VOTES_FILE)) {
    fs.writeFileSync(USER_VOTES_FILE, JSON.stringify({}, null, 2));
  }
}

// Get all leaderboards
function getAllLeaderboards() {
  initLeaderboardsFile();
  try {
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const leaderboards = JSON.parse(data);
    // Ensure numeric types for ratings and vote counts
    Object.keys(leaderboards.competitions).forEach(competitionId => {
      const competition = leaderboards.competitions[competitionId];
      if (competition.entries && Array.isArray(competition.entries)) {
        competition.entries.forEach(entry => {
          // Convert potentially string ratings to numbers
          if (entry.average_rating !== undefined) {
            entry.average_rating = parseFloat(entry.average_rating) || 0;
          }
          if (entry.vote_count !== undefined) {
            entry.vote_count = parseInt(entry.vote_count) || 0;
          }
        });
      }
    });
    return leaderboards;
  } catch (error) {
    console.error('Error reading leaderboards file:', error);
    return { competitions: {} };
  }
}

// Get leaderboard for a specific competition
function getLeaderboard(competitionId) {
  const allLeaderboards = getAllLeaderboards();
  // If competition doesn't exist in leaderboard data, create one with sample entries
  if (!allLeaderboards.competitions[competitionId]) {
    // Create a new leaderboard with sample entries
    const mockEntries = [
      {
        id: `submission-${Date.now()}-1`,
        rank: 1,
        title: 'Sunset at the Beach',
        username: 'photo_enthusiast',
        average_rating: 9.8,
        vote_count: 45
      },
      {
        id: `submission-${Date.now()}-2`,
        rank: 2,
        title: 'Mountain Landscape',
        username: 'nature_lover',
        average_rating: 9.5,
        vote_count: 38
      },
      {
        id: `submission-${Date.now()}-3`,
        rank: 3,
        title: 'Urban Architecture',
        username: 'city_explorer',
        average_rating: 9.3,
        vote_count: 41
      },
      {
        id: `submission-${Date.now()}-4`,
        rank: 4,
        title: 'Wildlife Portrait',
        username: 'animal_photographer',
        average_rating: 9.1,
        vote_count: 32
      },
      {
        id: `submission-${Date.now()}-5`,
        rank: 5,
        title: 'Abstract Patterns',
        username: 'artistic_eye',
        average_rating: 8.9,
        vote_count: 36
      }
    ];
    // Create new leaderboard
    allLeaderboards.competitions[competitionId] = {
      competitionId,
      title: "Competition Leaderboard",
      updatedAt: new Date().toISOString(),
      entries: mockEntries
    };
    // Save the updated leaderboards
    saveLeaderboards(allLeaderboards);
  }
  return allLeaderboards.competitions[competitionId];
}

// Update a leaderboard
function updateLeaderboard(competitionId, leaderboardData) {
  const allLeaderboards = getAllLeaderboards();
  allLeaderboards.competitions[competitionId] = {
    ...leaderboardData,
    updatedAt: new Date().toISOString()
  };
  saveLeaderboards(allLeaderboards);
  return allLeaderboards.competitions[competitionId];
}

// Save leaderboards data to file
function saveLeaderboards(leaderboardsData) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboardsData, null, 2));
  } catch (error) {
    console.error('Error writing leaderboards file:', error);
  }
}

// Get all user votes
function getAllUserVotes() {
  initLeaderboardsFile(); // This also initializes USER_VOTES_FILE
  try {
    const data = fs.readFileSync(USER_VOTES_FILE, 'utf8');
    const votes = JSON.parse(data);
    // Ensure all ratings are stored as numbers
    Object.keys(votes).forEach(userId => {
      Object.keys(votes[userId] || {}).forEach(compId => {
        Object.keys(votes[userId][compId] || {}).forEach(submissionId => {
          if (votes[userId][compId][submissionId] && votes[userId][compId][submissionId].rating !== undefined) {
            votes[userId][compId][submissionId].rating = 
              parseInt(votes[userId][compId][submissionId].rating) || 0;
          }
        });
      });
    });
    return votes;
  } catch (error) {
    console.error('Error reading user votes file:', error);
    return {};
  }
}

// Get a user's vote for a specific submission in a competition
function getUserVote(userId, competitionId, submissionId) {
  const allVotes = getAllUserVotes();
  if (!allVotes[userId]) {
    return null;
  }
  if (!allVotes[userId][competitionId]) {
    return null;
  }
  return allVotes[userId][competitionId][submissionId] || null;
}

// Save user's vote
function saveUserVote(userId, competitionId, submissionId, rating) {
  const allVotes = getAllUserVotes();
  // Initialize user entry if doesn't exist
  if (!allVotes[userId]) {
    allVotes[userId] = {};
  }
  // Initialize competition entry if doesn't exist
  if (!allVotes[userId][competitionId]) {
    allVotes[userId][competitionId] = {};
  }
  // Save the vote
  allVotes[userId][competitionId][submissionId] = {
    rating: Math.min(10, parseInt(rating)), // Ensure rating doesn't exceed 10
    timestamp: new Date().toISOString()
  };
  // Save to file
  try {
    fs.writeFileSync(USER_VOTES_FILE, JSON.stringify(allVotes, null, 2));
  } catch (error) {
    console.error('Error writing user votes file:', error);
  }
  return allVotes[userId][competitionId][submissionId];
}

// Update the leaderboard when a vote is submitted
function updateLeaderboardAfterVote(competitionId, submissionId, rating, userId) {
  // If no userId provided, use a default (for backward compatibility)
  const userIdToUse = userId || 'anonymous_user';
  const leaderboard = getLeaderboard(competitionId);
  const submission = leaderboard.entries.find(entry => entry.id === submissionId);

  // Check if user has already voted for this submission
  const existingVote = getUserVote(userIdToUse, competitionId, submissionId);

  // Parse the new rating as an integer (between 1-10)
  const newRating = Math.min(10, Math.max(1, parseInt(rating) || 5));

  if (submission) {
    // Initialize vote_count if not set and ensure it's a number
    if (typeof submission.vote_count !== 'number' || isNaN(submission.vote_count)) {
      submission.vote_count = 0;
    } else {
      submission.vote_count = parseInt(submission.vote_count) || 0;
    }

    // Initialize average_rating if not set and ensure it's a number
    if (typeof submission.average_rating !== 'number' || isNaN(submission.average_rating)) {
      submission.average_rating = 0;
    } else {
      submission.average_rating = parseFloat(submission.average_rating) || 0;
    }

    console.log(`Vote processing for submission ${submissionId} with current stats: average=${submission.average_rating}, count=${submission.vote_count}`);

    if (existingVote) {
      // User is updating an existing vote
      const oldRating = parseInt(existingVote.rating);
      console.log(`User ${userIdToUse} is updating vote from ${oldRating} to ${newRating}`);

      // Make sure average_rating is treated as a number, not a string
      const avgRating = parseFloat(submission.average_rating) || 0;

      // Calculate sum of all ratings (including the old rating from this user)
      const totalRatingSum = avgRating * submission.vote_count;
      console.log(`totalRatingSum = ${avgRating} * ${submission.vote_count} = ${totalRatingSum}`);

      // Remove old rating and add new rating
      const newTotalSum = totalRatingSum - oldRating + newRating;
      console.log(`newTotalSum = ${totalRatingSum} - ${oldRating} + ${newRating} = ${newTotalSum}`);

      // Calculate new average (vote count doesn't change)
      const calculatedAvg = newTotalSum / submission.vote_count;
      console.log(`calculatedAvg = ${newTotalSum} / ${submission.vote_count} = ${calculatedAvg}`);
      submission.average_rating = isNaN(calculatedAvg) || !isFinite(calculatedAvg) ? 
          newRating : calculatedAvg;
      console.log(`Final average_rating: ${submission.average_rating}`);
    } else {
      // This is a new vote
      console.log(`User ${userIdToUse} is submitting a new vote of ${newRating}`);

      // Increment vote count for new vote
      submission.vote_count += 1;

      // Add new rating to sum and calculate new average
      const newSum = (submission.average_rating * (submission.vote_count - 1)) + newRating;
      const calculatedAvg = newSum / submission.vote_count;
      submission.average_rating = isNaN(calculatedAvg) || !isFinite(calculatedAvg) ? 
          newRating : calculatedAvg;
      console.log(`Final average_rating: ${submission.average_rating}`);
    }

    // Round to 1 decimal place for display and ensure rating doesn't exceed 10
    submission.average_rating = Math.min(10, Math.round(submission.average_rating * 10) / 10);
    console.log(`Final result: average=${submission.average_rating}, count=${submission.vote_count}`);
  } else {
    // If submission not found, add a new entry
    console.log(`Creating new submission entry for ${submissionId} with initial rating ${newRating}`);
    leaderboard.entries.push({
      id: submissionId,
      rank: leaderboard.entries.length + 1,
      title: `Submission ${submissionId}`,
      username: 'anonymous',
      average_rating: Math.min(10, newRating), // Ensure rating doesn't exceed 10
      vote_count: 1
    });
  }

  // Sort entries by average_rating (descending)
  leaderboard.entries.sort((a, b) => b.average_rating - a.average_rating);

  // Update ranks
  leaderboard.entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // Save the updated leaderboard
  updateLeaderboard(competitionId, leaderboard);

  // Save the user's vote (ensure we use parsed integer rating)
  saveUserVote(userIdToUse, competitionId, submissionId, newRating);

  // Return updated leaderboard along with all submissions
  return getLeaderboard(competitionId);
}

module.exports = {
  getAllLeaderboards,
  getLeaderboard,
  updateLeaderboard,
  updateLeaderboardAfterVote,
  getAllUserVotes,
  getUserVote,
  saveUserVote
};