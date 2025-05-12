// src/Components/AdminPanel.js
// --- FULL REPLACEMENT CODE ---
// --- Implemented User Deletion Frontend Logic ---
// --- *** ADDED: User Editing Frontend Logic (Modal, State, API Call) *** ---
// --- *** MODIFIED: handleDeleteUser to update competition state after cascade delete *** ---
// --- *** ADDED: Category Suggestion Fetching and Display Logic *** ---
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext'; // Adjust path if necessary
import EditUserModal from './EditUserModal'; // *** Import the modal component ***

// If your frontend (e.g., localhost:3000) and backend (localhost:5001) are on different origins,
// AND you DO NOT have a proxy in your frontend's package.json (e.g., "proxy": "http://localhost:5001"),
// then you MUST use the full base URL for your backend here.
// If you DO have a proxy, or they are on the same origin, an empty string '' or just '/' is fine.
const API_BASE_URL = ''; // Or 'http://localhost:5001' if needed, e.g., for non-proxied cross-origin requests

function AdminPanel() {
    const { user: currentUser, token, isLoading: authLoading } = useAuth();

    // State for Competitions
    const [competitions, setCompetitions] = useState([]);
    const [competitionsLoading, setCompetitionsLoading] = useState(true);
    const [competitionsError, setCompetitionsError] = useState(null);
    const [deletingCompetitionId, setDeletingCompetitionId] = useState(null);

    // State for Users
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState(null);
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // *** NEW: State for Category Suggestions ***
    const [categorySuggestions, setCategorySuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(true);
    const [suggestionsError, setSuggestionsError] = useState(null);
    const [processingSuggestionId, setProcessingSuggestionId] = useState(null); // Loading indicator
    const [processedSuggestions, setProcessedSuggestions] = useState({}); // Track processed ones

    // Combined Loading State
    const isLoading = authLoading || competitionsLoading || usersLoading;

    // --- Fetch Competitions ---
    const fetchAllCompetitions = useCallback(async () => {
        if (!token || authLoading) {
            if (!authLoading && !token) {
                setCompetitionsError("Authentication token not found. Cannot fetch admin data.");
                setCompetitionsLoading(false);
            }
            return;
        }
        setCompetitionsLoading(true);
        setCompetitionsError(null);
        console.log("AdminPanel: Fetching all competitions...");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/api/competitions`, config);
            console.log("AdminPanel: Competitions API response received:", response.data);
            if (Array.isArray(response.data)) {
                const sortedCompetitions = response.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                const competitionsWithCreatorInfo = sortedCompetitions.map(comp => ({
                    ...comp,
                    createdBy: comp.createdBy || null
                }));
                setCompetitions(competitionsWithCreatorInfo);
            } else {
                console.error("AdminPanel: Competitions API did not return an array:", response.data);
                setCompetitionsError("Failed to load competitions: Invalid data format from server.");
                setCompetitions([]);
            }
        } catch (err) {
            console.error("AdminPanel: Error fetching competitions:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Could not fetch competitions.';
            if (err.response?.status === 401 || err.response?.status === 403) {
                setCompetitionsError(`Authorization error: ${errorMsg}. Please log in again.`);
            } else {
                setCompetitionsError(errorMsg);
            }
            setCompetitions([]);
        } finally {
            setCompetitionsLoading(false);
            console.log("AdminPanel: Competition fetching complete.");
        }
    }, [token, authLoading]);

    // --- Fetch Users ---
    const fetchAllUsers = useCallback(async () => {
        if (!token || authLoading) {
            if (!authLoading && !token) {
                setUsersError("Authentication token not found. Cannot fetch user data.");
                setUsersLoading(false);
            }
            return;
        }
        setUsersLoading(true);
        setUsersError(null);
        console.log("AdminPanel: Fetching all users...");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/api/admin/users`, config);
            console.log("AdminPanel: Users API response received:", response.data);
            if (Array.isArray(response.data)) {
                const sortedUsers = response.data.sort((a, b) =>
                    (a.username || '').localeCompare(b.username || '')
                );
                setUsers(sortedUsers);
            } else {
                console.error("AdminPanel: Users API did not return an array:", response.data);
                setUsersError("Failed to load users: Invalid data format from server.");
                setUsers([]);
            }
        } catch (err) {
            console.error("AdminPanel: Error fetching users:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Could not fetch users.';
            if (err.response?.status === 401 || err.response?.status === 403) {
                setUsersError(`Authorization error: ${errorMsg}. Please log in again.`);
            } else {
                setUsersError(errorMsg);
            }
            setUsers([]);
        } finally {
            setUsersLoading(false);
            console.log("AdminPanel: User fetching complete.");
        }
    }, [token, authLoading]);

    // *** NEW: Fetch Category Suggestions ***
    const fetchCategorySuggestions = useCallback(async () => {
        if (!token || authLoading) {
            if (!authLoading && !token) {
                setSuggestionsError("Authentication token not found. Cannot fetch category suggestions.");
                setSuggestionsLoading(false);
            }
            return;
        }
        setSuggestionsLoading(true);
        setSuggestionsError(null);
        console.log("AdminPanel: Fetching category suggestions...");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/api/category-suggestions/admin`, config);
            console.log("AdminPanel: Category suggestions API response received:", response.data);
            if (Array.isArray(response.data)) {
                const sortedSuggestions = response.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setCategorySuggestions(sortedSuggestions);
            } else {
                console.error("AdminPanel: Category suggestions API did not return an array:", response.data);
                setSuggestionsError("Failed to load suggestions: Invalid data format from server.");
                setCategorySuggestions([]);
            }
        } catch (err) {
            console.error("AdminPanel: Error fetching category suggestions:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Could not fetch category suggestions.';
            if (err.response?.status === 401 || err.response?.status === 403) {
                setSuggestionsError(`Authorization error: ${errorMsg}. Please log in again.`);
            } else {
                setSuggestionsError(errorMsg);
            }
            setCategorySuggestions([]);
        } finally {
            setSuggestionsLoading(false);
            console.log("AdminPanel: Category suggestion fetching complete.");
        }
    }, [token, authLoading]);

    // --- Effect to Fetch Data ---
    useEffect(() => {
        if (!authLoading && currentUser && currentUser.role === 'Admin') {
            fetchAllCompetitions();
            fetchAllUsers();
            fetchCategorySuggestions(); // Fetch suggestions
        } else if (!authLoading && (!currentUser || currentUser.role !== 'Admin')) {
            setCompetitions([]);
            setUsers([]);
            setCategorySuggestions([]);
            const authErrorMsg = "User is not authorized to view admin data.";
            setCompetitionsError(authErrorMsg);
            setUsersError(authErrorMsg);
            setSuggestionsError(authErrorMsg);
        }
    }, [authLoading, currentUser, fetchAllCompetitions, fetchAllUsers, fetchCategorySuggestions]);

    // --- Delete Competition Handler ---
    const handleDeleteCompetition = useCallback(async (competitionId, competitionTitle) => {
        if (!token) {
            setCompetitionsError("Authentication error. Cannot delete.");
            return;
        }
        if (deletingCompetitionId || deletingUserId || updatingUserId) return;
        const confirmDelete = window.confirm(
            `ADMIN ACTION:
Are you sure you want to permanently delete the competition "${competitionTitle}"?
This will also delete all its submissions and associated files.
This action CANNOT be undone.`
        );
        if (confirmDelete) {
            setDeletingCompetitionId(competitionId);
            setCompetitionsError(null);
            console.log(`AdminPanel: Attempting to delete competition: ${competitionId}`);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`${API_BASE_URL}/api/competitions/${competitionId}`, config);
                console.log(`AdminPanel: Competition ${competitionId} deleted successfully.`);
                setCompetitions(prevCompetitions =>
                    prevCompetitions.filter(comp => comp._id !== competitionId)
                );
                alert(`Competition "${competitionTitle}" and its submissions/files deleted successfully by Admin.`);
            } catch (err) {
                console.error(`AdminPanel: Error deleting competition ${competitionId}:`, err);
                const errorMsg = err.response?.data?.message || 'Failed to delete competition.';
                setCompetitionsError(errorMsg);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setCompetitionsError(`${errorMsg} Please try logging in again.`);
                }
                alert(`Error deleting competition: ${errorMsg}`)
            } finally {
                setDeletingCompetitionId(null);
            }
        } else {
            console.log("AdminPanel: Competition deletion cancelled by user.");
        }
    }, [token, deletingCompetitionId, deletingUserId, updatingUserId]);

    // --- Delete User Handler ---
    const handleDeleteUser = useCallback(async (userIdToDelete, username) => {
        if (!token) {
            setUsersError("Authentication error. Cannot delete user.");
            alert("Authentication error. Cannot delete user.");
            return;
        }
        if (deletingUserId || updatingUserId || deletingCompetitionId) return;
        if (currentUser && currentUser._id === userIdToDelete) {
            alert("Error: Cannot delete your own administrator account from the UI.");
            return;
        }
        const confirmDelete = window.confirm(
            `ADMIN ACTION: Are you sure you want to permanently delete user '${username}'?
This will ALSO DELETE all competitions and submissions created by this user, along with their files.
This action CANNOT be undone.`
        );
        if (confirmDelete) {
            setDeletingUserId(userIdToDelete);
            setUsersError(null);
            console.log(`AdminPanel: Attempting to delete user: ${userIdToDelete} (${username})`);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`${API_BASE_URL}/api/admin/users/${userIdToDelete}`, config);
                console.log(`AdminPanel: User ${userIdToDelete} deleted successfully via API (backend cascade initiated).`);
                setUsers(prevUsers =>
                    prevUsers.filter(user => user._id !== userIdToDelete)
                );
                setCompetitions(prevCompetitions =>
                    prevCompetitions.filter(comp => comp.createdBy?._id !== userIdToDelete)
                );
                alert(`User '${username}' and their associated content (competitions, submissions, files) deleted successfully.`);
            } catch (err) {
                console.error(`AdminPanel: Error deleting user ${userIdToDelete}:`, err);
                const errorMsg = err.response?.data?.message || 'Failed to delete user.';
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setUsersError(`Authorization error: ${errorMsg}. Please log in again.`);
                } else if (err.response?.status === 404) {
                    setUsersError(`User not found on server (perhaps already deleted?). ${errorMsg}`);
                } else {
                    setUsersError(errorMsg);
                }
                alert(`Error deleting user '${username}': ${errorMsg}`);
            } finally {
                setDeletingUserId(null);
                console.log(`AdminPanel: User deletion process finished for ${userIdToDelete}.`);
            }
        } else {
            console.log(`AdminPanel: User deletion cancelled for ${username}.`);
        }
    }, [token, deletingUserId, updatingUserId, deletingCompetitionId, currentUser]);

    // --- Handlers for Edit User Modal ---
    const handleOpenEditModal = useCallback((user) => {
        if (deletingUserId || updatingUserId || deletingCompetitionId) return;
        console.log("AdminPanel: Opening edit modal for user:", user);
        setEditingUser(user);
        setIsEditModalOpen(true);
        setUsersError(null);
    }, [deletingUserId, updatingUserId, deletingCompetitionId]);

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setEditingUser(null);
    }, []);

    // --- Handler to Save User Role Changes ---
    const handleSaveUserRole = useCallback(async (userIdToUpdate, newRole) => {
        if (!token) {
            setUsersError("Authentication error. Cannot update user role.");
            alert("Authentication error. Cannot update user role.");
            return;
        }
        if (editingUser && editingUser.role === newRole) {
            console.log("AdminPanel: Role hasn't changed. Closing modal.");
            handleCloseEditModal();
            return;
        }
        console.log(`AdminPanel: Attempting to update user ${userIdToUpdate} role to ${newRole}`);
        setUpdatingUserId(userIdToUpdate);
        setUsersError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { role: newRole };
            const response = await axios.put(`${API_BASE_URL}/api/admin/users/${userIdToUpdate}`, payload, config);
            console.log(`AdminPanel: User role updated successfully via API for user ${userIdToUpdate}. Response:`, response.data);
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === userIdToUpdate
                        ? { ...user, role: newRole }
                        : user
                )
            );
            alert(response.data.message || `User role updated successfully to '${newRole}'.`);
            handleCloseEditModal();
        } catch (err) {
            console.error(`AdminPanel: Error updating role for user ${userIdToUpdate}:`, err);
            const errorMsg = err.response?.data?.message || 'Failed to update user role.';
            if (err.response?.status === 401 || err.response?.status === 403) {
                setUsersError(`Authorization error: ${errorMsg}. Please log in again.`);
            } else if (err.response?.status === 404) {
                setUsersError(`User not found on server (perhaps deleted?). ${errorMsg}`);
            } else {
                setUsersError(errorMsg);
            }
            alert(`Error updating user role: ${errorMsg}`);
        } finally {
            setUpdatingUserId(null);
            console.log(`AdminPanel: User role update process finished for ${userIdToUpdate}.`);
        }
    }, [token, editingUser, handleCloseEditModal]);

    // --- NEW: Approve / Reject Handlers ---

    const handleUpdateSuggestionStatus = useCallback(async (suggestionId, status) => {
        if (!token || !suggestionId) return;

        setProcessingSuggestionId(suggestionId);
        setSuggestionsError(null);

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(
                `${API_BASE_URL}/api/category-suggestions/admin/${suggestionId}`,
                { status },
                config
            );

            // Update UI
            setCategorySuggestions(prev =>
                prev.map(s =>
                    s._id === suggestionId ? response.data.suggestion : s
                )
            );

            setProcessedSuggestions(prev => ({
                ...prev,
                [suggestionId]: status
            }));

            alert(`Suggestion has been ${status.replace('_', ' ')}.`);

        } catch (err) {
            console.error(`Error updating suggestion ${suggestionId} to ${status}:`, err);
            const errorMsg = err.response?.data?.message || `Failed to ${status} suggestion`;
            setSuggestionsError(errorMsg);
            alert(`Error: ${errorMsg}`);
        } finally {
            setProcessingSuggestionId(null);
        }
    }, [token]);

    const handleApproveSuggestion = useCallback((suggestionId) => {
        handleUpdateSuggestionStatus(suggestionId, 'approved');
    }, [handleUpdateSuggestionStatus]);

    const handleRejectSuggestion = useCallback((suggestionId) => {
        handleUpdateSuggestionStatus(suggestionId, 'rejected');
    }, [handleUpdateSuggestionStatus]);

    // --- Render Logic ---
    if (isLoading && !currentUser) {
        return <div style={{ padding: '20px' }}>Loading Admin Panel data...</div>;
    }

    if (!authLoading && !currentUser) {
        return <div style={{ padding: '20px', color: 'red' }}>Access Denied. Please log in as an Administrator.</div>;
    }

    if (!authLoading && currentUser && currentUser.role !== 'Admin') {
        return <div style={{ padding: '20px', color: 'red' }}>Forbidden. Administrator access required.</div>;
    }

    return (
        <div className="admin-panel-container" style={{ padding: '20px' }}>
            <h2>Admin Panel</h2>
            <p>Welcome, {currentUser?.username || 'Admin'}! (ID: {currentUser?._id})</p>
            <p>Manage system-wide settings and content.</p>

            {/* --- Competitions Section --- */}
            <section className="admin-section" style={{ marginTop: '30px', marginBottom: '40px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
                <h3>All Competitions ({competitions.length})</h3>
                {competitionsLoading && <p>Loading competitions...</p>}
                {competitionsError && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {competitionsError}</p>}
                {!competitionsLoading && !competitionsError && competitions.length === 0 && <p>No competitions found.</p>}
                {!competitionsLoading && competitions.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Title</th>
                                <th style={{ padding: '8px' }}>Status</th>
                                <th style={{ padding: '8px' }}>Creator</th>
                                <th style={{ padding: '8px' }}>Ends On</th>
                                <th style={{ padding: '8px' }}>Short ID</th>
                                <th style={{ padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>{competitions.map((comp) => (
                            <tr key={comp._id} style={{ borderBottom: '1px solid #eee', backgroundColor: deletingCompetitionId === comp._id ? '#ffe0e0' : 'transparent' }}>
                                <td style={{ padding: '8px' }}>{comp.title}</td>
                                <td style={{ padding: '8px', textTransform: 'capitalize' }}>{comp.status}</td>
                                <td style={{ padding: '8px' }}>{comp.createdBy?.username || comp.createdBy?._id || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>{new Date(comp.endDate).toLocaleDateString()}</td>
                                <td style={{ padding: '8px' }}>
                                    <Link to={`/competitions/${comp.shortId}`}>{comp.shortId}</Link>
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <Link to={`/competitions/${comp.shortId}/edit`} style={{ marginRight: '5px' }}>(Edit)</Link>
                                    <button
                                        onClick={() => handleDeleteCompetition(comp._id, comp.title)}
                                        disabled={deletingCompetitionId === comp._id || !!deletingCompetitionId || !!deletingUserId || !!updatingUserId}
                                        style={{ marginRight: '5px', color: 'red', cursor: (deletingCompetitionId === comp._id || !!deletingCompetitionId || !!deletingUserId || !!updatingUserId) ? 'wait' : 'pointer' }}
                                    >
                                        {deletingCompetitionId === comp._id ? 'Deleting...' : 'Delete'}
                                    </button>
                                    <Link to={`/dashboard/competitions/${comp.shortId}/submissions`} style={{ marginRight: '5px' }}>(View Subs)</Link>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </section>

            {/* --- Users Section --- */}
            <section className="admin-section" style={{ marginTop: '30px', marginBottom: '40px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
                <h3>Manage Users ({users.length})</h3>
                {usersLoading && <p>Loading users...</p>}
                {usersError && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {usersError}</p>}
                {!usersLoading && !usersError && users.length === 0 && <p>No users found.</p>}
                {!usersLoading && users.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Username</th>
                                <th style={{ padding: '8px' }}>Email</th>
                                <th style={{ padding: '8px' }}>Role</th>
                                <th style={{ padding: '8px' }}>Registered</th>
                                <th style={{ padding: '8px' }}>User ID</th>
                                <th style={{ padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>{users.map((user) => {
                            const isCurrentUserUI = currentUser?._id === user._id;
                            const isBeingDeleted = deletingUserId === user._id;
                            const isBeingUpdated = updatingUserId === user._id;
                            const isAnyActionInProgress = !!deletingUserId || !!updatingUserId || !!deletingCompetitionId;
                            const disableDelete = isCurrentUserUI || isAnyActionInProgress;
                            const disableEdit = isCurrentUserUI || isAnyActionInProgress;
                            return (
                                <tr key={user._id} style={{
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: isBeingDeleted ? '#ffe0e0' : (isBeingUpdated ? '#e0f0ff' : 'transparent')
                                }}>
                                    <td style={{ padding: '8px' }}>{user.username} {isCurrentUserUI ? '(You)' : ''}</td>
                                    <td style={{ padding: '8px' }}>{user.email}</td>
                                    <td style={{ padding: '8px' }}>
                                        {isBeingUpdated ? 'Updating...' : user.role}
                                    </td>
                                    <td style={{ padding: '8px' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px', fontSize: '0.8em', color: '#666' }}>{user._id}</td>
                                    <td style={{ padding: '8px' }}>
                                        <button
                                            onClick={() => handleOpenEditModal(user)}
                                            disabled={disableEdit}
                                            style={{
                                                marginRight: '5px',
                                                cursor: disableEdit ? 'not-allowed' : 'pointer',
                                                color: isCurrentUserUI ? '#aaa' : 'blue',
                                            }}
                                            title={isCurrentUserUI ? "Cannot edit your own account" : `Edit user ${user.username}`}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user._id, user.username)}
                                            disabled={disableDelete}
                                            style={{
                                                color: isCurrentUserUI ? '#aaa' : 'red',
                                                cursor: disableDelete ? (isBeingDeleted ? 'wait' : 'not-allowed') : 'pointer',
                                            }}
                                            title={isCurrentUserUI ? "Cannot delete your own account" : `Delete user ${user.username}`}
                                        >
                                            {isBeingDeleted ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}</tbody>
                    </table>
                )}
            </section>

            {/* --- NEW: Category Suggestions Section --- */}
            <section className="admin-section" style={{ marginTop: '30px', marginBottom: '40px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                <h3>Manage Category Suggestions ({categorySuggestions.length})</h3>
                {suggestionsLoading && <p>Loading category suggestions...</p>}
                {suggestionsError && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {suggestionsError}</p>}
                {!suggestionsLoading && !suggestionsError && categorySuggestions.length === 0 && <p>No category suggestions found.</p>}
                {!suggestionsLoading && !suggestionsError && categorySuggestions.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Category Name</th>
                                <th style={{ padding: '8px' }}>Reason</th>
                                <th style={{ padding: '8px' }}>Submitted By</th>
                                <th style={{ padding: '8px' }}>Status</th>
                                <th style={{ padding: '8px' }}>Submitted At</th>
                                <th style={{ padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorySuggestions.map((suggestion) => {
                                const isAnyOtherActionInProgress = !!deletingUserId || !!updatingUserId || !!deletingCompetitionId;
                                const isProcessing = processingSuggestionId === suggestion._id;
                                const isProcessed = processedSuggestions[suggestion._id];

                                return (
                                    <tr key={suggestion._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px' }}>{suggestion.categoryName}</td>
                                        <td style={{ padding: '8px' }}>{suggestion.reason}</td>
                                        <td style={{ padding: '8px' }}>
                                            {suggestion.submittedBy ? `${suggestion.submittedBy.username} (${suggestion.submittedBy.email || 'No email'})` : 'N/A'}
                                        </td>
                                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>{suggestion.status.replace('_', ' ')}</td>
                                        <td style={{ padding: '8px' }}>{new Date(suggestion.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '8px' }}>
                                            {suggestion.status === 'pending_review' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApproveSuggestion(suggestion._id)}
                                                        disabled={isProcessing || isAnyOtherActionInProgress}
                                                        style={{
                                                            marginRight: '5px',
                                                            backgroundColor: isProcessing ? '#90ee90' : 'green',
                                                            color: 'white',
                                                            padding: '5px 10px',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: isProcessing || isAnyOtherActionInProgress ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {isProcessing ? 'Approving...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectSuggestion(suggestion._id)}
                                                        disabled={isProcessing || isAnyOtherActionInProgress}
                                                        style={{
                                                            backgroundColor: isProcessing ? '#ff7f7f' : 'red',
                                                            color: 'white',
                                                            padding: '5px 10px',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: isProcessing || isAnyOtherActionInProgress ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {isProcessing ? 'Rejecting...' : 'Reject'}
                                                    </button>
                                                </>
                                            )}
                                            {(suggestion.status !== 'pending_review' || isProcessed) && (
                                                <span style={{color: '#666', textTransform: 'capitalize'}}>
                                                    Already {suggestion.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>

            {/* --- Render the Edit User Modal --- */}
            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                userToEdit={editingUser}
                onSave={handleSaveUserRole}
                isSaving={!!updatingUserId}
            />
        </div>
    );
}

export default AdminPanel;