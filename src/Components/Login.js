// src/Components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Make sure path is correct

function Login() {
    // State for form inputs
    const [email, setEmail] = useState(''); // Keep using 'email' for the input field state
    const [password, setPassword] = useState('');

    // State for feedback and loading
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get auth context methods and navigation hook
    const auth = useAuth();
    const navigate = useNavigate();

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission
        setError(''); // Clear previous errors
        setLoading(true); // Set loading state

        console.log("Login Component: Attempting login for identifier:", email); // Log the value being sent

        try {
            // Send login request to the backend
            const response = await fetch('/api/auth/login', { // Relative URL uses proxy
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Indicate we're sending JSON
                },
                // *** THIS IS THE CORRECTED LINE ***
                // Send the email input value under the key 'identifier'
                // to match what the backend expects (const { identifier, password } = req.body;)
                body: JSON.stringify({ identifier: email, password }),
                // *** END OF CORRECTED LINE ***
            });

            // Always try to parse the response as JSON, even for errors
            // It might contain an error message from the backend
            const data = await response.json();

            if (response.ok) {
                // --- SUCCESS (Status code 2xx) ---
                console.log("Login Component: Login successful. Response data:", data);

                // Extract user data and token from the successful response
                const { user, token } = data;

                // Basic validation of the response data
                if (!user || !token) {
                     console.error("Login Component: Missing user data or token in response.");
                     setError('Login failed: Incomplete data received from server.');
                     setLoading(false);
                     return; // Stop execution
                }

                // Call the login function from AuthContext to update state and localStorage
                auth.login(user, token);

                console.log("Login Component: AuthContext updated. Navigating to dashboard...");
                // Navigate to the dashboard or another protected route
                navigate('/dashboard'); // Adjust as needed

            } else {
                // --- FAILURE (Status code 4xx or 5xx) ---
                console.error("Login Component: Login failed. Status:", response.status, "Error:", data.message);
                // Display the error message received from the backend, or a generic one
                setError(data.message || `Login failed with status: ${response.status}`);
            }
        } catch (err) {
            // --- NETWORK OR OTHER FETCH ERRORS ---
            // Handle cases where the server is down or the response isn't valid JSON
            if (err instanceof SyntaxError) {
                 // This often happens if the server sends HTML (like a 404 page) instead of JSON
                 console.error("Login Component: Failed to parse server response as JSON.", err);
                 setError('Received an invalid response from the server. Check server logs or proxy setup.');
            } else {
                console.error("Login Component: Network or other fetch error during login:", err);
                setError('Login failed. Could not connect to the server.');
            }
        } finally {
            // Ensure loading state is turned off regardless of success or failure
            setLoading(false);
        }
    };

    // --- Render the Login Form ---
    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    {/* Label still says Email for user clarity */}
                    <label htmlFor="email">Email or Username:</label>
                    <input
                        type="text" // Changed type to 'text' to allow username entry too
                        id="email" // ID remains 'email' for the label
                        value={email} // Controlled input linked to 'email' state
                        onChange={(e) => setEmail(e.target.value)} // Update 'email' state
                        required
                        autoComplete="username" // Added autocomplete hint
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password" // Added autocomplete hint
                    />
                </div>
                {/* Display error message if 'error' state is not empty */}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {/* Disable button while loading */}
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
             {/* Optional: Add link to registration page */}
             <p style={{ marginTop: '15px' }}>
                Don't have an account? <a href="/register">Register here</a>
             </p>
        </div>
    );
}

export default Login;