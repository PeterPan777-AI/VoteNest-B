// --- Frontend/src/Components/Navbar.js ---
import React, { useState } from 'react';
import { Navbar as NavbarRB, Nav, NavDropdown, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import './Navbar.css'; // Make sure this CSS file has the updated styles

const NavbarComponent = () => { // Renamed to avoid conflict with imported Navbar
    const { user, logout, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    const handleLogout = () => {
        logout();
        setExpanded(false);
        navigate('/login');
    };

    const closeNavbar = () => setExpanded(false);

    return (
        <NavbarRB
            bg="dark" // Using Bootstrap's theme prop
            variant="dark" // Using Bootstrap's theme prop
            expand="lg"
            sticky="top" // Added sticky="top" as it's common
            expanded={expanded}
            onToggle={() => setExpanded(prevExpanded => !prevExpanded)}
            className="navbar-custom-main-styles" // Optional: if you need to target the main NavbarRB element
        >
            <Container fluid>
                <NavbarRB.Brand as={Link} to="/" className="navbar-brand-custom" onClick={closeNavbar}>VoteNest</NavbarRB.Brand>
                <NavbarRB.Toggle aria-controls="basic-navbar-nav" />
                <NavbarRB.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/competitions" className="nav-link-custom" onClick={closeNavbar}>Competitions</Nav.Link>
                        <Nav.Link as={Link} to="/leaderboard" className="nav-link-custom" onClick={closeNavbar}>Leaderboard</Nav.Link>
                        {isLoggedIn && user && <Nav.Link as={Link} to="/suggest-category" className="nav-link-custom" onClick={closeNavbar}>Suggest Category</Nav.Link>}
                    </Nav>
                    <Nav>
                        {isLoggedIn && user ? (
                            <>
                                <NavDropdown
                                    title={user.username || 'User'}
                                    id="basic-nav-dropdown"
                                    align="end"
                                    className="dropdown-toggle-custom" // Class for the dropdown toggle itself
                                >
                                    <NavDropdown.Item as={Link} to="/profile" className="dropdown-item-custom" onClick={closeNavbar}>Profile</NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/dashboard" className="dropdown-item-custom" onClick={closeNavbar}>Dashboard</NavDropdown.Item>
                                    {user.role === 'Admin' && <NavDropdown.Item as={Link} to="/admin" className="dropdown-item-custom" onClick={closeNavbar}>Admin Panel</NavDropdown.Item>}
                                    {(user.role === 'Business' || user.role === 'Admin') &&
                                        <NavDropdown.Item as={Link} to="/create-competition" className="dropdown-item-custom" onClick={closeNavbar}>Create Competition</NavDropdown.Item>
                                    }
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout} className="dropdown-item-custom">Logout</NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login" className="nav-link-custom" onClick={closeNavbar}>Login</Nav.Link>
                                <Nav.Link as={Link} to="/register" className="nav-link-custom" onClick={closeNavbar}>Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </NavbarRB.Collapse>
            </Container>
        </NavbarRB>
    );
};

export default NavbarComponent; // Export with the new name