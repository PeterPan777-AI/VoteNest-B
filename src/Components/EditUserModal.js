// src/components/EditUserModal.js
// --- Full Replacement Code ---

import React, { useState, useEffect } from 'react';

// Basic modal styling (can be replaced with a library like react-modal or Bootstrap modal)
const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    zIndex: 1000, // Ensure it's above other content
    minWidth: '400px', // Adjust as needed
};

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999, // Below the modal but above the page
};

// Define the allowed roles directly in the component or pass as props
const ALLOWED_ROLES = ['Individual', 'Business', 'Admin'];

function EditUserModal({ isOpen, onClose, userToEdit, onSave, isSaving }) {
    const [selectedRole, setSelectedRole] = useState('');

    // When the modal opens or the userToEdit changes, set the initial selected role
    useEffect(() => {
        if (userToEdit) {
            setSelectedRole(userToEdit.role);
        } else {
            setSelectedRole(''); // Reset if no user
        }
    }, [userToEdit]);

    // Handle role selection change
    const handleRoleChange = (event) => {
        setSelectedRole(event.target.value);
    };

    // Handle the save button click
    const handleSaveClick = () => {
        // Call the onSave function passed from AdminPanel, providing the userId and the new role
        if (userToEdit && userToEdit._id && selectedRole) {
            onSave(userToEdit._id, selectedRole);
        } else {
            console.error("EditUserModal: Cannot save - missing user ID or selected role.");
            // Optionally show an error to the user here
        }
    };

    // Don't render anything if the modal is not open or no user is selected
    if (!isOpen || !userToEdit) {
        return null;
    }

    return (
        <>
            {/* Modal Overlay */}
            <div style={overlayStyle} onClick={isSaving ? null : onClose} /> {/* Prevent closing while saving */}

            {/* Modal Content */}
            <div style={modalStyle}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Edit User Role
                </h3>

                {/* Display User Info (Read-Only) */}
                <div style={{ marginBottom: '15px' }}>
                    <strong>Username:</strong> {userToEdit.username}
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <strong>Email:</strong> {userToEdit.email}
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <strong>User ID:</strong> <code style={{ fontSize: '0.9em' }}>{userToEdit._id}</code>
                </div>

                {/* Role Selection Dropdown */}
                <div style={{ marginBottom: '25px' }}>
                    <label htmlFor="roleSelect" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Change Role:
                    </label>
                    <select
                        id="roleSelect"
                        value={selectedRole}
                        onChange={handleRoleChange}
                        disabled={isSaving} // Disable dropdown while saving
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        {/* Default option (optional) */}
                        {/* <option value="" disabled>Select a role</option> */}

                        {/* Populate options from ALLOWED_ROLES */}
                        {ALLOWED_ROLES.map(role => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                        onClick={onClose}
                        disabled={isSaving} // Disable cancel button while saving
                        style={{ padding: '8px 15px', cursor: isSaving ? 'not-allowed' : 'pointer', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving || selectedRole === userToEdit.role} // Disable if saving or role hasn't changed
                        style={{
                            padding: '8px 15px',
                            cursor: (isSaving || selectedRole === userToEdit.role) ? 'not-allowed' : 'pointer',
                            backgroundColor: (isSaving || selectedRole === userToEdit.role) ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                        title={selectedRole === userToEdit.role ? "Role has not changed" : "Save changes"}
                    >
                        {isSaving ? 'Saving...' : 'Save Role'}
                    </button>
                </div>
            </div>
        </>
    );
}

export default EditUserModal;