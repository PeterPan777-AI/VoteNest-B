// client/src/Components/App.js
// --- Full Replacement Code ---
// --- Ensures ALL imports and component usages are correct ---

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Core Components (Now relative to src/Components/) ---
import AppNavbar from './Navbar';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import ProtectedRoute from './ProtectedRoute';

// --- Feature Components (Now relative to src/Components/) ---
// *** CORRECTED IMPORT FOR THE FRONTEND COMPETITIONS COMPONENT ***
import Competitions from './Competitions'; // This should point to the file created in Step 1
import CompetitionDetails from './CompetitionDetails';
import CreateCompetition from './CreateCompetition';
import EditCompetitionForm from './EditCompetitionForm';
import Leaderboard from './Leaderboard';
import SuggestCategory from './SuggestCategory';
import SubmissionForm from './SubmissionForm';
import ManageSubmissions from './ManageSubmissions';
import AdminPanel from './AdminPanel';

// --- Context (Go one level UP to src/) ---
import { AuthProvider } from '../Context/AuthContext';

// --- CSS (Go one level UP to src/) ---
import '../App.css'; // Assuming App.css is in src/

function App() {

  // Helper function to wrap component with ProtectedRoute
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
                {/* === Public Routes === */}
                <Route path="/" element={<Competitions />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/competitions" element={<Competitions />} />
                <Route path="/competitions/:competitionId" element={<CompetitionDetails />} />
                <Route path="/leaderboard" element={<Leaderboard />} />

                {/* === Protected Routes (Login Required) === */}
                <Route path="/dashboard" element={protect(<Dashboard />)} />
                <Route path="/profile" element={protect(<Profile />)} />
                <Route path="/suggest-category" element={protect(<SuggestCategory />)} />
                <Route path="/competitions/:competitionId/submit" element={protect(<SubmissionForm />)} />

                {/* --- Protected Routes (Login + Role Required) --- */}
                <Route
                    path="/create-competition"
                    element={protect(<CreateCompetition />, ['Business', 'Admin'])}
                />
                <Route
                    path="/competitions/:competitionId/edit"
                    element={protect(<EditCompetitionForm />)} // This usually needs admin/creator role
                />
                <Route
                    path="/dashboard/competitions/:competitionId/submissions"
                    element={protect(<ManageSubmissions />)} // This usually needs admin/creator role
                />
                <Route
                    path="/admin"
                    element={protect(<AdminPanel />, ['Admin'])}
                />

                {/* === Catch-all Route === */}
                <Route path="*" element={<div style={{ padding: '20px' }}><h2>404 Not Found</h2><p>Sorry, the page you are looking for does not exist.</p></div>} />

              </Routes>
            </main>
          </div>
      </AuthProvider>
  );
}

export default App;