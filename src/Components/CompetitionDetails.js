// client/src/Components/CompetitionDetails.js
// --- Full Replacement Code ---
// --- Added Category display ---
// --- Added console.log for competition data ---

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext'; // Adjust path if needed
import './CompetitionDetails.css'; // Assuming you have this CSS file

function CompetitionDetails() {
    const { competitionId } = useParams();
    const navigate = useNavigate();

    const [competition, setCompetition] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userVotedSubmissionIds, setUserVotedSubmissionIds] = useState(new Set());
    const [votingInProgress, setVotingInProgress] = useState(new Set());
    const [deleting, setDeleting] = useState(false);

    const { user, isLoading: authLoading, token, isLoggedIn } = useAuth();

    const fetchCompetitionData = useCallback(async () => {
        console.log(`------ fetchCompetitionData called for ID: ${competitionId}`);
        setLoading(true); setError(null); setDeleting(false);
        try {
            // Use GET request to fetch competition details
            const response = await axios.get(`/api/competitions/${competitionId}`);
            console.log("API Response Received for Competition Details:", response.data); // Existing log

            // --- ADDED CONSOLE LOG TO INSPECT COMPETITION OBJECT ---
            console.log("Competition data received in state:", response.data);
            // --- END ADDED CONSOLE LOG ---

            setCompetition(response.data); // Set the entire competition object

            // Extract and sort submissions IF they are populated directly
            // If submissions are fetched separately, this part might need adjustment
            const sortedSubmissions = response.data.submissions?.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0)) || [];
            setSubmissions(sortedSubmissions);

            // Logging competition type and creator info (optional debugging)
            if (response.data) {
                console.log('Competition Type from API:', response.data.competitionType);
                 // Check if category data is present
                 if (response.data.category) {
                    console.log('Category data from API:', response.data.category);
                 } else {
                     console.warn('Category data NOT present in API response.');
                 }
                 // Check creator data
                 if (response.data.createdBy && response.data.createdBy.role) {
                     console.log('Creator data from API:', response.data.createdBy);
                 } else if (response.data.createdBy) {
                     console.warn('Creator data present but MISSING ROLE in API response.');
                 } else {
                      console.warn('Creator data not present in API response (might be an orphaned competition).');
                 }
            }

        } catch (err) {
            console.error("Error fetching competition details:", err);
            if (err.response?.status === 404) { setError('Competition not found. It may have been deleted.'); }
            else { setError(err.response?.data?.message || 'Failed to load competition details.'); }
            setCompetition(null); setSubmissions([]);
        } finally { setLoading(false); console.log("Fetching competition details complete."); }
    }, [competitionId]); // Dependency: only competitionId needed for the fetch itself

    // Fetch data when component mounts or ID changes
    useEffect(() => { fetchCompetitionData(); }, [fetchCompetitionData]);

    // Effect to update voted status when auth or submissions change
    useEffect(() => {
        console.log(`--- Vote Status Check Effect Triggered ---`);
        console.log(`Auth Loading: ${authLoading}, User LoggedIn: ${isLoggedIn}, Submissions count: ${submissions.length}`);
        if (!authLoading && submissions.length > 0) {
            if (isLoggedIn && user?._id) {
                // Ensure votedByUsers is an array before using includes
                const votedIds = new Set(
                    submissions
                        .filter(sub => Array.isArray(sub?.votedByUsers) && sub.votedByUsers.includes(user._id))
                        .map(sub => sub._id)
                );
                setUserVotedSubmissionIds(votedIds);
                console.log("User voted IDs set:", Array.from(votedIds));
            } else {
                setUserVotedSubmissionIds(new Set()); console.log("User not logged in or user ID missing. Cleared voted IDs.");
            }
        } else if (!authLoading) {
             setUserVotedSubmissionIds(new Set()); console.log("No submissions loaded or auth loading. Cleared voted IDs.");
        }
        console.log(`--- Vote Status Check Effect Finished ---`);
    }, [authLoading, isLoggedIn, user, submissions]); // Dependencies for vote status check

    // --- Voting Handler ---
    const handleVote = useCallback(async (submissionId) => {
        if (!isLoggedIn || !token) { alert('Please log in to vote.'); return; }
        if (competition?.status !== 'voting') { alert('Voting is not currently open for this competition.'); return; }
        if (votingInProgress.has(submissionId)) return; // Prevent double clicks

        setVotingInProgress(prev => new Set(prev).add(submissionId));
        try {
            // POST request to vote endpoint
            await axios.post(`/api/submissions/${submissionId}/vote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update frontend state optimistically (or re-fetch if preferred)
            setSubmissions(prevSubmissions =>
                prevSubmissions.map(sub =>
                    sub._id === submissionId
                        ? { ...sub,
                            voteCount: (sub.voteCount || 0) + 1,
                            // Ensure votedByUsers exists and add user ID
                            votedByUsers: [...(Array.isArray(sub.votedByUsers) ? sub.votedByUsers : []), user._id]
                          }
                        : sub
                // Re-sort after updating vote count
                ).sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
            );
            // Update the set of submissions the user has voted on
            setUserVotedSubmissionIds(prev => new Set(prev).add(submissionId));
            // alert('Vote recorded successfully!'); // Consider a less intrusive notification
        } catch (err) {
            console.error("Error voting:", err);
            alert(err.response?.data?.message || 'Failed to record vote. You might have already voted or an error occurred.');
        } finally {
            // Remove submission ID from voting in progress set
            setVotingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(submissionId);
                return newSet;
            });
        }
    }, [isLoggedIn, token, user?._id, competition?.status, votingInProgress]); // Updated dependencies


    // --- Delete Handler ---
    const handleDelete = useCallback(async () => {
        if (!isLoggedIn || !token || !user || !competition?._id) {
            alert('Cannot delete: Missing authentication or competition data.'); return;
        }
        const isCreator = competition.createdBy?._id === user._id;
        const isAdmin = user.role === 'Admin';

        if (!isCreator && !isAdmin) {
            alert('You are not authorized to delete this competition.'); return;
        }

        if (window.confirm(`Are you sure you want to permanently delete the competition "${competition.title}" and all its submissions? This action cannot be undone.`)) {
            setDeleting(true);
            try {
                // DELETE request to competition endpoint (using shortId if available)
                await axios.delete(`/api/competitions/${competition.shortId || competitionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Competition deleted successfully.');
                navigate('/competitions'); // Navigate away after deletion
            } catch (err) {
                console.error("Error deleting competition:", err);
                alert(err.response?.data?.message || 'Failed to delete competition.');
                setDeleting(false); // Reset deleting state on error
            }
            // No finally block needed for deleting state here, as navigation occurs on success
        }
    }, [isLoggedIn, token, user, competition, competitionId, navigate]); // Dependencies for delete


    // --- Helper Function ---
    const isImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        // Basic image extension check
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    };

    // --- Render Logic ---

    // Loading States
    if (authLoading || (loading && !competition && !error)) return <div className="details-container"><p>Loading competition details...</p></div>;
    if (error && !competition) return <div className="details-container"><p className="details-not-found">Error: {error}</p><Link to="/competitions" className="back-link">Back to Competitions</Link></div>;
    if (!competition && !loading) return <div className="details-container"><p className="details-not-found">Competition not found.</p><Link to="/competitions" className="back-link">Back to Competitions</Link></div>;

    // Determine Submission/Voting Eligibility (using state variables now)
    let canSubmit = false;
    let submitInfoText = '';
    const competitionStatus = competition?.status;
    const compType = competition?.competitionType;
    const currentUserRole = user?.role;

    // Submission Eligibility Logic (Simplified for clarity)
    if (competitionStatus === 'open' && isLoggedIn) {
        if (currentUserRole === 'Admin' ||
           (currentUserRole === 'Individual' && compType === 'Standard') ||
           (currentUserRole === 'Business' && compType === 'Business')) {
            canSubmit = true;
        } else if (compType) {
            submitInfoText = `As a(n) '${currentUserRole}' user, you cannot submit to a '${compType}' competition.`;
        } else {
            submitInfoText = 'Submission eligibility cannot be determined (missing competition type or role).';
        }
    } else if (competitionStatus !== 'open') {
        submitInfoText = 'Submissions are closed for this competition.';
    } else if (!isLoggedIn) {
        submitInfoText = <><Link to="/login">Login</Link> to submit.</>;
    }

    // Voting Eligibility Logic (Simplified for clarity)
    let canUserVoteInThisCompetitionType = false;
    let votingEligibilityInfoText = '';
    if (isLoggedIn) {
        if (currentUserRole === 'Admin' || currentUserRole === 'Individual' ||
           (currentUserRole === 'Business' && compType === 'Business')) {
             canUserVoteInThisCompetitionType = true;
        } else if (compType) {
            votingEligibilityInfoText = `As a 'Business' user, you can only vote in 'Business' competitions.`;
        } else {
            votingEligibilityInfoText = 'Voting eligibility cannot be determined.';
        }
    } else {
         votingEligibilityInfoText = <><Link to="/login">Login</Link> to see voting options.</>;
    }


    const isCreatorOrAdmin = isLoggedIn && user?._id && competition?.createdBy?._id && (user._id === competition.createdBy._id || user.role === 'Admin');
    const displayError = error && competition ? error : null; // Display subsequent errors even if competition loaded initially
    const creatorName = competition?.createdBy?.username || 'Unknown Creator';
    // --- GET CATEGORY NAME ---
    const categoryName = competition?.category?.name || 'N/A'; // Safely access category name

    return (
        <div className="details-container">
            <Link to="/competitions" className="back-link">← Back to Competitions</Link>

            <div className="details-header">
                <h2 className="details-title">{competition.title}</h2>
                <p className="details-type"><strong>Type:</strong> {competition.competitionType || 'N/A'}</p>

                {/* Conditional Action Buttons */}
                {authLoading && <p className="details-cannot-submit-info">Loading user status...</p>}
                {!authLoading && (
                    <div className="details-actions">
                        {canSubmit && (
                            <Link to={`/competitions/${competition.shortId || competitionId}/submit`} className="details-submit-button">Submit Entry</Link>
                        )}
                        {!canSubmit && submitInfoText && (
                            <p className="details-cannot-submit-info">{submitInfoText}</p>
                        )}

                        {/* Edit/Delete only for creator or admin */}
                        {isCreatorOrAdmin && (
                             <>
                                 <Link
                                    to={`/competitions/${competition.shortId || competitionId}/edit`}
                                    className="details-edit-button"
                                    style={{ marginLeft: '10px' }}
                                 >
                                    Edit
                                 </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="details-delete-button"
                                    style={{ marginLeft: '10px' }}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                             </>
                         )}
                    </div>
                )}
            </div>

            {/* --- MOVED INFO SECTION BEFORE SUBMISSIONS --- */}
            <div className="details-info-section">
                <div className="details-section"><strong>Description</strong><p>{competition.description || 'N/A'}</p></div>
                {/* --- ADDED CATEGORY DISPLAY --- */}
                <div className="details-section"><strong>Category</strong><p>{categoryName}</p></div>
                {/* --- END ADDED CATEGORY DISPLAY --- */}
                <div className="details-section"><strong>Status</strong><p style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{competition.status}</p></div>
                <div className="details-section"><strong>Ends on</strong><p>{new Date(competition.endDate).toLocaleDateString()}</p></div>
                <div className="details-section"><strong>Created by</strong><p>{creatorName} (Role: {competition.createdBy?.role || 'Unknown'})</p></div>
            </div>

            {displayError && <div className="error-message" style={{ color: 'red', marginBottom: '15px', fontWeight: 'bold' }}>Error: {displayError}</div>}

            {/* --- SUBMISSIONS SECTION --- */}
            <div className="details-submissions-section">
                <h2>Submissions ({submissions.length})</h2>
                {loading && submissions.length === 0 && <p>Loading submissions...</p>}
                {!loading && submissions.length === 0 && competition.status === 'open' && <p className="details-placeholder-text">No submissions yet. Be the first!</p>}
                {!loading && submissions.length === 0 && competition.status !== 'open' && <p className="details-placeholder-text">No submissions were made for this competition.</p>}

                {/* Display voting eligibility warning if applicable */}
                {competition.status === 'voting' && !canUserVoteInThisCompetitionType && votingEligibilityInfoText && (
                     <p className="details-cannot-vote-info">{votingEligibilityInfoText}</p>
                )}

                {/* Submissions Grid */}
                {submissions.length > 0 && (
                    <div className="submissions-grid">
                        {submissions.map(sub => {
                            // Basic validation for submission object
                            if (!sub?._id) {
                                console.warn("Skipping rendering of an invalid submission object:", sub);
                                return null;
                            }
                            const submitterName = sub.userId?.username || 'Anonymous';
                            // Determine if vote button should be shown and enabled
                            const showVoteButtonForThisSubmission = competition.status === 'voting' &&
                                                                 isLoggedIn &&
                                                                 canUserVoteInThisCompetitionType &&
                                                                 !userVotedSubmissionIds.has(sub._id);

                            const alreadyVotedOnThis = isLoggedIn && userVotedSubmissionIds.has(sub._id);

                            return (
                                <div key={sub._id} className="submission-card">
                                    <h3 className="submission-title">{sub.entryTitle || 'Untitled Entry'}</h3>
                                    <p className="submission-author">By: {submitterName}</p>
                                    <p className="submission-description">{sub.description || 'No description.'}</p>

                                    {/* Display Submission Files */}
                                    {Array.isArray(sub.fileUrls) && sub.fileUrls.length > 0 && (
                                        <div className="submission-files">
                                            <strong>Files:</strong>
                                            <ul>
                                                {sub.fileUrls.map((fileUrl, index) => {
                                                    // Basic parsing for filename
                                                    const filename = typeof fileUrl === 'string' ? fileUrl.substring(fileUrl.lastIndexOf('/') + 1) : `file_${index + 1}`;
                                                    // Construct display URL assuming backend serves static files correctly
                                                    const displayUrl = `/uploads/${filename}`; // Adjust if your static serving path is different
                                                    return (
                                                        <li key={index}>
                                                            <a href={displayUrl} target="_blank" rel="noopener noreferrer">{filename}</a>
                                                            {isImageUrl(filename) && ( // Check filename for image extension
                                                                <img src={displayUrl} alt={`Preview for ${filename}`} style={{ maxWidth: '100px', maxHeight: '100px', display: 'block', marginTop: '5px' }} />
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="submission-votes">Votes: {sub.voteCount || 0}</p>

                                    {/* Vote Button Logic */}
                                    {competition.status === 'voting' && isLoggedIn && canUserVoteInThisCompetitionType && (
                                        <button
                                            onClick={() => handleVote(sub._id)}
                                            // Disable if not eligible, already voted, or vote in progress
                                            disabled={!showVoteButtonForThisSubmission || votingInProgress.has(sub._id)}
                                            className={`vote-button ${alreadyVotedOnThis ? 'voted' : ''}`}
                                        >
                                            {votingInProgress.has(sub._id) ? 'Voting...' : (alreadyVotedOnThis ? 'Voted' : 'Vote')}
                                        </button>
                                    )}
                                    {/* Prompt login if voting is open but user isn't logged in */}
                                    {competition.status === 'voting' && !isLoggedIn && (
                                        <p><Link to="/login">Login</Link> to vote.</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div> {/* End Submissions Section */}
        </div> // End Details Container
    );
}

export default CompetitionDetails;