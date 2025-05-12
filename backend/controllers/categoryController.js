// backend/controllers/categoryController.js
const asyncHandler = require('express-async-handler');
const Category = require('../models/Category'); // Make sure this path is correct

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public (or Private if only logged-in users can see them)
const getAllCategories = asyncHandler(async (req, res) => {
    // Fetch only name and _id, sort alphabetically by name
    const categories = await Category.find({})
        .select('_id name') // Select only the fields needed for the dropdown
        .sort({ name: 1 }); // Sort alphabetically

    if (!categories) {
        // This case is unlikely with find(), it usually returns []
        return res.json([]);
    }

    res.json(categories);
});

// Add other category management functions here later if needed (create, update, delete by Admin)

module.exports = {
    getAllCategories,
};