const API_BASE_URL = 'http://localhost:5000/api';

export const fetchCompetitions = async () => {
  const response = await fetch(`${API_BASE_URL}/competitions`);
  if (!response.ok) throw new Error('Failed to fetch competitions');
  return response.json();
};

export const fetchLeaderboard = async (competitionId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/leaderboards/${competitionId}${queryParams ? `?${queryParams}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
};