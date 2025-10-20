// frontend/src/components/admin/MultiSportSetup.jsx


import React, { useState } from 'react';
import axios from 'axios';

const containerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', maxWidth: 900, margin: '0 auto' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box' };
const buttonStyles = { padding: '10px 20px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };

// Helper: get number of events from tournament
function getNumEvents(tournament) {
    if (!tournament) return undefined;
    let n = tournament.numEvents;
    if (typeof n === 'string') n = parseInt(n);
    return n;
}

const MultiSportSetup = ({ tournament, setView, token }) => {
    const numEvents = getNumEvents(tournament);
    const [events, setEvents] = useState(() => {
        // If tournament.events exists, prefill; else, create empty slots
        if (Array.isArray(tournament?.events) && tournament.events.length > 0) {
            return tournament.events.map(e => ({ ...defaultEvent(), ...e }));
        }
        return Array.from({ length: numEvents }, () => defaultEvent());
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Handle event field change
    const handleEventChange = (idx, field, value) => {
        setEvents(evts => evts.map((e, i) => i === idx ? { ...e, [field]: value } : e));
    };

    // Save events to backend
    const handleSaveEvents = async () => {
        // Validate all fields filled
        for (let e of events) {
            if (!e.eventName || !e.eventVenue || !e.playersPerEvent) {
                setError('Please fill all fields for every event.');
                return;
            }
        }
        try {
            await axios.put(`http://localhost:5000/api/tournaments/${tournament._id}`, {
                events,
                numEvents: numEvents,
                pointsSystem: 'point-total'
            }, {
                headers: { 'x-auth-token': token }
            });
            setSuccess('Events saved successfully!');
            setTimeout(() => setView('view'), 1200);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to save events');
        }
    };

    return (
        <div style={containerStyles}>
            <h2>Multi-Sport Event Setup</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>
                Tournament: <strong>{tournament?.name}</strong> | No. of Events: <strong>{numEvents}</strong>
            </p>

            <form onSubmit={e => { e.preventDefault(); handleSaveEvents(); }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                        <tr style={{ background: '#222' }}>
                            <th style={{ color: '#00ffaa', padding: 10 }}>#</th>
                            <th style={{ color: '#00ffaa', padding: 10 }}>Event Name</th>
                            <th style={{ color: '#00ffaa', padding: 10 }}>1st Points</th>
                            <th style={{ color: '#00ffaa', padding: 10 }}>2nd Points</th>
                            <th style={{ color: '#00ffaa', padding: 10 }}>3rd Points</th>
                            <th style={{ color: '#00ffaa', padding: 10 }}>Players/Event</th>
                            <th style={{ color: '#00ffaa', padding: 10 }}>Venue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event, idx) => (
                            <tr key={idx} style={{ background: idx % 2 ? '#232323' : '#181818' }}>
                                <td style={{ padding: 8, color: '#fff', textAlign: 'center' }}>{idx + 1}</td>
                                <td style={{ padding: 8 }}>
                                    <input
                                        style={inputStyles}
                                        type="text"
                                        placeholder="Event Name"
                                        value={event.eventName}
                                        onChange={e => handleEventChange(idx, 'eventName', e.target.value)}
                                    />
                                </td>
                                <td style={{ padding: 8 }}>
                                    <input
                                        style={inputStyles}
                                        type="number"
                                        min={0}
                                        value={event.pointsFirst}
                                        onChange={e => handleEventChange(idx, 'pointsFirst', parseInt(e.target.value) || 0)}
                                    />
                                </td>
                                <td style={{ padding: 8 }}>
                                    <input
                                        style={inputStyles}
                                        type="number"
                                        min={0}
                                        value={event.pointsSecond}
                                        onChange={e => handleEventChange(idx, 'pointsSecond', parseInt(e.target.value) || 0)}
                                    />
                                </td>
                                <td style={{ padding: 8 }}>
                                    <input
                                        style={inputStyles}
                                        type="number"
                                        min={0}
                                        value={event.pointsThird}
                                        onChange={e => handleEventChange(idx, 'pointsThird', parseInt(e.target.value) || 0)}
                                    />
                                </td>
                                <td style={{ padding: 8 }}>
                                    <input
                                        style={inputStyles}
                                        type="number"
                                        min={1}
                                        value={event.playersPerEvent}
                                        onChange={e => handleEventChange(idx, 'playersPerEvent', parseInt(e.target.value) || 1)}
                                    />
                                </td>
                                <td style={{ padding: 8 }}>
                                    <input
                                        style={inputStyles}
                                        type="text"
                                        placeholder="Venue"
                                        value={event.eventVenue}
                                        onChange={e => handleEventChange(idx, 'eventVenue', e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ textAlign: 'center', marginTop: 30 }}>
                    <button
                        type="submit"
                        style={{ ...buttonStyles, fontSize: '16px', padding: '15px 30px' }}
                    >
                        Save Events
                    </button>
                    <button
                        type="button"
                        style={{ ...buttonStyles, backgroundColor: '#666', color: '#fff' }}
                        onClick={() => setView('view')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
            {error && <p style={errorStyles}>Error: {error}</p>}
            {success && <p style={successStyles}>Success: {success}</p>}
        </div>
    );
};

export default MultiSportSetup;




















