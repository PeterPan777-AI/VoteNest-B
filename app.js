import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LeaderboardPage from './pages/LeaderboardPage';
import CompetitionsPage from './pages/CompetitionsPage';
import HomePage from './pages/HomePage';
import Navigation from '../Components/Navigation';
import Footer from '../Components/Footer';
import apiClient from './api-client';

function App() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const competitions = await apiClient.fetchCompetitions();
        const uniqueCategories = [];
        const categorySet = new Set();

        competitions.forEach(comp => {
          if (comp.categories && Array.isArray(comp.categories)) {
            comp.categories.forEach(cat => {
              if (!categorySet.has(cat)) {
                categorySet.add(cat);
                uniqueCategories.push({
                  id: cat.toLowerCase().replace(/\s+/g, '-'),
                  name: cat,
                });
              }
            });
          }
        });

        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/competitions" element={<CompetitionsPage categories={categories} />} />
            <Route path="/leaderboard" element={<LeaderboardPage categories={categories} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;