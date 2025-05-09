// client/src/Components/Competitions.js
// --- Full Replacement Code ---
// --- Using CSS classes for styling ---

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Competitions.css'; // Import the CSS file

const Competitions = () => {
    const [allCompetitions, setAllCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchCompetitions = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/competitions');
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setAllCompetitions(data);
            } catch (e) {
                console.error("Failed to fetch competitions:", e);
                setError(e.message || "Failed to load competitions. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);

    const getFilteredCompetitions = () => {
        if (activeFilter === 'Standard') {
            return allCompetitions.filter(comp => comp.competitionType === 'Standard');
        }
        if (activeFilter === 'Business') {
            return allCompetitions.filter(comp => comp.competitionType === 'Business');
        }
        return allCompetitions;
    };

    const filteredCompetitions = getFilteredCompetitions();

    if (loading) {
        return <div className="container"><p>Loading competitions...</p></div>;
    }

    if (error) {
        return <div className="container"><p style={{ color: 'red' }}>{error}</p></div>;
    }

    return (
        <div className="container" style={{paddingTop: '20px'}}> {/* Added a general container class for potential centering/padding */}
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Competitions</h2>

            <div className="filter-controls">
                <button
                    className={`filter-button ${activeFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('All')}
                >
                    All
                </button>
                <button
                    className={`filter-button ${activeFilter === 'Standard' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Standard')}
                >
                    Standard
                </button>
                <button
                    className={`filter-button ${activeFilter === 'Business' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Business')}
                >
                    Business
                </button>
            </div>

            {filteredCompetitions.length === 0 && !loading ? (
                <p style={{textAlign: 'center'}}>
                    {activeFilter === 'All' 
                        ? "No competitions available at the moment. Check back soon!" 
                        : `No ${activeFilter.toLowerCase()} competitions found.`}
                </p>
            ) : (
                <div className="competitions-list">
                    {filteredCompetitions.map(comp => {
                        let badgeClass = 'badge-general';
                        if (comp.competitionType === 'Standard') {
                            badgeClass = 'badge-standard';
                        } else if (comp.competitionType === 'Business') {
                            badgeClass = 'badge-business';
                        }

                        return (
                            <div key={comp._id} className="competition-card-item">
                                <div className="competition-badge-container">
                                    <span className={`competition-badge ${badgeClass}`}>
                                        {comp.competitionType || 'General'} 
                                    </span>
                                </div>
                                
                                <h3>{comp.title}</h3>
                                <p>{comp.description?.substring(0, 150)}{comp.description?.length > 150 ? '...' : ''}</p>
                                <p><strong>Status:</strong> <span style={{textTransform: 'capitalize'}}>{comp.status}</span></p>
                                <p><strong>Ends on:</strong> {new Date(comp.endDate).toLocaleDateString()}</p>
                                <Link to={`/competitions/${comp.shortId || comp._id}`}>View Details</Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Competitions;