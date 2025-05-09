// client/src/Components/CreateCompetition.js
// --- Full Replacement Code ---
// --- Integrated competitionType for Admins ---

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Ensure correct path to AuthContext

const CreateCompetition = () => {
  // Get auth context values
  const { token, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState(''); // Stays as 'title' assuming your backend handles it or you'll adjust
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState(''); // Store as string YYYY-MM-DD
  const [shortId, setShortId] = useState(''); // User-defined short identifier
  
  // *** NEW: State for competitionType, defaulting to 'Standard' ***
  const [competitionType, setCompetitionType] = useState('Standard'); 

  // Component state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null); // For backend/submission errors
  const [formError, setFormError] = useState(null); // For frontend validation errors

  // Access control state
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);
  const [accessDenied, setAccessDenied] = useState(true); // Default to denied until check passes

  // Effect for role check - run when auth loading status or user changes
  useEffect(() => {
    if (!authLoading) {
        if (user && (user.role === 'Business' || user.role === 'Admin')) {
            console.log(`CreateCompetition: Access granted for role: ${user.role}`);
            setAccessDenied(false);
        } else {
            console.log(`CreateCompetition: Access denied. User: ${user ? user.username : 'None'}, Role: ${user ? user.role : 'N/A'}`);
            setAccessDenied(true);
        }
        setRoleCheckComplete(true);
    } else {
        console.log('CreateCompetition: Waiting for auth state to load...');
        setRoleCheckComplete(false);
    }
  }, [user, authLoading, navigate]);

  // --- Frontend Validation ---
  const validateForm = () => {
      setFormError(null);
      if (!title.trim()) { setFormError("Title is required."); return false; }
      if (!description.trim()) { setFormError("Description is required."); return false; }
      if (!endDate) { setFormError("End Date is required."); return false; }

      if (!shortId.trim()) {
          setFormError("Short ID is required.");
          return false;
      }
      if (shortId.trim().length > 100) {
           setFormError("Short ID is too long (max 100 characters before conversion).");
           return false;
       }

      const today = new Date();
      today.setHours(0,0,0,0);
      const selectedEndDate = new Date(endDate + 'T00:00:00');
      if (isNaN(selectedEndDate.getTime())) {
           setFormError("Invalid End Date format. Please select a valid date.");
           return false;
       }
      if (selectedEndDate <= today) {
         setFormError("End Date must be in the future.");
         return false;
      }
      return true;
  };

  // --- Submit Handler ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
        return;
    }

    if (!token) {
      console.error('CreateCompetition: No auth token available.');
      setError('Authentication error. Please log in again.');
      return;
    }

    const competitionData = {
        title: title.trim(), // Or 'name' if you change state variable and backend expects 'name'
        description: description.trim(),
        endDate: endDate,
        shortId: shortId.trim()
    };

    // *** NEW: Only include competitionType in the payload if the user is an Admin. ***
    // The backend will automatically set it for Business users.
    if (user && user.role === 'Admin') {
        competitionData.competitionType = competitionType;
    }

    setIsSubmitting(true);
    console.log('CreateCompetition: Submitting data to POST /api/competitions:', competitionData);
    console.log(`CreateCompetition: Using Token: ${token ? token.substring(0, 15) + '...' : 'NONE'}`);

    try {
        const response = await fetch('/api/competitions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(competitionData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error(`CreateCompetition: API Error ${response.status}:`, responseData);
            setError(responseData.message || `Failed to create competition. Server responded with status ${response.status}.`);
            setIsSubmitting(false);
            return;
        }

        console.log('CreateCompetition: Success! Response:', responseData);
        alert('Competition created successfully!');
        
        // Reset form fields to initial state after successful submission
        setTitle('');
        setDescription('');
        setEndDate('');
        setShortId('');
        setCompetitionType('Standard'); // Reset competitionType to default
        setError(null);
        setFormError(null);

        navigate(`/competitions/${responseData.shortId}`); // Or responseData.id / responseData._id depending on your backend response

    } catch (err) {
        console.error('CreateCompetition: Network or parsing error:', err);
        setError('Failed to create competition due to a network error or unexpected response. Please check your connection and try again.');
        setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (authLoading) {
      return <div>Loading authentication state...</div>;
  }

  if (!roleCheckComplete) {
      return <div>Verifying user role...</div>;
  }

  if (accessDenied) {
      return (
          <div>
              <h2>Access Denied</h2>
              <p>Only users with the 'Business' or 'Admin' role can create new competitions.</p>
          </div>
      );
  }

  return (
    <div>
      <h2>Create New Competition</h2>
      <form onSubmit={handleSubmit} noValidate>
         {/* Title */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Competition Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={100}
            style={{ width: '80%', minWidth: '250px', padding: '8px' }}
          />
        </div>

        {/* Short ID */}
        <div style={{ marginBottom: '15px' }}>
           <label htmlFor="shortId" style={{ display: 'block', marginBottom: '5px' }}>Short ID (URL friendly):</label>
           <input
             type="text"
             id="shortId"
             value={shortId}
             onChange={(e) => setShortId(e.target.value)}
             disabled={isSubmitting}
             placeholder="e.g., My Awesome Gadget Contest"
             maxLength={100}
             style={{ width: '60%', minWidth: '200px', padding: '8px' }}
           />
            <small style={{ display: 'block', color: '#666', marginTop: '3px' }}>
                Spaces/special characters will be converted for the URL (e.g., "AI Agent" becomes "ai-agent").
            </small>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            disabled={isSubmitting}
            maxLength={1000}
            style={{ width: '80%', minWidth: '250px', padding: '8px' }}
          />
        </div>

        {/* End Date */}
         <div style={{ marginBottom: '15px' }}>
          <label htmlFor="endDate" style={{ display: 'block', marginBottom: '5px' }}>End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isSubmitting}
            style={{ padding: '8px' }}
            min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
          />
         </div>

        {/* --- NEW: Competition Type Dropdown for Admins Only --- */}
        {user && user.role === 'Admin' && (
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="competitionType" style={{ display: 'block', marginBottom: '5px' }}>Competition Type:</label>
                <select
                    id="competitionType"
                    value={competitionType}
                    onChange={(e) => setCompetitionType(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: 'auto', minWidth: '200px', padding: '8px' }}
                >
                    <option value="Standard">Standard</option>
                    <option value="Business">Business</option>
                </select>
                <small style={{ display: 'block', color: '#666', marginTop: '3px' }}>
                    Select the type of competition. 'Standard' is typically for individual users, 'Business' for business users.
                </small>
            </div>
        )}
        {/* --- End of New Section --- */}

        {formError && <p style={{ color: 'orange', marginTop: '10px', fontWeight: 'bold' }}>{formError}</p>}
        {error && <p style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>Error: {error}</p>}

        <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', fontSize: '16px', cursor: isSubmitting ? 'wait' : 'pointer' }}>
          {isSubmitting ? 'Creating...' : 'Create Competition'}
        </button>
      </form>
    </div>
  );
};

export default CreateCompetition;