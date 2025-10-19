// frontend/src/components/manager/RosterManagementView.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { AddPlayerForm, TeamRoster } from './RosterRoutines'; // Import the new combined component

const getManagerToken = () => localStorage.getItem('token'); 

// NOTE: Styles are imported/copied from the main dashboard file
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' };
const buttonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };

const teamStatusButtonStyles = (isReady) => ({
    padding: '8px 12px',
    backgroundColor: isReady ? '#39ff14' : '#ff6b6b',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9em',
    marginLeft: '15px',
    transition: 'background-color 0.2s'
});


const RosterManagementView = ({ team, fetchAssignments, setView }) => {
    const MAX_PLAYERS = team.tournaments[0]?.tournamentId?.playersPerTeam || 5;
    const isRosterComplete = team.roster.length >= MAX_PLAYERS;
    const isReady = team.isReady;
    const [readyError, setReadyError] = useState('');
    const [readySuccess, setReadySuccess] = useState('');

    const handleToggleReady = async () => {
        setReadyError('');
        setReadySuccess('');
        const token = getManagerToken();
        const newReadyState = !isReady;
        
        // 1. Client-side check before trying to set to READY
        if (newReadyState === true && !isRosterComplete) {
            setReadyError(`Roster is incomplete (${team.roster.length}/${MAX_PLAYERS}). Cannot set status to Ready.`);
            return;
        }

        try {
            const endpoint = `http://localhost:5000/api/tournaments/team/${team._id}/ready`;
            const res = await axios.put(endpoint, { isReady: newReadyState }, { headers: { 'x-auth-token': token } });
            
            setReadySuccess(res.data.msg);
            fetchAssignments(); // Refresh data to show new status
            
        } catch (err) {
            console.error("Toggle Ready Error:", err.response?.data || err);
            setReadyError(err.response?.data?.msg || 'Failed to update team status.');
        }
    };
    
    return (
        <>
            <div style={cardStyles}>
                <h2 style={{ color: '#00ffaa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Team: {team.name}</span>
                    
                    {/* --- READY BUTTON --- */}
                    <button 
                        style={teamStatusButtonStyles(isReady)}
                        onClick={handleToggleReady}
                        disabled={!isRosterComplete && !isReady} 
                    >
                        {isReady ? 'UNSET READY' : 'SET READY'}
                    </button>
                </h2>
                <h3 style={{ fontSize: '1.2em', marginBottom: '10px' }}>
                    Roster Status: {team.roster.length} / {MAX_PLAYERS} Players
                </h3>
                
                {readyError && <p style={errorStyles}>Error: {readyError}</p>}
                {readySuccess && <p style={successStyles}>{readySuccess}</p>}
                
                {/* Player Limit and Add Form */}
                <AddPlayerForm 
                    fetchTeamData={fetchAssignments} 
                    activeTeam={team} 
                    maxPlayers={MAX_PLAYERS} 
                />
                
                {/* Roster List */}
                <TeamRoster 
                    roster={team.roster} 
                    fetchTeamData={fetchAssignments}
                    maxPlayersPerTeam={MAX_PLAYERS}
                />
            </div>
            
            <button 
                style={{...buttonStyles, marginBottom: '20px', marginTop: 0}}
                onClick={() => setView('assignments')}
            >
                ← Back to Assignments
            </button>
        </>
    );
};

export default RosterManagementView;