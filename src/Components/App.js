// --- Full Replacement Code for: Frontend/src/Components/App.js ---
// Paths adjusted based on App.js being in Frontend/src/Components/

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- CSS Imports ---
// Assuming App.css is in Frontend/src/App.css
// Path from Frontend/src/Components/App.js to Frontend/src/App.css is '../App.css'
import '../App.css'; 

// CORRECTED PATH for our button styles:
// Path from Frontend/src/Components/App.js to Frontend/src/Assets/Styles/index.css
import '../Assets/Styles/index.css'; 

// --- Core Components (Assuming these are in the SAME Frontend/src/Components/ folder as App.js) ---
import AppNavbar from './Navbar';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import ProtectedRoute from './ProtectedRoute';

// --- Feature Components (Assuming these are in the SAME Frontend/src/Components/ folder as App.js) ---
import Competitions from './Competitions';
import CompetitionDetails from './CompetitionDetails';
import CreateCompetition from './CreateCompetition';
import EditCompetitionForm from './EditCompetitionForm';
import Leaderboard from './Leaderboard';
import SuggestCategory from './SuggestCategory';
import SubmissionForm from './SubmissionForm';
import ManageSubmissions from './ManageSubmissions';
import AdminPanel from './AdminPanel';

// --- Context ---
// Assuming AuthContext.js is in Frontend/src/Context/AuthContext.js
// Path from Frontend/src/Components/App.js to Frontend/src/Context/AuthContext.js is '../Context/AuthContext.js'
import { AuthProvider } from '../Context/AuthContext'; 

// --- NEW: Import our GoToTopButton component ---
// CORRECTED PATH: Assuming GoToTopButton.js is in the SAME Frontend/src/Components/ folder as App.js
import GoToTopButton from './GoToTopButton';

function App() {
  const protect = (element, roles = null) => (
      <ProtectedRoute allowedRoles={roles}>
          {element}
      </ProtectedRoute>
  );

  return (
      <AuthProvider>
          <div className="App">
            <AppNavbar />
            <main className="main-content" style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 15px' }}>
              <Routes>
                {/* All your page routes go here... */}
                <Route path="/" element={<Competitions />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/competitions" element={<Competitions />} />
                <Route path="/competitions/:competitionId" element={<CompetitionDetails />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/dashboard" element={protect(<Dashboard />)} />
                <Route path="/profile" element={protect(<Profile />)} />
                <Route path="/suggest-category" element={protect(<SuggestCategory />)} />
                <Route path="/competitions/:competitionId/submit" element={protect(<SubmissionForm />)} />
                <Route path="/create-competition" element={protect(<CreateCompetition />, ['Business', 'Admin'])} />
                <Route path="/competitions/:competitionId/edit" element={protect(<EditCompetitionForm />)} />
                <Route path="/dashboard/competitions/:competitionId/submissions" element={protect(<ManageSubmissions />)} />
                <Route path="/admin" element={protect(<AdminPanel />, ['Admin'])} />
                <Route path="*" element={<div style={{ padding: '20px' }}><h2>404 Not Found</h2><p>Sorry, the page you are looking for does not exist.</p></div>} />
              </Routes>
            </main>

            {/* --- Add the GoToTopButton component here --- */}
            <GoToTopButton />
          </div>
      </AuthProvider>
  );
}

export default App;