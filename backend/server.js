// backend/server.js
// --- Full Code Incorporating competitionType, Corrected Eligibility, Cascade Delete, AND NEW SEED DATA ---

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Submission = require('./models/Submission');
const Competition = require('./models/Competition'); // Ensure this points to your updated Competition.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Configuration Constants ---
const JWT_SECRET = 'your_super_secret_random_string_123!@#'; // CHANGE IN PRODUCTION!
const UPLOADS_DIR = 'uploads';
const MONGODB_URI = 'mongodb+srv://peterpawlak:080HsxwzFEuy6QOV@cluster0.lwfm7ij.mongodb.net/competitionAppDb?retryWrites=true&w=majority';
const ALLOWED_BACKEND_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.avi', '.mov', '.mkv', '.webm'];
const BACKEND_MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024; // 300MB

// --- Setup Uploads Directory ---
const uploadsDirPath = path.join(__dirname, UPLOADS_DIR);
if (!fs.existsSync(uploadsDirPath)) {
    try {
        fs.mkdirSync(uploadsDirPath);
        console.log(`Uploads directory created at: ${uploadsDirPath}`);
    } catch (err) {
        console.error(`Error creating uploads directory: ${err}`);
        process.exit(1);
    }
}

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDirPath));

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDirPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'file-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: BACKEND_MAX_FILE_SIZE_BYTES },
    fileFilter: function (req, file, cb) {
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_BACKEND_EXTENSIONS.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed. Only ${ALLOWED_BACKEND_EXTENSIONS.join(', ')} are permitted.`));
        }
    }
});

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("MongoDB Atlas connected successfully.");
        seedInitialData(); // Seed data after successful connection
    })
    .catch(err => {
        console.error('MongoDB Atlas connection error:', err);
        process.exit(1);
    });


// --- Helper Function for Slugs ---
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// --- START: Updated seedInitialData function ---
async function seedInitialData() {
    try {
        // --- Seed Standard Users (Admin, Business, Individual) ---
        const usersToSeed = [
            { username: 'SeedAdmin', email: 'admin@example.com', password: 'password123', role: 'Admin' },
            { username: 'SeedBizUser', email: 'seedbiz@example.com', password: 'password123', role: 'Business' },
            { username: 'SeedIndUser', email: 'seedind@example.com', password: 'password123', role: 'Individual' },
        ];

        let dbAdminUser, dbBusinessUser, dbIndividualUser;

        for (const userData of usersToSeed) {
            let user = await User.findOne({ $or: [{ email: userData.email }, { username: userData.username }] });
            if (!user) {
                console.log(`Creating Seed User: ${userData.username} (${userData.role})`);
                user = new User(userData);
                await user.save();
                console.log(`Seed User ${userData.username} created.`);
            }
            if (userData.username === 'SeedAdmin') dbAdminUser = user;
            if (userData.username === 'SeedBizUser') dbBusinessUser = user;
            if (userData.username === 'SeedIndUser') dbIndividualUser = user;
        }

        if (!dbAdminUser || !dbBusinessUser || !dbIndividualUser) {
            console.warn("One or more seed users (Admin, Business, Individual) not assigned during loop. Attempting to re-fetch from DB...");
            if (!dbAdminUser) dbAdminUser = await User.findOne({ username: 'SeedAdmin' });
            if (!dbBusinessUser) dbBusinessUser = await User.findOne({ username: 'SeedBizUser' });
            if (!dbIndividualUser) dbIndividualUser = await User.findOne({ username: 'SeedIndUser' });

             if (!dbAdminUser || !dbBusinessUser || !dbIndividualUser) {
                console.error("CRITICAL: One or more seed users still not found after re-fetch. Aborting competition seeding.");
                return;
             }
        }
        console.log("Verified essential seed users for competition creation:");
        if(dbAdminUser) console.log(`  Admin User ID: ${dbAdminUser._id}`); else console.error("  Admin User not found!");
        if(dbBusinessUser) console.log(`  Business User ID: ${dbBusinessUser._id}`); else console.error("  Business User not found!");
        if(dbIndividualUser) console.log(`  Individual User ID: ${dbIndividualUser._id}`); else console.error("  Individual User not found!");

        // --- Seed Competitions (only if competition collection is empty) ---
        const competitionCount = await Competition.countDocuments();
        if (competitionCount === 0) {
            console.log("Competitions collection is empty. Seeding new list of competitions...");

            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // Ensure all user IDs are valid before proceeding
            if (!dbBusinessUser?._id || !dbIndividualUser?._id || !dbAdminUser?._id) {
                console.error("CRITICAL: Not all seed user IDs are available. Cannot create competitions. Check user seeding logs.");
                return;
            }
            
            const competitionsToSeed = [
                {
                    title: "Best AI Tool Showcase",
                    description: "Showcase the most innovative AI tools of the year. Open to businesses.",
                    shortId: slugify("Best AI Tool 2024"),
                    createdBy: dbBusinessUser._id,
                    competitionType: 'Business', // ADDED
                    status: 'open',
                    endDate: new Date(now + 30 * oneDay)
                },
                {
                    title: "Most Innovative Gadget (Business)",
                    description: "Present the latest and greatest tech gadgets. Business entries only.",
                    shortId: slugify("Most Innovative Gadget Q3 2024"),
                    createdBy: dbBusinessUser._id,
                    competitionType: 'Business', // ADDED
                    status: 'voting',
                    endDate: new Date(now - 1 * oneDay)
                },
                {
                    title: "Top Eco-Friendly Product (Business)",
                    description: "Highlight products making a positive environmental impact. Business focus.",
                    shortId: slugify("Top Eco-Friendly Product 2024"),
                    createdBy: dbBusinessUser._id,
                    competitionType: 'Business', // ADDED
                    status: 'open',
                    endDate: new Date(now + 45 * oneDay)
                },
                {
                    title: "Best Pet Innovation (Business Challenge)",
                    description: "Share new products and ideas for our furry friends. Business solutions.",
                    shortId: slugify("Best Pet Innovation Awards Business"),
                    createdBy: dbBusinessUser._id,
                    competitionType: 'Business', // ADDED
                    status: 'closed',
                    endDate: new Date(now - 15 * oneDay)
                },
                {
                    title: "Most Innovative Startup Idea (Business Pitch)",
                    description: "Pitch your groundbreaking startup concept. For business entrants.",
                    shortId: slugify("Innovative Startup Idea Pitchfest"),
                    createdBy: dbBusinessUser._id,
                    competitionType: 'Business', // ADDED
                    status: 'upcoming',
                    endDate: new Date(now + 60 * oneDay)
                },
                {
                    title: "Best Indie Fashion Brand (Business Spotlight)",
                    description: "Discover emerging independent fashion designers and brands. Business entries.",
                    shortId: slugify("Indie Fashion Spotlight 2024 Business"),
                    createdBy: dbBusinessUser._id,
                    competitionType: 'Business', // ADDED
                    status: 'open',
                    endDate: new Date(now + 20 * oneDay)
                },
                // NOTE: Individuals cannot create competitions per rules. These are for seed data consistency.
                // Consider having Admin create these 'Standard' competitions.
                {
                    title: "New Music Score Challenge (Standard)",
                    description: "Submit your original musical compositions. Open to Individuals.",
                    shortId: slugify("New Music Score Challenge Autumn"),
                    createdBy: dbIndividualUser._id, // Ideally Admin should create Standard comps
                    competitionType: 'Standard', // ADDED
                    status: 'open',
                    endDate: new Date(now + 35 * oneDay)
                },
                {
                    title: "Best Lyrics - Music or Poetry (Standard)",
                    description: "Share your most impactful song lyrics or original poetry. For Individuals.",
                    shortId: slugify("Lyrical Masters Contest"),
                    createdBy: dbIndividualUser._id, // Ideally Admin
                    competitionType: 'Standard', // ADDED
                    status: 'voting',
                    endDate: new Date(now - 3 * oneDay)
                },
                {
                    title: "Cutest Cat Photo Contest (Standard)",
                    description: "Let's see those adorable cat pictures! Open for Individual submissions.",
                    shortId: slugify("Cutest Cat Photo Contest Fall"),
                    createdBy: dbIndividualUser._id, // Ideally Admin
                    competitionType: 'Standard', // ADDED
                    status: 'open',
                    endDate: new Date(now + 10 * oneDay)
                },
                {
                    title: "Cutest Dog Photo Contest (Standard)",
                    description: "Show off your charming canine companions. Individual entries.",
                    shortId: slugify("Cutest Dog Photo Contest Fall"),
                    createdBy: dbIndividualUser._id, // Ideally Admin
                    competitionType: 'Standard', // ADDED
                    status: 'open',
                    endDate: new Date(now + 12 * oneDay)
                },
                {
                    title: "Funniest Pet Video Awards (Standard)",
                    description: "Submit your most hilarious pet moments. Open to Individuals.",
                    shortId: slugify("Funniest Pet Video Awards 2024"),
                    createdBy: dbIndividualUser._id, // Ideally Admin
                    competitionType: 'Standard', // ADDED
                    status: 'closed',
                    endDate: new Date(now - 25 * oneDay)
                },
                {
                    title: "Best DIY Craft vs. Art Showdown (Standard)",
                    description: "Is it craft, or is it art? Show us your best! Individual submissions.",
                    shortId: slugify("DIY Craft Art Showdown"),
                    createdBy: dbIndividualUser._id, // Ideally Admin
                    competitionType: 'Standard', // ADDED
                    status: 'upcoming',
                    endDate: new Date(now + 50 * oneDay)
                },
                // Admin Created Competitions
                {
                    title: "Admin's Universal Test Competition (Standard)",
                    description: "A versatile Standard competition by Admin for testing various features.",
                    shortId: slugify("Admin Universal Test Comp Standard"),
                    createdBy: dbAdminUser._id,
                    competitionType: 'Standard', // ADDED
                    status: 'open',
                    endDate: new Date(now + 90 * oneDay)
                },
                { // NEW Admin-created Business Competition
                    title: "Admin's Business Test Competition",
                    description: "A Business-type competition created by Admin for testing Business user interactions.",
                    shortId: slugify("Admin Business Test Comp"),
                    createdBy: dbAdminUser._id,
                    competitionType: 'Business', // ADDED
                    status: 'open',
                    endDate: new Date(now + 80 * oneDay)
                }
            ];
            
            console.log(`Attempting to seed ${competitionsToSeed.length} competitions...`);
            await Competition.insertMany(competitionsToSeed);
            console.log(`Seeding complete. ${competitionsToSeed.length} competitions added.`);

        } else {
            // console.log("Competitions collection is not empty. Skipping competition seeding.");
        }

    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
             console.warn("Skipping seeding for duplicate entry (likely already exists). If this is unexpected, check your shortIds for uniqueness.");
        } else if (error.name === 'ValidationError') {
            console.error('ValidationError during seeding (often due to schema mismatch, check Competition model and seed data):', error.message);
            Object.values(error.errors).forEach(errDetail => console.error(`  - Path: '${errDetail.path}', Value: '${errDetail.value}', Message: ${errDetail.message}`));
        }
        else {
            console.error('Error during initial data seeding:', error);
        }
    }
}
// --- END: Updated seedInitialData function ---


// --- Helper Functions ---
const generateToken = (user) => {
    // ... (rest of generateToken function - no changes)
    if (!user || !user._id || !user.username || !user.role) {
        console.error("Error generating token: Invalid user object provided.", user);
        return null;
    }
    const payload = {
        userId: user._id,
        username: user.username,
        role: user.role
    };
    try {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    } catch (error) {
        console.error("Error signing JWT:", error);
        return null;
    }
};

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    // ... (rest of authenticateToken function - no changes)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
            }
            console.error("JWT Verification Error:", err.message);
            return res.status(403).json({ message: 'Invalid or malformed token.' });
        }
        req.user = userPayload;
        next();
    });
};

// --- Admin Check Middleware ---
const isAdmin = (req, res, next) => {
    // ... (rest of isAdmin function - no changes)
    if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: Administrator access required.' });
    }
    next();
};

// --- API Routes ---

app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// --- User Authentication Routes ---
app.post('/api/auth/register', async (req, res) => {
    // ... (rest of register route - no changes)
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Username, email, password, and role are required.' });
    }
    if (!['Individual', 'Business'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either "Individual" or "Business".' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username }] });
        if (existingUser) {
            const conflictField = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
            return res.status(409).json({ message: `${conflictField} already exists.` });
        }

        const newUser = new User({ username, email: email.toLowerCase(), password, role });
        await newUser.save();

        const userForResponse = newUser.toObject();
        delete userForResponse.password;

        res.status(201).json({ message: 'User registered successfully!', user: userForResponse });

    } catch (error) {
        console.error("Registration Error:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error during registration process.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    // ... (rest of login route - no changes)
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Username/email and password are required.' });
    }

    try {
        const isEmail = identifier.includes('@');
        const query = isEmail ? { email: identifier.toLowerCase() } : { username: identifier };
        const user = await User.findOne(query);

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(user);
        if (!token) {
             return res.status(500).json({ message: 'Server error during login process (token generation failed).' });
        }

        const userForResponse = user.toObject();
        delete userForResponse.password;

        res.status(200).json({
            message: 'Login successful!',
            user: userForResponse,
            token: token
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login process.' });
    }
});

// --- Admin Routes ---
// ... (Admin routes - /api/admin/check, /api/admin/users, /api/admin/users/:userIdToDelete, /api/admin/users/:userIdToUpdate - no functional changes regarding competitionType)
app.get('/api/admin/check', authenticateToken, isAdmin, (req, res) => {
    res.json({ message: `Welcome Admin ${req.user.username}! You have admin privileges.`, adminData: req.user });
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    console.log("Admin route /api/admin/users accessed by:", req.user.username);
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching all users (Admin):", error);
        res.status(500).json({ message: 'Server error fetching user list.' });
    }
});

app.delete('/api/admin/users/:userIdToDelete', authenticateToken, isAdmin, async (req, res) => {
    const { userIdToDelete } = req.params;
    const adminUserId = req.user.userId;

    console.log(`Admin ${adminUserId} attempting to delete user ${userIdToDelete}`);

    if (!mongoose.Types.ObjectId.isValid(userIdToDelete)) {
        return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    if (userIdToDelete === adminUserId) {
        return res.status(400).json({ message: 'Administrators cannot delete their own account.' });
    }

    try {
        const userToDelete = await User.findById(userIdToDelete);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (userToDelete.role === 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last remaining Administrator account.' });
            }
        }

        console.log(`Admin ${adminUserId}: Initiating content cleanup for user ${userIdToDelete} (${userToDelete.username})...`);
        let contentDeletionErrors = [];

        try {
            const competitionsToDelete = await Competition.find({ createdBy: userIdToDelete });
            console.log(` Found ${competitionsToDelete.length} competitions created by user ${userIdToDelete}.`);

            for (const competition of competitionsToDelete) {
                const compId = competition._id;
                console.log(`  Processing competition ${compId} (${competition.title})...`);
                try {
                    const submissionsToDelete = await Submission.find({ competitionId: compId });
                    console.log(`   Found ${submissionsToDelete.length} submissions for this competition.`);
                    let deletedFileCount = 0;
                    for (const sub of submissionsToDelete) {
                        if (sub.fileUrls && sub.fileUrls.length > 0) {
                            for (const fileUrl of sub.fileUrls) {
                                try {
                                    const filename = path.basename(fileUrl);
                                    const filePath = path.join(uploadsDirPath, filename);
                                    if (fs.existsSync(filePath)) {
                                        fs.unlinkSync(filePath);
                                        deletedFileCount++;
                                        console.log(`    Deleted file: ${filePath}`);
                                    } else {
                                        console.warn(`    File not found, skipping deletion: ${filePath}`);
                                    }
                                } catch (fileErr) {
                                    console.error(`    Error deleting file ${fileUrl} for submission ${sub._id}:`, fileErr);
                                    contentDeletionErrors.push(`File deletion failed for sub ${sub._id} (comp ${compId}): ${fileErr.message}`);
                                }
                            }
                        }
                    }
                    if (deletedFileCount > 0) console.log(`   Deleted ${deletedFileCount} associated files for competition ${compId}.`);
                    if (submissionsToDelete.length > 0) {
                        const deleteSubResult = await Submission.deleteMany({ competitionId: compId });
                        console.log(`   Deleted ${deleteSubResult.deletedCount} submission documents for competition ${compId}.`);
                    }
                    await Competition.findByIdAndDelete(compId);
                    console.log(`  Successfully deleted competition document ${compId}.`);
                } catch (compError) {
                    console.error(`  Error during cascade delete for competition ${compId}:`, compError);
                    contentDeletionErrors.push(`Cascade delete failed for competition ${compId}: ${compError.message}`);
                }
            }
            if (contentDeletionErrors.length > 0) console.warn(`Admin Delete User: Encountered ${contentDeletionErrors.length} errors during content cleanup for user ${userIdToDelete}.`);
            else if (competitionsToDelete.length > 0) console.log(`Successfully cleaned up all content associated with user ${userIdToDelete}.`);
            else console.log(`No competitions found for user ${userIdToDelete}. No content cleanup needed.`);
        } catch (cleanupError) {
            console.error(`FATAL: Error during the initial content cleanup phase for user ${userIdToDelete}:`, cleanupError);
            contentDeletionErrors.push(`Fatal cleanup error: ${cleanupError.message}`);
        }

        await User.findByIdAndDelete(userIdToDelete);
        console.log(`User ${userIdToDelete} (${userToDelete.username}) document deleted successfully by Admin ${adminUserId}.`);
        res.status(200).json({ message: `User '${userToDelete.username}' and their associated content deleted successfully.` });

    } catch (error) {
        console.error(`Error processing delete request for user ${userIdToDelete} by Admin ${adminUserId}:`, error);
        if (error.name === 'CastError' && !res.headersSent) return res.status(400).json({ message: 'Invalid user ID format during database operation.' });
        if (!res.headersSent) res.status(500).json({ message: 'Server error during user deletion process.' });
    }
});

app.put('/api/admin/users/:userIdToUpdate', authenticateToken, isAdmin, async (req, res) => {
    const { userIdToUpdate } = req.params;
    const { role: newRole } = req.body;
    const adminUserId = req.user.userId;

    console.log(`Admin ${adminUserId} attempting to update role for user ${userIdToUpdate} to '${newRole}'`);

    if (!mongoose.Types.ObjectId.isValid(userIdToUpdate)) return res.status(400).json({ message: 'Invalid user ID format.' });
    if (userIdToUpdate === adminUserId) return res.status(400).json({ message: 'Administrators cannot change their own role via this panel.' });
    const allowedRoles = User.schema.path('role').enumValues; 
    if (!newRole || !allowedRoles.includes(newRole)) return res.status(400).json({ message: `Invalid role provided. Allowed roles are: ${allowedRoles.join(', ')}.` });

    try {
        const userToUpdate = await User.findById(userIdToUpdate);
        if (!userToUpdate) return res.status(404).json({ message: 'User not found.' });

        if (userToUpdate.role === 'Admin' && newRole !== 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount <= 1) return res.status(400).json({ message: 'Cannot change the role of the last remaining Administrator.' });
        }

        userToUpdate.role = newRole;
        const updatedUser = await userToUpdate.save();
        const userForResponse = updatedUser.toObject();
        delete userForResponse.password;

        console.log(`User ${userIdToUpdate} (${userToUpdate.username}) role updated to '${newRole}' successfully by Admin ${adminUserId}.`);
        res.status(200).json({ message: `User '${userToUpdate.username}' role updated successfully to '${newRole}'.`, user: userForResponse });

    } catch (error) {
        console.error(`Error updating role for user ${userIdToUpdate} by Admin ${adminUserId}:`, error);
        if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID format during database operation.' });
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation failed during save: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error during user role update.' });
    }
});


// --- User-Specific Routes ---
app.get('/api/users/me/competitions', authenticateToken, async (req, res) => {
    // ... (no changes)
    const userId = req.user.userId;
    try {
        const userCompetitions = await Competition.find({ createdBy: userId })
            .select('title description status endDate shortId _id createdAt competitionType') // Added competitionType
            .sort({ createdAt: -1 });
        res.status(200).json(userCompetitions);
    } catch (error) {
        console.error("Error fetching user's competitions:", error);
        res.status(500).json({ message: 'Server error fetching your competitions.' });
    }
});

// --- Competition Routes ---
app.get('/api/competitions', async (req, res) => {
    // ... (no changes other than selecting competitionType for consistency)
    try {
        const competitions = await Competition.find()
            .select('title description status endDate shortId createdAt createdBy submissions competitionType') // Added competitionType
            .populate({ path: 'createdBy', model: 'User', select: 'username role _id' })
            .sort({ endDate: 1 });
        res.status(200).json(competitions);
    } catch (error) {
        console.error("Error fetching competitions list:", error);
        res.status(500).json({ message: 'Server error fetching competitions.' });
    }
});

app.get('/api/competitions/:competitionId', async (req, res) => {
    // ... (no changes other than selecting competitionType for consistency)
    const { competitionId } = req.params;
    let competition = null;
    try {
        const populateSubmissionsConfig = {
            path: 'submissions',
            model: 'Submission',
            select: '-__v -competitionId',
            populate: { path: 'userId', model: 'User', select: 'username _id role' },
            options: { sort: { voteCount: -1 } }
        };
         const populateCreatorConfig = { path: 'createdBy', model: 'User', select: 'username role _id' };

        if (mongoose.Types.ObjectId.isValid(competitionId)) {
            competition = await Competition.findById(competitionId)
                .select('+competitionType') // Ensure competitionType is selected
                .populate(populateSubmissionsConfig)
                .populate(populateCreatorConfig);
        }
        if (!competition) {
            competition = await Competition.findOne({ shortId: competitionId })
                .select('+competitionType') // Ensure competitionType is selected
                .populate(populateSubmissionsConfig)
                .populate(populateCreatorConfig);
        }
        if (!competition) return res.status(404).json({ message: 'Competition not found.' });
        res.status(200).json(competition);
    } catch (error) {
        console.error(`Error fetching competition details for ID ${competitionId}:`, error);
        if (error.name === 'CastError') return res.status(400).json({ message: `Invalid competition ID format: ${competitionId}` });
        res.status(500).json({ message: 'Server error while fetching competition details.' });
    }
});

// --- Create Competition Route ---
app.post('/api/competitions', authenticateToken, async (req, res) => {
    // *** UPDATED to handle competitionType ***
    if (req.user.role !== 'Business' && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: Only Business or Admin users can create competitions.' });
    }
    // Added competitionType to destructuring
    const { title, description, endDate, shortId: userProvidedShortId, status: userProvidedStatus, competitionType: userProvidedCompetitionType } = req.body;

    if (!title || !description || !endDate || !userProvidedShortId) {
        return res.status(400).json({ message: 'Title, description, end date, and short ID are required.' });
    }

    let finalCompetitionType = 'Standard'; // Default for safety
    if (req.user.role === 'Business') {
        finalCompetitionType = 'Business'; // Businesses always create 'Business' type competitions
    } else if (req.user.role === 'Admin') {
        if (!userProvidedCompetitionType || !['Standard', 'Business'].includes(userProvidedCompetitionType)) {
            return res.status(400).json({ message: "Admin must specify a valid competition type ('Standard' or 'Business')." });
        }
        finalCompetitionType = userProvidedCompetitionType;
    } else {
        // Should not happen due to initial role check, but as a safeguard:
        return res.status(403).json({ message: "Forbidden: Your role cannot create competitions."});
    }

    const generatedShortId = slugify(userProvidedShortId);
    if (!generatedShortId) return res.status(400).json({ message: 'Short ID cannot be empty or contain only invalid characters.' });

    const parsedEndDate = new Date(endDate);
    if (isNaN(parsedEndDate)) return res.status(400).json({ message: 'Invalid end date format.' });

    const competitionStatus = (userProvidedStatus && Competition.schema.path('status').enumValues.includes(userProvidedStatus))
        ? userProvidedStatus
        : 'open';

    if (parsedEndDate <= Date.now() && competitionStatus !== 'closed' && competitionStatus !== 'voting') {
        return res.status(400).json({ message: "End date must be in the future unless status is 'closed' or 'voting'." });
    }

    try {
        const existingByShortId = await Competition.findOne({ shortId: generatedShortId });
        if (existingByShortId) return res.status(409).json({ message: `The short ID '${generatedShortId}' is already in use.` });
        const existingByTitle = await Competition.findOne({ title: title });
        if (existingByTitle) return res.status(409).json({ message: `The title "${title}" is already used by another competition.` });

        const newCompetition = new Competition({
            title: title.trim(),
            description: description.trim(),
            endDate: parsedEndDate,
            shortId: generatedShortId,
            createdBy: req.user.userId,
            status: competitionStatus,
            competitionType: finalCompetitionType // SAVE the competitionType
        });
        const savedCompetition = await newCompetition.save();
        res.status(201).json(savedCompetition);
    } catch (error) {
        console.error("Competition Creation Error:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        if (error.code === 11000) return res.status(409).json({ message: 'A competition with this title or short ID already exists.' });
        res.status(500).json({ message: 'Server error creating competition.' });
    }
});

app.put('/api/competitions/:competitionId', authenticateToken, async (req, res) => {
    // *** UPDATED to handle competitionType for Admins ***
    const { competitionId } = req.params;
    const { userId, role: userRole } = req.user;
    // Added competitionType to destructuring for potential updates
    const { title, description, endDate, status, competitionType: newCompetitionType } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;

    // Only Admins can change competitionType after creation
    if (userRole === 'Admin' && newCompetitionType !== undefined) {
        if (!['Standard', 'Business'].includes(newCompetitionType)) {
            return res.status(400).json({ message: "Invalid competition type. Must be 'Standard' or 'Business'." });
        }
        updateData.competitionType = newCompetitionType;
    }

    const errors = [];
    if (Object.keys(updateData).length === 0) return res.status(400).json({ message: 'No update data provided.' });
    if (updateData.title === '') errors.push('Title cannot be empty.');
    if (updateData.description === '') errors.push('Description cannot be empty.');
    let parsedEndDate;
    if (updateData.endDate) {
        parsedEndDate = new Date(updateData.endDate);
        if (isNaN(parsedEndDate)) errors.push('Invalid end date format.');
        else {
            updateData.endDate = parsedEndDate; // Assign here, check logic below with competition context
        }
    }
    if (updateData.status) {
         const allowedStatuses = Competition.schema.path('status').enumValues;
         if (!allowedStatuses.includes(updateData.status)) errors.push(`Invalid status value. Allowed: ${allowedStatuses.join(', ')}.`);
    }
    if (errors.length > 0) return res.status(400).json({ message: `Validation failed: ${errors.join('; ')}` });

    try {
        let competition;
        if (mongoose.Types.ObjectId.isValid(competitionId)) competition = await Competition.findById(competitionId);
        if (!competition) competition = await Competition.findOne({ shortId: competitionId });
        if (!competition) return res.status(404).json({ message: 'Competition not found.' });

        const isCreator = competition.createdBy && competition.createdBy.toString() === userId;
        const isAdminUser = userRole === 'Admin';
        if (!isCreator && !isAdminUser) return res.status(403).json({ message: 'Forbidden: You are not authorized to edit this competition.' });
        
        // If Business user (not admin) tries to change competitionType
        if (isCreator && userRole === 'Business' && updateData.competitionType && updateData.competitionType !== 'Business') {
            return res.status(403).json({ message: 'Business users cannot change their competition type away from "Business".' });
        }


        // End date validation logic (combined with status)
        if (updateData.endDate) {
            const finalStatus = updateData.status || competition.status;
            if (new Date(updateData.endDate) < new Date().setHours(0,0,0,0) && finalStatus !== 'closed' && finalStatus !== 'voting') {
                return res.status(400).json({ message: "End Date must be today or in the future unless current/target status is 'closed' or 'voting'." });
            }
        }


        if (updateData.title && updateData.title !== competition.title) {
            const existingByTitle = await Competition.findOne({ title: updateData.title, _id: { $ne: competition._id } });
            if (existingByTitle) return res.status(409).json({ message: `The title "${updateData.title}" is already used.` });
        }

        const updatedCompetition = await Competition.findByIdAndUpdate(competition._id, { $set: updateData }, { new: true, runValidators: true })
            .populate({ path: 'createdBy', model: 'User', select: 'username _id role' });
        if (!updatedCompetition) return res.status(404).json({ message: 'Competition not found during update.' });
        res.status(200).json(updatedCompetition);
    } catch (error) {
        console.error("Competition Update Error:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        if (error.code === 11000) return res.status(409).json({ message: 'Update failed: Title might already exist.' });
        if (error.name === 'CastError') return res.status(400).json({ message: `Invalid ID format or data type.` });
        res.status(500).json({ message: 'Server error updating competition.' });
    }
});

app.delete('/api/competitions/:competitionId', authenticateToken, async (req, res) => {
    // ... (rest of delete competition route - no changes)
    const { competitionId } = req.params;
    const { userId, role: userRole } = req.user;
    try {
        let competition;
        if (mongoose.Types.ObjectId.isValid(competitionId)) competition = await Competition.findById(competitionId);
        if (!competition) competition = await Competition.findOne({ shortId: competitionId });
        if (!competition) return res.status(404).json({ message: 'Competition not found.' });

        const isCreator = competition.createdBy && competition.createdBy.toString() === userId;
        const isAdminUser = userRole === 'Admin';
        if (!isCreator && !isAdminUser) return res.status(403).json({ message: 'Forbidden: Not authorized to delete.' });

        console.log(`Deleting submissions and files for competition ${competition._id}...`);
        const submissionsToDelete = await Submission.find({ competitionId: competition._id });
        let deletedFileCount = 0, deletedSubCount = 0;
        for (const sub of submissionsToDelete) {
            if (sub.fileUrls && sub.fileUrls.length > 0) {
                for (const fileUrl of sub.fileUrls) {
                    try {
                        const filename = path.basename(fileUrl);
                        const filePath = path.join(uploadsDirPath, filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            deletedFileCount++; console.log(` Deleted file: ${filePath}`);
                        } else console.warn(` File not found for deletion: ${filePath}`);
                    } catch (fileErr) { console.error(` Error deleting file ${fileUrl} for sub ${sub._id}:`, fileErr); }
                }
            }
        }
        if (submissionsToDelete.length > 0) {
             const deleteResult = await Submission.deleteMany({ competitionId: competition._id });
             deletedSubCount = deleteResult.deletedCount;
             console.log(`Deleted ${deletedSubCount} submission documents and ${deletedFileCount} files.`);
        } else console.log(`No submissions found for competition ${competition._id}.`);

        await Competition.findByIdAndDelete(competition._id);
        res.status(200).json({ message: `Competition "${competition.title}" and its content deleted.` });
    } catch (error) {
        console.error("Competition Deletion Error:", error);
        if (error.name === 'CastError') return res.status(400).json({ message: `Invalid ID format: ${competitionId}` });
        res.status(500).json({ message: 'Server error deleting competition.' });
    }
});

// --- Submission Routes ---
app.get('/api/submissions', async (req, res) => {
    // ... (no changes here)
    try {
        const submissions = await Submission.find()
            .populate({ path: 'userId', model: 'User', select: 'username _id role'})
            .populate({ path: 'competitionId', model: 'Competition', select: 'title shortId _id status competitionType'}) // Added competitionType
            .sort({ submissionDate: -1 });
        res.status(200).json(submissions);
    } catch (error) {
        console.error("Error fetching all submissions:", error);
        res.status(500).json({ message: 'Server error fetching submissions.' });
    }
});

app.get('/api/competitions/:competitionId/submissions', authenticateToken, async (req, res) => {
    // ... (no changes here)
    const { competitionId } = req.params;
    const { userId: requestingUserId, role: requestingUserRole } = req.user;
    try {
        let competition;
        if (mongoose.Types.ObjectId.isValid(competitionId)) competition = await Competition.findById(competitionId).select('createdBy title shortId');
        if (!competition) competition = await Competition.findOne({ shortId: competitionId }).select('createdBy title shortId');
        if (!competition) return res.status(404).json({ message: 'Competition not found.' });

        const isCreator = competition.createdBy && competition.createdBy.toString() === requestingUserId;
        const isAdminUser = requestingUserRole === 'Admin';
        if (!isCreator && !isAdminUser) return res.status(403).json({ message: 'Forbidden: Not authorized.' });

        const submissions = await Submission.find({ competitionId: competition._id })
            .populate({ path: 'userId', model: 'User', select: 'username email role _id'})
            .sort({ submissionDate: -1 });
        res.status(200).json({ competitionTitle: competition.title, competitionShortId: competition.shortId, submissions });
    } catch (error) {
        console.error(`Error fetching submissions for competition ${competitionId}:`, error);
        if (error.name === 'CastError') return res.status(400).json({ message: `Invalid ID format: ${competitionId}` });
        res.status(500).json({ message: 'Server error fetching competition submissions.' });
    }
});

// --- Create Submission Route ---
app.post('/api/competitions/:competitionId/submissions', authenticateToken, (req, res, next) => {
    // ... (Multer middleware part unchanged)
    const uploader = upload.array('submissionFiles', 5);
    uploader(req, res, function (err) {
        if (err instanceof multer.MulterError) {
             if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: `File too large. Max ${BACKEND_MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` });
             if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: `Too many files. Max 5.` });
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        } else if (err) {
             if (err.message?.startsWith('File type not allowed')) return res.status(400).json({ message: err.message });
            console.error("Upload middleware unknown error:", err);
            return res.status(500).json({ message: `File upload failed: ${err.message || 'Unknown error'}` });
        }
        next();
    });
},
async (req, res) => {
    // *** UPDATED with new submission eligibility logic ***
    const { competitionId } = req.params;
    const { entryTitle, description } = req.body;
    const { userId, username, role: submitterRole } = req.user; // submitterRole is key
    const files = req.files;

    const cleanupFilesOnError = (filesToClean) => {
        // ... (cleanupFilesOnError unchanged)
        if (filesToClean && filesToClean.length > 0) {
            console.warn(`cleanupFilesOnError: Cleaning up ${filesToClean.length} files...`);
            filesToClean.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path); console.log(`cleanupFilesOnError: Deleted: ${file.path}`);
                    } else console.warn(`cleanupFilesOnError: File not found: ${file.path}`);
                } catch (cleanupErr) { console.error(`cleanupFilesOnError: Error cleaning ${file.path}:`, cleanupErr); }
            });
        }
    };

    if (!entryTitle || !description) { cleanupFilesOnError(files); return res.status(400).json({ message: 'Entry title and description required.' }); }
    if (!files || files.length === 0) return res.status(400).json({ message: 'At least one file must be uploaded.' });

    let targetCompetition = null;
    try {
        // Fetch competition including its 'status' and 'competitionType'
        const selectFields = 'status competitionType createdBy'; // Ensure these are selected
        if (mongoose.Types.ObjectId.isValid(competitionId)) {
            targetCompetition = await Competition.findById(competitionId).select(selectFields);
        }
        if (!targetCompetition) {
            targetCompetition = await Competition.findOne({ shortId: competitionId }).select(selectFields);
        }
        
        if (!targetCompetition) { cleanupFilesOnError(files); return res.status(404).json({ message: 'Competition not found.' }); }

        if (targetCompetition.status !== 'open') {
            cleanupFilesOnError(files);
            return res.status(403).json({ message: `Competition not open for submissions (Status: ${targetCompetition.status}).` });
        }

        // --- New Submission Eligibility Logic ---
        let isEligible = false;
        let rejectionReason = 'Submission restricted due to eligibility rules.';

        if (submitterRole === 'Admin') { // Admins can submit to any for testing
            isEligible = true;
        } else if (submitterRole === 'Individual') {
            if (targetCompetition.competitionType === 'Standard') {
                isEligible = true;
            } else { 
                rejectionReason = `As an 'Individual' user, you cannot submit to 'Business' type competitions. This competition is type: '${targetCompetition.competitionType}'.`;
            }
        } else if (submitterRole === 'Business') {
            if (targetCompetition.competitionType === 'Business') {
                isEligible = true;
            } else { 
                rejectionReason = `As a 'Business' user, you can only submit to 'Business' type competitions. This competition is type: '${targetCompetition.competitionType}'.`;
            }
        } else {
            rejectionReason = `Your user role (${submitterRole}) is not recognized for standard submission eligibility checks.`;
        }
        // --- End New Submission Eligibility Logic ---

        if (!isEligible) {
            cleanupFilesOnError(files);
            return res.status(403).json({ message: rejectionReason });
        }

        const existingSubmission = await Submission.findOne({ competitionId: targetCompetition._id, userId: userId });
        if (existingSubmission) {
             cleanupFilesOnError(files);
             return res.status(400).json({ message: 'You have already submitted to this competition.' });
        }

        const fileUrls = files.map(file => `/${UPLOADS_DIR}/${file.filename}`);
        const newSubmission = new Submission({
            competitionId: targetCompetition._id, userId, username,
            entryTitle: entryTitle.trim(), description: description.trim(), fileUrls
        });
        const savedSubmission = await newSubmission.save();
        await Competition.findByIdAndUpdate(targetCompetition._id, { $addToSet: { submissions: savedSubmission._id } });
        res.status(201).json({ message: 'Submission created!', submission: savedSubmission });

    } catch (error) {
        console.error("Error during submission:", error);
        cleanupFilesOnError(files);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        if (error.name === 'CastError' && !res.headersSent) return res.status(400).json({ message: `Invalid ID format.` });
        if (!res.headersSent) res.status(500).json({ message: 'Server error saving submission.' });
    }
});

// --- Vote on Submission Route ---
app.post('/api/submissions/:submissionId/vote', authenticateToken, async (req, res) => {
    // *** UPDATED with new voting eligibility logic ***
    const { submissionId } = req.params;
    const { userId, role: voterRole } = req.user; // voterRole is key

    if (!mongoose.Types.ObjectId.isValid(submissionId)) return res.status(400).json({ message: 'Invalid submission ID.' });

    try {
        // Populate competitionId with status AND competitionType
        const submission = await Submission.findById(submissionId)
            .populate({ 
                path: 'competitionId', 
                select: 'status _id competitionType' // Ensure competitionType is selected
            });

        if (!submission) return res.status(404).json({ message: 'Submission not found.' });
        if (!submission.competitionId || !submission.competitionId.status || !submission.competitionId.competitionType) {
            return res.status(500).json({ message: 'Server error: Could not verify competition details for voting.' });
        }
        
        if (submission.competitionId.status !== 'voting') {
            return res.status(403).json({ message: `Voting not allowed (Competition Status: ${submission.competitionId.status}).` });
        }

        // --- New Voting Eligibility Logic ---
        const competitionTypeOfSubmission = submission.competitionId.competitionType;
        let canVote = false;
        let voteRejectionReason = 'Voting restricted due to eligibility rules.';

        if (voterRole === 'Admin') { // Admins can vote for testing
            canVote = true;
        } else if (voterRole === 'Individual') { // Individuals can vote on any type
            canVote = true;
        } else if (voterRole === 'Business') {
            if (competitionTypeOfSubmission === 'Business') {
                canVote = true;
            } else { 
                voteRejectionReason = `As a 'Business' user, you can only vote on 'Business' type competitions. This submission is in a '${competitionTypeOfSubmission}' type competition.`;
            }
        } else {
            voteRejectionReason = `Your user role (${voterRole}) is not permitted to vote.`;
        }

        if (!canVote) {
            return res.status(403).json({ message: voteRejectionReason });
        }
        // --- End New Voting Eligibility Logic ---

        const alreadyVoted = submission.votedByUsers.some(voterId => voterId.equals(userId));
        if (alreadyVoted) return res.status(409).json({ message: 'You have already voted for this submission.' });

        const updatedSubmission = await Submission.findByIdAndUpdate(submissionId,
            { $addToSet: { votedByUsers: userId }, $inc: { voteCount: 1 } },
            { new: true }
        );
        if (!updatedSubmission) return res.status(404).json({ message: 'Submission not found during vote update.' });
        res.status(200).json({ message: 'Vote recorded!', newVoteCount: updatedSubmission.voteCount, submission: updatedSubmission }); // Return updated submission for clarity
    } catch (error) {
        console.error("Vote Error:", error);
         if (error.name === 'CastError') return res.status(500).json({ message: 'Error retrieving competition data for voting.' });
        res.status(500).json({ message: 'Server error processing vote.' });
    }
});

// --- Global Error Handling Middleware ---
app.use((err, req, res, next) => {
    // ... (Global error handler - no changes)
    console.error("Global Error Handler Caught:", err.stack || err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: `File too large. Max ${BACKEND_MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` });
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    }
    if (err.message?.startsWith('File type not allowed')) return res.status(400).json({ message: err.message });
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
    }
    if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ID format for field: ${err.path}` });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid authentication token.' });
    if (err.status) return res.status(err.status).json({ message: err.message });
    if (!res.headersSent) res.status(500).json({ message: 'Unexpected server error.' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});