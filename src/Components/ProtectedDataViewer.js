// src/Components/ProtectedDataViewer.js

// Import necessary tools from React and our Auth Context
import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext'; // Path to your AuthContext file

// Define the component (like a blueprint for this part of the page)
function ProtectedDataViewer() {
    // --- State Variables ---
    // These are like small memory boxes for this component

    // 'data': To store the protected data we get from the backend (initially empty)
    const [data, setData] = useState(null);
    // 'error': To store any error message if things go wrong (initially empty)
    const [error, setError] = useState('');
    // 'loading': To know if we are currently waiting for the backend response (initially false)
    const [loading, setLoading] = useState(false);

    // --- Auth Context ---
    // Get access to the login information (user, token, isLoggedIn status)
    // that we stored in AuthContext.js
    const auth = useAuth();

    // --- Function to Fetch Data ---
    // This function contains the steps to ask the backend for the protected data
    const fetchData = async () => {
        console.log("ProtectedDataViewer: Button clicked. Trying to fetch...");

        // 1. Reset previous results and start loading indicator
        setError(''); // Clear any old error messages
        setData(null); // Clear any old data
        setLoading(true); // Show the user we are "Loading..."

        // 2. Check: Is the user actually logged in? Do we have a token?
        if (!auth.token) {
            console.error("ProtectedDataViewer: No token found in AuthContext.");
            setError('You need to be logged in to see this data.');
            setLoading(false); // Stop loading
            return; // Stop the function here, don't proceed to fetch
        }

        console.log("ProtectedDataViewer: Token found. Preparing to call backend.");
        console.log("ProtectedDataViewer: Using token:", auth.token); // Just for debugging, shows the token

        // 3. Try to contact the backend
        try {
            // 'fetch' is the browser's tool to make requests to servers
            const response = await fetch(
                '/api/protected-data', // The ADDRESS on the BACKEND we want to talk to
                {
                    method: 'GET', // We are just GETTING data (not sending new data to save)
                    headers: {
                        // 'headers' are like instructions or info on the envelope of our request

                        // *** THIS IS THE MOST IMPORTANT PART FOR AUTHENTICATION ***
                        // We add the 'Authorization' header.
                        // Its value MUST start with "Bearer " (notice the space after Bearer)
                        // followed by the actual JWT token we got from auth.token.
                        'Authorization': `Bearer ${auth.token}`,

                        // It's also good practice to tell the server what kind of content we expect
                        'Content-Type': 'application/json'
                    }
                    // No 'body' needed for a GET request
                }
            );

            // 4. Handle the backend's response
            const responseData = await response.json(); // Try to read the response as JSON data

            if (response.ok) {
                // 'response.ok' is true if the status code was good (e.g., 200 OK)
                console.log("ProtectedDataViewer: Backend responded OK. Data:", responseData);
                // Store the received data in our 'data' state variable
                // Adjust 'responseData.message' if your backend sends data differently
                setData(responseData.message || responseData);
            } else {
                // The backend responded with an error status (e.g., 401 Unauthorized, 403 Forbidden, 500 Server Error)
                console.error("ProtectedDataViewer: Backend responded with error.", response.status, responseData);
                // Store the error message from the backend (if any) or create a generic one
                setError(responseData.message || `Error from server: ${response.status}`);

                // OPTIONAL: If the error was specifically an authentication error (401 or 403),
                // it might mean the token is expired or invalid. You could automatically log the user out.
                if (response.status === 401 || response.status === 403) {
                     console.log("ProtectedDataViewer: Authentication error received. Logging out.");
                    // auth.logout(); // Uncomment this line if you want auto-logout on bad token
                }
            }

        } catch (err) {
            // This 'catch' block runs if there was a network problem (e.g., couldn't connect to the server at all)
            console.error("ProtectedDataViewer: Network error during fetch:", err);
            setError('Could not connect to the server. Please check your connection.');
        } finally {
            // This 'finally' block runs *always* after the 'try' or 'catch' finishes
            setLoading(false); // Stop showing the "Loading..." message
            console.log("ProtectedDataViewer: Fetch process complete.");
        }
    };

    // --- What the Component Looks Like (JSX) ---
    // This 'return' statement describes the HTML structure of this component
    return (
        <div>
            <h2>Protected Data Viewer</h2>
            <p>This component attempts to fetch data from a backend route that requires authentication.</p>

            {/* Show a button to trigger the fetch. Disable it if loading or not logged in. */}
            <button onClick={fetchData} disabled={loading || !auth.isLoggedIn}>
                {loading ? 'Fetching...' : 'Fetch Protected Data Now'}
            </button>

            {/* Show an error message if the 'error' state has text in it */}
            {error && (
                <div style={{ color: 'red', marginTop: '10px', border: '1px solid red', padding: '5px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Show the fetched data if the 'data' state has something in it */}
            {data && (
                <div style={{ marginTop: '10px', border: '1px solid green', padding: '5px' }}>
                    <strong>Successfully Received Data from Backend:</strong>
                    {/* Displaying the data. Using <pre> helps format JSON nicely */}
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}

            {/* Show a message if the user isn't logged in */}
             {!auth.isLoggedIn && !loading && (
                <p style={{ marginTop: '10px', color: 'orange' }}>
                    Please log in to use this feature.
                </p>
            )}
        </div>
    );
}

// Make the component available for other files to import
export default ProtectedDataViewer;