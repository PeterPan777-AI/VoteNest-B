// src/ManageSubmissions.js
// --- Full Replacement Code ---

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Adjust path if needed (e.g., ../Context/AuthContext)
import axios from 'axios'; // Import axios for API calls
import './ManageSubmissions.css'; // Create and import a CSS file for styling

// Define the backend base URL for constructing file links
const BACKEND_URL = 'http://localhost:5001'; // Make sure this matches your backend port

function ManageSubmissions() {
    const { competitionId } = useParams(); // Get the competition ID/shortId from the URL
    const { user, token, isLoading: authLoading, isLoggedIn } = useAuth();

    // State for submissions data, title, loading, and errors
    const [submissions, setSubmissions] = useState([]);
    const [competitionTitle, setCompetitionTitle] = useState('');
    const [competitionShortId, setCompetitionShortId] = useState(competitionId); // Store shortId for linking
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Callback function to fetch submissions data
    const fetchSubmissions = useCallback(async () => {
        // Ensure user is logged in and token is available
        if (!isLoggedIn || !token) {
            setError("Authentication required. Please log in.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        console.log(`ManageSubmissions: Fetching submissions for competition ID: ${competitionId}`);

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            // Make the API call to the specific backend endpoint
            const response = await axios.get(`/api/competitions/${competitionId}/submissions`, config);

            console.log("ManageSubmissions: API Response Received:", response.data);

            // Update state with data from the response
            if (response.data && Array.isArray(response.data.submissions)) {
                setCompetitionTitle(response.data.competitionTitle || 'Competition Details');
                setSubmissions(response.data.submissions);
                setCompetitionShortId(response.data.competitionShortId || competitionId); // Update shortId if backend provides it
            } else {
                console.error("ManageSubmissions: Invalid data format received:", response.data);
                setError("Received invalid data format from the server.");
                setSubmissions([]);
                setCompetitionTitle('');
            }

        } catch (err) {
            console.error("ManageSubmissions: Error fetching submissions:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load submissions.';
            setError(errorMsg);
            setSubmissions([]);
            setCompetitionTitle(''); // Clear title on error too

            // Handle specific errors (e.g., Forbidden if not the creator)
            if (err.response?.status === 403) {
                setError("You are not authorized to view these submissions.");
            } else if (err.response?.status === 404) {
                setError("Competition not found.");
            } else if (err.response?.status === 401) {
                setError("Authentication failed. Please log in again.");
            }
        } finally {
            setLoading(false); // Ensure loading is set to false after fetch attempt
            console.log("ManageSubmissions: Fetching complete.");
        }
    }, [competitionId, token, isLoggedIn]); // Dependencies for the useCallback

    // useEffect to trigger the fetch when the component mounts or dependencies change
    useEffect(() => {
        if (!authLoading) { // Only fetch if auth state is resolved
            fetchSubmissions();
        } else {
            setLoading(true); // Show loading while auth is resolving
        }
    }, [authLoading, fetchSubmissions]); // Rerun effect if auth state or fetch function changes

    // Helper function to check if a URL is likely an image
    const isImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    };


    // --- Render Logic ---

    // 1. Show loading state (while auth is resolving or data is fetching)
    if (authLoading || loading) {
        return (
            <div className="manage-submissions-container">
                <h2>Manage Submissions for {competitionTitle || `Competition ${competitionId}`}</h2>
                <p>Loading submission data...</p>
            </div>
        );
    }

    // 2. Show error state
    if (error) {
        return (
            <div className="manage-submissions-container">
                <h2>Manage Submissions</h2>
                <p className="error-message">Error: {error}</p>
                <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
            </div>
        );
    }

    // 3. Main content: Display submissions list
    return (
        <div className="manage-submissions-container">
            <h2>Manage Submissions for "{competitionTitle}"</h2>
            <div className="navigation-links">
                <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
                {/* Link to the public competition page using the fetched shortId */}
                <Link to={`/competitions/${competitionShortId}`} className="view-public-link">View Public Page →</Link>
            </div>

            <div className="submissions-list-section">
                <h3>Submissions List ({submissions.length})</h3>
                {submissions.length === 0 ? (
                    <p className="no-submissions-message">No submissions have been made for this competition yet.</p>
                ) : (
                    <div className="submissions-list">
                        {submissions.map((sub) => {
                             if (!sub?._id) {
                                console.warn("Submission missing _id:", sub);
                                return null; // Skip rendering if essential data is missing
                             }
                             const submitter = sub.userId; // User object is populated by backend
                             const filesToRender = sub.fileUrls && Array.isArray(sub.fileUrls) ? sub.fileUrls : [];

                             return (
                                <div key={sub._id} className="submission-manage-item">
                                    <div className="submission-header">
                                        <h4 className="submission-entry-title">{sub.entryTitle || 'Untitled Entry'}</h4>
                                        <span className="submission-date">
                                            Submitted: {new Date(sub.submissionDate || sub.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="submission-details">
                                        <p><strong>Submitter:</strong> {submitter?.username || 'Unknown User'} ({submitter?.email || 'No Email'})</p>
                                        <p><strong>Role:</strong> {submitter?.role || 'N/A'}</p>
                                        <p><strong>Description:</strong> {sub.description || 'No description provided.'}</p>
                                        <p><strong>Votes:</strong> {sub.voteCount !== undefined ? sub.voteCount : 'N/A'}</p>
                                    </div>
                                    {filesToRender.length > 0 && (
                                        <div className="submission-files-manage">
                                            <strong>Files:</strong>
                                            <ul>
                                                {filesToRender.map((fileUrl, index) => {
                                                    // Construct absolute URL for the file link
                                                    const absoluteFileUrl = `${BACKEND_URL}${fileUrl}`;
                                                    // Extract filename for display
                                                    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
                                                    return (
                                                        <li key={index}>
                                                            <a href={absoluteFileUrl} target="_blank" rel="noopener noreferrer" className="submission-file-link">
                                                                {filename}
                                                            </a>
                                                            {isImageUrl(fileUrl) && (
                                                                <img src={absoluteFileUrl} alt={`Preview ${index+1}`} className="submission-image-thumbnail" />
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Placeholder for future management actions (e.g., disqualify, mark winner) */}
                                    <div className="submission-manage-actions">
                                         {/* <button disabled>Disqualify</button> */}
                                         {/* <button disabled>Mark as Winner</button> */}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageSubmissions;