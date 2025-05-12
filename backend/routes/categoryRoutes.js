// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../controllers/categoryController');
// Import protect middleware if you want to make fetching categories private
// const { protect } = require('../middleware/authMiddleware');

// GET all categories (e.g., for dropdowns)
// Add 'protect' middleware if access should be restricted
router.get('/', getAllCategories);

// Add routes for Admin category management (POST, PUT, DELETE) here later

module.exports = router;