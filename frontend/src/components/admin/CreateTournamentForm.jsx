// frontend/src/components/admin/CreateTournamentForm.jsx - FINAL CORRECTED CODE (Using SPORT_LIST & Removed Unwanted Features)

import React, { useState } from 'react';
import axios from 'axios';
import { SPORT_LIST } from '../../data/sportConstants'; // FIX: Import the centralized list

// Helper function for Single Elimination validation (moved from Dashboard)
const isPowerOfTwo = (n) => {
    return n && (n & (n - 1)) === 0;
};

// --- STYLES (Kept for reference) ---
const formContainerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const inputGroupStyles = { marginBottom: '15px' };
const labelStyles = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e0e0e0' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box' };
const selectStyles = { ...inputStyles, appearance: 'none' };
const submitButtonStyles = { padding: '10px 20px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s', marginTop: '20px' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };

// --- COMPONENT START ---
const CreateTournamentForm = ({ setView, token }) => {
    const [formData, setFormData] = useState({
        name: '', sport: 'football', format: 'single elimination', 
        participantsType: 'Team', maxParticipants: 4, playersPerTeam: 5, 
        liveScoreEnabled: false, 
        venueType: 'off', venues: '',
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

        if (type === 'checkbox') { newValue = checked; }
        if (name === 'participantsType' && newValue === 'Player') { setFormData(prev => ({ ...prev, participantsType: 'Player', playersPerTeam: 0 })); return; }

        setFormData({ ...formData, [name]: newValue, });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');

        if (isSingleElimination && !isValidBracketSize) {
            setError(bracketError);
            return;
        }

        if (formData.participantsType === 'Team' && (!formData.playersPerTeam || formData.playersPerTeam < 1)) { setError('Please specify the number of players per team.'); return; }
        if (formData.maxParticipants < 2) { setError('Minimum 2 participants (teams or players) required.'); return; }

        const dataToSubmit = {
            ...formData,
            playersPerTeam: formData.participantsType === 'Team' ? formData.playersPerTeam : undefined,
            venues: formData.venueType === 'multi' ? formData.venues.split(',').map(v => v.trim()) : (formData.venueType === 'single' ? [formData.venues] : []),
            liveScoreEnabled: false,
        };

        try {
            await axios.post('http://localhost:5000/api/tournaments', dataToSubmit, { headers: { 'x-auth-token': token, } });
            setSuccess(`Tournament created successfully!`);
            setFormData(prev => ({ ...prev, name: '', startDate: '', endDate: '' }));
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
                            {/* FIX: Use the imported SPORT_LIST for consistency */}
                            {SPORT_LIST.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                    <div style={{...inputGroupStyles, flex: 1}}>
                        <label style={labelStyles} htmlFor="format">Tournament Format</label>
                        <select style={selectStyles} id="format" name="format" value={formData.format} onChange={handleChange} required>
                            <option value="single elimination">Single Elimination</option>
                            <option value="round robin">Round Robin</option>
                            <option value="group stage">Group Stage</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{...inputGroupStyles, flex: 1}}>
                        <label style={labelStyles} htmlFor="participantsType">Participants</label>
                        <select 
                            style={selectStyles} 
                            id="participantsType" 
                            name="participantsType" 
                            value={formData.participantsType} 
                            onChange={handleChange} 
                            required
                        >
                            <option value="Team">Teams</option>
                            <option value="Player">Players (Individual)</option>
                        </select>
                    </div>
                    <div style={{...inputGroupStyles, flex: 1}}>
                        <label style={labelStyles} htmlFor="maxParticipants">No. of {formData.participantsType.charAt(0).toUpperCase() + formData.participantsType.slice(1)}</label>
                        <input style={inputStyles} type="number" id="maxParticipants" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} required min="2" />
                        {bracketError && <p style={errorStyles}>{bracketError}</p>} 
                    </div>
                    {formData.participantsType === 'Team' && (<div style={{...inputGroupStyles, flex: 1}}><label style={labelStyles} htmlFor="playersPerTeam">Players Per Team</label><input style={inputStyles} type="number" id="playersPerTeam" name="playersPerTeam" value={formData.playersPerTeam} onChange={handleChange} required min="1" /></div>)}
                </div>
                
                {/* DATE FIELDS REMOVED */}

                <div style={inputGroupStyles}><label style={labelStyles} htmlFor="venueType">Venue Type</label><select style={selectStyles} id="venueType" name="venueType" value={formData.venueType} onChange={handleChange} required><option value="off">No Venue</option><option value="single">Single Venue</option><option value="multi">Multiple Venues</option></select></div>
                
                {(formData.venueType !== 'off') && (<div style={inputGroupStyles}><label style={labelStyles} htmlFor="venues">Venue Name(s)</label><input style={inputStyles} type="text" id="venues" name="venues" placeholder={formData.venueType === 'single' ? 'e.g., College Ground' : 'e.g., Venue A, Venue B, Venue C (comma separated)'} value={formData.venues} onChange={handleChange} required /></div>)}
                
                {/* LIVE SCORE CHECKBOX REMOVED */}

                <button type="submit" style={submitButtonStyles} disabled={!!bracketError}>Create Tournament</button>
                
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>Success: {success}</p>}
            </form>
        </div>
    );
};

export default CreateTournamentForm;