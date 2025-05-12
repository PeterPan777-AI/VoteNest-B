// backend/models/Category.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Basic schema for main categories
const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Category name is required.'],
        unique: true, // Category names should usually be unique
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters long.'],
        maxlength: [100, 'Category name cannot exceed 100 characters.']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters.']
        // Description is often optional
    },
    // You might want to add who created the category later
    // createdBy: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'User'
    // }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Index the name for faster lookups (especially with unique constraint)
categorySchema.index({ name: 1 });

// Create the model from the schema
// Mongoose will automatically look for the plural, lowercased version
// of your model name for the collection: 'categories'
const Category = mongoose.model('Category', categorySchema);

// Export the model
module.exports = Category;