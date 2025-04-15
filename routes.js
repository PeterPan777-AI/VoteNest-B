const mockDatabase = {
  categories: [
    { id: 'cat-b1', name: 'Best AI Tool', description: 'Developers...', is_business: true },
    { id: 'cat-b2', name: 'Most Innovative Gadget', description: 'Tech brands...', is_business: true }
  ],
  leaderboards: {
    'mock-comp-1': {
      competition_id: 'mock-comp-1',
      entries: [
        { submission_id: 'sub-1', user_id: 'user-1', username: 'designMaster', title: 'Minimalist AI Logo', average_rating: 8.5, vote_count: 2, rank: 2 }
      ]
    }
  }
};

function registerVotingApiRoutes(app) {
  app.get('/api/categories', (req, res) => {
    res.json(mockDatabase.categories);
  });

  app.get('/api/leaderboards/:competitionId', (req, res) => {
    const { competitionId } = req.params;
    const leaderboard = mockDatabase.leaderboards[competitionId];
    if (!leaderboard) {
      return res.status(404).json({ error: 'Leaderboard not found' });
    }
    res.json(leaderboard);
  });
}

module.exports = { registerVotingApiRoutes };