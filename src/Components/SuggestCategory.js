// Filename: frontend/src/Components/SuggestCategory.js

import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext'; // Your AuthContext hook
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

    // This is the data structure your backend expects
    const suggestionData = {
      categoryName: categoryName.trim(),
      reason: reason.trim(),
    };

    try {
      const response = await fetch('/api/category-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send the token for authentication
        },
        body: JSON.stringify(suggestionData),
      });

      const responseData = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // If response is not OK (e.g., 400, 401, 500), throw an error to be caught by the catch block
        // Use the message from the backend if available, otherwise a generic one
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      // If the submission was successful (e.g., status 201)
      setSuccessMessage(responseData.message || `Suggestion "${categoryName}" submitted successfully! Awaiting review.`);
      setCategoryName(''); // Clear the form
      setReason('');       // Clear the form

    } catch (err) {
      console.error('SuggestCategory: API Error:', err);
      // Display the error message from the error object (thrown manually or network error)
      setError(err.message || 'Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading authentication status...</div>;
  if (!isLoggedIn) return <div style={{ padding: '20px', textAlign: 'center' }}>Please log in to suggest a category.</div>;

  return (
    <div className="suggest-category-container" style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Suggest a New Category</h2>
      <p style={{ textAlign: 'center', color: '#555', marginBottom: '20px' }}>
        Think we're missing a category for competitions? Let us know!
      </p>

      <form onSubmit={handleSubmit} className={`suggest-category-form ${isSubmitting ? 'submitting' : ''}`}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="categoryName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Suggested Category Name: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            id="categoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
            disabled={isSubmitting}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            placeholder="e.g., Sustainable Tech Innovations"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="reason" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Reason for Suggestion (Optional):
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="4"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            placeholder="Why do you think this category would be a good addition?"
          />
        </div>

        {error && (
          <p style={{ color: 'red', backgroundColor: '#ffebee', border: '1px solid red', padding: '10px', borderRadius: '4px', marginBottom: '15px' }} className="error-message">
            Error: {error}
          </p>
        )}
        {successMessage && (
          <p style={{ color: 'green', backgroundColor: '#e8f5e9', border: '1px solid green', padding: '10px', borderRadius: '4px', marginBottom: '15px' }} className="success-message">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: isSubmitting ? '#ccc' : '#007bff',
            color: 'white',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            width: '100%',
            fontSize: '16px'
          }}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
      </form>
    </div>
  );
};

export default SuggestCategory;