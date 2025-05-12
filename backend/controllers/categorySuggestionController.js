// backend/controllers/categorySuggestionController.js

const asyncHandler = require('express-async-handler');
const CategorySuggestion = require('../models/categorySuggestionModel');
const Category = require('../models/Category'); // Ensure this path is correct

// @desc    Get all category suggestions (Admin only)
// @route   GET /api/category-suggestions/admin
// @access  Private/Admin
const getAllSuggestionsAdmin = asyncHandler(async (req, res) => {
    console.log("Attempting to fetch category suggestions for Admin..."); // Debugging
    try {
        const suggestions = await CategorySuggestion.find()
            .populate('submittedBy', 'username email') // Populate user details
            .sort({ createdAt: -1 }); // Sort by newest first

        if (!suggestions) {
             console.log("CategorySuggestion.find() returned null or undefined."); // Debugging
             return res.json([]);
        }

        if (suggestions.length === 0) {
            console.log("No category suggestions found in the database."); // Debugging
            return res.json([]);
        }

        console.log(`Found ${suggestions.length} suggestions.`); // Debugging
        res.json(suggestions);

    } catch (error) {
        console.error("Error fetching category suggestions:", error); // Log the actual error
        res.status(500).json({ message: 'Server error fetching suggestions.' }); // Send a generic server error
    }
});


// @desc    Update suggestion status (Approve/Reject)
// @route   PUT /api/category-suggestions/admin/:suggestionId
// @access  Private/Admin
const updateSuggestionStatusAdmin = asyncHandler(async (req, res) => {
    const { suggestionId } = req.params;
    const { status } = req.body; // Expect 'approved' or 'rejected'

    console.log(`Attempting to update suggestion ${suggestionId} to status: ${status}`); // Debugging

    // Validate input status
    if (!['approved', 'rejected'].includes(status)) {
        res.status(400); // Bad Request
        throw new Error("Invalid status provided. Must be 'approved' or 'rejected'.");
    }

    const suggestion = await CategorySuggestion.findById(suggestionId);

    if (!suggestion) {
        console.log(`Suggestion with ID ${suggestionId} not found.`); // Debugging
        res.status(404);
        throw new Error('Category suggestion not found');
    }

    console.log(`Found suggestion: ${suggestion.categoryName}, Current status: ${suggestion.status}`); // Debugging

    // Check if already processed
    if (suggestion.status !== 'pending_review') {
        console.log(`Suggestion ${suggestionId} already processed with status: ${suggestion.status}.`); // Debugging
         res.json({
             message: `Suggestion was already ${suggestion.status.replace('_', ' ')}. No changes made.`,
             suggestion
         });
         return;
    }

    // Update the status
    suggestion.status = status;

    // If approving, try to create the main category
    if (status === 'approved') {
        console.log(`Status is 'approved'. Checking/Creating main category for: ${suggestion.categoryName}`); // Debugging
        try {
            // Check if a category with the same name already exists (case-insensitive)
            const existingCategory = await Category.findOne({
                name: { $regex: new RegExp(`^${suggestion.categoryName}$`, 'i') }
            });

            if (!existingCategory) {
                console.log(`Main category '${suggestion.categoryName}' does not exist. Creating...`); // Debugging
                // Ensure description is provided or fallback correctly
                const description = suggestion.reason || `User suggested category: ${suggestion.categoryName}`;
                await Category.create({
                    name: suggestion.categoryName.trim(), // Trim name before saving
                    description: description.trim(), // Trim description
                });
                console.log(`Main category '${suggestion.categoryName}' created successfully.`); // Debugging
            } else {
                console.log(`Main category '${suggestion.categoryName}' already exists. Skipping creation.`); // Debugging
            }
        } catch (categoryError) {
            console.error(`Error creating main category '${suggestion.categoryName}':`, categoryError);
            // Decide how to handle this error - here we just log and proceed, maybe throw?
             // For now, let's throw an error to signal the problem more clearly
             res.status(500);
             throw new Error(`Failed to create category '${suggestion.categoryName}' due to server error.`);
        }
    } else {
         console.log(`Status is 'rejected'. No category creation needed for suggestion: ${suggestion.categoryName}`); // Debugging
    }

    // Save the updated suggestion status
    const updatedSuggestion = await suggestion.save();
    console.log(`Suggestion ${suggestionId} status saved as ${updatedSuggestion.status}.`); // Debugging

    res.json({
        message: `Suggestion successfully ${status.replace('_', ' ')}.`, // Dynamic success message
        suggestion: updatedSuggestion // Return the final state of the suggestion
    });
});

// @desc    Create a new category suggestion
// @route   POST /api/category-suggestions
// @access  Private (Any logged-in user)
const createSuggestion = asyncHandler(async (req, res) => {
    const { categoryName, reason } = req.body;

    // Basic validation
    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim().length === 0) {
        res.status(400);
        throw new Error('Category name is required and cannot be empty.');
    }

    const trimmedCategoryName = categoryName.trim();

    // Check if a suggestion with the same name (case-insensitive) already exists and is pending
    const existingPendingSuggestion = await CategorySuggestion.findOne({
        categoryName: { $regex: new RegExp(`^${trimmedCategoryName}$`, 'i') },
        status: 'pending_review',
    });

    if (existingPendingSuggestion) {
        res.status(400); // Bad Request is more appropriate than Conflict (409) here
        throw new Error(`A suggestion for '${trimmedCategoryName}' is already pending review.`);
    }

     // Check if a main category with the same name already exists (case-insensitive)
    const existingCategory = await Category.findOne({
         name: { $regex: new RegExp(`^${trimmedCategoryName}$`, 'i') }
    });

    if (existingCategory) {
        res.status(400); // Bad Request
        throw new Error(`The category '${trimmedCategoryName}' already exists.`);
    }

    // Create the suggestion
    const suggestion = new CategorySuggestion({
        categoryName: trimmedCategoryName, // Use trimmed name
        reason: reason ? reason.trim() : '', // Handle optional reason and trim
        submittedBy: req.user._id, // Get user ID from protect middleware
        status: 'pending_review', // Default status
    });

    const createdSuggestion = await suggestion.save();

    console.log(`New category suggestion created by ${req.user.username}: ${createdSuggestion.categoryName}, ID: ${createdSuggestion._id}`); // Debugging log with ID

    // Respond with the created suggestion
    res.status(201).json(createdSuggestion);
});


// Export all functions
module.exports = {
    getAllSuggestionsAdmin,
    updateSuggestionStatusAdmin,
    createSuggestion // Added export
};