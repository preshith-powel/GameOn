// frontend/src/components/manager/RosterRoutines.jsx

import React, { useState } from 'react';
import axios from 'axios';

const getManagerToken = () => localStorage.getItem('token'); 

// NOTE: Styles are imported/copied from the main dashboard file
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' };
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
            setError(err.response?.data?.msg || 'Failed to add player. Check backend console for details.');
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

const TeamRoster = ({ roster, fetchTeamData, maxPlayersPerTeam }) => {
    const [error, setError] = useState(null);
    const [editPlayerId, setEditPlayerId] = useState(null);
    const [editPlayerName, setEditPlayerName] = useState('');

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
            }, {
                headers: { 'x-auth-token': token }
            });

            setEditPlayerId(null);
            fetchTeamData();
            
        } catch (err) {
             console.error('Edit player failed:', err.response?.data || err);
             setError(err.response?.data?.msg || 'Failed to save changes. Ensure backend PUT route is configured.');
        }
    };

    const handleRemove = async (playerId, playerName) => {
        const isRosterAtLimit = roster.length === maxPlayersPerTeam;

        if (isRosterAtLimit) {
            if (!window.confirm(`WARNING: Removing ${playerName} will make your roster incomplete (${maxPlayersPerTeam - 1}/${maxPlayersPerTeam}). Continue?`)) return;
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
            setError(err.response?.data?.msg || 'Failed to remove player.');
        }
    };

    return (
        <div style={cardStyles}>
            <h3>Current Roster ({roster.length} / {maxPlayersPerTeam})</h3>
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
                                Delete
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