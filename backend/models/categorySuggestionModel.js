// Filename: backend/models/categorySuggestionModel.js

const mongoose = require('mongoose');

const categorySuggestionSchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required.'],
      trim: true,
      minlength: [3, 'Category name must be at least 3 characters long.'],
      maxlength: [100, 'Category name cannot exceed 100 characters.']
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters.']
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User' // This 'User' must match the name you used when creating your User model (e.g., mongoose.model('User', userSchema))
    },
    status: {
      type: String,
      required: true,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review'
    }
    // We can add more fields later if needed, like adminNotes, reviewedBy, etc.
  },
  {
    timestamps: true // This automatically adds `createdAt` and `updatedAt` fields
  }
);

const CategorySuggestion = mongoose.model('CategorySuggestion', categorySuggestionSchema);

module.exports = CategorySuggestion;