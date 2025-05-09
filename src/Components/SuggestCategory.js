// src/Components/SuggestCategory.js

import React, { useState } from 'react'; // Removed useContext
// CORRECTED: Import useAuth hook
import { useAuth } from '../Context/AuthContext';
// import './SuggestCategory.css'; // Optional styling

const SuggestCategory = () => {
  // CORRECTED: Use useAuth hook
  const { token, user, isLoggedIn, isLoading: authLoading } = useAuth();
  const [categoryName, setCategoryName] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (!isLoggedIn || !user || !token) {
       setError('Must be logged in.');
       return;
    }
    if (!categoryName.trim()) {
      setError('Category name required.');
      return;
    }

    const suggestionData = {
      suggestedCategory: categoryName, reason,
      submittedByUserId: user.id, submittedByUsername: user.username, // Adjust if user obj structure differs
    };
    console.log('SuggestCategory: Submitting data:', suggestionData);

    // --- Simulate API Call ---
    setIsSubmitting(true);
    console.log('SuggestCategory: Simulating API POST...');
    console.log(`SuggestCategory: Using Token: ${token.substring(0, 15)}...`);

    setTimeout(() => {
      try {
        console.log(`SuggestCategory: Simulated Success!`);
        setSuccessMessage(`Thanks, ${user.username || 'user'}! Suggestion "${categoryName}" submitted.`);
        setCategoryName('');
        setReason('');
      } catch (simulatedError) {
        console.error('SuggestCategory: Simulated API Error:', simulatedError);
        setError('Failed to submit suggestion.');
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  // --- Render Logic ---
  if (authLoading) return <div>Loading...</div>;
  if (!isLoggedIn) return <div>Please log in to suggest a category.</div>;

  return (
    <div className="suggest-category-container">
      <h2>Suggest a New Category</h2>
      <p>Think we're missing something?</p>

      <form onSubmit={handleSubmit} className={`suggest-category-form ${isSubmitting ? 'submitting' : ''}`}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="categoryName">Suggested Category:</label><br />
          <input type="text" id="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required disabled={isSubmitting} style={{ minWidth: '250px', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="reason">Reason (Optional):</label><br />
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows="3" disabled={isSubmitting} style={{ width: '80%', minWidth: '250px', padding: '8px' }} placeholder="Why add this?" />
        </div>

        {error && <p style={{ color: 'red' }} className="error-message">Error: {error}</p>}
        {successMessage && <p style={{ color: 'green' }} className="success-message">{successMessage}</p>}

        <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px', padding: '10px 15px' }} className="submit-button">
          {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
      </form>
    </div>
  );
};

export default SuggestCategory;