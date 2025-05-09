// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Handles page routing

// --- NEW: Import Bootstrap CSS ---
// This line must come BEFORE your own CSS imports to allow overrides
import 'bootstrap/dist/css/bootstrap.min.css';

// Import global styles and the main App component
import './Assets/Styles/index.css'; // Adjust path if your CSS is elsewhere
// Assuming App.js is inside src/Components/
import App from './Components/App'; // Verify this path is correct for your App component

// Import our AuthProvider CORRECTLY
// Use the correct file path and NAMED import syntax (curly braces)
import { AuthProvider } from './Context/AuthContext'; // <-- CORRECTED LINE

import reportWebVitals from './reportWebVitals'; // For performance measuring (optional)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 1. BrowserRouter handles URLs */}
    <BrowserRouter>
       {/* 2. AuthProvider wraps the App, providing context */}
      <AuthProvider> {/* This now correctly refers to the imported AuthProvider */}
         {/* 3. App contains all your pages and components */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();