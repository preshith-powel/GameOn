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
    
    // --- MULTI-SPORT: Per-event player assignment ---
    const tournament = team.tournaments[0]?.tournamentId;
    const isMultiSport = tournament && tournament.sport === 'multi-sport' && Array.isArray(tournament.events);
    const [eventAssignments, setEventAssignments] = useState(() => {
        // Prefill from team.eventAssignments if present
        if (Array.isArray(team.eventAssignments)) {
            const map = {};
            team.eventAssignments.filter(ea => String(ea.tournamentId) === String(tournament?._id)).forEach(ea => {
                map[ea.eventName] = ea.playerIds.map(String);
            });
            return map;
        }
        return {};
    });
    const [assignError, setAssignError] = useState('');
    const [assignSuccess, setAssignSuccess] = useState('');

    const handleAssignChange = (eventName, playerId, checked) => {
        setEventAssignments(prev => {
            const prevList = prev[eventName] || [];
            return {
                ...prev,
                [eventName]: checked
                    ? [...prevList, playerId]
                    : prevList.filter(id => id !== playerId)
            };
        });
    };

    const handleSaveAssignments = async () => {
        setAssignError(''); setAssignSuccess('');
        try {
            const token = getManagerToken();
            // Build array for backend
            const payload = Object.entries(eventAssignments).map(([eventName, playerIds]) => ({
                tournamentId: tournament._id,
                eventName,
                playerIds
            }));
            await axios.put(`http://localhost:5000/api/manager/team/${team._id}/event-assignments`, { assignments: payload }, { headers: { 'x-auth-token': token } });
            setAssignSuccess('Event assignments saved!');
            fetchAssignments();
        } catch (err) {
            setAssignError(err.response?.data?.msg || 'Failed to save assignments.');
        }
    };

    return (
        <>
            <div style={cardStyles}>
                <h2 style={{ color: '#00ffaa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Team: {team.name}</span>
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
                <AddPlayerForm 
                    fetchTeamData={fetchAssignments} 
                    activeTeam={team} 
                    maxPlayers={MAX_PLAYERS} 
                />
                <TeamRoster 
                    roster={team.roster} 
                    fetchTeamData={fetchAssignments}
                    maxPlayersPerTeam={MAX_PLAYERS}
                />
                {/* Multi-sport event assignment UI */}
                {isMultiSport && (
                    <div style={{ marginTop: 30, background: '#181818', borderRadius: 8, padding: 20 }}>
                        <h3 style={{ color: '#ffa500', marginBottom: 15 }}>Assign Players to Each Event</h3>
                        {tournament.events.map(ev => (
                            <div key={ev.eventName} style={{ marginBottom: 18, padding: 10, background: '#222', borderRadius: 6 }}>
                                <div style={{ fontWeight: 'bold', color: '#00ffaa', marginBottom: 6 }}>{ev.eventName}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {team.roster.length === 0 && <span style={{ color: '#ff6b6b' }}>No players in roster.</span>}
                                    {team.roster.map(item => (
                                        <label key={item.playerId?._id} style={{ color: '#e0e0e0', background: '#333', borderRadius: 4, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <input
                                                type="checkbox"
                                                checked={!!(eventAssignments[ev.eventName]?.includes(String(item.playerId?._id)))}
                                                onChange={e => handleAssignChange(ev.eventName, String(item.playerId?._id), e.target.checked)}
                                            />
                                            {item.playerId?.name || 'Player'}
                                        </label>
                                    ))}
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#aaa', marginTop: 4 }}>
                                    {eventAssignments[ev.eventName]?.length > 0
                                        ? `${eventAssignments[ev.eventName].length} assigned`
                                        : 'No players assigned (no participation)'}
                                </div>
                            </div>
                        ))}
                        {assignError && <p style={errorStyles}>Error: {assignError}</p>}
                        {assignSuccess && <p style={successStyles}>{assignSuccess}</p>}
                        <button style={{ ...buttonStyles, marginTop: 10 }} onClick={handleSaveAssignments}>Save Event Assignments</button>
                    </div>
                )}
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