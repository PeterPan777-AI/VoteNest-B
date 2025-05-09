// backend/models/User.js
// --- Full Replacement Code ---
// --- Added 'Admin' to role enum ---

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true, // Ensure usernames are unique
        trim: true, // Remove whitespace
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensure emails are unique
        trim: true,
        lowercase: true, // Store emails in lowercase
        match: [/.+\@.+\..+/, 'Please enter a valid email address'] // Basic email format validation
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'] // Enforce minimum password length
        // We select false here so the password hash isn't sent back by default
        // in user queries unless explicitly requested.
        // select: false
        // Let's keep it simple for now and select true, we will remove it manually later
    },
    role: {
        type: String,
        required: true,
        // *** UPDATED: Added 'Admin' to the list of allowed roles ***
        enum: ['Individual', 'Business', 'Admin'], // Only allow these roles
        default: 'Individual'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    // Add any other fields you might need later (e.g., profile info, subscription status)
});

// --- Password Hashing Middleware ---
// This function runs *before* a user document is saved ('save' event)
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate a salt (randomness factor) - 10 rounds is generally recommended
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        const hashedPassword = await bcrypt.hash(this.password, salt);
        // Replace the plain text password with the hashed password
        this.password = hashedPassword;
        next(); // Continue with the save operation
    } catch (error) {
        next(error); // Pass any error to the next middleware/error handler
    }
});

// --- Password Comparison Method ---
// Add a method to the user schema to compare submitted password with stored hash
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // Use bcrypt to compare the provided password with the stored hash
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error; // Re-throw the error to be caught by the calling function
    }
};


// Create the User model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User; // Export the model for use in other files