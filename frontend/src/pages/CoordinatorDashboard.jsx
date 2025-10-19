// frontend/src/pages/CoordinatorDashboard.jsx - FINAL FIX 3 (Using Shared MatchCard)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- NEW IMPORTS ---
import MatchCard from '../components/shared/MatchCard'; // FIX 1: Import the shared, dynamic MatchCard
// -------------------

// --- Global Functions to get data from Local Storage ---
const getCoordinatorToken = () => localStorage.getItem('token'); 
const LOGGED_IN_USERNAME = localStorage.getItem('username') || 'Coordinator'; 
const LOGGED_IN_ID = localStorage.getItem('userId'); // The logged-in User's MongoDB ID

// Helper function to format date/time
const formatMatchTime = (date, time) => {
    if (date) {
        const d = new Date(date);
        return d.toLocaleDateString() + (time ? ` @ ${time}` : '');
    }
    return 'TBD';
};

// --- STYLES (Simplified - kept for reference) ---
const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0', position: 'relative' };
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const welcomeMessageStyles = { fontSize: '3em', fontWeight: '900', color: '#e0e0e0', margin: 0 };
const usernameHighlightStyles = { color: '#00ffaa', marginLeft: '15px' };
const headerWrapperStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoutButtonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const inputStyles = { padding: '8px', border: '1px solid #333', borderRadius: '4px', backgroundColor: '#2c2c2c', color: '#e0e0e0', width: '80px', margin: '0 5px', textAlign: 'center' };
// (Removed the local MatchCard, matchCardStyles, etc.)


// --- MAIN COORDINATOR DASHBOARD COMPONENT ---

const CoordinatorDashboard = () => {
    const navigate = useNavigate();
    const [allMatches, setAllMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [tournaments, setTournaments] = useState([]);

    const coordinatorUsername = LOGGED_IN_USERNAME; 
    const coordinatorId = LOGGED_IN_ID; 

    const token = getCoordinatorToken();

    // 2. Fetch Matches for the Selected Tournament (Wrapped in useCallback for stability)
    const fetchMatches = useCallback(async () => {
        if (!selectedTournament) return;
        setLoading(true);
        setError(null);

        try {
            // Uses the GET /api/matches/:tournamentId route
            const res = await axios.get(`http://localhost:5000/api/matches/${selectedTournament}`, {
                headers: { 'x-auth-token': token }
            });
            
            // Filter matches to show only those assigned to the current coordinator
            const assignedMatches = res.data.filter(match => 
                match.coordinatorId?._id === coordinatorId // Check if coordinatorId is populated
            );
            
            setAllMatches(assignedMatches);
            setLoading(false);
        } catch (err) {
            console.error(err.response?.data || err);
            setError(err.response?.data?.msg || 'Failed to load assigned matches.');
            setLoading(false);
        }
    }, [selectedTournament, token, coordinatorId]); // Depend on selectedTournament and coordinatorId

    // 1. Fetch ALL Tournaments (Wrapped in useCallback for stability)
    const fetchTournaments = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/tournaments', {
                headers: { 'x-auth-token': token }
            });
            const ongoingTournaments = res.data.filter(t => t.status !== 'pending');
            setTournaments(ongoingTournaments); 

            if (ongoingTournaments.length > 0 && !selectedTournament) {
                // Default to the first ongoing tournament
                setSelectedTournament(ongoingTournaments.find(t => t.status === 'ongoing')?._id || ongoingTournaments[0]._id);
            }
        } catch (err) {
            console.error('Failed to fetch tournaments:', err);
            setError('Failed to load tournaments list.');
        }
    }, [token, selectedTournament]);

    useEffect(() => {
        fetchTournaments(); 
    }, [fetchTournaments]);

    useEffect(() => {
        // When selectedTournament changes, fetch the corresponding matches
        if (selectedTournament) {
            fetchMatches();
        }
    }, [selectedTournament, fetchMatches]);

    // --- Score Update Handler (Called by the imported MatchCard) ---
    // FIX 2: Define a single, centralized update handler that accepts the flexible payload
    const handleScoreUpdate = useCallback(async (matchId, scoreUpdatePayload) => {
        try {
            await axios.put(`http://localhost:5000/api/matches/${matchId}/score`, 
                scoreUpdatePayload, // CRITICAL: Sends the flexible {scoreData, status} object
                { headers: { 'x-auth-token': token } }
            );
            
            alert("Score saved successfully!");
            fetchMatches(); // Re-fetch list to show updated status/score
        } catch (err) {
            console.error(`Failed to update score: ${err.response?.data?.msg || 'Server Error'}`);
            setError(err.response?.data?.msg || 'Failed to update score.');
        }
    }, [token, fetchMatches]);


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('userId'); // Clear user ID
        navigate('/'); 
    };

    const tournamentName = tournaments.find(t => t._id === selectedTournament)?.name || 'Select Tournament';

    return (
        <div style={containerStyles}>
            <div style={headerWrapperStyles}>
                <div style={welcomeMessageStyles}>
                    Welcome, Coordinator 
                    <span style={usernameHighlightStyles}>({coordinatorUsername})</span>
                </div>
                <button style={logoutButtonStyles} onClick={handleLogout}>
                    Logout
                </button>
            </div>
            
            <h1 style={headerStyles}>Match Coordination Center</h1>
            
            <div style={cardStyles}>
                <h3 style={{ marginBottom: '10px' }}>Select Tournament to Manage:</h3>
                <select 
                    style={{...inputStyles, width: '300px', height: 'auto', textAlign: 'left'}}
                    value={selectedTournament || ''}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    disabled={tournaments.length === 0}
                >
                    <option value="" disabled>-- Select a Tournament --</option>
                    {tournaments.map(t => (
                        <option key={t._id} value={t._id}>
                            {t.name} ({t.status.toUpperCase()})
                        </option>
                    ))}
                </select>
            </div>

            <h2 style={{ color: '#00ffaa' }}>Assigned Matches for: {tournamentName}</h2>

            {loading && <h2 style={{color: '#fff'}}>Loading matches...</h2>}
            {error && <p style={errorStyles}>Error: {error}</p>}

            {selectedTournament && !loading && allMatches.length === 0 && (
                <p>You have no matches currently assigned to this tournament.</p>
            )}

            {/* FIX 3: Render the imported MatchCard component */}
            {!loading && allMatches.length > 0 && (
                allMatches.map(match => (
                    <MatchCard 
                        key={match._id} 
                        match={match} 
                        onScoreUpdate={handleScoreUpdate} // Pass the centralized handler
                        hasAdminRights={true} // Coordinator has admin rights for score entry
                    />
                ))
            )}
            
        </div>
    );
};

export default CoordinatorDashboard;