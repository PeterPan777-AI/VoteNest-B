// src/Components/Register.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext'; // If needed for checking logged-in state, etc.
import './Register.css'; // Make sure you have some basic CSS or remove this line

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: '', // Initialize role as empty string
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    // const { isLoggedIn } = useContext(AuthContext); // Optional: redirect if already logged in

    // Redirect if user is already logged in (optional)
    // useEffect(() => {
    //     if (isLoggedIn) {
    //         navigate('/dashboard'); // Or wherever logged-in users should go
    //     }
    // }, [isLoggedIn, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Clear previous errors when user starts typing
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission which reloads the page
        setError(''); // Clear previous errors
        setSuccessMessage(''); // Clear previous success message

        // Frontend Validation (Basic)
        if (!formData.username || !formData.email || !formData.password || !formData.role) {
            setError('All fields are required, including selecting a role.');
            return;
        }
        if (formData.role !== 'Individual' && formData.role !== 'Business') {
             // This check might be redundant if dropdown is used correctly, but good practice
            setError('Please select a valid role (Individual or Business).');
            return;
        }
        // Add more specific validation if needed (e.g., email format, password strength)

        console.log("Register.js: Attempting to register with data:", formData);

        try {
            const response = await fetch('http://localhost:5001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log("Register.js: Received response:", response.status, data);


            if (!response.ok) {
                // Handle errors from the backend (like duplicate email/username, validation errors)
                setError(data.message || `Registration failed with status: ${response.status}`);
                console.error("Register.js: Registration error response:", data.message || response.statusText);
            } else {
                // Registration successful
                setSuccessMessage(data.message || 'Registration successful!');
                console.log("Registration successful:", data);
                // Optionally clear the form
                setFormData({ username: '', email: '', password: '', role: '' });
                // Redirect to login page after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 2000); // Redirect after 2 seconds
            }
        } catch (err) {
            console.error("Register.js: Registration error:", err);
            // Network error or other issue with the fetch call
            setError('Registration failed. Could not connect to the server.');
            // Log the detailed error if possible
             if (err instanceof Error) {
                 console.error("Register.js: Fetch error details:", err.message);
                 setError(`Registration failed: ${err.message}`);
            } else {
                 setError('An unknown error occurred during registration.');
            }
        }
    };

    return (
        <div className="register-container">
            <h2>Register New Account</h2>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6" // Match backend validation if possible
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="role">Account Type:</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        {/* Default, non-selectable option */}
                        <option value="" disabled>-- Select Role --</option>
                        {/* *** THE CRITICAL PART *** Ensure these values match EXACTLY what the backend expects */}
                        <option value="Individual">Individual User</option>
                        <option value="Business">Business User</option>
                    </select>
                </div>

                <button type="submit" className="submit-button">Register</button>
            </form>
        </div>
    );
}

export default Register;