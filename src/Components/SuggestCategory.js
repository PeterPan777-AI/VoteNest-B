// --- Full Replacement Code for: frontend/src/Components/SuggestCategory.js ---

import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { Alert } from 'react-bootstrap'; // Import Alert component

// import './SuggestCategory.css'; // Optional styling if you have this file

const SuggestCategory = () => {
  const { token, user, isLoggedIn, isLoading: authLoading } = useAuth();
  const [categoryName, setCategoryName] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (!isLoggedIn || !user || !token) {
      setError('You must be logged in to suggest a category.');
      return;
    }
    if (!categoryName.trim()) {
      setError('Category name is required.');
      return;
    }

    setIsSubmitting(true);

    const suggestionData = {
      categoryName: categoryName.trim(),
      reason: reason.trim(),
    };

    try {
      const response = await fetch('/api/category-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(suggestionData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage(responseData.message || `Suggestion "${categoryName}" submitted successfully! Awaiting review.`);
      setCategoryName('');
      setReason('');

    } catch (err) {
      console.error('SuggestCategory: API Error:', err);
      setError(err.message || 'Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading authentication status...</div>;
  // This check is good, but for users who are not logged in, you might redirect them or show a more prominent login prompt.
  // For now, the simple message is fine.
  if (!isLoggedIn) return <div style={{ padding: '20px', textAlign: 'center' }}>Please log in to suggest a category.</div>;

  return (
    // MODIFIED: Removed inline border and boxShadow. Kept layout styles.
    // Consider using Bootstrap card classes here if you want a card-like appearance: e.g., className="card p-4"
    <div 
      className="suggest-category-container" 
      style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}
    >
      {/* MODIFIED: Removed inline color. Text color will now be inherited from the dark theme. */}
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Suggest a New Category</h2>
      {/* MODIFIED: Removed inline color. Text color will now be inherited. */}
      <p style={{ textAlign: 'center', marginBottom: '20px' }}>
        Think we're missing a category for competitions? Let us know!
      </p>

      <form onSubmit={handleSubmit} className={`suggest-category-form ${isSubmitting ? 'submitting' : ''}`}>
        <div className="mb-3"> {/* Used Bootstrap margin bottom class */}
          <label htmlFor="categoryName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Suggested Category Name: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            id="categoryName"
            className="form-control" // ADDED: Bootstrap class for styling
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
            disabled={isSubmitting}
            // REMOVED: Inline styles for width, padding, border, borderRadius, boxSizing (handled by form-control)
            placeholder="e.g., Sustainable Tech Innovations"
          />
        </div>

        <div className="mb-3"> {/* Used Bootstrap margin bottom class */}
          <label htmlFor="reason" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Reason for Suggestion (Optional):
          </label>
          <textarea
            id="reason"
            className="form-control" // ADDED: Bootstrap class for styling
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="4"
            disabled={isSubmitting}
            // REMOVED: Inline styles for width, padding, border, borderRadius, boxSizing (handled by form-control)
            placeholder="Why do you think this category would be a good addition?"
          />
        </div>

        {/* MODIFIED: Replaced p tag with Bootstrap Alert component for errors */}
        {error && (
          <Alert variant="danger" className="mt-3"> 
            {error}
          </Alert>
        )}
        {/* MODIFIED: Replaced p tag with Bootstrap Alert component for success messages */}
        {successMessage && (
          <Alert variant="success" className="mt-3">
            {successMessage}
          </Alert>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          // ADDED: Bootstrap button classes. REMOVED all inline styles.
          className="btn btn-primary w-100 mt-3" 
        >
          {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
      </form>
    </div>
  );
};

export default SuggestCategory;