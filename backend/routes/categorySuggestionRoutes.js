// backend/routes/categorySuggestionRoutes.js

const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllSuggestionsAdmin,
    updateSuggestionStatusAdmin,
    createSuggestion // <-- Import the new function
} = require('../controllers/categorySuggestionController');

// Middleware for authentication and role checks
const { protect, isAdmin } = require('../middleware/authMiddleware');

// === User Routes ===

// @route   POST /api/category-suggestions
// @desc    Submit a new category suggestion
// @access  Private (Any logged-in user)
router.post('/', protect, createSuggestion); // <-- Add this route for creating suggestions

// === Admin Routes ===

// @route   GET /api/category-suggestions/admin
// @desc    Admin gets all category suggestions
// @access  Private/Admin
router.get('/admin', protect, isAdmin, getAllSuggestionsAdmin);

// @route   PUT /api/category-suggestions/admin/:suggestionId
// @desc    Admin approves or rejects a suggestion
// @access  Private/Admin
router.put('/admin/:suggestionId', protect, isAdmin, updateSuggestionStatusAdmin);

module.exports = router;