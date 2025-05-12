// backend/controllers/competitionController.js
// --- Full Replacement Code (Integrate createCompetition changes carefully) ---
// --- Modified createCompetition to handle 'category' ---
// --- Added category population to get routes ---

const asyncHandler = require('express-async-handler');
const Competition = require('../models/Competition');
const User = require('../models/User'); // Assuming needed for other functions
const Submission = require('../models/Submission'); // Assuming needed for other functions
// *** NEW: Import Category model ***
const Category = require('../models/Category'); // Make sure this path is correct
const generateShortId = require('../utils/generateShortId'); // Make sure this utility exists and path is correct

// @desc    Fetch all competitions (consider pagination later)
// @route   GET /api/competitions
// @access  Public (or Private depending on your app)
const getAllCompetitions = asyncHandler(async (req, res) => {
    const competitions = await Competition.find({})
        .populate('createdBy', 'username')
        .populate('category', 'name') // *** Populate category name ***
        .sort({ createdAt: -1 });

    res.json(competitions);
});

// @desc    Fetch a single competition by ID or shortId
// @route   GET /api/competitions/:idOrShortId
// @access  Public (or Private)
const getCompetitionById = asyncHandler(async (req, res) => {
    const idOrShortId = req.params.idOrShortId;
    let competition;

    // Define population options
    const populateSubmissionsConfig = {
        path: 'submissions', model: 'Submission', select: '-__v -competitionId',
        populate: { path: 'userId', model: 'User', select: 'username _id role' },
        options: { sort: { voteCount: -1 } }
    };
    const populateCreatorConfig = { path: 'createdBy', model: 'User', select: 'username role _id' };
    const populateCategoryConfig = { path: 'category', model: 'Category', select: 'name _id' }; // Populate category

    // Check if it looks like a MongoDB ObjectId, otherwise assume shortId
    if (idOrShortId.match(/^[0-9a-fA-F]{24}$/)) {
        competition = await Competition.findById(idOrShortId)
            .select('+competitionType') // Ensure competitionType is selected if needed
            .populate(populateSubmissionsConfig)
            .populate(populateCreatorConfig)
            .populate(populateCategoryConfig); // Add category populate
    } else {
        competition = await Competition.findOne({ shortId: idOrShortId })
            .select('+competitionType') // Ensure competitionType is selected if needed
            .populate(populateSubmissionsConfig)
            .populate(populateCreatorConfig)
            .populate(populateCategoryConfig); // Add category populate
    }

    if (!competition) {
        res.status(404);
        throw new Error('Competition not found');
    }

    res.json(competition);
});


// @desc    Create a new competition
// @route   POST /api/competitions
// @access  Private (Business or Admin - check in route or here)
const createCompetition = asyncHandler(async (req, res) => {
    // Destructure fields from request body - including 'category'
    const { title, description, endDate, shortId: userShortId, competitionType, category } = req.body;

    // Basic validation - check for category
    if (!title || !description || !endDate || !category) {
        res.status(400);
        throw new Error('Please provide title, description, end date, and category.');
    }

    // Validate Category ID exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        res.status(400);
        throw new Error('Invalid Category selected.');
    }

    // Generate unique shortId based on user input or title
    const baseId = userShortId?.trim() || title;
    if (!baseId) {
         res.status(400);
         throw new Error('Short ID or Title is required to generate competition URL.');
    }
    // Ensure generateShortId utility handles uniqueness checks against the DB
    const uniqueShortId = await generateShortId(baseId);

    // Determine competition type based on user role
    let finalCompetitionType = 'Standard'; // Default
    // Make sure req.user is populated by your auth middleware
    if (!req.user || !req.user.role) {
        res.status(401); // Unauthorized or middleware issue
        throw new Error('User authentication or role data missing.');
    }
    if (req.user.role === 'Business') {
        finalCompetitionType = 'Business';
    } else if (req.user.role === 'Admin' && competitionType) {
        if (['Standard', 'Business'].includes(competitionType)) {
            finalCompetitionType = competitionType;
        } else {
             res.status(400);
             throw new Error('Invalid competition type provided by Admin.');
        }
    } else if (req.user.role !== 'Admin') {
        // If not Business and not Admin (e.g., Individual), they shouldn't reach here if route is protected,
        // but double-check authorization logic.
        res.status(403);
        throw new Error('User role not authorized to create this type of competition.');
    }


    // Create competition object - include 'category'
    const competition = new Competition({
        title: title.trim(),
        description: description.trim(),
        endDate,
        shortId: uniqueShortId,
        status: 'open', // Or 'upcoming' etc. - Consider making this configurable?
        createdBy: req.user.userId, // Assuming your auth middleware adds req.user.userId
        competitionType: finalCompetitionType,
        category: category, // Assign the validated category ID
    });

    const createdCompetition = await competition.save();

    // Populate details before sending response
    await createdCompetition.populate('createdBy', 'username email'); // Populate creator details
    await createdCompetition.populate('category', 'name'); // Populate category name

    console.log("Competition created:", createdCompetition);
    res.status(201).json(createdCompetition);
});


// @desc    Update a competition
// @route   PUT /api/competitions/:idOrShortId (Using param that matches getCompetitionById)
// @access  Private (Creator or Admin)
const updateCompetition = asyncHandler(async (req, res) => {
    const idOrShortId = req.params.idOrShortId; // Match parameter name if possible
    const { title, description, endDate, status /* , category */ } = req.body; // Add category later if needed

    // Find the competition first
    let competition;
     if (idOrShortId.match(/^[0-9a-fA-F]{24}$/)) {
        competition = await Competition.findById(idOrShortId);
    } else {
        competition = await Competition.findOne({ shortId: idOrShortId });
    }

    if (!competition) {
        res.status(404);
        throw new Error('Competition not found');
    }

    // Authorization check: Ensure user is creator or admin
    // Ensure req.user is populated by auth middleware
     if (!req.user || !req.user.userId || !req.user.role) {
        res.status(401); throw new Error('User authentication data missing.');
    }
    const isCreator = competition.createdBy.toString() === req.user.userId.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isCreator && !isAdmin) {
        res.status(403); // Forbidden
        throw new Error('User not authorized to update this competition');
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;
    // Add category update logic here later if needed, including validation

    // Validate update data
    if (updateData.title === '') { res.status(400); throw new Error('Title cannot be empty.'); }
    if (updateData.description === '') { res.status(400); throw new Error('Description cannot be empty.'); }
    if (updateData.endDate) {
        if (isNaN(new Date(updateData.endDate).getTime())) {
            res.status(400); throw new Error('Invalid end date format.');
        }
        // Add future date check if status is not closed/voting
        const finalStatus = updateData.status || competition.status;
        if (new Date(updateData.endDate) < new Date().setHours(0,0,0,0) && finalStatus !== 'closed' && finalStatus !== 'voting') {
             res.status(400); throw new Error("End Date must be today or in the future unless status is 'closed' or 'voting'.");
        }
    }
    if (updateData.status) {
        if (!Competition.schema.path('status').enumValues.includes(updateData.status)) {
            res.status(400); throw new Error('Invalid status value provided.');
        }
    }
     // Add category validation if editing category

    // Prevent Business users changing type away from Business (if applicable)
    if (isCreator && req.user.role === 'Business' && competition.competitionType === 'Business') {
         // You might prevent updating 'competitionType' altogether for non-admins here
         // or specifically check if they try to change it.
         // delete updateData.competitionType; // Example: Prevent business user from changing type
    }

    // Check for title collision if title is being changed
    if (updateData.title && updateData.title !== competition.title) {
        const existingByTitle = await Competition.findOne({ title: updateData.title, _id: { $ne: competition._id } });
        if (existingByTitle) { res.status(409); throw new Error(`The title "${updateData.title}" is already used.`); }
    }

    // Apply updates using findByIdAndUpdate for atomicity if possible, or save()
    const updatedCompetition = await Competition.findByIdAndUpdate(competition._id, { $set: updateData }, { new: true, runValidators: true })
        .populate('createdBy', 'username email') // Populate details before sending response
        .populate('category', 'name');

    res.json(updatedCompetition);
});


// @desc    Delete a competition (handle cascade deletion carefully)
// @route   DELETE /api/competitions/:idOrShortId
// @access  Private (Creator or Admin)
const deleteCompetition = asyncHandler(async (req, res) => {
    const idOrShortId = req.params.idOrShortId;

    // Find the competition first
    let competition;
     if (idOrShortId.match(/^[0-9a-fA-F]{24}$/)) {
        competition = await Competition.findById(idOrShortId);
    } else {
        competition = await Competition.findOne({ shortId: idOrShortId });
    }

    if (!competition) {
        res.status(404);
        throw new Error('Competition not found');
    }

    // Authorization check: Ensure user is creator or admin
    if (!req.user || !req.user.userId || !req.user.role) {
        res.status(401); throw new Error('User authentication data missing.');
    }
    const isCreator = competition.createdBy.toString() === req.user.userId.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isCreator && !isAdmin) {
        res.status(403); // Forbidden
        throw new Error('User not authorized to delete this competition');
    }

    // --- Cascade Delete Logic ---
    console.log(`Attempting cascade delete for competition: ${competition._id}`);
    // 1. Delete associated submissions
    const submissionsToDelete = await Submission.find({ competitionId: competition._id });
    console.log(` Found ${submissionsToDelete.length} submissions to delete.`);
    for (const sub of submissionsToDelete) {
        // TODO: Delete associated files from storage (S3, Vercel Blob, etc.)
        // This depends heavily on your file storage implementation.
        // Example for local files (adjust getFilePathForDeletion):
        // if (sub.fileUrls && sub.fileUrls.length > 0) {
        //     sub.fileUrls.forEach(url => cleanupUploadedFile(getFilePathForDeletion(url)));
        // }
    }
    await Submission.deleteMany({ competitionId: competition._id });
    console.log(` Deleted submissions for competition ${competition._id}.`);

    // 2. Delete the competition itself
    await Competition.deleteOne({ _id: competition._id }); // Use deleteOne
    console.log(` Deleted competition document ${competition._id}.`);

    res.json({ message: 'Competition and associated submissions deleted successfully.' });
});


// Export all controller functions
module.exports = {
    getAllCompetitions,
    getCompetitionById,
    createCompetition,
    updateCompetition,
    deleteCompetition,
    // Add other functions if you have them
};