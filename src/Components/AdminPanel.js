// src/Components/AdminPanel.js
// --- Full Replacement Code ---
// --- Implemented User Deletion Frontend Logic ---
// --- *** ADDED: User Editing Frontend Logic (Modal, State, API Call) *** ---
// --- *** MODIFIED: handleDeleteUser to update competition state after cascade delete *** ---

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext'; // Adjust path if necessary
import EditUserModal from './EditUserModal'; // *** Import the modal component ***

const API_BASE_URL = ''; // Or 'http://localhost:5001' if needed

function AdminPanel() {
    const { user: currentUser, token, isLoading: authLoading } = useAuth(); // Renamed 'user' to 'currentUser'

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
    // State for user editing modal and process
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // Holds the user object being edited
    const [updatingUserId, setUpdatingUserId] = useState(null); // Tracks which user is being updated via API


    // Combined Loading State
    const isLoading = authLoading || competitionsLoading || usersLoading;

    // --- Fetch Competitions ---
    const fetchAllCompetitions = useCallback(async () => {
        // (Keep existing fetchAllCompetitions code - no changes needed here)
        if (!token || authLoading) {
            if (!authLoading && !token) {
                setCompetitionsError("Authentication token not found. Cannot fetch admin data.");
                setCompetitionsLoading(false);
            }
            return;
        }
        setCompetitionsLoading(true);
        setCompetitionsError(null);
        setDeletingCompetitionId(null);
        console.log("AdminPanel: Fetching all competitions...");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_BASE_URL}/api/competitions`, config); // Assuming this fetches all, might need /api/admin/competitions if different
            console.log("AdminPanel: Competitions API response received:", response.data);
            if (Array.isArray(response.data)) {
                const sortedCompetitions = response.data.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                // Ensure createdBy is populated or handle cases where it might be just an ID
                const competitionsWithCreatorInfo = sortedCompetitions.map(comp => ({
                    ...comp,
                    // Assuming the backend populates createdBy with at least _id
                    // If createdBy might be missing or just an ID string, adjust accordingly
                    createdBy: comp.createdBy || null // Or handle potential ID string if needed
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
        // (Keep existing fetchAllUsers code - no changes needed here)
        if (!token || authLoading) {
            if (!authLoading && !token) {
                setUsersError("Authentication token not found. Cannot fetch user data.");
                setUsersLoading(false);
            }
            return;
        }
        setUsersLoading(true);
        setUsersError(null);
        setDeletingUserId(null); // Clear deleting state on refresh
        setUpdatingUserId(null); // Clear updating state on refresh too
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

    // --- Effect to Fetch Data ---
    useEffect(() => {
         if (!authLoading) {
             fetchAllCompetitions();
             fetchAllUsers();
         }
    }, [authLoading, fetchAllCompetitions, fetchAllUsers]); // Dependencies

    // --- Delete Competition Handler ---
    const handleDeleteCompetition = useCallback(async (competitionId, competitionTitle) => {
        // (Keep existing handleDeleteCompetition code - no changes needed here)
        if (!token) {
            setCompetitionsError("Authentication error. Cannot delete.");
            return;
        }
        if (deletingCompetitionId) return; // Prevent multiple deletes

        const confirmDelete = window.confirm(
            `ADMIN ACTION:\nAre you sure you want to permanently delete the competition "${competitionTitle}"?\nThis will also delete all its submissions and associated files.\nThis action CANNOT be undone.`
        );

        if (confirmDelete) {
            setDeletingCompetitionId(competitionId);
            setCompetitionsError(null);
            console.log(`AdminPanel: Attempting to delete competition: ${competitionId}`);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`${API_BASE_URL}/api/competitions/${competitionId}`, config);
                console.log(`AdminPanel: Competition ${competitionId} deleted successfully.`);
                // Update competitions state
                setCompetitions(prevCompetitions =>
                    prevCompetitions.filter(comp => comp._id !== competitionId)
                );
                 // Also remove from users state IF the user was the creator? No, user deletion handles that.
                alert(`Competition "${competitionTitle}" and its submissions/files deleted successfully by Admin.`);
            } catch (err) {
                console.error(`AdminPanel: Error deleting competition ${competitionId}:`, err);
                const errorMsg = err.response?.data?.message || 'Failed to delete competition.';
                setCompetitionsError(errorMsg);
                 if (err.response?.status === 401 || err.response?.status === 403) {
                    setCompetitionsError(`${errorMsg} Please try logging in again.`);
                 }
                 alert(`Error deleting competition: ${errorMsg}`) // Also alert on error
            } finally {
                setDeletingCompetitionId(null);
            }
        } else {
            console.log("AdminPanel: Competition deletion cancelled by user.");
        }
    }, [token, deletingCompetitionId]); // Removed setCompetitions from deps, useState setters are stable

    // --- Delete User Handler ---
    // *** MODIFIED ***
    const handleDeleteUser = useCallback(async (userIdToDelete, username) => {
        if (!token) {
            setUsersError("Authentication error. Cannot delete user.");
            alert("Authentication error. Cannot delete user.");
            return;
        }
        if (deletingUserId || updatingUserId) return; // Prevent action if deleting OR updating

        if (currentUser && currentUser._id === userIdToDelete) {
            alert("Error: Cannot delete your own administrator account from the UI.");
            return;
        }

        // *** MODIFIED: Update confirmation message for cascade effect ***
        const confirmDelete = window.confirm(
            `ADMIN ACTION: Are you sure you want to permanently delete user '${username}'?\nThis will ALSO DELETE all competitions and submissions created by this user, along with their files.\nThis action CANNOT be undone.`
        );

        if (confirmDelete) {
            setDeletingUserId(userIdToDelete);
            setUsersError(null);
            console.log(`AdminPanel: Attempting to delete user: ${userIdToDelete} (${username})`);

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                // API call to delete the user (triggers backend cascade)
                await axios.delete(`${API_BASE_URL}/api/admin/users/${userIdToDelete}`, config);
                console.log(`AdminPanel: User ${userIdToDelete} deleted successfully via API (backend cascade initiated).`);

                // --- Frontend State Updates ---
                // 1. Remove the deleted user from the users list
                setUsers(prevUsers =>
                    prevUsers.filter(user => user._id !== userIdToDelete)
                );

                // 2. Remove competitions created by the deleted user from the competitions list
                //    (Ensure comp.createdBy has an _id property available)
                setCompetitions(prevCompetitions =>
                    prevCompetitions.filter(comp => comp.createdBy?._id !== userIdToDelete)
                );

                // *** MODIFIED: Update success alert ***
                alert(`User '${username}' and their associated content (competitions, submissions, files) deleted successfully.`);

            } catch (err) {
                console.error(`AdminPanel: Error deleting user ${userIdToDelete}:`, err);
                const errorMsg = err.response?.data?.message || 'Failed to delete user.';
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setUsersError(`Authorization error: ${errorMsg}. Please log in again.`);
                } else if (err.response?.status === 404) {
                     setUsersError(`User not found on server (perhaps already deleted?). ${errorMsg}`);
                     // Optionally refresh users list if 404
                     // fetchAllUsers();
                } else {
                    setUsersError(errorMsg); // Display backend errors (like 'cannot delete last admin')
                }
                alert(`Error deleting user '${username}': ${errorMsg}`);
            } finally {
                setDeletingUserId(null);
                console.log(`AdminPanel: User deletion process finished for ${userIdToDelete}.`);
            }
        } else {
            console.log(`AdminPanel: User deletion cancelled for ${username}.`);
        }
        // Include setCompetitions in dependencies? No, it's stable. Include currentUser? Yes.
    }, [token, deletingUserId, updatingUserId, currentUser]); // Removed fetchAllUsers, fetchAllCompetitions. Added currentUser.


    // --- Handlers for Edit User Modal ---
    const handleOpenEditModal = useCallback((user) => {
        if (deletingUserId || updatingUserId) return; // Don't open modal if another operation is running
        console.log("AdminPanel: Opening edit modal for user:", user);
        setEditingUser(user); // Set the user to be edited
        setIsEditModalOpen(true); // Open the modal
        setUsersError(null); // Clear previous user errors
    }, [deletingUserId, updatingUserId]);

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false); // Close the modal
        setEditingUser(null); // Clear the user being edited
        // setUpdatingUserId(null); // Optional: clear here too
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
                 fetchAllUsers(); // Optionally refresh list
            } else {
                 setUsersError(errorMsg); // Display other errors
            }
            alert(`Error updating user role: ${errorMsg}`);
            // Keep modal open on error
        } finally {
            setUpdatingUserId(null);
            console.log(`AdminPanel: User role update process finished for ${userIdToUpdate}.`);
        }
    }, [token, editingUser, fetchAllUsers, handleCloseEditModal]); // fetchAllUsers needed if called in catch

    // --- Render Logic ---
    // (Keep existing Render Logic - no changes needed here)

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
                                <th style={{ padding: '8px' }}>Creator</th> {/* Display Creator Name */}
                                <th style={{ padding: '8px' }}>Ends On</th>
                                <th style={{ padding: '8px' }}>Short ID</th>
                                <th style={{ padding: '8px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>{competitions.map((comp) => (
                            <tr key={comp._id} style={{ borderBottom: '1px solid #eee', backgroundColor: deletingCompetitionId === comp._id ? '#ffe0e0' : 'transparent' }}>
                                <td style={{ padding: '8px' }}>{comp.title}</td>
                                <td style={{ padding: '8px', textTransform: 'capitalize' }}>{comp.status}</td>
                                {/* Make sure createdBy object includes username */}
                                <td style={{ padding: '8px' }}>{comp.createdBy?.username || comp.createdBy?._id || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>{new Date(comp.endDate).toLocaleDateString()}</td>
                                <td style={{ padding: '8px' }}>
                                    <Link to={`/competitions/${comp.shortId}`}>{comp.shortId}</Link>
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <Link to={`/competitions/${comp.shortId}/edit`} style={{ marginRight: '5px' }}>(Edit)</Link>
                                    <button
                                        onClick={() => handleDeleteCompetition(comp._id, comp.title)}
                                        disabled={deletingCompetitionId === comp._id || !!deletingCompetitionId || !!deletingUserId || !!updatingUserId} // Also disable if user action in progress
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
             <section className="admin-section" style={{ marginTop: '30px' }}>
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
                             const isCurrentUser = currentUser?._id === user._id;
                             const isBeingDeleted = deletingUserId === user._id;
                             const isBeingUpdated = updatingUserId === user._id;
                             const isAnyActionInProgress = !!deletingUserId || !!updatingUserId || !!deletingCompetitionId; // Check all actions

                             const disableDelete = isCurrentUser || isAnyActionInProgress;
                             const disableEdit = isCurrentUser || isAnyActionInProgress;

                             return (
                                 <tr key={user._id} style={{
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: isBeingDeleted ? '#ffe0e0' : (isBeingUpdated ? '#e0f0ff' : 'transparent')
                                    }}>
                                     <td style={{ padding: '8px' }}>{user.username} {isCurrentUser ? '(You)' : ''}</td>
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
                                                 color: isCurrentUser ? '#aaa' : 'blue',
                                             }}
                                             title={isCurrentUser ? "Cannot edit your own account" : `Edit user ${user.username}`}
                                         >
                                             Edit
                                         </button>
                                         <button
                                             onClick={() => handleDeleteUser(user._id, user.username)}
                                             disabled={disableDelete}
                                             style={{
                                                 color: isCurrentUser ? '#aaa' : 'red',
                                                 cursor: disableDelete ? (isBeingDeleted ? 'wait' : 'not-allowed') : 'pointer',
                                             }}
                                             title={isCurrentUser ? "Cannot delete your own account" : `Delete user ${user.username}`}
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

             {/* --- Render the Edit User Modal --- */}
             <EditUserModal
                 isOpen={isEditModalOpen}
                 onClose={handleCloseEditModal}
                 userToEdit={editingUser}
                 onSave={handleSaveUserRole}
                 isSaving={!!updatingUserId} // Pass loading state to modal
             />

        </div>
    );
}

export default AdminPanel;