// frontend/src/pages/CoordinatorDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Global Functions to get data from Local Storage ---
const getCoordinatorToken = () => localStorage.getItem('token'); 
const LOGGED_IN_USERNAME = localStorage.getItem('username') || 'Coordinator'; 
const LOGGED_IN_ID = localStorage.getItem('userId'); // Assuming userId is stored during login

// Helper function to format date/time
const formatMatchTime = (date, time) => {
    if (date) {
        const d = new Date(date);
        return d.toLocaleDateString() + (time ? ` @ ${time}` : '');
    }
    return 'TBD';
};

// --- STYLES (Simplified) ---
const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0', position: 'relative' };
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' };
const buttonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };
const inputStyles = { padding: '8px', border: '1px solid #333', borderRadius: '4px', backgroundColor: '#2c2c2c', color: '#e0e0e0', width: '80px', margin: '0 5px', textAlign: 'center' };

const matchCardStyles = (status) => ({
    backgroundColor: status === 'in-progress' ? '#331a00' : (status === 'completed' ? '#2c2c2c' : '#1a1a1a'),
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    borderLeft: status === 'in-progress' ? '4px solid #ffcc00' : (status === 'completed' ? '4px solid #a0a0a0' : '4px solid #00ffaa'),
});

const scoreUpdateAreaStyles = {
    marginTop: '15px',
    paddingTop: '10px',
    borderTop: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const welcomeMessageStyles = { fontSize: '3em', fontWeight: '900', color: '#e0e0e0', margin: 0 };
const usernameHighlightStyles = { color: '#00ffaa', marginLeft: '15px' };
const headerWrapperStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoutButtonStyles = { ...buttonStyles, transition: 'background-color 0.2s' };
const statusTagStyles = (status) => ({
    backgroundColor: status === 'in-progress' ? '#ffcc00' : (status === 'completed' ? '#a0a0a0' : '#00ffaa'),
    color: '#1a1a1a',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8em',
    fontWeight: 'bold',
    marginLeft: '10px'
});


// --- MATCH COMPONENT (Handles score submission) ---

const MatchCard = ({ match, fetchMatches }) => {
    const [teamAScore, setTeamAScore] = useState(match.scores?.teamA || 0);
    const [teamBScore, setTeamBScore] = useState(match.scores?.teamB || 0);
    const [isEditing, setIsEditing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const token = getCoordinatorToken();

    // Check if the current coordinator is assigned to this match
    const isAssigned = match.coordinatorId?.uniqueId === localStorage.getItem('uniqueId'); 

    const handleScoreUpdate = async (newStatus = 'completed') => {
        setStatusMessage(null);
        try {
            await axios.put(`http://localhost:5000/api/matches/${match._id}/score`, 
                { 
                    teamAscore: Number(teamAScore), 
                    teamBscore: Number(teamBScore), 
                    status: newStatus 
                }, 
                { headers: { 'x-auth-token': token } }
            );

            setStatusMessage({ type: 'success', msg: `Score updated to ${newStatus}.` });
            setIsEditing(false);
            fetchMatches(); // Refresh the list
        } catch (err) {
            console.error('Score update failed:', err.response?.data || err);
            setStatusMessage({ type: 'error', msg: err.response?.data?.msg || 'Failed to update score.' });
        }
    };

    return (
        <div style={matchCardStyles(match.status)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#e0e0e0' }}>
                    {match.teams[0]?.name || 'TBD'} vs {match.teams[1]?.name || 'TBD'}
                    <span style={statusTagStyles(match.status)}>{match.status.toUpperCase()}</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.9em' }}>
                    Venue: **{match.venue || 'TBD'}**
                </p>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#a0a0a0' }}>
                Scheduled: {formatMatchTime(match.date, match.time)} 
                {match.round && <span style={{ marginLeft: '10px' }}>Round: {match.round}</span>}
            </p>

            <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold', color: '#00ffaa' }}>
                Current Score: {match.scores?.teamA || 0} - {match.scores?.teamB || 0}
            </p>

            {/* Score Update Interface (Visible if Assigned and not Completed) */}
            {match.status !== 'completed' && (
                <div style={scoreUpdateAreaStyles}>
                    {statusMessage && (
                        <p style={statusMessage.type === 'error' ? errorStyles : successStyles}>{statusMessage.msg}</p>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ minWidth: '100px', textAlign: 'right' }}>{match.teams[0]?.name || 'Team A'}:</span>
                            <input 
                                type="number" 
                                style={inputStyles} 
                                value={teamAScore} 
                                onChange={(e) => setTeamAScore(e.target.value)} 
                                disabled={!isAssigned && req.user?.role !== 'admin'}
                                min="0"
                            />
                            
                            <span style={{ margin: '0 10px' }}>-</span>
                            
                            <input 
                                type="number" 
                                style={inputStyles} 
                                value={teamBScore} 
                                onChange={(e) => setTeamBScore(e.target.value)} 
                                disabled={!isAssigned && req.user?.role !== 'admin'}
                                min="0"
                            />
                            <span style={{ minWidth: '100px' }}>{match.teams[1]?.name || 'Team B'}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                style={{ ...buttonStyles, backgroundColor: '#ffcc00', color: '#1a1a1a', fontWeight: 'bold' }}
                                onClick={() => handleScoreUpdate('in-progress')}
                                disabled={!isAssigned && req.user?.role !== 'admin'}
                            >
                                Live Update
                            </button>
                            <button 
                                style={{ ...buttonStyles, backgroundColor: '#39ff14', color: '#1a1a1a', fontWeight: 'bold' }}
                                onClick={() => handleScoreUpdate('completed')}
                                disabled={!isAssigned && req.user?.role !== 'admin'}
                            >
                                Finalize Score
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- MAIN COORDINATOR DASHBOARD COMPONENT ---

const CoordinatorDashboard = () => {
    const navigate = useNavigate();
    const [allCoordinatorMatches, setAllCoordinatorMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coordinatorAssignments, setCoordinatorAssignments] = useState([]); // Stores all tournaments with assigned venues/events

    const coordinatorUsername = LOGGED_IN_USERNAME; 
    const coordinatorId = LOGGED_IN_ID; // The logged-in User's MongoDB ID

    const token = getCoordinatorToken();

    // 1. Fetch ALL Tournaments (to populate dropdown)
    const fetchTournaments = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/tournaments/coordinator-assignments', {
                headers: { 'x-auth-token': token }
            });
            setTournaments(res.data.filter(t => t.status !== 'pending')); // Only show active/completed tournaments
            if (res.data.length > 0 && !selectedTournament) {
                // Default to the first ongoing tournament
                setSelectedTournament(res.data.find(t => t.status === 'ongoing')?._id || res.data[0]._id);
            }
        } catch (err) {
            console.error('Failed to fetch tournaments:', err);
            setError(err.response?.data?.msg || 'Failed to load tournaments list.');
            setLoading(false); 
        }
    };
    
    // 2. Fetch Matches for the Selected Tournament
    const fetchMatches = async () => {
        if (!selectedTournament) return;
        setLoading(true);
        setError(null);

        try {
            // Uses the GET /api/matches/:tournamentId route
            const res = await axios.get(`http://localhost:5000/api/matches/${selectedTournament}`, {
                headers: { 'x-auth-token': token }
            });
            
            // Filter matches to show only those assigned to the current coordinator
            // This assumes the backend populates coordinatorId with the Mongoose object ID
            const assignedMatches = res.data.filter(match => 
                match.coordinatorId?._id === coordinatorId
            );
            
            setAllMatches(assignedMatches);
            setLoading(false);
        } catch (err) {
            console.error(err.response?.data || err);
            setError(err.response?.data?.msg || 'Failed to load assigned matches.');
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load: Fetch tournaments, then let selectedTournament trigger match fetch
        fetchTournaments(); 
    }, []);

    useEffect(() => {
        // When selectedTournament changes, fetch the corresponding matches
        if (selectedTournament) {
            fetchMatches();
        }
    }, [selectedTournament]);

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

            {!loading && allMatches.length > 0 && (
                allMatches.map(match => (
                    <MatchCard key={match._id} match={match} fetchMatches={fetchMatches} />
                ))
            )}
            
        </div>
    );
};

export default CoordinatorDashboard;