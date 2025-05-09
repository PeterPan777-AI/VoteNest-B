// src/Components/Dashboard.js
// --- Full Replacement Code ---
// --- Updated Create button visibility check ---

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext'; // Ensure correct path
import './Dashboard.css'; // Import the CSS file

// Define the backend base URL - adjust if your setup differs (e.g., using proxy)
const API_BASE_URL = ''; // Use empty string if using proxy, or http://localhost:5001 if not

function Dashboard() {
    const { user, token, isLoading: authLoading, isLoggedIn } = useAuth();
    const navigate = useNavigate(); // Hook for navigation after delete

    const [myCompetitions, setMyCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null); // Track which competition is being deleted

    // Function to fetch user's competitions
    const fetchMyCompetitions = useCallback(async () => {
        if (!token || !isLoggedIn) {
            setError("Please log in to view your dashboard.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setDeletingId(null); // Reset deleting state on fetch

        console.log("Dashboard: Fetching user's competitions...");

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const response = await axios.get(`${API_BASE_URL}/api/users/me/competitions`, config);

            console.log("Dashboard: API response received:", response.data);
            if (Array.isArray(response.data)) {
                setMyCompetitions(response.data);
            } else {
                console.error("Dashboard: API did not return an array:", response.data);
                setError("Failed to load competitions: Invalid data format from server.");
                setMyCompetitions([]);
            }
        } catch (err) {
            console.error("Dashboard: Error fetching competitions:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Could not fetch your competitions.';
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError(`${errorMsg} Please try logging in again.`);
            } else {
                setError(errorMsg);
            }
            setMyCompetitions([]);
        } finally {
            setLoading(false);
            console.log("Dashboard: Fetching complete.");
        }
    }, [token, isLoggedIn]); // Dependency array includes token and login status

    // Effect to fetch data when component mounts or auth state changes
    useEffect(() => {
        if (!authLoading) {
            if (isLoggedIn) {
                fetchMyCompetitions();
            } else {
                setMyCompetitions([]);
                setLoading(false);
                setError("You are not logged in.");
            }
        } else {
            setLoading(true); // Show loading while auth is resolving
        }
    }, [authLoading, isLoggedIn, fetchMyCompetitions]); // Rerun if auth state or fetch function changes


    // Function to handle competition deletion
    const handleDelete = useCallback(async (competitionId, competitionTitle) => {
        if (!token) {
            setError("Authentication error. Cannot delete.");
            return;
        }
        if (deletingId) return; // Prevent multiple simultaneous deletions

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the competition "${competitionTitle}"? This will also delete all its submissions and cannot be undone.`
        );

        if (confirmDelete) {
            setDeletingId(competitionId); // Indicate loading state for this specific competition
            setError(null); // Clear previous errors
            console.log(`Dashboard: Attempting to delete competition: ${competitionId}`);

            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                await axios.delete(`${API_BASE_URL}/api/competitions/${competitionId}`, config);

                console.log(`Dashboard: Competition ${competitionId} deleted successfully.`);
                setMyCompetitions(prevCompetitions =>
                    prevCompetitions.filter(comp => comp._id !== competitionId)
                );
                alert(`Competition "${competitionTitle}" deleted successfully.`);

            } catch (err) {
                console.error(`Dashboard: Error deleting competition ${competitionId}:`, err);
                setError(err.response?.data?.message || 'Failed to delete competition. Please try again.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setError(`${err.response.data.message || 'Authorization error.'} Please try logging in again.`);
                }
            } finally {
                setDeletingId(null); // Reset deleting state
            }
        } else {
            console.log("Dashboard: Competition deletion cancelled by user.");
        }
    }, [token, deletingId]); // Added deletingId dependency


    // --- Render Logic ---

    if (authLoading || loading) {
        return (
            <div className="dashboard-container">
                <h2>My Dashboard</h2>
                <p>Loading dashboard...</p>
            </div>
        );
    }

     if (error) {
        return (
            <div className="dashboard-container">
                <h2>My Dashboard</h2>
                <p className="dashboard-error">Error: {error}</p>
                 {!isLoggedIn && <p><Link to="/login">Please login</Link> to access your dashboard.</p>}
            </div>
        );
    }

    if (isLoggedIn && myCompetitions.length === 0) {
        return (
            <div className="dashboard-container">
                <h2>My Dashboard</h2>
                <p>You haven't created any competitions yet.</p>
                {/* *** UPDATED: Show create link if Business OR Admin *** */}
                {user && (user.role === 'Business' || user.role === 'Admin') && (
                    <Link to="/create-competition" className="dashboard-button create">
                        Create Your First Competition
                    </Link>
                )}
            </div>
        );
    }

    // Main content: Display the list of competitions
    return (
        <div className="dashboard-container">
            <h2>My Competitions</h2>
            <p>Manage the competitions you have created.</p>
            {/* *** UPDATED: Show create link if Business OR Admin *** */}
            {user && (user.role === 'Business' || user.role === 'Admin') && (
                <Link to="/create-competition" className="dashboard-button create" style={{marginBottom: '20px', display: 'inline-block'}}>
                    + Create New Competition
                </Link>
            )}

            {error && <p className="dashboard-error">Error: {error}</p>}

            <div className="my-competitions-list">
                {myCompetitions.map((comp) => (
                    <div key={comp._id} className="my-competition-item">
                        <div className="competition-info">
                            <h3 className="competition-title">{comp.title}</h3>
                            <p><strong>Status:</strong> {comp.status}</p>
                            <p><strong>Ends:</strong> {new Date(comp.endDate).toLocaleDateString()}</p>
                            <p><strong>ID:</strong> {comp.shortId}</p> {/* Display shortId */}
                        </div>
                        <div className="competition-actions">
                            {/* Links use shortId */}
                            <Link to={`/competitions/${comp.shortId}`} className="dashboard-button view">
                                View Public Page
                            </Link>
                            <Link to={`/competitions/${comp.shortId}/edit`} className="dashboard-button edit">
                                Edit Details
                            </Link>
                            <Link to={`/dashboard/competitions/${comp.shortId}/submissions`} className="dashboard-button manage">
                                Manage Submissions
                            </Link>
                            <button
                                onClick={() => handleDelete(comp._id, comp.title)} // Pass _id for deletion
                                disabled={deletingId === comp._id}
                                className="dashboard-button delete"
                            >
                                {deletingId === comp._id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard; // Make sure this is the VERY LAST line