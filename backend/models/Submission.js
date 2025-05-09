// backend/models/Submission.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Use Schema alias for clarity

const submissionSchema = new Schema({
    // Link to the Competition this submission belongs to
    // We'll assume you'll have a 'Competition' model later
    competitionId: {
        type: Schema.Types.ObjectId,
        ref: 'Competition', // Reference to the (future) Competition model
        required: true,
        index: true // Indexing for faster lookups by competition
    },
    // Link to the User who made the submission
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
        index: true // Indexing for faster lookups by user
    },
    // Store the username at submission time for easy display
    // (Denormalization - avoids needing to lookup User every time)
    username: {
        type: String,
        required: true
    },
    // Details of the submission entry
    entryTitle: {
        type: String,
        required: [true, 'Entry title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    // Store URLs of uploaded files (adjust if using different storage)
    // For simplicity, let's assume an array of strings for now
    fileUrls: {
        type: [String],
        default: []
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },

    // --- Fields for Voting ---
    voteCount: {
        type: Number,
        default: 0, // Start with zero votes
        min: 0 // Ensure vote count cannot be negative
    },
    votedByUsers: {
        // An array storing the ObjectIds of users who have voted
        type: [Schema.Types.ObjectId],
        ref: 'User', // Each ID in the array refers to a User document
        default: [] // Start with an empty array
    }
    // --- End Voting Fields ---

    // Consider adding other fields like status (e.g., pending, approved, rejected) if needed later
});

// Optional: Compound index if you often query by user AND competition
// submissionSchema.index({ userId: 1, competitionId: 1 });

// Create the Submission model from the schema
const Submission = mongoose.model('Submission', submissionSchema);

// Export the model
module.exports = Submission;