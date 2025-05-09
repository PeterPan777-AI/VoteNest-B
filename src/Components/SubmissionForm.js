// D:\AQWENAPPS\APPPROJECT\VOTE-NEST-FIXED\frontend\src\Components\SubmissionForm.js
// --- Updated File Content ---
// --- Improved User Feedback for Eligibility ---

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../Context/AuthContext';
import './SubmissionForm.css';

function SubmissionForm() {
    const { competitionId } = useParams();
    const { user, token, isLoggedIn, isLoading: authIsLoading } = useAuth();
    const navigate = useNavigate();

    const [competition, setCompetition] = useState(null);
    const [isLoadingCompetition, setIsLoadingCompetition] = useState(true);
    const [fetchErrorCompetition, setFetchErrorCompetition] = useState(null);

    // State for eligibility check
    const [canSubmit, setCanSubmit] = useState(false); // Is the user allowed to submit to this competition?
    const [eligibilityReason, setEligibilityReason] = useState(''); // Reason if not eligible
    const [accessChecked, setAccessChecked] = useState(false); // Has the check completed?

    const [entryTitle, setEntryTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [fileError, setFileError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // --- Constants ---
    const MAX_FILES = 5;
    const VIDEO_MAX_SIZE_MB = 300;
    const OTHER_MAX_SIZE_MB = 100;
    const VIDEO_MAX_SIZE_BYTES = VIDEO_MAX_SIZE_MB * 1024 * 1024;
    const OTHER_MAX_SIZE_BYTES = OTHER_MAX_SIZE_MB * 1024 * 1024;
    const MAX_FILE_SIZE_MB = VIDEO_MAX_SIZE_MB;
    const MAX_FILE_SIZE_BYTES = VIDEO_MAX_SIZE_BYTES;
    const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const ALLOWED_MIMETYPES_MAP = {
        'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'], 'image/gif': ['.gif'],
        'image/webp': ['.webp'], 'application/pdf': ['.pdf'], 'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'text/plain': ['.txt'], 'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'], 'audio/ogg': ['.ogg'],
        'audio/mp4': ['.m4a'], 'audio/aac': [], 'video/mp4': ['.mp4'], 'video/x-msvideo': ['.avi'],
        'video/quicktime': ['.mov'], 'video/x-matroska': ['.mkv'], 'video/webm': ['.webm']
    };

    // --- Effect to Load Competition Data ---
    useEffect(() => {
        console.log(`SubmissionForm: useEffect - Fetching competition details for ID: ${competitionId}`);
        setIsLoadingCompetition(true);
        setFetchErrorCompetition(null); setAccessChecked(false); setCompetition(null);
        setCanSubmit(false); setEligibilityReason(''); // Reset eligibility on new competition load

        const fetchCompetitionData = async () => {
            try {
                const response = await fetch(`/api/competitions/${competitionId}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
                console.log("SubmissionForm: Competition data fetched:", data);
                setCompetition(data); setFetchErrorCompetition(null);
            } catch (error) {
                console.error("SubmissionForm: Error fetching competition:", error);
                setFetchErrorCompetition(error.message || 'Failed to load competition details.'); setCompetition(null);
            } finally { setIsLoadingCompetition(false); }
        };
        fetchCompetitionData();
    }, [competitionId]);

    // --- Effect to Check Access Rights (REFINED REASONING) ---
    useEffect(() => {
        console.log(`SubmissionForm: useEffect - Checking access. Auth Loading: ${authIsLoading}, Comp Loading: ${isLoadingCompetition}`);
        if (authIsLoading || isLoadingCompetition) {
            setAccessChecked(false); // Still loading, access not determined yet
            return;
        }

        let isEligible = false;
        let reason = '';

        if (fetchErrorCompetition) {
            isEligible = false;
            reason = 'Error loading competition details.';
        } else if (!competition) {
             isEligible = false;
             reason = 'Competition data not available.';
        } else if (!isLoggedIn || !user) {
            isEligible = false;
            reason = 'You must be logged in to submit.';
        } else if (competition.status !== 'open') {
            isEligible = false;
            reason = `This competition is not currently open (Status: ${competition.status}).`;
        } else if (competition.isBusinessOnly && user.role !== 'Business') {
            isEligible = false;
            reason = `Only Business accounts can submit to this competition. Your role is '${user.role}'.`;
        } else {
            // All checks passed
            isEligible = true;
            reason = ''; // No reason needed if eligible
        }

        console.log(`SubmissionForm: Final Eligibility: ${isEligible}, Reason: "${reason}"`);
        setCanSubmit(isEligible);
        setEligibilityReason(reason);
        setAccessChecked(true); // Mark check as complete

    }, [authIsLoading, isLoadingCompetition, fetchErrorCompetition, user, isLoggedIn, competition]); // Dependencies


    // --- Input Handlers ---
    const handleTitleChange = (event) => setEntryTitle(event.target.value);
    const handleDescriptionChange = (event) => setDescription(event.target.value);

    // --- react-dropzone onDrop Callback (MODIFIED for specific limits) ---
    const onDrop = useCallback((acceptedFiles, fileRejections) => {
        setFileError(null); // Clear previous errors
        console.log("Dropzone: Initial processing - Accepted (by Dropzone):", acceptedFiles.length, "Rejected (by Dropzone):", fileRejections.length);

        let currentErrors = []; // Collect errors from THIS batch
        let filesToAdd = [];      // Collect files passing ALL checks

        // 1. Process initial rejections from useDropzone (wrong type, > MAX_FILE_SIZE_BYTES)
        if (fileRejections.length > 0) {
            console.log("--- Dropzone Rejections (Initial) ---");
            fileRejections.forEach(({ file, errors }) => {
                console.log(`  File: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
                errors.forEach(err => {
                    console.log(`    Error code: ${err.code}, Message: ${err.message}`);
                    if (err.code === 'file-too-large') {
                        currentErrors.push(`Error: ${file.name} exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`);
                    } else if (err.code === 'file-invalid-type') {
                        currentErrors.push(`Error: ${file.name} has an unsupported file type.`);
                    } else {
                        currentErrors.push(`Error with ${file.name}: ${err.message}`);
                    }
                });
            });
            console.log("-------------------------------------");
        }

        // 2. Process files initially accepted by useDropzone (type ok, size <= MAX_FILE_SIZE_BYTES)
        //    Apply OUR specific size logic here.
        if (acceptedFiles.length > 0) {
            console.log("--- Processing Accepted Files (Applying Specific Limits) ---");
            acceptedFiles.forEach(file => {
                console.log(`  Checking file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB), Type: ${file.type}`);
                const isVideo = file.type.startsWith('video/');
                const currentFileLimitMB = isVideo ? VIDEO_MAX_SIZE_MB : OTHER_MAX_SIZE_MB;
                const currentFileLimitBytes = isVideo ? VIDEO_MAX_SIZE_BYTES : OTHER_MAX_SIZE_BYTES;

                if (file.size > currentFileLimitBytes) {
                    console.log(`    -> REJECTED (Specific Limit): Exceeds ${currentFileLimitMB}MB for its type.`);
                    currentErrors.push(`Error: ${file.name} (${isVideo ? 'Video' : 'Non-Video'}) exceeds its limit of ${currentFileLimitMB}MB.`);
                } else {
                    const isDuplicate = selectedFiles.some(existingFile =>
                        existingFile.name === file.name && existingFile.size === file.size
                    );
                    if (isDuplicate) {
                         console.log(`    -> Skipping ${file.name} (duplicate found in current list).`);
                    } else {
                        if (selectedFiles.length + filesToAdd.length < MAX_FILES) {
                            filesToAdd.push(file);
                            console.log(`    -> OK: Adding ${file.name} to the queue.`);
                        } else {
                             console.log(`    -> Skipping ${file.name} (would exceed max ${MAX_FILES} files).`);
                             if (!currentErrors.some(e => e.includes('Maximum'))) {
                                 currentErrors.push(`Cannot add more files. Maximum of ${MAX_FILES} files allowed.`);
                             }
                        }
                    }
                }
            });
            console.log("----------------------------------------------------------");
        }

        // 3. Update state
        if (currentErrors.length > 0) {
            setFileError(currentErrors.join(' '));
        }
        if (filesToAdd.length > 0) {
            setSelectedFiles(prevFiles => {
                const updatedFiles = [...prevFiles, ...filesToAdd];
                console.log("SubmissionForm: Updating selectedFiles state. New count:", updatedFiles.length);
                return updatedFiles;
            });
        }

    }, [selectedFiles, MAX_FILES, MAX_FILE_SIZE_MB, VIDEO_MAX_SIZE_MB, OTHER_MAX_SIZE_MB, VIDEO_MAX_SIZE_BYTES, OTHER_MAX_SIZE_BYTES]);


    // --- Configure useDropzone hook ---
    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject
    } = useDropzone({
        onDrop,
        accept: ALLOWED_MIMETYPES_MAP,
        maxSize: MAX_FILE_SIZE_BYTES,
        disabled: isSubmitting || selectedFiles.length >= MAX_FILES || !canSubmit, // Disable dropzone if not eligible
        multiple: true
    });


    // --- Handler to remove a specific file ---
    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        setFileError(null); // Clear errors when a file is removed
    };


    // --- Submit Handler ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('SubmissionForm: handleSubmit called.');

        // Final client-side checks before attempting submission
        if (!accessChecked || !canSubmit) {
            console.log('SubmissionForm: Submit prevented - Eligibility check failed or pending.');
            setSubmitError(eligibilityReason || 'Submission not allowed. Please check competition rules and your login status.');
            return;
        }
        if (!entryTitle.trim() || !description.trim()) {
            console.log('SubmissionForm: Submit prevented - Title or Description missing.');
            setSubmitError("Title and Description are required.");
            return;
        }
        if (selectedFiles.length === 0) {
             console.log('SubmissionForm: Submit prevented - No files selected.');
             setFileError("Please add at least one file to upload."); // Use fileError state for this
             setSubmitError(null); // Clear general submit error
             return;
        }
         if (!!fileError) {
             console.log('SubmissionForm: Submit prevented - Active file error exists:', fileError);
             setSubmitError(null); // Clear general submit error, fileError is already shown
             return;
         }
        if (selectedFiles.length > MAX_FILES) {
             console.log('SubmissionForm: Submit prevented - Too many files selected.');
             setFileError(`Maximum ${MAX_FILES} files allowed. You have ${selectedFiles.length}.`);
             setSubmitError(null);
             return;
        }
        // Redundant check for token, but good practice
        if (!isLoggedIn || !user || !token) {
             console.log('SubmissionForm: Submit prevented - Authorization error (token/user missing).');
             setSubmitError('Authorization error. Please log in again.');
             return;
        }

        // Clear previous errors and set submitting state
        setSubmitError(null);
        setFileError(null); // Clear file errors before attempting upload
        setIsSubmitting(true);
        setSuccessMessage('');
        console.log('SubmissionForm: Attempting to submit entry with files...');

        const formData = new FormData();
        formData.append('entryTitle', entryTitle);
        formData.append('description', description);
        selectedFiles.forEach((file) => {
            formData.append('submissionFiles', file, file.name);
        });

        console.log(`SubmissionForm: FormData prepared. Title: ${formData.get('entryTitle')}, Files: ${selectedFiles.length}`);
        console.log(`SubmissionForm: Target URL: /api/competitions/${competitionId}/submissions`);

        try {
            const response = await fetch(`/api/competitions/${competitionId}/submissions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json(); // Attempt to parse JSON regardless of status

            if (!response.ok) {
                 // Log the detailed error from backend if available
                console.error(`SubmissionForm: API submission failed (${response.status}):`, result);
                // Use the message from the backend JSON response if possible
                throw new Error(result.message || `Submission failed with status: ${response.status}`);
            }

            console.log('SubmissionForm: Submission successful!', result);
            setSuccessMessage(`Entry "${entryTitle}" submitted successfully! Redirecting...`);
            setEntryTitle('');
            setDescription('');
            setSelectedFiles([]);
            setTimeout(() => { navigate(`/competitions/${competitionId}`); }, 2000);

        } catch (error) {
            console.error('SubmissionForm: Error during submission process:', error);
            // Display the specific error message caught (either from backend or fetch itself)
            setSubmitError(error.message || 'An unexpected error occurred during submission.');
        } finally {
            setIsSubmitting(false); // Ensure submitting state is reset
        }
    };

    // --- Render Logic ---

    // 1. Initial Loading States
    if (authIsLoading || (isLoadingCompetition && !competition && !fetchErrorCompetition)) {
        return <div className="submission-loading">Loading form details...</div>;
    }

    // 2. Competition Fetch Error
    if (fetchErrorCompetition) {
        return (
             <div className="submission-form-container submission-error">
                 <h2>Error Loading Competition</h2>
                 <p>{fetchErrorCompetition}</p>
                 <Link to="/competitions">Back to Competitions</Link>
             </div>
         );
    }

    // 3. Competition Not Found (after loading finished)
     if (!competition && !isLoadingCompetition) {
         return (
             <div className="submission-form-container submission-error">
                 <h2>Error</h2><p>Competition not found.</p>
                 <Link to="/competitions">Back to Competitions</Link>
             </div>
         );
     }

    // 4. Access Check Pending
    if (!accessChecked) {
        return <div className="submission-loading">Verifying access rights...</div>;
    }

    // 5. Access Denied (Eligibility check failed)
    if (!canSubmit) {
        return (
            <div className="submission-form-container submission-error">
                <h2>Access Denied</h2>
                <p>Cannot submit entry to "{competition?.title || 'this competition'}".</p>
                {/* Display the specific reason stored in state */}
                {eligibilityReason && <p><strong>Reason:</strong> {eligibilityReason}</p>}
                <div style={{ marginTop: '15px' }}>
                     <Link to={`/competitions/${competitionId}`}>View Competition Details</Link>
                     <span style={{ margin: '0 10px' }}>|</span>
                     <Link to="/competitions">Explore Other Competitions</Link>
                     {!isLoggedIn && <><span style={{ margin: '0 10px' }}>|</span><Link to="/login">Login</Link></>}
                 </div>
            </div>
        );
    }

    // 6. Eligible - Render the Form
    const constraintsText = `Accepted types: ${ALLOWED_EXTENSIONS.join(', ')}. Max ${MAX_FILES} files. Limits: Video up to ${VIDEO_MAX_SIZE_MB}MB, Others up to ${OTHER_MAX_SIZE_MB}MB.`;

    return (
        <div className="submission-form-container">
            <h1 className="submission-form-header">Submit Entry for: {competition.title}</h1>

            {/* Display messages */}
            {successMessage && <p className="submission-success-message">{successMessage}</p>}
            {/* Combine submit and file errors for clarity */}
            {(submitError || fileError) && (
                <p className="submission-error-message">
                    {submitError}{submitError && fileError ? <br /> : ''}{fileError}
                </p>
            )}


            {/* Hide form on success */}
            {!successMessage && (
                <form onSubmit={handleSubmit} className={`submission-form ${isSubmitting ? 'submitting' : ''}`}>
                    {/* Title Input */}
                    <div className="submission-form-group">
                        <label htmlFor="entryTitle" className="submission-label">Entry Title:</label>
                        <input type="text" id="entryTitle" value={entryTitle} onChange={handleTitleChange} required maxLength={100} disabled={isSubmitting} className="submission-input" />
                    </div>
                    {/* Description Input */}
                    <div className="submission-form-group">
                        <label htmlFor="description" className="submission-label">Description:</label>
                        <textarea id="description" value={description} onChange={handleDescriptionChange} required maxLength={1000} disabled={isSubmitting} className="submission-textarea" rows={5} />
                    </div>

                    {/* File Dropzone */}
                    <div className="submission-form-group">
                        <label className="submission-label" id="file-dropzone-label">
                            Files:
                        </label>
                        <p className="file-constraints-info">{constraintsText}</p>

                        <div
                            {...getRootProps({
                                className: `dropzone
                                    ${isDragActive ? 'active' : ''}
                                    ${isDragAccept ? 'accept' : ''}
                                    ${isDragReject ? 'reject' : ''}
                                    ${(isSubmitting || selectedFiles.length >= MAX_FILES || !canSubmit) ? 'disabled' : ''}` // Ensure disabled if !canSubmit
                            })}
                            aria-labelledby="file-dropzone-label"
                        >
                            <input {...getInputProps()} />
                             {isDragAccept ? <p>Drop the files here ...</p> :
                             isDragReject ? <p>Some files cannot be added (check type/size)</p> :
                             (selectedFiles.length >= MAX_FILES) ? <p>Maximum {MAX_FILES} files reached.</p> :
                             <p>Drag 'n' drop files here, or click to select</p>}
                        </div>

                        {/* Selected Files List */}
                        {selectedFiles.length > 0 && (
                            <div className="selected-files-list">
                                <strong>Selected Files ({selectedFiles.length}/{MAX_FILES}):</strong>
                                <ul>
                                    {selectedFiles.map((file, index) => (
                                        <li key={index}>
                                            <span>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                                            <button type="button" onClick={() => handleRemoveFile(index)} disabled={isSubmitting} title="Remove file">X</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                       type="submit"
                       disabled={isSubmitting || !canSubmit || !entryTitle || !description || selectedFiles.length === 0 || !!fileError || selectedFiles.length > MAX_FILES}
                       className="submission-button"
                       title={
                           // Provide helpful tooltips based on disabled state reason
                           isSubmitting ? "Submitting..." :
                           !canSubmit ? (eligibilityReason || "Submission not allowed") : // Show eligibility reason in tooltip
                           (!entryTitle || !description) ? "Please enter Title and Description." :
                           (selectedFiles.length === 0) ? "Please add at least one file." :
                           (!!fileError) ? "Please resolve the file error shown above." :
                           (selectedFiles.length > MAX_FILES) ? `Maximum ${MAX_FILES} files allowed.` :
                           "Submit your entry"
                       }
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                    </button>
                </form>
            )}

            {/* Cancel Link */}
            {!successMessage && (
                <Link to={`/competitions/${competitionId}`} style={{ display: 'block', marginTop: '20px' }}>Cancel</Link>
            )}
        </div>
    );
}

export default SubmissionForm;