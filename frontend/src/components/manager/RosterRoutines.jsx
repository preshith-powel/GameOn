// frontend/src/components/manager/RosterRoutines.jsx - UPDATED CODE

import React, { useState } from 'react';
import axios from 'axios';
// FIX 1: Import the constants to potentially use for future validation
import { SPORT_CONSTANTS } from '../../data/sportConstants'; 

const getManagerToken = () => localStorage.getItem('token'); 

// NOTE: Styles are assumed to be loaded via CSS classes or passed as props. 
// Using placeholder object for styles to maintain functionality within this file.
// FIX 2: Replace hardcoded styles with simplified constants or classes (You must replace these with real CSS in your project!)
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px', color: '#e0e0e0' };
const rosterItemStyles = { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box', marginBottom: '10px' };
const buttonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };
const rosterControlStyles = { padding: '5px 10px', marginLeft: '10px', backgroundColor: '#ff6b6b', color: '#1a1a1a', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' };


// --- 2A. ADD PLAYER FORM ---

const AddPlayerForm = ({ fetchTeamData, activeTeam, maxPlayers }) => {
    const [playerName, setPlayerName] = useState('');
    const [contact, setContact] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Max players is correctly pulled from the props passed from the parent (which gets the highest limit from the backend)
    const MAX_PLAYERS = maxPlayers; 
    const isRosterFull = activeTeam && activeTeam.roster.length >= MAX_PLAYERS;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const token = getManagerToken();

        if (!playerName) { setError('Player name is required.'); return; }
        if (isRosterFull) { setError(`Roster for this team is full! Max ${MAX_PLAYERS} players.`); return; }
        if (!activeTeam) { setError('Team context missing.'); return; }

        try {
            await axios.post('http://localhost:5000/api/manager/players', {
                name: playerName,
                contactInfo: contact,
                teamId: activeTeam._id
            }, { headers: { 'x-auth-token': token, } });
            
            setPlayerName('');
            setContact('');

            await fetchTeamData(); 
            setSuccess(`Player added successfully! Roster updated.`);
            
        } catch (err) {
            console.error('Add player failed:', err.response?.data || err);
            // Uses the clean error message from the backend's asyncHandler
            setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to add player. Check console for details.'); 
        }
    };

    return (
        <div style={cardStyles}>
            <h3>Add New Player to Roster</h3>
            <form onSubmit={handleSubmit}>
                <input style={inputStyles} type="text" placeholder="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required disabled={isRosterFull || !activeTeam}/>
                <input style={inputStyles} type="text" placeholder="Contact Info (Optional)" value={contact} onChange={(e) => setContact(e.target.value)} disabled={isRosterFull || !activeTeam}/>
                <button type="submit" style={buttonStyles} disabled={isRosterFull || !activeTeam}>
                    {isRosterFull ? `Roster is Full (${MAX_PLAYERS}/${MAX_PLAYERS})` : 'Add Player'}
                </button>
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>{success}</p>}
            </form>
        </div>
    );
};


// --- 2B. TEAM ROSTER LIST ---

const TeamRoster = ({ roster, fetchTeamData, maxPlayersPerTeam, minPlayersPerTeam }) => { // FIX 1: Added minPlayersPerTeam prop
    const [error, setError] = useState(null);
    const [editPlayerId, setEditPlayerId] = useState(null);
    const [editPlayerName, setEditPlayerName] = useState('');
    
    const currentRosterSize = roster.length;
    const isRosterBelowMinimum = minPlayersPerTeam > 0 && currentRosterSize < minPlayersPerTeam;

    const handleSaveEdit = async (playerId) => {
        if (!editPlayerName) {
            setError('Player name cannot be empty.');
            return;
        }
        
        setError(null);
        const token = getManagerToken();
        
        try {
            await axios.put(`http://localhost:5000/api/manager/players/${playerId}`, { 
                name: editPlayerName, 
                // contactInfo is intentionally omitted for simplicity in this edit form
            }, {
                headers: { 'x-auth-token': token }
            });

            setEditPlayerId(null);
            fetchTeamData();
            
        } catch (err) {
             console.error('Edit player failed:', err.response?.data || err);
             setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to save changes.');
        }
    };

    const handleRemove = async (playerId, playerName) => {
        // FIX 1: Updated check to use the minimum requirement for a warning
        if (isRosterBelowMinimum || currentRosterSize === minPlayersPerTeam) {
            if (!window.confirm(`WARNING: Removing ${playerName} will drop the roster below the minimum required size (${minPlayersPerTeam}). Continue?`)) return;
        } else {
            if (!window.confirm(`Are you sure you want to remove ${playerName}?`)) return;
        }
        
        setError(null);
        const token = getManagerToken();

        try {
            await axios.delete(`http://localhost:5000/api/manager/players/${playerId}`, {
                headers: { 'x-auth-token': token }
            });
            
            alert(`${playerName} removed.`);
            fetchTeamData();
            
        } catch (err) {
            console.error('Remove player failed:', err.response?.data || err);
            setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to remove player.');
        }
    };

    return (
        <div style={cardStyles}>
            <h3>
                Current Roster ({currentRosterSize} / {maxPlayersPerTeam})
                {/* FIX 1: Display warning if below minimum */}
                {isRosterBelowMinimum && minPlayersPerTeam > 0 && (
                    <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
                        (Minimum {minPlayersPerTeam} required!) ⚠️
                    </span>
                )}
            </h3>
            {error && <p style={errorStyles}>Error: {error}</p>}
            
            {roster.length === 0 ? (
                <p>No players on the roster. Add players using the form above.</p>
            ) : (
                roster.map(item => (
                    <div key={item.playerId?._id || item.id} style={rosterItemStyles}>
                        {editPlayerId === item.playerId?._id ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    value={editPlayerName} 
                                    onChange={(e) => setEditPlayerName(e.target.value)} 
                                    style={{...inputStyles, width: '200px', marginBottom: 0}}
                                />
                                <button 
                                    style={{...rosterControlStyles, backgroundColor: '#00ffaa', color: '#1a1a1a'}} 
                                    onClick={() => handleSaveEdit(item.playerId._id)}
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <span>{item.playerId?.name || 'Player Name Missing'} {item.isCaptain && '(Captain)'}</span>
                        )}

                        <div>
                            {editPlayerId !== item.playerId?._id && (
                                <button 
                                    style={{...rosterControlStyles, backgroundColor: '#00ffaa', color: '#1a1a1a'}} 
                                    onClick={() => {
                                        setEditPlayerId(item.playerId._id);
                                        setEditPlayerName(item.playerId?.name || '');
                                    }}
                                >
                                    Edit
                                </button>
                            )}
                            
                            <button 
                                style={{...rosterControlStyles, backgroundColor: '#ff6b6b'}} 
                                onClick={() => handleRemove(item.playerId._id, item.playerId?.name || 'Player')}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// Export the main components of this file
export { AddPlayerForm, TeamRoster };