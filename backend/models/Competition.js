// backend/models/Competition.js
// --- Full Replacement Code ---
// --- Added 'competitionType' field ---

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const competitionSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Competition title is required.'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long.'],
        maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    description: {
        type: String,
        required: [true, 'Competition description is required.'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long.'],
        maxlength: [2000, 'Description cannot exceed 2000 characters.']
    },
    shortId: {
        type: String,
        required: [true, 'Short ID is required for the competition URL.'],
        unique: true,
        trim: true,
        match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Short ID can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.']
    },
    status: { // This manages the lifecycle (e.g., open, voting, closed)
        type: String,
        required: [true, 'Competition status is required.'],
        enum: {
            values: ['upcoming', 'open', 'voting', 'closed', 'pending_review'],
            message: 'Invalid status: {VALUE} is not supported. Allowed statuses are upcoming, open, voting, closed, pending_review.'
        },
        default: 'open'
    },
    // *** THIS FIELD defines the AUDIENCE/NATURE of the competition ***
    competitionType: {
        type: String,
        required: [true, 'Competition type is required.'],
        enum: {
            values: ['Standard', 'Business'], // 'Standard' for general/individual, 'Business' for business-focused
            message: 'Invalid competition type: {VALUE} is not supported. Allowed types are Standard, Business.'
        },
        // When Admin creates, they'll choose. When Business creates, it's auto 'Business'.
        // A default might be 'Standard', or you might require it explicitly.
        default: 'Standard' 
    },
    endDate: {
        type: Date,
        required: [true, 'Competition end date is required.']
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Competition must have a creator.']
    },
    submissions: [{
        type: Schema.Types.ObjectId,
        ref: 'Submission'
    }]
}, {
    timestamps: true
});

competitionSchema.index({ status: 1 });
competitionSchema.index({ endDate: 1 });
competitionSchema.index({ createdBy: 1 });
competitionSchema.index({ competitionType: 1 }); // Index the new field

const Competition = mongoose.model('Competition', competitionSchema);

module.exports = Competition;