// src/Components/EditCompetitionForm.js
// --- Full Replacement Code ---
// --- Added Status dropdown and handling ---
// --- *** CORRECTED Authorization to allow Admins to edit *** ---

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext'; // Ensure correct path

const EditCompetitionForm = () => {
    const { competitionId } = useParams(); // Get ID/shortId from URL
    const navigate = useNavigate();
    const { user, token, isLoading: authLoading } = useAuth();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('open');

    // Component state
    const [originalData, setOriginalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Allowed status values (ensure these align with your backend enum)
    // Backend server.js seedData and Competition model seem to use: 'open', 'voting', 'closed', 'pending_review'
    // This form uses 'upcoming'. For now, let's keep it as is, but ideally they should match.
    const allowedStatuses = ['upcoming', 'open', 'voting', 'closed'];

    const fetchCompetitionData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setFormError(null);
        console.log(`EditCompetitionForm: Fetching data for competition ID: ${competitionId}`);

        try {
            const response = await axios.get(`/api/competitions/${competitionId}`);
            const competitionData = response.data;
            console.log("EditCompetitionForm: Received competition data:", competitionData);

            // --- Authorization Check ---
            if (!authLoading && user && competitionData?.createdBy?._id) {
                const isCreator = user._id === competitionData.createdBy._id;
                const isAdmin = user.role === 'Admin'; // Check if the user is an Admin

                if (isCreator || isAdmin) { // *** MODIFIED CHECK HERE ***
                    setIsAuthorized(true);
                    console.log(`EditCompetitionForm: Authorization check passed. User is ${isCreator ? 'Creator' : ''}${isAdmin ? (isCreator ? ' and Admin' : 'Admin') : ''}.`);

                    setTitle(competitionData.title);
                    setDescription(competitionData.description);
                    setEndDate(competitionData.endDate ? new Date(competitionData.endDate).toISOString().split('T')[0] : '');
                    setStatus(competitionData.status || 'open');
                    setOriginalData(competitionData);
                } else {
                    console.warn("EditCompetitionForm: User is not the creator and not an Admin.");
                    setError("You are not authorized to edit this competition.");
                    setIsAuthorized(false);
                }
            } else if (!authLoading) {
                setError("Could not verify authorization. User or competition data missing.");
                setIsAuthorized(false);
            }

        } catch (err) {
            console.error("EditCompetitionForm: Error fetching competition data:", err);
            setError(err.response?.data?.message || 'Failed to load competition data.');
            if (err.response?.status === 404) {
                setError("Competition not found.");
            }
            setIsAuthorized(false);
        } finally {
            if (!authLoading) {
                setLoading(false);
            }
        }
    }, [competitionId, user, authLoading]);

    useEffect(() => {
        if (!authLoading) {
            fetchCompetitionData();
        } else {
            setLoading(true);
        }
    }, [authLoading, fetchCompetitionData]);

    const validateForm = () => {
        setFormError(null);
        if (!title.trim()) { setFormError("Title is required."); return false; }
        if (!description.trim()) { setFormError("Description is required."); return false; }
        if (!endDate) { setFormError("End Date is required."); return false; }
        if (!status) { setFormError("Status is required."); return false; }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare against start of today
        // Adjust endDate to be interpreted in local timezone for comparison if it's just a date string
        const selectedEndDate = new Date(endDate + 'T00:00:00');


        if (isNaN(selectedEndDate.getTime())) {
            setFormError("Invalid End Date format."); return false;
        }

        // Allow past end dates ONLY if status is 'closed'
        if (selectedEndDate < today && status !== 'closed') {
           setFormError("End Date must be today or in the future, unless the status is 'closed'.");
           return false;
        }
        if (!allowedStatuses.includes(status)) {
             setFormError("Invalid status selected."); return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        if (!token || !isAuthorized) {
            setError('Cannot submit: Not authenticated or authorized.');
            return;
        }

        const updateData = {
            title: title.trim(),
            description: description.trim(),
            endDate: endDate,
            status: status
        };

        // Optional: Prevent submission if no actual changes were made
        if (originalData &&
            updateData.title === originalData.title &&
            updateData.description === originalData.description &&
            updateData.endDate === (originalData.endDate ? new Date(originalData.endDate).toISOString().split('T')[0] : '') &&
            updateData.status === originalData.status) {
            setFormError("No changes detected to save.");
            return;
        }

        setIsSubmitting(true);
        console.log(`EditCompetitionForm: Submitting updates for ${competitionId}:`, updateData);

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };
            const response = await axios.put(`/api/competitions/${competitionId}`, updateData, config);

            console.log('EditCompetitionForm: Update successful!', response.data);
            alert('Competition updated successfully!');
            const navigateToId = response.data?.shortId || originalData?.shortId || competitionId;
            navigate(`/competitions/${navigateToId}`);

        } catch (err) {
            console.error('EditCompetitionForm: Update error:', err);
            setError(err.response?.data?.message || `Failed to update competition. Status: ${err.response?.status}`);
            // Only set submitting to false on error, success will navigate away
            setIsSubmitting(false);
        }
    };

    if (loading || authLoading) {
        return <div className="form-container"><p>Loading competition editor...</p></div>;
    }

    if (!isAuthorized && !loading) {
        return (
            <div className="form-container">
                <h2>Edit Competition</h2>
                <p className="error-message">{error || 'You are not authorized to edit this competition.'}</p>
                <Link to="/competitions" className="back-link">Back to Competitions</Link>
            </div>
        );
    }

     if (error && !originalData) {
         return (
             <div className="form-container">
                 <h2>Edit Competition</h2>
                 <p className="error-message">{error}</p>
                 <Link to="/competitions" className="back-link">Back to Competitions</Link>
             </div>
         );
     }

    return (
        <div className="form-container" style={{ maxWidth: '700px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Edit Competition: <span style={{fontWeight: 'normal'}}>{originalData?.title || ''}</span></h2>
            {error && !isSubmitting && <p style={{ color: 'red', fontWeight: 'bold', marginBottom: '15px' }}>Error: {error}</p>}

            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Competition Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={100}
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="5"
                        disabled={isSubmitting}
                        maxLength={1000}
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label htmlFor="endDate" style={{ display: 'block', marginBottom: '5px' }}>End Date:</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={isSubmitting}
                        style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    />
                </div>

                 <div className="form-group" style={{ marginBottom: '20px' }}>
                     <label htmlFor="status" style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
                     <select
                         id="status"
                         value={status}
                         onChange={(e) => setStatus(e.target.value)}
                         disabled={isSubmitting}
                         style={{ padding: '10px', minWidth: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                         required
                     >
                         {allowedStatuses.map((stat) => (
                             <option key={stat} value={stat}>
                                 {stat.charAt(0).toUpperCase() + stat.slice(1)}
                             </option>
                         ))}
                     </select>
                 </div>

                {formError && <p style={{ color: 'orange', marginTop: '10px', fontWeight: 'bold' }}>{formError}</p>}
                {/* Submission error is already displayed at the top if 'error' state is set */}

                <div className="form-actions" style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
                    <button type="submit" disabled={isSubmitting || loading} style={{ padding: '10px 20px', fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}>
                        {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                    <Link to={`/competitions/${originalData?.shortId || competitionId}`} className="cancel-link" style={{ textDecoration: 'none', color: '#007bff' }}>
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default EditCompetitionForm;