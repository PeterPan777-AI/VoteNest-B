// --- Full Replacement Code for: Frontend/src/Components/Navbar.js ---
import React, { useState } from 'react'; // Removed 'useContext' from here as useAuth handles it
import { Navbar as NavbarRB, Nav, NavDropdown, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Import useAuth instead of AuthContext

// import './Navbar.css'; // Or your custom CSS path if you have specific Navbar.css

const Navbar = () => {
    const { user, logout, isLoggedIn } = useAuth(); // Use the useAuth hook
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false); // State for navbar collapse

    // console.log("Navbar User Object:", user); // For debugging
    // console.log("Navbar isLoggedIn:", isLoggedIn); // For debugging

    const handleLogout = () => {
        logout();
        setExpanded(false); // Close navbar on logout
        navigate('/login');
    };

    // Function to close the navbar, can be used by any link
    const closeNavbar = () => setExpanded(false);

    return (
        <NavbarRB 
            variant="dark" 
            expand="lg" 
            className="navbar" 
            expanded={expanded} // Control expanded state
            onToggle={() => setExpanded(prevExpanded => !prevExpanded)} // Handle toggle button click
        >
            <Container fluid>
                <NavbarRB.Brand as={Link} to="/" className="navbar-brand-custom" onClick={closeNavbar}>VoteNest</NavbarRB.Brand>
                <NavbarRB.Toggle aria-controls="basic-navbar-nav" />
                <NavbarRB.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/competitions" className="navbar-link" onClick={closeNavbar}>Competitions</Nav.Link>
                        <Nav.Link as={Link} to="/leaderboard" className="navbar-link" onClick={closeNavbar}>Leaderboard</Nav.Link>
                        {/* Ensure user object is checked before trying to access its properties like 'role' */}
                        {isLoggedIn && user && <Nav.Link as={Link} to="/suggest-category" className="navbar-link" onClick={closeNavbar}>Suggest Category</Nav.Link>}
                    </Nav>
                    <Nav>
                        {isLoggedIn && user ? ( // Check isLoggedIn and user
                            <>
                                <NavDropdown 
                                    title={user.username || 'User'} 
                                    id="basic-nav-dropdown" 
                                    align="end" 
                                    className="navbar-link"
                                >
                                    <NavDropdown.Item as={Link} to="/profile" className="navbar-link-dropdown" onClick={closeNavbar}>Profile</NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/dashboard" className="navbar-link-dropdown" onClick={closeNavbar}>Dashboard</NavDropdown.Item>
                                    {user.role === 'Admin' && <NavDropdown.Item as={Link} to="/admin" className="navbar-link-dropdown" onClick={closeNavbar}>Admin Panel</NavDropdown.Item>}
                                    { (user.role === 'Business' || user.role === 'Admin') && 
                                        <NavDropdown.Item as={Link} to="/create-competition" className="navbar-link-dropdown" onClick={closeNavbar}>Create Competition</NavDropdown.Item>
                                    }
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout} className="navbar-link-dropdown">Logout</NavDropdown.Item> 
                                </NavDropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login" className="navbar-link" onClick={closeNavbar}>Login</Nav.Link>
                                <Nav.Link as={Link} to="/register" className="navbar-link" onClick={closeNavbar}>Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </NavbarRB.Collapse>
            </Container>
        </NavbarRB>
    );
};

export default Navbar;