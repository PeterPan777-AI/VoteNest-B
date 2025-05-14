// client/src/Components/CompetitionDetails.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
// --- React Bootstrap Imports ---
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner'; // For loading states

import './CompetitionDetails.css';

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
        setLoading(true); setError(null); setDeleting(false);
        try {
            const response = await axios.get(`/api/competitions/${competitionId}`);
            setCompetition(response.data);
            const sortedSubmissions = response.data.submissions?.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0)) || [];
            setSubmissions(sortedSubmissions);
        } catch (err) {
            console.error("Error fetching competition details:", err);
            if (err.response?.status === 404) { setError('Competition not found. It may have been deleted.'); }
            else { setError(err.response?.data?.message || 'Failed to load competition details.'); }
            setCompetition(null); setSubmissions([]);
        } finally { setLoading(false); }
    }, [competitionId]);

    useEffect(() => { fetchCompetitionData(); }, [fetchCompetitionData]);

    useEffect(() => {
        if (!authLoading && submissions.length > 0) {
            if (isLoggedIn && user?._id) {
                const votedIds = new Set(
                    submissions
                        .filter(sub => Array.isArray(sub?.votedByUsers) && sub.votedByUsers.includes(user._id))
                        .map(sub => sub._id)
                );
                setUserVotedSubmissionIds(votedIds);
            } else {
                setUserVotedSubmissionIds(new Set());
            }
        } else if (!authLoading) {
             setUserVotedSubmissionIds(new Set());
        }
    }, [authLoading, isLoggedIn, user, submissions]);

    const handleVote = useCallback(async (submissionId) => {
        if (!isLoggedIn || !token) { 
            setError('Please log in to vote.'); // Use setError for non-alert messages
            return; 
        }
        if (competition?.status !== 'voting') { 
            setError('Voting is not currently open for this competition.'); 
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
                        ? { ...sub,
                            voteCount: (sub.voteCount || 0) + 1,
                            votedByUsers: [...(Array.isArray(sub.votedByUsers) ? sub.votedByUsers : []), user._id]
                          }
                        : sub
                ).sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
            );
            setUserVotedSubmissionIds(prev => new Set(prev).add(submissionId));
        } catch (err) {
            console.error("Error voting:", err);
            setError(err.response?.data?.message || 'Failed to record vote. You might have already voted or an error occurred.');
        } finally {
            setVotingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(submissionId);
                return newSet;
            });
        }
    }, [isLoggedIn, token, user?._id, competition?.status, votingInProgress]);

    const handleDelete = useCallback(async () => {
        if (!isLoggedIn || !token || !user || !competition?._id) {
            setError('Cannot delete: Missing authentication or competition data.'); return;
        }
        const isCreator = competition.createdBy?._id === user._id;
        const isAdmin = user.role === 'Admin';

        if (!isCreator && !isAdmin) {
            setError('You are not authorized to delete this competition.'); return;
        }

        if (window.confirm(`Are you sure you want to permanently delete the competition "${competition.title}" and all its submissions? This action cannot be undone.`)) {
            setDeleting(true);
            try {
                await axios.delete(`/api/competitions/${competition.shortId || competitionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // alert('Competition deleted successfully.'); // Consider navigation or a success message component
                navigate('/competitions');
            } catch (err) {
                console.error("Error deleting competition:", err);
                setError(err.response?.data?.message || 'Failed to delete competition.');
                setDeleting(false);
            }
        }
    }, [isLoggedIn, token, user, competition, competitionId, navigate]);

    const isImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    };

    // --- Render Logic ---
    if (authLoading || (loading && !competition && !error)) {
        return (
            // --- Use Card for main container ---
            <Card className="details-container my-3">
                <Card.Body className="text-center">
                    <Spinner animation="border" role="status" className="me-2" />
                    Loading competition details...
                </Card.Body>
            </Card>
        );
    }
    
    if (error && !competition) { // Initial load error, no competition data
        return (
            <Card className="details-container my-3">
                <Card.Body>
                    {/* --- Use Bootstrap Alert for errors --- */}
                    <Alert variant="danger">Error: {error}</Alert>
                    <Button as={Link} to="/competitions" variant="secondary" className="back-link">← Back to Competitions</Button>
                </Card.Body>
            </Card>
        );
    }

    if (!competition && !loading) { // Competition not found after loading
         return (
            <Card className="details-container my-3">
                <Card.Body>
                    <Alert variant="warning">Competition not found.</Alert>
                    <Button as={Link} to="/competitions" variant="secondary" className="back-link">← Back to Competitions</Button>
                </Card.Body>
            </Card>
        );
    }

    // Determine Submission/Voting Eligibility
    let canSubmit = false;
    let submitInfoText = '';
    const competitionStatus = competition?.status;
    const compType = competition?.competitionType;
    const currentUserRole = user?.role;

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
    const displayErrorLater = error && competition ? error : null; // Display subsequent errors even if competition loaded
    const creatorName = competition?.createdBy?.username || 'Unknown Creator';
    const categoryName = competition?.category?.name || 'N/A';

    return (
        // --- Use Card for main container ---
        <Card className="details-container my-3"> 
            <Card.Body> {/* Wrap content in Card.Body */}
                <Button as={Link} to="/competitions" variant="outline-secondary" className="back-link mb-3">← Back to Competitions</Button>

                <div className="details-header"> {/* Keeping this div for flex layout, but Card.Header could be an option */}
                    {/* details-title will now inherit color or use --bs-body-color via CSS */}
                    <h2 className="details-title">{competition.title}</h2> 
                    {/* details-type will inherit color */}
                    <p className="details-type text-muted"><strong>Type:</strong> {competition.competitionType || 'N/A'}</p> 

                    {!authLoading && (
                        <div className="details-actions">
                            {canSubmit && (
                                // --- Use Bootstrap Button ---
                                <Button as={Link} to={`/competitions/${competition.shortId || competitionId}/submit`} variant="primary">Submit Entry</Button>
                            )}
                            {!canSubmit && submitInfoText && (
                                <p className="details-cannot-submit-info text-muted">{submitInfoText}</p>
                            )}
                            {isCreatorOrAdmin && (
                                 <>
                                     <Button
                                        as={Link}
                                        to={`/competitions/${competition.shortId || competitionId}/edit`}
                                        variant="warning" // Bootstrap warning color for edit
                                        className="ms-2" // margin-start
                                     >
                                        Edit
                                     </Button>
                                    <Button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        variant="danger" // Bootstrap danger color for delete
                                        className="ms-2"
                                    >
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                 </>
                             )}
                        </div>
                    )}
                     {authLoading && <Spinner animation="border" size="sm" as="span" className="ms-2"/>}
                </div>

                <div className="details-info-section">
                    {/* These sections will inherit text color */}
                    <div className="details-section"><strong>Description</strong><p>{competition.description || 'N/A'}</p></div>
                    <div className="details-section"><strong>Category</strong><p>{categoryName}</p></div>
                    <div className="details-section"><strong>Status</strong><p style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{competition.status}</p></div>
                    <div className="details-section"><strong>Ends on</strong><p>{new Date(competition.endDate).toLocaleDateString()}</p></div>
                    <div className="details-section"><strong>Created by</strong><p>{creatorName} (Role: {competition.createdBy?.role || 'Unknown'})</p></div>
                </div>

                {/* --- Use Bootstrap Alert for subsequent errors --- */}
                {displayErrorLater && <Alert variant="danger" className="mb-3">Error: {displayErrorLater}</Alert>}

                <div className="details-submissions-section">
                    <h2>Submissions ({submissions.length})</h2>
                    {loading && submissions.length === 0 && <p>Loading submissions...</p>}
                    {!loading && submissions.length === 0 && competition.status === 'open' && <p className="details-placeholder-text text-muted">No submissions yet. Be the first!</p>}
                    {!loading && submissions.length === 0 && competition.status !== 'open' && <p className="details-placeholder-text text-muted">No submissions were made for this competition.</p>}

                    {competition.status === 'voting' && !canUserVoteInThisCompetitionType && votingEligibilityInfoText && (
                         <Alert variant="info" className="details-cannot-vote-info">{votingEligibilityInfoText}</Alert>
                    )}

                    {submissions.length > 0 && (
                        // Using "submission-list" from CSS instead of submissions-grid if it offers better control
                        <div className="submission-list"> 
                            {submissions.map(sub => {
                                if (!sub?._id) {
                                    console.warn("Skipping rendering of an invalid submission object:", sub);
                                    return null;
                                }
                                const submitterName = sub.userId?.username || 'Anonymous';
                                const showVoteButtonForThisSubmission = competition.status === 'voting' &&
                                                                     isLoggedIn &&
                                                                     canUserVoteInThisCompetitionType &&
                                                                     !userVotedSubmissionIds.has(sub._id);
                                const alreadyVotedOnThis = isLoggedIn && userVotedSubmissionIds.has(sub._id);

                                // --- Each submission as a Card ---
                                return (
                                    <Card key={sub._id} className="submission-card mb-3"> 
                                        <Card.Body>
                                            <Card.Title as="h3" className="submission-title">{sub.entryTitle || 'Untitled Entry'}</Card.Title>
                                            <Card.Subtitle as="p" className="submission-author mb-2 text-muted">By: {submitterName}</Card.Subtitle>
                                            <Card.Text className="submission-description">{sub.description || 'No description.'}</Card.Text>

                                            {Array.isArray(sub.fileUrls) && sub.fileUrls.length > 0 && (
                                                <div className="submission-files mb-2">
                                                    <strong>Files:</strong>
                                                    <ul>
                                                        {sub.fileUrls.map((fileUrl, index) => {
                                                            const filename = typeof fileUrl === 'string' ? fileUrl.substring(fileUrl.lastIndexOf('/') + 1) : `file_${index + 1}`;
                                                            const displayUrl = `/uploads/${filename}`;
                                                            return (
                                                                <li key={index}>
                                                                    <a href={displayUrl} target="_blank" rel="noopener noreferrer">{filename}</a>
                                                                    {isImageUrl(filename) && (
                                                                        <img src={displayUrl} alt={`Preview for ${filename}`} className="submission-image-thumbnail mt-1" />
                                                                    )}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                            <Card.Text className="submission-votes">Votes: {sub.voteCount || 0}</Card.Text>

                                            {competition.status === 'voting' && isLoggedIn && canUserVoteInThisCompetitionType && (
                                                <Button
                                                    onClick={() => handleVote(sub._id)}
                                                    disabled={!showVoteButtonForThisSubmission || votingInProgress.has(sub._id)}
                                                    variant={alreadyVotedOnThis ? "secondary" : "success"} // Use Bootstrap variants
                                                    size="sm"
                                                >
                                                    {votingInProgress.has(sub._id) ? 'Voting...' : (alreadyVotedOnThis ? 'Voted' : 'Vote')}
                                                </Button>
                                            )}
                                            {competition.status === 'voting' && !isLoggedIn && (
                                                <p><Link to="/login">Login</Link> to vote.</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

export default CompetitionDetails;