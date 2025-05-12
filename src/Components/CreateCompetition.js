// client/src/Components/CreateCompetition.js
// --- Full Replacement Code ---
// --- Added Category Fetching and Selection ---

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Ensure correct path to AuthContext
import axios from 'axios'; // Using axios for consistency

const CreateCompetition = () => {
  const { token, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shortId, setShortId] = useState('');
  const [competitionType, setCompetitionType] = useState('Standard');
  const [selectedCategory, setSelectedCategory] = useState(''); // *** NEW: State for selected category ID

  // State for category list
  const [categories, setCategories] = useState([]); // *** NEW: State for available categories
  const [categoriesLoading, setCategoriesLoading] = useState(true); // *** NEW: Loading state for categories
  const [categoriesError, setCategoriesError] = useState(null); // *** NEW: Error state for categories

  // Component state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  // Access control state
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);
  const [accessDenied, setAccessDenied] = useState(true);

  // Effect for role check
  useEffect(() => {
    if (!authLoading) {
        if (user && (user.role === 'Business' || user.role === 'Admin')) {
            setAccessDenied(false);
        } else {
            setAccessDenied(true);
        }
        setRoleCheckComplete(true);
    } else {
        setRoleCheckComplete(false);
    }
  }, [user, authLoading]);

  // *** NEW: Effect to fetch categories ***
  const fetchCategories = useCallback(async () => {
      if (!token || accessDenied) { // Only fetch if authenticated and has access
           setCategoriesLoading(false);
           return;
      }
      console.log("CreateCompetition: Fetching categories...");
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
          // Assuming the endpoint exists now
          const response = await axios.get('/api/categories', {
              headers: { Authorization: `Bearer ${token}` } // Add auth if needed
          });
          console.log("CreateCompetition: Categories received:", response.data);
          if (Array.isArray(response.data)) {
            setCategories(response.data);
          } else {
            console.error("CreateCompetition: Categories API did not return an array:", response.data);
            setCategoriesError("Failed to load categories: Invalid data format.");
            setCategories([]);
          }
      } catch (err) {
          console.error("CreateCompetition: Error fetching categories:", err);
          const errorMsg = err.response?.data?.message || err.message || 'Could not fetch categories.';
          setCategoriesError(errorMsg);
          setCategories([]);
      } finally {
          setCategoriesLoading(false);
      }
  }, [token, accessDenied]); // Depend on token and access status

  // Trigger category fetch after role check is complete and access is granted
  useEffect(() => {
      if (roleCheckComplete && !accessDenied) {
          fetchCategories();
      }
  }, [roleCheckComplete, accessDenied, fetchCategories]);


  // Frontend Validation
  const validateForm = () => {
      setFormError(null);
      if (!title.trim()) { setFormError("Title is required."); return false; }
      if (!description.trim()) { setFormError("Description is required."); return false; }
      // *** ADDED: Category validation ***
      if (!selectedCategory) { setFormError("Category is required."); return false; }
      if (!endDate) { setFormError("End Date is required."); return false; }

      if (!shortId.trim()) { setFormError("Short ID is required."); return false; }
      if (shortId.trim().length > 100) { setFormError("Short ID is too long (max 100 characters)."); return false; }

      const today = new Date();
      today.setHours(0,0,0,0);
      const selectedEndDate = new Date(endDate + 'T00:00:00');
      if (isNaN(selectedEndDate.getTime())) { setFormError("Invalid End Date format."); return false; }
      if (selectedEndDate <= today) { setFormError("End Date must be in the future."); return false; }
      return true;
  };

  // Submit Handler
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!validateForm()) { return; }
    if (!token) { setError('Authentication error.'); return; }

    // Prepare data - include selectedCategory
    const competitionData = {
        title: title.trim(),
        description: description.trim(),
        endDate: endDate,
        shortId: shortId.trim(),
        category: selectedCategory // *** ADDED: Include selected category ID ***
    };

    if (user && user.role === 'Admin') {
        competitionData.competitionType = competitionType;
    }

    setIsSubmitting(true);
    console.log('CreateCompetition: Submitting data:', competitionData);

    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        // Using axios post
        const response = await axios.post('/api/competitions', competitionData, config);

        console.log('CreateCompetition: Success! Response:', response.data);
        alert('Competition created successfully!');

        // Reset form fields
        setTitle('');
        setDescription('');
        setEndDate('');
        setShortId('');
        setCompetitionType('Standard');
        setSelectedCategory(''); // Reset selected category
        setError(null);
        setFormError(null);

        // Use response.data which should contain the created competition object
        navigate(`/competitions/${response.data.shortId}`);

    } catch (err) {
        console.error('CreateCompetition: Submission error:', err);
        const errorMsg = err.response?.data?.message || `Failed to create competition. Status: ${err.response?.status}`;
        setError(errorMsg);
        setIsSubmitting(false); // Only set submitting false on error
    }
  };

  // --- Render Logic ---
  if (authLoading || !roleCheckComplete) {
      return <div>Loading...</div>;
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
          <label htmlFor="title">Competition Title:</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} maxLength={100} style={{ width: '80%'}} />
        </div>

        {/* Short ID */}
        <div style={{ marginBottom: '15px' }}>
           <label htmlFor="shortId">Short ID (URL friendly):</label>
           <input type="text" id="shortId" value={shortId} onChange={(e) => setShortId(e.target.value)} disabled={isSubmitting} placeholder="e.g., My Awesome Contest" maxLength={100} style={{ width: '60%' }} />
            <small>Spaces/special characters will be converted for the URL.</small>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description">Description:</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="5" disabled={isSubmitting} maxLength={1000} style={{ width: '80%' }} />
        </div>

        {/* --- NEW: Category Dropdown --- */}
        <div style={{ marginBottom: '15px' }}>
            <label htmlFor="category">Category:</label>
            {categoriesLoading && <p>Loading categories...</p>}
            {categoriesError && <p style={{ color: 'red' }}>Error loading categories: {categoriesError}</p>}
            {!categoriesLoading && !categoriesError && (
                <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={isSubmitting || categories.length === 0}
                    required // Make selection mandatory
                    style={{ width: 'auto', minWidth: '200px', padding: '8px' }}
                >
                    <option value="" disabled>-- Select a Category --</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            )}
             {categories.length === 0 && !categoriesLoading && !categoriesError && <p style={{color: 'grey'}}>No categories available.</p>}
        </div>
        {/* --- End Category Dropdown --- */}

        {/* End Date */}
         <div style={{ marginBottom: '15px' }}>
          <label htmlFor="endDate">End Date:</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isSubmitting} min={new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]} style={{ padding: '8px' }} />
         </div>

        {/* Competition Type for Admins Only */}
        {user && user.role === 'Admin' && (
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="competitionType">Competition Type:</label>
                <select id="competitionType" value={competitionType} onChange={(e) => setCompetitionType(e.target.value)} disabled={isSubmitting} style={{ width: 'auto', padding: '8px' }} >
                    <option value="Standard">Standard</option>
                    <option value="Business">Business</option>
                </select>
                <small>Select the type of competition.</small>
            </div>
        )}

        {formError && <p style={{ color: 'orange', marginTop: '10px' }}>{formError}</p>}
        {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}

        <button type="submit" disabled={isSubmitting || categoriesLoading} style={{ padding: '10px 20px', fontSize: '16px' }}>
          {isSubmitting ? 'Creating...' : 'Create Competition'}
        </button>
      </form>
    </div>
  );
};

export default CreateCompetition;