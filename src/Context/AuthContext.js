// src/Context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const AuthContext = createContext(null); // Exporting this directly is less common now with custom hooks

// --- Provider Component ---
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState(null);
    // Tracks initial check from localStorage
    const [isLoading, setIsLoading] = useState(true);

    // useEffect runs once when the AuthProvider first mounts
    useEffect(() => {
        console.log("AuthProvider (useEffect): Checking local storage...");
        try {
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('authUser');

            if (storedToken && storedUser) {
                console.log("AuthProvider (useEffect): Found token and user in storage.");
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                setIsLoggedIn(true);
            } else {
                console.log("AuthProvider (useEffect): No token/user found in storage.");
                // Explicitly clear state if nothing is found
                setToken(null);
                setUser(null);
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("AuthProvider (useEffect): Error reading from local storage", error);
            // Clear potentially corrupted storage and reset state
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            setIsLoggedIn(false);
        } finally {
            // Set isLoading to false ONLY AFTER the check is complete
            console.log("AuthProvider (useEffect): Initial check complete. Setting isLoading to false.");
            setIsLoading(false);
        }
    }, []); // Empty dependency array means run only ONCE on mount

    // --- Login Function ---
    const login = (userData, receivedToken) => {
        console.log("AuthProvider (login): Logging in user:", userData.username || userData.email); // Use username or email
        try {
            localStorage.setItem('authUser', JSON.stringify(userData));
            localStorage.setItem('authToken', receivedToken);
            setUser(userData);
            setToken(receivedToken);
            setIsLoggedIn(true);
            // isLoading is only for the initial load, not subsequent logins
            console.log("AuthProvider (login): State updated, user logged in.");
        } catch (error) {
            console.error("AuthProvider (login): Error saving to local storage", error);
            // Attempt to logout cleanly if login storage fails
            logout();
        }
    };

    // --- Logout Function ---
    const logout = () => {
        console.log("AuthProvider (logout): Logging out user.");
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
        // isLoading is not affected by logout
        console.log("AuthProvider (logout): State reset, user logged out.");
    };

    // --- Value Provided by Context ---
    // Bundle the state and functions. Use 'isLoading' for the loading status.
    const value = {
        user,
        isLoggedIn,
        token,
        isLoading, // Provide the loading status using the key 'isLoading'
        login,
        logout,
    };

    // --- Render the Provider ---
    // The Provider component wraps parts of the app that need access to the context
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom Hook ---
// Provides an easy way for components to get the auth context data
// This is the preferred way for components to consume the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // This error means you tried to use the context outside of an AuthProvider wrapper
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context; // Return the whole value object { user, token, isLoading, ... }
};

// Optional: Export the context itself if needed elsewhere, though useAuth is usually sufficient
// export { AuthContext };