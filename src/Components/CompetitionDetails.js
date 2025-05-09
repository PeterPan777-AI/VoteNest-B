// client/src/Components/CompetitionDetails.js
// --- Full Replacement Code ---
// --- Updated Submission & Voting Eligibility based on competition.competitionType ---
// --- ESLint dependency warning for handleVote resolved ---

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
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
            const response = await axios.get(`/api/competitions/${competitionId}`);
            console.log("API Response Received for Competition Details:", response.data);
            setCompetition(response.data);
            const sortedSubmissions = response.data.submissions?.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0)) || [];
            setSubmissions(sortedSubmissions);
            
            if (response.data) {
                console.log('Competition Type from API:', response.data.competitionType);
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
    }, [competitionId]);

    useEffect(() => { fetchCompetitionData(); }, [fetchCompetitionData]);

    useEffect(() => {
        console.log(`--- Vote Status Check Effect Triggered ---`);
        console.log(`Auth Loading: ${authLoading}, User LoggedIn: ${isLoggedIn}, Submissions count: ${submissions.length}`);
        if (!authLoading && submissions.length > 0) {
            if (isLoggedIn && user?._id) {
                const votedIds = new Set( submissions.filter(sub => sub?.votedByUsers?.includes(user._id)).map(sub => sub._id) );
                setUserVotedSubmissionIds(votedIds);
                console.log("User voted IDs set:", Array.from(votedIds));
            } else {
                setUserVotedSubmissionIds(new Set()); console.log("User not logged in or user ID missing. Cleared voted IDs.");
            }
        } else if (!authLoading) {
             setUserVotedSubmissionIds(new Set()); console.log("No submissions loaded or auth loading. Cleared voted IDs.");
        }
        console.log(`--- Vote Status Check Effect Finished ---`);
    }, [authLoading, isLoggedIn, user, submissions]);

    const handleVote = useCallback(async (submissionId) => {
        if (!isLoggedIn || !token) {
            alert('Please log in to vote.');
            return;
        }
        if (competition?.status !== 'voting') {
            alert('Voting is not currently open for this competition.');
            return;
        }
        if (votingInProgress.has(submissionId)) return;

        setVotingInProgress(prev => new Set(prev).add(submissionId));
        try {
            await axios.post(`/api/submissions/${submissionId}/vote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissions(prevSubmissions =>
                prevSubmissions.map(sub =>
                    sub._id === submissionId
                        ? { ...sub, voteCount: (sub.voteCount || 0) + 1, votedByUsers: [...(sub.votedByUsers || []), user._id] }
                        : sub
                ).sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
            );
            setUserVotedSubmissionIds(prev => new Set(prev).add(submissionId));
            alert('Vote recorded successfully!');
        } catch (err) {
            console.error("Error voting:", err);
            alert(err.response?.data?.message || 'Failed to record vote. You might have already voted or an error occurred.');
        } finally {
            setVotingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(submissionId);
                return newSet;
            });
        }
    }, [isLoggedIn, token, user, competition?.status, votingInProgress]); // MODIFIED LINE: Removed competition?.competitionType

    const handleDelete = useCallback(async () => {
        if (!isLoggedIn || !token || !user || !competition || !competition._id) {
            alert('Cannot delete: Missing authentication or competition data.');
            return;
        }
        const isCreator = competition.createdBy && competition.createdBy._id === user._id;
        const isAdmin = user.role === 'Admin';

        if (!isCreator && !isAdmin) {
            alert('You are not authorized to delete this competition.');
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete the competition "${competition.title}" and all its submissions? This action cannot be undone.`)) {
            setDeleting(true);
            try {
                await axios.delete(`/api/competitions/${competition.shortId || competitionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Competition deleted successfully.');
                navigate('/competitions'); 
            } catch (err) {
                console.error("Error deleting competition:", err);
                alert(err.response?.data?.message || 'Failed to delete competition.');
                setDeleting(false);
            }
        }
    }, [isLoggedIn, token, user, competition, competitionId, navigate]);

    const isImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    };

    if (authLoading || (loading && !competition && !error)) return <div className="details-container"><p>Loading competition details...</p></div>;
    if (error && !competition) return <div className="details-container"><p className="details-not-found">Error: {error}</p><Link to="/competitions" className="back-link">Back to Competitions</Link></div>;
    if (!competition && !loading) return <div className="details-container"><p className="details-not-found">Competition not found.</p><Link to="/competitions" className="back-link">Back to Competitions</Link></div>;

    // --- Determine Submission Eligibility ---
    let canSubmit = false;
    let submitInfoText = '';
    const competitionStatus = competition.status;
    const compType = competition.competitionType; 
    const currentUserRole = user?.role;

    console.log("--- DEBUG: Checking Submission Eligibility ---");
    console.log(`DEBUG: Competition Status = ${competitionStatus}`);
    console.log(`DEBUG: Competition Type = ${compType}`);
    console.log(`DEBUG: Is Logged In = ${isLoggedIn}`);
    console.log(`DEBUG: Current User Role = ${currentUserRole}`);

    if (competitionStatus !== 'open') {
        submitInfoText = 'Submissions are closed for this competition.';
        console.log("DEBUG: Reason - Competition not open.");
    } else if (!isLoggedIn) {
        submitInfoText = <><Link to="/login">Login</Link> to submit.</>;
        console.log("DEBUG: Reason - User not logged in.");
    } else if (!compType) {
        submitInfoText = 'Cannot determine submission eligibility (competition type is missing).';
        console.log("DEBUG: Reason - Competition type missing from competition data.");
    } else {
        console.log("DEBUG: Checking roles and competition type for submission...");
        if (currentUserRole === 'Admin') {
            canSubmit = true;
            console.log("DEBUG: User is Admin, allowing submission to any type.");
        } else if (currentUserRole === 'Individual') {
            console.log("DEBUG: User is Individual.");
            if (compType === 'Standard') {
                canSubmit = true;
                console.log("DEBUG: Competition is 'Standard', allowing submission for Individual user.");
            } else { 
                submitInfoText = `As an 'Individual' user, you can only submit to 'Standard' type competitions. This is a '${compType}' competition.`;
                console.log(`DEBUG: Competition is '${compType}', disallowing submission for Individual user.`);
            }
        } else if (currentUserRole === 'Business') {
            console.log("DEBUG: User is Business.");
            if (compType === 'Business') {
                canSubmit = true;
                console.log("DEBUG: Competition is 'Business', allowing submission for Business user.");
            } else { 
                submitInfoText = `As a 'Business' user, you can only submit to 'Business' type competitions. This is a '${compType}' competition.`;
                console.log(`DEBUG: Competition is '${compType}', disallowing submission for Business user.`);
            }
        } else {
            submitInfoText = 'Your user role is not recognized or does not permit submission under the current rules.';
            console.log(`DEBUG: User role (${currentUserRole}) not recognized or not permitted for submission.`);
        }
    }

    if (!canSubmit && !submitInfoText && competitionStatus === 'open' && isLoggedIn) {
        submitInfoText = 'You are not eligible to submit to this competition based on the current criteria.';
        console.log("DEBUG: Fallback - Not eligible for submission based on current criteria.");
    }

    console.log(`DEBUG: Final canSubmit = ${canSubmit}`);
    console.log(`DEBUG: Final submitInfoText = ${typeof submitInfoText === 'string' ? submitInfoText : 'JSX Element for submitInfoText'}`);
    console.log("--- DEBUG: Submission Eligibility Check Complete ---");


    // --- Determine Voting Eligibility for the entire competition ---
    let canUserVoteInThisCompetitionType = false;
    let votingEligibilityInfoText = ''; 

    console.log("--- DEBUG: Checking Voting Eligibility for Competition Type ---");
    console.log(`DEBUG: Competition Type = ${compType}`);
    console.log(`DEBUG: Current User Role = ${currentUserRole}`);

    if (!isLoggedIn) {
        votingEligibilityInfoText = <><Link to="/login">Login</Link> to see voting options.</>;
        console.log("DEBUG: User not logged in, cannot vote.");
    } else if (!compType) {
        votingEligibilityInfoText = 'Cannot determine voting eligibility (competition type is missing).';
        console.log("DEBUG: Reason - Competition type missing from competition data for voting.");
    } else {
        if (currentUserRole === 'Admin') {
            canUserVoteInThisCompetitionType = true;
            console.log("DEBUG: User is Admin, allowed to vote in any competition type.");
        } else if (currentUserRole === 'Individual') {
            canUserVoteInThisCompetitionType = true; 
            console.log("DEBUG: User is Individual, allowed to vote in 'Standard' or 'Business' competitions.");
        } else if (currentUserRole === 'Business') {
            if (compType === 'Business') {
                canUserVoteInThisCompetitionType = true;
                console.log("DEBUG: User is Business, allowed to vote in 'Business' competitions.");
            } else { 
                votingEligibilityInfoText = "As a 'Business' user, you can only vote in 'Business' type competitions.";
                console.log("DEBUG: User is Business, NOT allowed to vote in 'Standard' competitions.");
            }
        } else {
            votingEligibilityInfoText = "Your user role is not recognized for voting.";
            console.log(`DEBUG: User role (${currentUserRole}) not recognized for voting.`);
        }
    }
    console.log(`DEBUG: Final canUserVoteInThisCompetitionType = ${canUserVoteInThisCompetitionType}`);
    console.log(`DEBUG: Final votingEligibilityInfoText = ${typeof votingEligibilityInfoText === 'string' ? votingEligibilityInfoText : 'JSX Element for votingEligibilityInfoText'}`);
    console.log("--- DEBUG: Voting Eligibility for Competition Type Check Complete ---");


    const isCreatorOrAdmin = isLoggedIn && user?._id && competition?.createdBy?._id && (user._id === competition.createdBy._id || user.role === 'Admin');
    const displayError = error && competition ? error : null;
    const creatorName = competition?.createdBy?.username || 'Unknown Creator';

    return (
        <div className="details-container">
            <Link to="/competitions" className="back-link">← Back to Competitions</Link>

            <div className="details-header">
                <h2 className="details-title">{competition.title}</h2>
                <p className="details-type"><strong>Type:</strong> {competition.competitionType || 'N/A'}</p>
                
                {authLoading && <p className="details-cannot-submit-info">Loading user status...</p>}
                {!authLoading && (
                    <div className="details-actions">
                        {canSubmit && (
                            <Link to={`/competitions/${competition.shortId || competitionId}/submit`} className="details-submit-button">Submit Entry</Link>
                        )}
                        {!canSubmit && submitInfoText && (
                            <p className="details-cannot-submit-info">{submitInfoText}</p>
                        )}

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

            <div className="details-info-section">
                <div className="details-section"><strong>Description</strong><p>{competition.description || 'N/A'}</p></div>
                <div className="details-section"><strong>Status</strong><p style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{competition.status}</p></div>
                <div className="details-section"><strong>Ends on</strong><p>{new Date(competition.endDate).toLocaleDateString()}</p></div>
                <div className="details-section"><strong>Created by</strong><p>{creatorName} (Role: {competition.createdBy?.role || 'Unknown'})</p></div>
            </div>

            {displayError && <div className="error-message" style={{ color: 'red', marginBottom: '15px', fontWeight: 'bold' }}>Error: {displayError}</div>}

            <div className="details-submissions-section">
                <h2>Submissions ({submissions.length})</h2>
                {loading && submissions.length === 0 && <p>Loading submissions...</p>}
                {!loading && submissions.length === 0 && competition.status === 'open' && <p className="details-placeholder-text">No submissions yet. Be the first!</p>}
                {!loading && submissions.length === 0 && competition.status !== 'open' && <p className="details-placeholder-text">No submissions were made for this competition.</p>}

                {competition.status === 'voting' && !canUserVoteInThisCompetitionType && votingEligibilityInfoText && (
                     <p className="details-cannot-vote-info">{votingEligibilityInfoText}</p>
                )}

                {submissions.length > 0 && (
                    <div className="submissions-grid">
                        {submissions.map(sub => {
                            if (!sub || !sub._id) {
                                console.warn("Skipping rendering of an invalid submission object:", sub);
                                return null;
                            }
                            const submitterName = sub.userId?.username || 'Anonymous';
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

                                    {sub.fileUrls && sub.fileUrls.length > 0 && (
                                        <div className="submission-files">
                                            <strong>Files:</strong>
                                            <ul>
                                                {sub.fileUrls.map((fileUrl, index) => {
                                                    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
                                                    const displayUrl = `http://localhost:5001${fileUrl}`; 
                                                    return (
                                                        <li key={index}>
                                                            <a href={displayUrl} target="_blank" rel="noopener noreferrer">{filename}</a>
                                                            {isImageUrl(displayUrl) && (
                                                                <img src={displayUrl} alt={`Preview for ${filename}`} style={{ maxWidth: '100px', maxHeight: '100px', display: 'block', marginTop: '5px' }} />
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="submission-votes">Votes: {sub.voteCount || 0}</p>
                                    
                                    {competition.status === 'voting' && isLoggedIn && canUserVoteInThisCompetitionType && (
                                        <button
                                            onClick={() => handleVote(sub._id)}
                                            disabled={!showVoteButtonForThisSubmission || votingInProgress.has(sub._id)}
                                            className={`vote-button ${alreadyVotedOnThis ? 'voted' : ''}`}
                                        >
                                            {votingInProgress.has(sub._id) ? 'Voting...' : (alreadyVotedOnThis ? 'Voted' : 'Vote')}
                                        </button>
                                    )}
                                    {competition.status === 'voting' && !isLoggedIn && ( 
                                        <p><Link to="/login">Login</Link> to vote.</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompetitionDetails;