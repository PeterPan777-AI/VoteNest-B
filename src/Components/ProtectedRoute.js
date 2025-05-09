// src/Components/ProtectedRoute.js
// --- Full Replacement Code ---
// --- Added optional role-based access control ---

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// *** Adjust path if ProtectedRoute.js is in src/Components ***
import { useAuth } from '../Context/AuthContext';

// This component wraps routes that require authentication and optionally specific roles
// *** ADDED allowedRoles prop ***
const ProtectedRoute = ({ children, allowedRoles }) => {
    // *** Destructure user as well to check the role ***
    const { user, isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    // --- 1. Wait until the loading check is complete ---
    if (isLoading) {
        console.log("ProtectedRoute: Auth state is loading...");
        // It's generally better to show a consistent loading indicator
        // perhaps matching your app's style
        return <div style={{ padding: '20px', textAlign: 'center' }}>Verifying access...</div>;
    }

    // --- 2. Once loading is complete, check login status ---
    if (!isLoggedIn) {
        // If not logged in after loading, redirect to the login page
        console.log("ProtectedRoute: Auth loaded, user is NOT logged in. Redirecting to /login.");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- 3. If logged in, check roles (if allowedRoles is provided) ---
    // *** NEW: Role Check Logic ***
    if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRole = user?.role; // Get the user's role
        console.log(`ProtectedRoute: Role check required. Allowed: [${allowedRoles.join(', ')}], User has: ${userRole}`);

        if (!userRole || !allowedRoles.includes(userRole)) {
            // If user role is missing or not in the allowed list, deny access
            console.log("ProtectedRoute: User role NOT authorized. Denying access.");
            // Render an "Unauthorized" message or redirect
            // Rendering a message is often clearer than a silent redirect
            return (
                <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                    <h2>Access Denied</h2>
                    <p>You do not have the necessary permissions ({allowedRoles.join(' or ')}) to view this page.</p>
                    {/* Optionally add a link back to the dashboard or home */}
                    {/* <Link to="/dashboard">Back to Dashboard</Link> */}
                </div>
            );
        }
         console.log("ProtectedRoute: User role IS authorized.");
    } else {
        // If allowedRoles is not provided, just being logged in is sufficient
         console.log("ProtectedRoute: No specific roles required, proceeding.");
    }

    // --- 4. If loading is complete, user is logged in, AND role check passes (or wasn't required) ---
    // Render the actual component that this ProtectedRoute is wrapping
    console.log("ProtectedRoute: Access granted. Rendering children.");
    return children;
};

export default ProtectedRoute;