// src/components/Navbar.js
// --- Full Replacement Code ---
// --- Added console.log for debugging user object ---

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Adjust path if needed
// Import necessary components from react-bootstrap
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button'; // For logout button styling

function AppNavbar() { // Renamed component slightly to avoid conflict if Navbar name used elsewhere
    const auth = useAuth();

    // --- DEBUGGING LINE ADDED ---
    // Log the user object provided by the AuthContext to check its structure and role property
    console.log('Navbar User Object:', auth.user);
    // --- END DEBUGGING LINE ---

    return (
        // Use Navbar component from react-bootstrap
        // expand="lg" means it will collapse on screens smaller than 'large'
        // bg="light" sets background color, variant="light" adjusts text/toggle colors
        <Navbar bg="light" variant="light" expand="lg" sticky="top" className="mb-4 shadow-sm">
            <Container> {/* Wraps content for proper alignment and padding */}
                {/* Optional: Add a Brand/Logo - Link to homepage */}
                <Navbar.Brand as={Link} to="/">VoteNest</Navbar.Brand>

                {/* Hamburger button for mobile */}
                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                {/* Collapsible content */}
                <Navbar.Collapse id="basic-navbar-nav">
                    {/* Left-aligned navigation links */}
                    <Nav className="me-auto"> {/* me-auto pushes subsequent items to the right */}
                        <Nav.Link as={Link} to="/competitions">Competitions</Nav.Link>
                        <Nav.Link as={Link} to="/leaderboard">Leaderboard</Nav.Link>

                        {/* Links shown only when logged in */}
                        {auth.isLoggedIn && (
                            <>
                                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                                <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                                <Nav.Link as={Link} to="/suggest-category">Suggest Category</Nav.Link>

                                {/* Check if user exists and role is Business or Admin */}
                                {(auth.user?.role === 'Business' || auth.user?.role === 'Admin') && (
                                    <Nav.Link as={Link} to="/create-competition">Create Competition</Nav.Link>
                                )}
                                {/* Check if user exists and role is Admin */}
                                {auth.user?.role === 'Admin' && (
                                    <Nav.Link as={Link} to="/admin" style={{ fontWeight: 'bold', color: 'red' }}>Admin Panel</Nav.Link>
                                )}
                            </>
                        )}
                    </Nav>

                    {/* Right-aligned navigation items */}
                    <Nav>
                        {auth.isLoggedIn ? (
                            <>
                                <Navbar.Text className="me-3"> {/* Use Navbar.Text for non-link text */}
                                    Signed in as: <Link to="/profile">{auth.user?.username || 'User'}</Link> ({auth.user?.role})
                                    {/* Added role display here as well for clarity */}
                                </Navbar.Text>
                                <Button variant="outline-secondary" size="sm" onClick={auth.logout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                {/* Display Loading state if needed */}
                                { auth.isLoading && <Navbar.Text className="me-3">Loading...</Navbar.Text> }
                                { !auth.isLoading &&
                                    <>
                                        <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                        <Nav.Link as={Link} to="/register">Register</Nav.Link>
                                    </>
                                }
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default AppNavbar;