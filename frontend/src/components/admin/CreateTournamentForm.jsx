// frontend/src/components/admin/CreateTournamentForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

// Helper function for Single Elimination validation (moved from Dashboard)
const isPowerOfTwo = (n) => {
    return n && (n & (n - 1)) === 0;
};

// --- STYLES (Copied from Dashboard) ---
const formContainerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const inputGroupStyles = { marginBottom: '15px' };
const labelStyles = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e0e0e0' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box' };
const selectStyles = { ...inputStyles, appearance: 'none' };
const submitButtonStyles = { padding: '10px 20px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s', marginTop: '20px' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };

const teamOnlySports = [ 'kabaddi', 'volleyball', 'hockey']; // Ensure volleyball is in teamOnlySports

// --- COMPONENT START ---
const CreateTournamentForm = ({ setView, token }) => {
    const [formData, setFormData] = useState({
        name: '',
        sport: 'football',
        format: 'single elimination',
        // startDate: '',
        // endDate: '',
        participantsType: 'Team',
        maxParticipants: 4,
        playersPerTeam: 5,
        numEvents: 1,
        venueType: 'off',
        venues: '',
        pointsSystem: 'point-total',
        // New fields for Group Stage
        numGroups: 4,
        teamsPerGroup: 4,
        roundRobinMatchesPerGroup: 1, // Default 1, max 2
        winnersPerGroup: 2, // Default 2
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Derived state for error message display
    const isSingleElimination = formData.format === 'single elimination';
    const isValidBracketSize = isPowerOfTwo(Number(formData.maxParticipants)) && Number(formData.maxParticipants) >= 2;
    const bracketError = isSingleElimination && !isValidBracketSize 
        ? 'Single Elimination requires participant counts of 2, 4, 8, 16, etc.' 
        : '';

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        if (name === 'sport') {
            let newFormData = { ...formData, sport: newValue };
            if (newValue === 'multi-sport') {
                newFormData.format = 'aggregate scoring';
                newFormData.participantsType = 'Team';
                newFormData.playersPerTeam = 0; // Or adjust as per multi-sport logic
                newFormData.pointsSystem = 'point-total';
            } else if (formData.sport === 'multi-sport' && newValue !== 'multi-sport') {
                // If changing from multi-sport to another sport, reset format
                newFormData.format = 'single elimination'; // Default back to single elimination
                // Keep other fields as they were or reset as needed
            } else if (newValue === 'volleyball') {
                newFormData.participantsType = 'Team';
                newFormData.playersPerTeam = 0; // Dynamic, to be set by user
            } else if (teamOnlySports.includes(newValue)) {
                newFormData.participantsType = 'Team';
                newFormData.playersPerTeam = 0; // Set to 0 to make it dynamic
            } else if (newValue === 'badminton') {
                newFormData.participantsType = 'Player'; // Default to singles for badminton
                newFormData.playersPerTeam = 0; 
            } else if (newValue === 'chess') {
                newFormData.format = 'single elimination';
                newFormData.participantsType = 'Player';
                newFormData.playersPerTeam = 1;
            } else if (newValue === 'carroms') {
                newFormData.format = 'single elimination';
                newFormData.participantsType = 'Player'; // Default to Player for carroms
                newFormData.playersPerTeam = 1; // Default to 1 player per team for individual carroms
            } else {
                newFormData.participantsType = 'Player'; // Default for other individual sports
                newFormData.playersPerTeam = 0; // Default for other individual sports
            }
            setFormData(prev => newFormData);
            setError('');
            return;
        }

        if (name === 'format') {
            let newFormat = newValue;
            let newFormData = { ...formData, format: newFormat };
            // Reset group stage specific fields if format is not 'group stage'
            if (newFormat !== 'group stage') {
                newFormData.numGroups = 4;
                newFormData.teamsPerGroup = 4;
                newFormData.roundRobinMatchesPerGroup = 1;
                newFormData.winnersPerGroup = 2;
            }
            setFormData(prev => newFormData);
            setError('');
            return;
        }

        if (name === 'participantsType') {
            let newParticipantsType = newValue;
            let newPlayersPerTeam = formData.playersPerTeam;
            if (formData.sport === 'badminton') {
                if (newParticipantsType === 'Player') {
                    newPlayersPerTeam = 0; // Singles
                } else if (newParticipantsType === 'Team') {
                    newPlayersPerTeam = 2; // Doubles
                }
            } else if (formData.sport === 'carroms') {
                if (newParticipantsType === 'Team') {
                    newPlayersPerTeam = 2; // Carroms team is always 2 players
                } else if (newParticipantsType === 'Player') {
                    newPlayersPerTeam = 1; // Carroms individual is always 1 player
                }
            } else if (newParticipantsType === 'Player') {
                newPlayersPerTeam = 0; // For other individual sports
            } else if (newParticipantsType === 'Team') {
                // Only change if it was previously 0 (individual), otherwise keep current or default to 5
                newPlayersPerTeam = formData.playersPerTeam === 0 ? 5 : formData.playersPerTeam;
            }
            setFormData(prev => ({
                ...prev,
                participantsType: newParticipantsType,
                playersPerTeam: newPlayersPerTeam
            }));
            setError('');
            return;
        }

        // Default update for other fields, converting numbers where appropriate
        setFormData(prev => ({
            ...prev, 
            [name]: (name === 'numGroups' || name === 'teamsPerGroup' || name === 'roundRobinMatchesPerGroup' || name === 'winnersPerGroup' || name === 'maxParticipants' || name === 'playersPerTeam' || name === 'numEvents') 
                      ? Number(newValue) 
                      : newValue 
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');

        if (isSingleElimination && !isValidBracketSize) {
            setError(bracketError);
            return;
        }

        // Group Stage validation
        if (formData.format === 'group stage') {
            if (formData.numGroups < 1) { setError('Number of Groups must be at least 1.'); return; }
            if (formData.teamsPerGroup < 2) { setError('Number of Teams Per Group must be at least 2.'); return; }
            if (formData.roundRobinMatchesPerGroup < 1 || formData.roundRobinMatchesPerGroup > 2) { setError('Number of Head to Head Round Robin matches must be 1 or 2.'); return; }
            if (formData.winnersPerGroup < 1 || formData.winnersPerGroup >= formData.teamsPerGroup) { setError('Number of Winners from Each Group must be at least 1 and less than teams per group.'); return; }
        }

    // playersPerTeam is not required for multi-sport (teams may be combinations across events)
    if (formData.participantsType === 'Team' && formData.sport !== 'multi-sport' && (!formData.playersPerTeam || formData.playersPerTeam < 1)) { setError('Please specify the number of players per team.'); return; }
        if (formData.maxParticipants < 2) { setError('Minimum 2 participants (teams or players) required.'); return; }

        const dataToSubmit = {
            ...formData,
            // startDate: formData.startDate,
            // endDate: formData.endDate,
            maxParticipants: formData.format === 'group stage' ? (formData.numGroups * formData.teamsPerGroup) : formData.maxParticipants,
            playersPerTeam: formData.participantsType === 'Team' ? formData.playersPerTeam : undefined,
            numEvents: formData.sport === 'multi-sport' ? formData.numEvents : undefined,
            venues: formData.venueType === 'multi' ? formData.venues.split(',').map(v => v.trim()) : (formData.venueType === 'single' ? [formData.venues] : []),
        };

        // Clean up group stage specific fields if not group stage format
        if (formData.format !== 'group stage') {
            delete dataToSubmit.numGroups;
            delete dataToSubmit.teamsPerGroup;
            delete dataToSubmit.roundRobinMatchesPerGroup;
            delete dataToSubmit.winnersPerGroup;
        }

        try {
            await axios.post('http://localhost:5000/api/tournaments', dataToSubmit, { headers: { 'x-auth-token': token, } });
            setSuccess(`Tournament created successfully!`);
            setFormData(prev => ({ ...prev, name: '' }));
            setTimeout(() => setView('view'), 1500); 

        } catch (err) {
            console.error('Tournament creation failed:', err.response || err);
            setError(err.response?.data?.msg || 'Failed to create tournament. Token may be expired.');
        }
    };

    return (
        <div style={formContainerStyles}>
            <h2>Create Tournament</h2>
            <form onSubmit={handleSubmit}>
                <div style={inputGroupStyles}><label style={labelStyles} htmlFor="name">Tournament Name</label><input style={inputStyles} type="text" id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{...inputGroupStyles, flex: 1}}>
                        <label style={labelStyles} htmlFor="sport">Sport Type</label>
                        <select style={selectStyles} id="sport" name="sport" value={formData.sport} onChange={handleChange} required>
                            {['football', 'badminton', 'volleyball', 'kabaddi', 'multi-sport', 'chess', 'hockey', 'carroms'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                    <div style={{...inputGroupStyles, flex: 1}}>
                        <label style={labelStyles} htmlFor="format">Tournament Format</label>
                        <select 
                            style={selectStyles} 
                            id="format" 
                            name="format" 
                            value={formData.format} 
                            onChange={handleChange} 
                            required
                            disabled={formData.sport === 'multi-sport' || formData.sport === 'chess'} // Disable if multi-sport or chess is selected
                        >
                            <option value="single elimination" disabled={formData.sport === 'multi-sport' || formData.sport === 'chess'}>Single Elimination</option>
                            <option value="round robin" disabled={formData.sport === 'multi-sport' || formData.sport === 'chess'}>Round Robin</option>
                            <option value="group stage" disabled={formData.sport === 'multi-sport' || formData.sport === 'chess'}>Group Stage</option>
                            <option value="aggregate scoring" disabled={formData.sport !== 'multi-sport'}>Aggregate Scoring Method</option>
                        </select>
                    </div>
                </div>
                {/* New Group Stage specific inputs */}
                {formData.format === 'group stage' && (
                    <>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{...inputGroupStyles, flex: 1}}>
                                <label style={labelStyles} htmlFor="numGroups">No. of Groups</label>
                                <input 
                                    style={inputStyles} 
                                    type="number" 
                                    id="numGroups" 
                                    name="numGroups" 
                                    value={formData.numGroups} 
                                    onChange={handleChange} 
                                    required 
                                    min="1"
                                />
                            </div>
                            <div style={{...inputGroupStyles, flex: 1}}>
                                <label style={labelStyles} htmlFor="teamsPerGroup">No. of Teams Per Group</label>
                                <input 
                                    style={inputStyles} 
                                    type="number" 
                                    id="teamsPerGroup" 
                                    name="teamsPerGroup" 
                                    value={formData.teamsPerGroup} 
                                    onChange={handleChange} 
                                    required 
                                    min="2"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{...inputGroupStyles, flex: 1}}>
                                <label style={labelStyles} htmlFor="roundRobinMatchesPerGroup">Number of Head to Head Round Robin</label>
                                <input 
                                    style={inputStyles} 
                                    type="number" 
                                    id="roundRobinMatchesPerGroup" 
                                    name="roundRobinMatchesPerGroup" 
                                    value={formData.roundRobinMatchesPerGroup} 
                                    onChange={handleChange} 
                                    required 
                                    min="1" 
                                    max="2" // Maximum 2 round robin rounds
                                />
                            </div>
                            <div style={{...inputGroupStyles, flex: 1}}>
                                <label style={labelStyles} htmlFor="winnersPerGroup">Number of Winners from Each Group</label>
                                <input 
                                    style={inputStyles} 
                                    type="number" 
                                    id="winnersPerGroup" 
                                    name="winnersPerGroup" 
                                    value={formData.winnersPerGroup} 
                                    onChange={handleChange} 
                                    required 
                                    min="1"
                                    max={formData.teamsPerGroup -1} // Max winners is one less than teams per group
                                />
                            </div>
                        </div>
                    </>
                )}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{...inputGroupStyles, flex: 1}}>
                        <label style={labelStyles} htmlFor="participantsType">Participants</label>
                        <select 
                            style={selectStyles} 
                            id="participantsType" 
                            name="participantsType" 
                            value={teamOnlySports.includes(formData.sport) || formData.sport === 'multi-sport' ? 'Team' : (formData.sport === 'chess' ? 'Player' : formData.participantsType)} 
                            onChange={handleChange} 
                            required
                            disabled={formData.sport === 'multi-sport' || teamOnlySports.includes(formData.sport) || formData.sport === 'chess'}
                        >
                            <option value="Player" disabled={teamOnlySports.includes(formData.sport)}>Players (Individual)</option>
                            <option value="Team">Teams</option> 
                        </select>
                    </div>
                    <div style={{...inputGroupStyles, flex: 1}}>
                        <label style={labelStyles} htmlFor="maxParticipants">No. of {formData.participantsType.charAt(0).toUpperCase() + formData.participantsType.slice(1)}</label>
                        <input 
                            style={inputStyles} 
                            type="number" 
                            id="maxParticipants" 
                            name="maxParticipants" 
                            value={formData.format === 'group stage' ? (formData.numGroups * formData.teamsPerGroup) : formData.maxParticipants} 
                            onChange={handleChange} 
                            required 
                            min="2"
                            disabled={formData.format === 'group stage'} // maxParticipants is still disabled for group stage
                        />
                        {bracketError && <p style={errorStyles}>{bracketError}</p>} 
                    </div>
                    {formData.sport === 'multi-sport' ? (
                        <div style={{...inputGroupStyles, flex: 1}}>
                            <label style={labelStyles} htmlFor="numEvents">No. of Events</label>
                            <input
                                style={inputStyles}
                                type="number"
                                id="numEvents"
                                name="numEvents"
                                value={formData.numEvents}
                                onChange={handleChange}
                                required
                                min="1"
                            />
                        </div>
                    ) : (formData.participantsType === 'Team' && (
                        <div style={{...inputGroupStyles, flex: 1}}>
                            <label style={labelStyles} htmlFor="playersPerTeam">Players Per Team</label>
                            <input 
                                style={inputStyles} 
                                type="number" 
                                id="playersPerTeam" 
                                name="playersPerTeam" 
                                value={(formData.sport === 'badminton' && formData.participantsType === 'Team') ? 2 : 
                                       (formData.sport === 'carroms' && formData.participantsType === 'Team') ? 2 : 
                                       (formData.sport === 'carroms' && formData.participantsType === 'Player') ? 1 : 
                                       formData.playersPerTeam}
                                onChange={handleChange} 
                                required 
                                min="1"
                                disabled={(formData.sport === 'badminton' && formData.participantsType === 'Team') || 
                                           (formData.sport === 'carroms') || 
                                           formData.sport === 'chess'}
                            />
                        </div>
                    ))}
                    
                    {/* Removed multi-sport specific points system display */}
                    {/* {formData.format === 'multi-sport' && (
                        <div style={{...inputGroupStyles, flex: 1}}>
                            <label style={labelStyles}>Points System</label>
                            <div style={{...inputStyles, backgroundColor: '#333', color: '#00ffaa', fontWeight: 'bold'}}>
                                Point-Total System (Auto-selected)
                            </div>
                        </div>
                    )} */}
                </div>
                <div style={inputGroupStyles}><label style={labelStyles} htmlFor="venueType">Venue Type</label><select style={selectStyles} id="venueType" name="venueType" value={formData.venueType} onChange={handleChange} required><option value="off">No Venue</option><option value="single">Single Venue</option><option value="multi">Multiple Venues</option></select></div>
                
                {(formData.venueType !== 'off') && (<div style={inputGroupStyles}><label style={labelStyles} htmlFor="venues">Venue Name(s)</label><input style={inputStyles} type="text" id="venues" name="venues" placeholder={formData.venueType === 'single' ? 'e.g., College Ground' : 'e.g., Venue A, Venue B, Venue C (comma separated)'} value={formData.venues} onChange={handleChange} required /></div>)}
                
                <button type="submit" style={submitButtonStyles} disabled={!!bracketError}>Create Tournament</button>
                
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>Success: {success}</p>}
            </form>
        </div>
    );
};

export default CreateTournamentForm;