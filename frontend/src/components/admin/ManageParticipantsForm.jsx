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

                if (hasParticipants) {
                    initialList = fullTourney.registeredParticipants.map((p, index) => {
                        const participantData = {
                            id: index + 1,
                            teamId: p._id, 
                            name: p.name || '', 
                            managerId: isTeams ? (p.managerId?.uniqueId || '') : undefined, 
                            isReady: p.isReady || false
                        };
                        return participantData;
                    });
                } else {
                    initialList = Array.from({ length: fullTourney.maxParticipants }, (_, i) => ({ 
                        id: i + 1, name: '', managerId: isTeams ? '' : undefined, 
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
            if (isTeams) { return { teamName: p.name, managerId: p.managerId }; } else { return { name: p.name }; }
        });
        
        if (dataToSend.some(item => (isTeams && (!item.teamName || !item.managerId)) || (!isTeams && !item.name))) {
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
            {loading ? 'Saving...' : 'Register/Save Changes'}
        </button>
    );

    return (
        <div style={formContainerStyles}>
            <h2>Register Participants for: {tournament.name}</h2>
            <p>Type: **{tournament.participantsType.toUpperCase()}** | Slots: **{participantsList.length}**</p> 
            
            <p style={{marginTop: '10px', fontSize: '0.9em', color: isLocked ? '#00ffaa' : '#fff000'}}>
                Status: **{isLocked ? 'LOCKED' : 'EDITING'}**
            </p>
            
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'center' }}>
                
                <button 
                    type="button" 
                    style={{...buttonStyles, backgroundColor: '#333', color: '#fff'}} 
                    onClick={() => setView('view')}
                >
                    ← Back to Tournament List
                </button>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                    {(isLocked && allReady && tournament.status.toLowerCase() === 'pending') && ( 
                        <button 
                            style={startTournamentButtonStyles}
                            onClick={() => handleStartTournament(tournament._id)} 
                        >
                            Start Tournament
                        </button>
                    )}
                    {actionButton}
                </div>
            </div>
        </div>
    );
};

export default ManageParticipantsForm;