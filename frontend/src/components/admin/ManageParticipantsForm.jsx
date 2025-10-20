// frontend/src/components/admin/ManageParticipantsForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

// --- STYLES (Copied from Dashboard) ---
const formContainerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const buttonStyles = { padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#00ffaa', border: '1px solid #00ffaa', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box' };
const submitButtonStyles = { ...buttonStyles, backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', marginTop: '20px' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };
const slotWrapperStyles = { display: 'flex', flexDirection: 'column', gap: '10px' }; 
const slotItemStyles = { backgroundColor: '#2c2c2c', borderRadius: '5px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' };
const readySymbolStyles = { color: '#39ff14', fontSize: '1.2em', marginLeft: '10px' };
const startTournamentButtonStyles = { ...submitButtonStyles, backgroundColor: '#00ffaa', color: '#1a1a1a', marginLeft: '20px' };

// --- COMPONENT START ---
const ManageParticipantsForm = ({ tournament, token, setView }) => {
    const navigate = useNavigate(); 
    const isTeams = tournament.participantsType === 'Team'; 

    if (!tournament) {
        return (
            <div style={{...formContainerStyles, ...errorStyles}}>
                Tournament details missing.
                <button 
                    style={{...buttonStyles, marginTop: '20px', backgroundColor: '#333', color: '#fff'}} 
                    onClick={() => setView('view')}
                >
                    ← Back to Tournament List
                </button>
            </div>
        );
    }
    
    const [participantsList, setParticipantsList] = useState([]); 
    const [isLocked, setIsLocked] = useState(false); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    // For multi-sport: show events editor below participants when triggered
    const [showEventsEditor, setShowEventsEditor] = useState(false);
    const [events, setEvents] = useState(tournament.events || []);

    // Number of events configured at tournament creation (fallback to existing events length, but never 0 if multi-sport)
    let configuredNumEvents = 0;
    if (tournament.sport === 'multi-sport') {
        const numEventsVal = Number(tournament.numEvents);
        if (!isNaN(numEventsVal) && numEventsVal > 0) {
            configuredNumEvents = numEventsVal;
        } else if (tournament.events && tournament.events.length > 0) {
            configuredNumEvents = tournament.events.length;
        } else {
            configuredNumEvents = 1; // fallback to 1 if nothing set, so UI is not locked
        }
    }

    const calculateReadyStatus = (participants) => {
        const totalParticipants = tournament.maxParticipants;
        
        if (!isTeams) {
            const allSlotsFilled = participants.every(p => p.name);
            return { readyCount: allSlotsFilled ? totalParticipants : 0, totalParticipants: totalParticipants, allReady: allSlotsFilled };
        }

        let readyCount = 0;
        participants.forEach(p => {
            if (p.isReady) {
                readyCount++;
            }
        });
        
        return { readyCount, totalParticipants: totalParticipants, allReady: readyCount === totalParticipants };
    };
    
    const { allReady } = calculateReadyStatus(participantsList);

    const handleStartTournament = async (tournamentId) => { 
        setError('');
        setSuccess('');
        
        try {
            // API call to trigger schedule generation
            const res = await axios.post(`http://localhost:5000/api/matches/generate/${tournamentId}`, {}, {
                headers: { 'x-auth-token': token }
            });

            setSuccess(res.data.msg + " Navigating to view...");
            
            setTimeout(() => {
                navigate(`/tournament/${tournamentId}`); // NAVIGATE TO THE NEW PAGE
                setView('view'); 
            }, 1500); 
            
        } catch (err) {
            console.error("Schedule Generation Error:", err.response || err);
            setError(err.response?.data?.msg || 'Failed to generate schedule. Check if all teams are ready and roster complete.');
        }
    };

    useEffect(() => {
        const fetchExistingParticipants = async () => {
            setLoading(true);
            setError('');

            try {
                const tourneyRes = await axios.get(`http://localhost:5000/api/tournaments/${tournament._id}`, {
                    headers: { 'x-auth-token': token }
                });
                const fullTourney = tourneyRes.data;

                const hasParticipants = fullTourney.registeredParticipants && fullTourney.registeredParticipants.length > 0;
                setIsLocked(hasParticipants);

                let initialList;

                // initialize events from server if available
                const serverEvents = fullTourney.events || tournament.events || [];
                // Determine target number of events to show/edit
                const target = fullTourney.numEvents || configuredNumEvents || serverEvents.length || 0;

                if ((serverEvents.length || 0) >= target && serverEvents.length > 0) {
                    setEvents(serverEvents.slice(0, target));
                } else if (target > 0) {
                    // Prefill placeholders up to target
                    const filled = Array.from({ length: target }, (_, i) => ({ ...(serverEvents[i] || {}), eventName: serverEvents[i]?.eventName || '' }));
                    setEvents(filled);
                } else {
                    setEvents(serverEvents);
                }

                if (hasParticipants) {
                    initialList = fullTourney.registeredParticipants.map((p, index) => {
                        const participantData = {
                            id: index + 1,
                            teamId: p._id, 
                            name: p.name || '', 
                            managerId: isTeams ? (p.managerId?.uniqueId || '') : undefined, 
                        };
                        return participantData;
                    });
                } else {
                    initialList = Array.from({ length: fullTourney.maxParticipants }, (_, i) => ({
                        id: i + 1, 
                        name: isTeams ? '' : `Player ${i + 1}`, // Default name for players
                        managerId: isTeams ? '' : undefined,
                    }));
                }
                
                setParticipantsList(initialList);

            } catch (err) {
                console.error("Fetch Participant Error:", err);
                setError(err.response?.data?.msg || 'Could not load tournament details for management.');
            } finally {
                setLoading(false);
            }
        };

        fetchExistingParticipants();
    }, [tournament._id, isTeams, token]);


    const handleInputChange = (id, field, value) => {
        setParticipantsList(participantsList.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (isLocked) {
            setIsLocked(false); 
            return;
        }

        setLoading(true);

        const dataToSend = participantsList.map(p => {
            if (isTeams) { return { teamId: p.teamId, teamName: p.name, managerId: p.managerId }; } else { return { name: p.name }; }
        });
        
        if (dataToSend.some(item => 
            (isTeams && (!item.teamName || !item.managerId)) || 
            (!isTeams && (!item.name || item.name.trim() === '')) // Ensure player name is not empty or just whitespace
        )) {
             setError(`Please fill all required slots (Name ${isTeams ? 'and Manager ID' : ''}).`);
             setLoading(false);
             return;
        }

        try {
            const endpoint = `/api/tournaments/${tournament._id}/register-slots-dynamic`; 
            
            await axios.post(`http://localhost:5000${endpoint}`, { participants: dataToSend }, { headers: { 'x-auth-token': token } });
            
            setSuccess(`Participants saved successfully!`);
            
            setTimeout(() => setView('view'), 1500); 

        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.msg || 'Save failed. Check backend console for details.');
        }
    };
    
    if (loading) return <div style={formContainerStyles}>Loading participant slots...</div>;

    // Action buttons for registration/editing
    const actionButton = isLocked ? (
        <button 
            type="button" 
            style={{...submitButtonStyles, backgroundColor: '#1a1a1a', color: '#00ffaa'}} 
            onClick={() => setIsLocked(false)}
        >
            Edit Participants
        </button>
    ) : (
        <button type="submit" style={submitButtonStyles} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : (participantsList.length === 0 ? 'Register' : 'Save Changes')}
        </button>
    );

    return (
        <div style={formContainerStyles}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
                <button 
                    type="button" 
                    style={{...buttonStyles, backgroundColor: '#333', color: '#fff'}} 
                    onClick={() => setView('view')}
                >
                    ← Back to Tournament List
                </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '2.5em', textTransform: 'uppercase', color: '#e0e0e0', marginBottom: '10px' }}>
                    Register Participants for: 
                    <span style={{ 
                        backgroundColor: '#00ffaa', 
                        color: '#1a1a1a', 
                        padding: '5px 15px', 
                        borderRadius: '8px', 
                        marginLeft: '10px', 
                        fontWeight: 'bold' 
                    }}>{tournament.name}</span>
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
                    <div style={{ backgroundColor: '#006400', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.1em' }}>
                        PARTICIPANTS : {tournament.participantsType}
                    </div>
                    <div style={{ backgroundColor: '#4682b4', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.1em' }}>
                        SLOTS : {participantsList.length}
                    </div>
                    {tournament.sport === 'multi-sport' && (
                        <div style={{ backgroundColor: '#ffa500', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.1em' }}>
                            EVENTS : {configuredNumEvents}
                        </div>
                    )}
                    <div style={{ backgroundColor: '#cd5c5c', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.1em' }}>
                        STATUS : {isLocked ? 'LOCKED' : 'EDITING'}
                    </div>
                </div>
            </div>

            {/* Only show participants section for multi-sport, no tabs */}
            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                <div style={slotWrapperStyles}>
                    {participantsList.map(p => {
                        const isReady = p.isReady; 
                        return (
                            <div key={p.id} style={slotItemStyles}>
                                <div style={{ width: '30px', fontWeight: 'bold' }}>{p.id}</div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        style={{...inputStyles, marginBottom: 0, flexGrow: 1}} 
                                        type="text" 
                                        placeholder={isTeams ? `Team ${p.id}` : `Player ${p.id}`}
                                        value={p.name}
                                        onChange={(e) => handleInputChange(p.id, 'name', e.target.value)}
                                        required
                                        disabled={isLocked}
                                    />
                                    {isTeams && isReady && (
                                        <span style={readySymbolStyles}>✅</span>
                                    )}
                                    {isTeams && (
                                        <input 
                                            style={{...inputStyles, marginTop: '5px', marginBottom: 0, marginLeft: '10px'}} 
                                            type="text" 
                                            placeholder={`Manager ${p.id} (Compulsory)`} 
                                            value={p.managerId}
                                            onChange={(e) => handleInputChange(p.id, 'managerId', e.target.value)}
                                            required
                                            disabled={isLocked}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>Success: {success}</p>}
            </form>

            {/* Action buttons: Save always right, Manage/Hide Events always left */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'center' }}>
                <div>
                    {tournament.sport === 'multi-sport' && (
                        showEventsEditor ? (
                            <button
                                type="button"
                                style={{ ...buttonStyles, backgroundColor: '#ffa500', color: '#1a1a1a', minWidth: '180px', fontWeight: 'bold' }}
                                onClick={() => setShowEventsEditor(false)}
                            >
                                Hide Manage Events
                            </button>
                        ) : (
                            <button
                                type="button"
                                style={{ ...buttonStyles, backgroundColor: '#ffa500', color: '#1a1a1a', minWidth: '180px', fontWeight: 'bold' }}
                                onClick={() => setShowEventsEditor(true)}
                            >
                                Manage Events
                            </button>
                        )
                    )}
                </div>
                <div>
                    {actionButton}
                </div>
            </div>

            {/* Events editor below participants if toggled */}
            {showEventsEditor && (
                <div style={{ marginTop: '30px', background: '#181818', borderRadius: '8px', padding: '20px' }}>
                    <h3 style={{ color: '#ffa500', marginBottom: '15px' }}>Manage Events</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '220px', position: 'relative', padding: '10px', borderRadius: '6px', backgroundColor: '#111' }}>
                        {events.length > 0 && events.map((ev, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    style={{ ...inputStyles, flex: 2 }}
                                    type="text"
                                    placeholder={`Event ${idx + 1} name`}
                                    value={ev.eventName || ''}
                                    onChange={(e) => {
                                        const updated = [...events];
                                        updated[idx] = { ...updated[idx], eventName: e.target.value };
                                        setEvents(updated);
                                    }}
                                />
                                <input
                                    style={{ ...inputStyles, flex: 2 }}
                                    type="text"
                                    placeholder="Venue"
                                    value={ev.venue || ''}
                                    onChange={(e) => {
                                        const updated = [...events];
                                        updated[idx] = { ...updated[idx], venue: e.target.value };
                                        setEvents(updated);
                                    }}
                                />
                            </div>
                        ))}
                        <div style={{ color: '#aaa', alignSelf: 'center', marginLeft: '8px', marginTop: '8px' }}>{events.length}/{configuredNumEvents} defined</div>
                        {/* Save Events button pinned to bottom-right */}
                        <div style={{ position: 'absolute', right: '12px', bottom: '12px', display: 'flex', gap: '10px' }}>
                            <button type="button" style={{...submitButtonStyles, minWidth: '140px'}}
                                disabled={
                                    events.length !== configuredNumEvents ||
                                    events.some(ev =>
                                        !ev?.eventName ||
                                        (tournament.venueType === 'multi' ? !ev?.venue : false)
                                    )
                                }
                                onClick={async () => {
                                    setError(''); setSuccess('');
                                    try {
                                        // Only save up to configuredNumEvents, and only eventName/venue
                                        const payloadEvents = events.slice(0, configuredNumEvents).map(ev => ({
                                            eventName: ev?.eventName || '',
                                            venue: ev?.venue || ''
                                        }));
                                        const res = await axios.put(`http://localhost:5000/api/tournaments/${tournament._id}`, { events: payloadEvents }, { headers: { 'x-auth-token': token } });
                                        setSuccess('Events saved successfully.');
                                    } catch (err) {
                                        console.error('Save events error', err);
                                        setError(err.response?.data?.msg || 'Failed to save events.');
                                    }
                                }}>Save Events</button>
                        </div>
                        {error && <p style={errorStyles}>Error: {error}</p>}
                        {success && <p style={successStyles}>Success: {success}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageParticipantsForm;