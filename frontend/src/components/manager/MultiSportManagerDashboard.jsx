import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const getManagerToken = () => localStorage.getItem('token');

const tabButtonStyles = (isActive) => ({
    padding: '10px 20px',
    marginRight: '10px',
    border: 'none',
    borderRadius: '5px 5px 0 0',
    cursor: 'pointer',
    backgroundColor: isActive ? '#00ffaa' : '#333',
    color: isActive ? '#1a1a1a' : '#e0e0e0',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    '&:hover': {
        backgroundColor: isActive ? '#00cc88' : '#555',
    },
});

const contentBoxStyles = {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '0 8px 8px 8px',
    minHeight: '400px',
    color: '#e0e0e0',
};

const MultiSportManagerDashboard = ({ team, fetchAssignments, setView }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'event-assignments'
    const [roster, setRoster] = useState([]);
    const [eventAssignments, setEventAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerContact, setNewPlayerContact] = useState('');

    useEffect(() => {
        if (team) {
            setRoster(team.roster.map(p => ({ ...p.playerId, _id: p.playerId._id })));
            // Initialize event assignments from team data, or create placeholders
            const initialAssignments = team.tournaments[0]?.tournamentId?.events.map(event => {
                const existingAssignment = team.eventAssignments.find(ea => ea.eventName === event.eventName && ea.tournamentId.toString() === team.tournaments[0]?.tournamentId._id.toString());
                return {
                    eventName: event.eventName,
                    eventVenue: event.eventVenue,
                    playersPerEvent: event.playersPerEvent,
                    playerIds: existingAssignment ? existingAssignment.playerIds.map(p => p.toString()) : []
                };
            }) || [];
            setEventAssignments(initialAssignments);
            setLoading(false);
        }
    }, [team]);

    const handlePlayerSelect = (eventName, playerId) => {
        setEventAssignments(prevAssignments => prevAssignments.map(event => {
            if (event.eventName === eventName) {
                const currentPlayers = new Set(event.playerIds);
                if (currentPlayers.has(playerId)) {
                    currentPlayers.delete(playerId);
                } else {
                    currentPlayers.add(playerId);
                }
                return { ...event, playerIds: Array.from(currentPlayers) };
            }
            return event;
        }));
    };

    const getAvailablePlayers = (currentEventIndex) => {
        const assignedPlayerIdsInPreviousEvents = new Set();
        // Collect players assigned in all events *before* the current one
        for (let i = 0; i < currentEventIndex; i++) {
            eventAssignments[i].playerIds.forEach(id => assignedPlayerIdsInPreviousEvents.add(id));
        }
        // Filter roster to exclude already assigned players
        return roster.filter(player => !assignedPlayerIdsInPreviousEvents.has(player._id));
    };

    const handleDropdownSelect = (eventName, selectedPlayerIds) => {
        setEventAssignments(prevAssignments => prevAssignments.map(event => {
            if (event.eventName === eventName) {
                return { ...event, playerIds: selectedPlayerIds };
            }
            return event;
        }));
    };

    const handleSaveEventAssignments = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const token = getManagerToken();
            const payload = {
                teamId: team._id,
                assignments: eventAssignments.map(event => ({
                    eventName: event.eventName,
                    playerIds: event.playerIds
                }))
            };
            await axios.post('http://localhost:5000/api/manager/event-assignments', payload, {
                headers: { 'x-auth-token': token }
            });
            setSuccess('Event assignments saved successfully!');
            await fetchAssignments(); // Refresh data in parent
        } catch (err) {
            console.error('Save event assignments error:', err.response?.data || err);
            setError(err.response?.data?.msg || 'Failed to save event assignments.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlayer = async () => {
        if (!newPlayerName.trim() || loading) return;
        setLoading(true);
        try {
            const token = getManagerToken();
            const payload = {
                name: newPlayerName.trim(),
                contactInfo: newPlayerContact.trim() || 'N/A',
                teamId: team._id
            };
            await axios.post('http://localhost:5000/api/manager/players', payload, {
                headers: { 'x-auth-token': token }
            });
            setNewPlayerName('');
            setNewPlayerContact('');
            // setRoster will be updated by fetchAssignments
            setSuccess('Player added successfully!');
            await fetchAssignments(); // Refresh data in parent
        } catch (err) {
            console.error('Add player error:', err.response?.data || err);
            setError(err.response?.data?.msg || 'Failed to add player.');
        } finally {
            setLoading(false);
        }
    };

    if (!team) {
        return <div style={{ color: '#ff6b6b', textAlign: 'center' }}>Team data missing for multi-sport management.</div>;
    }

    const teamRosterSize = team.roster.length;
    const tournament = team.tournaments[0]?.tournamentId;
    const isTeamReady = team.isMultiSportReady; // Use multi-sport specific readiness

    return (
        <div style={{ padding: '20px', backgroundColor: '#0a0a0a', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button
                    onClick={() => setView('assignments')}
                    style={{ padding: '10px 15px', backgroundColor: '#333', color: '#e0e0e0', border: '1px solid #555', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                    ← Back to Assignments
                </button>
                <h2 style={{ color: '#00ffaa', margin: 0 }}>Manage Multi-Sport Team: {team.name}</h2>
                {isTeamReady && <span style={{ backgroundColor: '#006400', color: 'white', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' }}>TEAM READY!</span>}
            </div>

            <div style={{ marginBottom: '15px' }}>
                <button style={tabButtonStyles(activeTab === 'roster')} onClick={() => setActiveTab('roster')}>
                    Roster ({teamRosterSize} players)
                </button>
                <button style={tabButtonStyles(activeTab === 'event-assignments')} onClick={() => setActiveTab('event-assignments')}>
                    Event Assignments
                </button>
            </div>

            <div style={contentBoxStyles}>
                {activeTab === 'roster' && (
                    <div>
                        <h3 style={{ color: '#00cc88', borderBottom: '1px solid #3a3a3a', paddingBottom: '10px', marginBottom: '20px' }}>Team Roster</h3>
                        {roster.length < (tournament?.numEvents || 0) && (
                            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="New Player Name"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    style={{ flexGrow: 1, padding: '8px', borderRadius: '5px', border: '1px solid #555', backgroundColor: '#333', color: '#e0e0e0' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Contact Info (Optional)"
                                    value={newPlayerContact}
                                    onChange={(e) => setNewPlayerContact(e.target.value)}
                                    style={{ flexGrow: 1, padding: '8px', borderRadius: '5px', border: '1px solid #555', backgroundColor: '#333', color: '#e0e0e0' }}
                                />
                                <button
                                    onClick={handleAddPlayer}
                                    disabled={!newPlayerName.trim() || loading}
                                    style={{
                                        padding: '8px 15px',
                                        backgroundColor: '#00ffaa',
                                        color: '#1a1a1a',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        transition: 'background-color 0.2s',
                                        opacity: (!newPlayerName.trim() || loading) ? 0.5 : 1
                                    }}
                                >
                                    Add Player
                                </button>
                            </div>
                        )}
                        {roster.length === 0 ? (
                            <p>No players in the roster yet. Use the form above to add players.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {roster.map(player => (
                                    <li key={player._id} style={{ backgroundColor: '#2c2c2c', padding: '10px 15px', borderRadius: '5px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{player.name} ({player.contactInfo})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === 'event-assignments' && (
                    <div>
                        <h3 style={{ color: '#00cc88', borderBottom: '1px solid #3a3a3a', paddingBottom: '10px', marginBottom: '20px' }}>Assign Players to Events</h3>
                        {eventAssignments.length === 0 ? (
                            <p>No events defined for this tournament or not loaded.</p>
                        ) : (
                            eventAssignments.map((event, index) => (
                                <div key={event.eventName} style={{ backgroundColor: '#2c2c2c', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #444' }}>
                                    <h4 style={{ color: '#00ffaa', marginTop: 0, marginBottom: '10px' }}>EVENT : {event.eventName}</h4>
                                    <p style={{ fontSize: '0.9em', color: '#a0a0a0', marginBottom: '10px' }}>Venue: {event.eventVenue || 'N/A'}</p>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', color: '#a0a0a0' }}>Select Player(s):</label>
                                        <select
                                            multiple={event.playersPerEvent > 1}
                                            value={event.playerIds}
                                            onChange={(e) => handleDropdownSelect(event.eventName, Array.from(e.target.selectedOptions).map(option => option.value))}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '5px',
                                                border: '1px solid #555',
                                                backgroundColor: '#333',
                                                color: '#e0e0e0',
                                                minHeight: event.playersPerEvent > 1 ? '80px' : 'auto',
                                                cursor: 'pointer'
                                            }}
                                            disabled={roster.length === 0 || (event.playersPerEvent > 0 && event.playerIds.length >= event.playersPerEvent && !event.playerIds.includes(player._id))}
                                        >
                                            {event.playersPerEvent > 1 && roster.length === 0 && <option value="" disabled>No players in roster</option>}
                                            {event.playersPerEvent === 1 && <option value="" disabled>Select Player</option>}
                                            {getAvailablePlayers(index).map(player => (
                                                <option key={player._id} value={player._id}>
                                                    {player.name}
                                                </option>
                                            ))}
                                        </select>
                                        {getAvailablePlayers(index).length === 0 && roster.length > 0 && <p style={{ color: '#ff6b6b', fontSize: '0.9em', marginTop: '5px' }}>All players assigned.</p>}
                                        {roster.length === 0 && <p style={{ color: '#ff6b6b', fontSize: '0.9em', marginTop: '5px' }}>Please add players to the roster first.</p>}
                                    </div>
                                    {event.playerIds.length !== event.playersPerEvent && event.playersPerEvent > 0 && (
                                        <p style={{ color: '#ff6b6b', marginTop: '10px', fontSize: '0.9em' }}>
                                            Requires {event.playersPerEvent - event.playerIds.length} more player(s)
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                        {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
                        {success && <p style={{ color: '#00ffaa' }}>Success: {success}</p>}
                        <button
                            onClick={handleSaveEventAssignments}
                            disabled={loading || eventAssignments.some(event => event.playersPerEvent > 0 && event.playerIds.length !== event.playersPerEvent)}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '1.1em',
                                marginTop: '20px',
                                transition: 'background-color 0.2s',
                                '&:hover': { backgroundColor: '#0056b3' },
                                opacity: loading ? 0.7 : 1,
                            }}
                        > {loading ? 'Processing...' : 'Make as Ready'} </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiSportManagerDashboard;
