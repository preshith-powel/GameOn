// frontend/src/components/admin/MultiSportSetup.jsx

import React, { useState } from 'react';
import axios from 'axios';

// Styles
const containerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const inputGroupStyles = { marginBottom: '15px' };
const labelStyles = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e0e0e0' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box' };
const selectStyles = { ...inputStyles, appearance: 'none' };
const buttonStyles = { padding: '10px 20px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' };
const tableStyles = { width: '100%', borderCollapse: 'collapse', marginTop: '20px' };
const thStyles = { backgroundColor: '#333', color: '#00ffaa', padding: '10px', border: '1px solid #555', textAlign: 'left' };
const tdStyles = { padding: '10px', border: '1px solid #555', backgroundColor: '#2c2c2c' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };

const MultiSportSetup = ({ tournament, setView, token }) => {
    const [teams, setTeams] = useState([]);
    const [events, setEvents] = useState([]);
    const [currentTeam, setCurrentTeam] = useState({ name: '', managerId: '' });
    const [currentEvent, setCurrentEvent] = useState({ 
        eventName: '', 
        pointsFirst: 10, 
        pointsSecond: 7, 
        pointsThird: 5, 
        playersPerEvent: 1, 
        eventVenue: '' 
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const addTeam = () => {
        if (!currentTeam.name || !currentTeam.managerId) {
            setError('Please fill in team name and manager ID');
            return;
        }
        
        setTeams([...teams, { ...currentTeam, id: Date.now() }]);
        setCurrentTeam({ name: '', managerId: '' });
        setError('');
    };

    const addEvent = () => {
        if (!currentEvent.eventName) {
            setError('Please fill in event name');
            return;
        }
        
        setEvents([...events, { ...currentEvent, id: Date.now() }]);
        setCurrentEvent({ 
            eventName: '', 
            pointsFirst: 10, 
            pointsSecond: 7, 
            pointsThird: 5, 
            playersPerEvent: 1, 
            eventVenue: '' 
        });
        setError('');
    };

    const removeTeam = (id) => {
        setTeams(teams.filter(team => team.id !== id));
    };

    const removeEvent = (id) => {
        setEvents(events.filter(event => event.id !== id));
    };

    const handleSubmit = async () => {
        if (teams.length === 0) {
            setError('Please add at least one team');
            return;
        }
        
        if (events.length === 0) {
            setError('Please add at least one event');
            return;
        }

        try {
            // Update tournament with teams and events
            await axios.put(`http://localhost:5000/api/tournaments/${tournament._id}`, {
                events: events,
                pointsSystem: 'point-total'
            }, {
                headers: { 'x-auth-token': token }
            });

            setSuccess('Multi-sport tournament setup completed!');
            setTimeout(() => setView('view'), 1500);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to setup tournament');
        }
    };

    return (
        <div style={containerStyles}>
            <h2>Multi-Sport Tournament Setup</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>
                Tournament: <strong>{tournament.name}</strong> | Teams: {tournament.maxParticipants}
            </p>

            {/* Add Teams Section */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#00ffaa', marginBottom: '15px' }}>Add Teams</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                        style={{...inputStyles, flex: 1}}
                        type="text"
                        placeholder="Team Name"
                        value={currentTeam.name}
                        onChange={(e) => setCurrentTeam({...currentTeam, name: e.target.value})}
                    />
                    <input
                        style={{...inputStyles, flex: 1}}
                        type="text"
                        placeholder="Manager ID"
                        value={currentTeam.managerId}
                        onChange={(e) => setCurrentTeam({...currentTeam, managerId: e.target.value})}
                    />
                    <button style={buttonStyles} onClick={addTeam}>Add Team</button>
                </div>
                
                {teams.length > 0 && (
                    <table style={tableStyles}>
                        <thead>
                            <tr>
                                <th style={thStyles}>Team Name</th>
                                <th style={thStyles}>Manager ID</th>
                                <th style={thStyles}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map(team => (
                                <tr key={team.id}>
                                    <td style={tdStyles}>{team.name}</td>
                                    <td style={tdStyles}>{team.managerId}</td>
                                    <td style={tdStyles}>
                                        <button 
                                            style={{...buttonStyles, backgroundColor: '#ff6b6b', padding: '5px 10px'}}
                                            onClick={() => removeTeam(team.id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Events Section */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#00ffaa', marginBottom: '15px' }}>Add Events</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <input
                        style={inputStyles}
                        type="text"
                        placeholder="Event Name"
                        value={currentEvent.eventName}
                        onChange={(e) => setCurrentEvent({...currentEvent, eventName: e.target.value})}
                    />
                    <input
                        style={inputStyles}
                        type="number"
                        placeholder="1st Place Points"
                        value={currentEvent.pointsFirst}
                        onChange={(e) => setCurrentEvent({...currentEvent, pointsFirst: parseInt(e.target.value) || 0})}
                    />
                    <input
                        style={inputStyles}
                        type="number"
                        placeholder="2nd Place Points"
                        value={currentEvent.pointsSecond}
                        onChange={(e) => setCurrentEvent({...currentEvent, pointsSecond: parseInt(e.target.value) || 0})}
                    />
                    <input
                        style={inputStyles}
                        type="number"
                        placeholder="3rd Place Points"
                        value={currentEvent.pointsThird}
                        onChange={(e) => setCurrentEvent({...currentEvent, pointsThird: parseInt(e.target.value) || 0})}
                    />
                    <input
                        style={inputStyles}
                        type="number"
                        placeholder="Players per Event"
                        value={currentEvent.playersPerEvent}
                        onChange={(e) => setCurrentEvent({...currentEvent, playersPerEvent: parseInt(e.target.value) || 1})}
                    />
                    <input
                        style={inputStyles}
                        type="text"
                        placeholder="Event Venue"
                        value={currentEvent.eventVenue}
                        onChange={(e) => setCurrentEvent({...currentEvent, eventVenue: e.target.value})}
                    />
                </div>
                <button style={buttonStyles} onClick={addEvent}>Add Event</button>
                
                {events.length > 0 && (
                    <table style={tableStyles}>
                        <thead>
                            <tr>
                                <th style={thStyles}>Event Name</th>
                                <th style={thStyles}>1st Points</th>
                                <th style={thStyles}>2nd Points</th>
                                <th style={thStyles}>3rd Points</th>
                                <th style={thStyles}>Players</th>
                                <th style={thStyles}>Venue</th>
                                <th style={thStyles}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id}>
                                    <td style={tdStyles}>{event.eventName}</td>
                                    <td style={tdStyles}>{event.pointsFirst}</td>
                                    <td style={tdStyles}>{event.pointsSecond}</td>
                                    <td style={tdStyles}>{event.pointsThird}</td>
                                    <td style={tdStyles}>{event.playersPerEvent}</td>
                                    <td style={tdStyles}>{event.eventVenue}</td>
                                    <td style={tdStyles}>
                                        <button 
                                            style={{...buttonStyles, backgroundColor: '#ff6b6b', padding: '5px 10px'}}
                                            onClick={() => removeEvent(event.id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button 
                    style={{...buttonStyles, fontSize: '16px', padding: '15px 30px'}}
                    onClick={handleSubmit}
                >
                    Complete Setup
                </button>
                <button 
                    style={{...buttonStyles, backgroundColor: '#666', color: '#fff'}}
                    onClick={() => setView('view')}
                >
                    Cancel
                </button>
            </div>

            {error && <p style={errorStyles}>Error: {error}</p>}
            {success && <p style={successStyles}>Success: {success}</p>}
        </div>
    );
};

export default MultiSportSetup;
















