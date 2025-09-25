// frontend/src/pages/AdminDashboard.jsx - FULL FINAL CODE (Single Column Layout)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Global Functions to get data from Local Storage ---
const getAdminToken = () => localStorage.getItem('token'); 
const LOGGED_IN_USERNAME = localStorage.getItem('username') || 'Admin'; 

// --- STYLES (Finalized for Layout) ---
const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0', position: 'relative' }; 
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const buttonGroupStyles = { display: 'flex', gap: '20px', marginBottom: '40px' };
const buttonStyles = { padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#00ffaa', border: '1px solid #00ffaa', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const formContainerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const inputGroupStyles = { marginBottom: '15px' };
const labelStyles = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e0e0e0' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box' };
const selectStyles = { ...inputStyles, appearance: 'none' };
const submitButtonStyles = { ...buttonStyles, backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', marginTop: '20px' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };
const listContainerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const tournamentCardStyles = { backgroundColor: '#2c2c2c', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #00ffaa' };

const welcomeMessageStyles = { fontSize: '3.5em', fontWeight: '900', color: '#e0e0e0', margin: 0 };
const usernameHighlightStyles = { color: '#00ffaa', marginLeft: '15px' };
const headerWrapperStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoutButtonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };

// --- Styles for the new Participants Layout ---
// REMOVED: participantGridStyles and swapArrowStyles
const slotWrapperStyles = { display: 'flex', flexDirection: 'column', gap: '10px' }; // Renamed from participantColumnStyles
const slotItemStyles = { backgroundColor: '#2c2c2c', borderRadius: '5px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' };


// ##################################################################
// --- HELPER COMPONENTS ---
// ##################################################################


// --- 1. CREATE TOURNAMENT FORM (Unchanged) ---

const CreateTournamentForm = ({ setView, token }) => {
    const [formData, setFormData] = useState({
        name: '', sport: 'football', format: 'single elimination', 
        startDate: '', endDate: '',
        datesRequired: true, 
        participantsType: 'teams', maxParticipants: 4, playersPerTeam: 5, 
        liveScoreEnabled: false, venueType: 'off', venues: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        if (type === 'checkbox') { newValue = checked; }
        if (name === 'participantsType' && newValue === 'players') { setFormData(prev => ({ ...prev, participantsType: 'players', playersPerTeam: 0 })); return; }
        if (name === 'datesRequired' && newValue === false) { setFormData(prev => ({ ...prev, datesRequired: false, startDate: '', endDate: '' })); return; }

        setFormData({ ...formData, [name]: newValue, });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');

        if (formData.participantsType === 'teams' && (!formData.playersPerTeam || formData.playersPerTeam < 1)) { setError('Please specify the number of players per team.'); return; }
        if (formData.maxParticipants < 2) { setError('Minimum 2 participants (teams or players) required.'); return; }
        if (formData.datesRequired && (!formData.startDate || !formData.endDate)) { setError('Start and End dates are required for scheduled tournaments.'); return; }

        const dataToSubmit = {
            ...formData,
            startDate: formData.datesRequired ? formData.startDate : undefined, 
            endDate: formData.datesRequired ? formData.endDate : undefined, 
            playersPerTeam: formData.participantsType === 'teams' ? formData.playersPerTeam : undefined,
            venues: formData.venueType === 'multi' ? formData.venues.split(',').map(v => v.trim()) : (formData.venueType === 'single' ? [formData.venues] : []),
        };

        try {
            await axios.post('http://localhost:5000/api/tournaments', dataToSubmit, { headers: { 'x-auth-token': token, } });
            setSuccess(`Tournament created successfully!`);
            setFormData(prev => ({ ...prev, name: '', startDate: '', endDate: '', }));
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
                <div style={{ display: 'flex', gap: '20px' }}><div style={{...inputGroupStyles, flex: 1}}><label style={labelStyles} htmlFor="sport">Sport Type</label><select style={selectStyles} id="sport" name="sport" value={formData.sport} onChange={handleChange} required>{['football', 'cricket', 'badminton', 'volleyball', 'basketball', 'table tennis', 'esports', 'other'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div><div style={{...inputGroupStyles, flex: 1}}><label style={labelStyles} htmlFor="format">Tournament Format</label><select style={selectStyles} id="format" name="format" value={formData.format} onChange={handleChange} required><option value="single elimination">Single Elimination</option><option value="round robin">Round Robin</option><option value="group stage">Group Stage</option></select></div></div>
                <div style={{ display: 'flex', gap: '20px' }}><div style={{...inputGroupStyles, flex: 1}}><label style={labelStyles} htmlFor="participantsType">Participants</label><select style={selectStyles} id="participantsType" name="participantsType" value={formData.participantsType} onChange={handleChange} required><option value="teams">Teams</option><option value="players">Players (Individual)</option></select></div><div style={{...inputGroupStyles, flex: 1}}><label style={labelStyles} htmlFor="maxParticipants">No. of {formData.participantsType.charAt(0).toUpperCase() + formData.participantsType.slice(1)}</label><input style={inputStyles} type="number" id="maxParticipants" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} required min="2" /></div>
                    {formData.participantsType === 'teams' && (<div style={{...inputGroupStyles, flex: 1}}><label style={labelStyles} htmlFor="playersPerTeam">Players Per Team</label><input style={inputStyles} type="number" id="playersPerTeam" name="playersPerTeam" value={formData.playersPerTeam} onChange={handleChange} required min="1" /></div>)}
                </div>
                
                <div style={inputGroupStyles}>
                    <label style={labelStyles}><input type="checkbox" name="datesRequired" checked={formData.datesRequired} onChange={handleChange} style={{ marginRight: '10px' }}/>Require Specific Start/End Dates (Uncheck if dates are NOT needed)</label>
                </div>
                
                {formData.datesRequired && (
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={inputGroupStyles}><label style={labelStyles} htmlFor="startDate">Start Date</label><input style={inputStyles} type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required={formData.datesRequired} /></div>
                        <div style={inputGroupStyles}><label style={labelStyles} htmlFor="endDate">End Date</label><input style={inputStyles} type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required={formData.datesRequired} /></div>
                    </div>
                )}

                <div style={inputGroupStyles}><label style={labelStyles} htmlFor="venueType">Venue Type</label><select style={selectStyles} id="venueType" name="venueType" value={formData.venueType} onChange={handleChange} required><option value="off">No Venue</option><option value="single">Single Venue</option><option value="multi">Multiple Venues</option></select></div>
                
                {(formData.venueType !== 'off') && (<div style={inputGroupStyles}><label style={labelStyles} htmlFor="venues">Venue Name(s)</label><input style={inputStyles} type="text" id="venues" name="venues" placeholder={formData.venueType === 'single' ? 'e.g., College Ground' : 'e.g., Venue A, Venue B, Venue C (comma separated)'} value={formData.venues} onChange={handleChange} required /></div>)}
                <div style={inputGroupStyles}><label style={labelStyles}><input type="checkbox" name="liveScoreEnabled" checked={formData.liveScoreEnabled} onChange={handleChange} style={{ marginRight: '10px' }}/>Enable Real-Time Live Scoring</label></div>
                
                <button type="submit" style={submitButtonStyles}>Create Tournament</button>
                
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>Success: {success}</p>}
            </form>
        </div>
    );
};

// --- 2. MANAGE PARTICIPANTS FORM (UPDATED FOR SINGLE COLUMN) ---

const ManageParticipantsForm = ({ tournament, token, setView }) => {
    const isTeams = tournament.participantsType === 'teams';
    const [participantsList, setParticipantsList] = useState([]); 
    const [isLocked, setIsLocked] = useState(false); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

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
                    initialList = fullTourney.registeredParticipants.map((p, index) => ({
                        id: index + 1,
                        name: isTeams ? `Team ${index + 1}` : `Player ${index + 1}`, // Placeholder Name
                        managerId: isTeams ? `MGR-${index + 1}` : undefined, // Placeholder for Manager ID
                    }));
                } else {
                    initialList = Array.from({ length: fullTourney.maxParticipants }, (_, i) => ({ 
                        id: i + 1, name: '', managerId: isTeams ? '' : undefined, 
                    }));
                }
                
                setParticipantsList(initialList);

            } catch (err) {
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
        
        // Final Validation Check (Point 5 Fix: Ensure Manager ID is COMPULSORY for teams)
        if (dataToSend.some(item => (isTeams && (!item.teamName || !item.managerId)) || (!isTeams && !item.name))) {
             setError(`Please fill all required slots (Name and Manager ID for Teams).`);
             setLoading(false);
             return;
        }

        try {
            const endpoint = `/api/tournaments/${tournament._id}/register-slots-dynamic`; 
            
            await axios.post(`http://localhost:5000${endpoint}`, { participants: dataToSend }, { headers: { 'x-auth-token': token } });
            
            setSuccess(`Participants saved successfully!`);
            setIsLocked(true); // LOCK the form after successful save
            setLoading(false);

        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.msg || 'Save failed. Check backend console for details.');
        }
    };
    
    if (loading) return <div style={formContainerStyles}>Loading participant slots...</div>;
    if (error) return <div style={{...formContainerStyles, ...errorStyles}}>{error}</div>;

    // Dynamic button based on isLocked state
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
                
                {/* Single Column Participant List (POINT 1 FIX) */}
                <div style={slotWrapperStyles}>
                    {participantsList.map(p => (
                        <div key={p.id} style={slotItemStyles}>
                            <div style={{ width: '30px', fontWeight: 'bold' }}>{p.id}</div>
                            <div style={{ flex: 1 }}>
                                <input 
                                    style={{...inputStyles, marginBottom: 0}} 
                                    type="text" 
                                    // POINT 3 FIX: Use simpler placeholder naming
                                    placeholder={isTeams ? `Team ${p.id} Name` : `Player ${p.id} Name`}
                                    value={p.name}
                                    onChange={(e) => handleInputChange(p.id, 'name', e.target.value)}
                                    required
                                    disabled={isLocked} // LOCKING MECHANISM
                                />
                                {isTeams && (
                                    <input 
                                        style={{...inputStyles, marginTop: '5px', marginBottom: 0}} 
                                        type="text" 
                                        // POINT 3 FIX: Use simpler placeholder naming
                                        placeholder={`Manager ${p.id} ID (Compulsory)`} 
                                        value={p.managerId}
                                        onChange={(e) => handleInputChange(p.id, 'managerId', e.target.value)}
                                        required
                                        disabled={isLocked} // LOCKING MECHANISM
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Error/Success Messages */}
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>Success: {success}</p>}
            </form>

            
            {/* BUTTONS MOVED BELOW THE LIST (POINT 4 FIX) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button 
                    type="button" 
                    style={{...buttonStyles, backgroundColor: '#333', color: '#fff'}} 
                    onClick={() => setView('view')}
                >
                    ← Back to Tournament List
                </button>
                
                {/* DYNAMIC REGISTER/SAVE/EDIT BUTTON (Aligned right) */}
                {actionButton}
            </div>
        </div>
    );
};


// --- 3. VIEW ALL TOURNAMENTS (Navigation logic) ---

const ViewTournaments = ({ token, setView, setSelectedTournament }) => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            if (!token) { setError('Authentication required to view tournaments.'); setLoading(false); return; }
            try {
                const res = await axios.get('http://localhost:5000/api/tournaments', { headers: { 'x-auth-token': token } });
                setTournaments(res.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch tournaments. Token may be invalid or expired.');
                setLoading(false);
                console.error(err);
            }
        };
        fetchTournaments();
    }, [token]);

    const handleManageClick = (tournament) => {
        setSelectedTournament(tournament); // Pass the entire tournament object
        setView('manage-participants');
    };

    if (loading) return <div style={listContainerStyles}>Loading tournaments...</div>;
    if (error) return <div style={listContainerStyles}>Error: {error}</div>;

    return (
        <div style={listContainerStyles}>
            <h2>View All Tournaments ({tournaments.length})</h2>
            
            {tournaments.length === 0 ? (
                <p>No tournaments have been created yet.</p>
            ) : (
                tournaments.map(t => (
                    <div key={t._id} style={tournamentCardStyles}>
                        <h3>{t.name} ({t.sport.toUpperCase()})</h3>
                        <p>Format: {t.format} | Participants: **{t.maxParticipants} {t.participantsType}**</p> 
                        {t.participantsType === 'teams' && <p>Players per Team: **{t.playersPerTeam}**</p>}
                        <p>Status: **{t.status.toUpperCase()}**</p>
                        <p>Dates: {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'} - {t.endDate ? new Date(t.endDate).toLocaleDateString() : 'N/A'}</p>
                        
                        <button 
                            style={{...buttonStyles, backgroundColor: '#00ffaa', color: '#1a1a1a', fontSize: '0.9em', marginTop: '10px', width: 'auto'}}
                            onClick={() => handleManageClick(t)} // Passes the entire tournament object
                        >
                            Manage Participants
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};


const ManageCoordinators = () => {
    return (<div style={listContainerStyles}><h2>Manage Coordinators</h2><p>Admin feature: List, add, edit, and remove coordinators here.</p></div>);
}


// --- MAIN ADMIN DASHBOARD COMPONENT ---

const AdminDashboard = () => {
    const navigate = useNavigate();
    const token = getAdminToken(); 
    const loggedInUsername = LOGGED_IN_USERNAME; 
    
    const [currentView, setCurrentView] = useState('home'); 
    const [selectedTournament, setSelectedTournament] = useState(null); 

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        navigate('/'); // Redirects to the login page
    };

    if (!token) {
        return (<div style={containerStyles}><h1 style={errorStyles}>Access Denied. Please log in as Admin.</h1></div>);
    }

    const renderContent = () => {
        switch (currentView) {
            case 'create-tournament': 
                return <CreateTournamentForm setView={setCurrentView} token={token} />;
            case 'view':
                return <ViewTournaments setView={setCurrentView} setSelectedTournament={setSelectedTournament} token={token} />; 
            case 'manage-participants': 
                return <ManageParticipantsForm tournament={selectedTournament} token={token} setView={setCurrentView} />;
            case 'coordinators':
                return <ManageCoordinators />;
            case 'home':
            default:
                return (
                    <div style={{height: '200px'}}>
                        <p style={{fontSize: '1.2em'}}>Select an option above to begin management.</p>
                    </div>
                );
        }
    }

    return (
        <div style={containerStyles}>
            
            {/* NEW: Wrapper for Welcome Message and Logout Button */}
            <div style={headerWrapperStyles}>
                {/* Personalized Welcome Message */}
                <div style={welcomeMessageStyles}>
                    Welcome, Admin 
                    <span style={usernameHighlightStyles}>({loggedInUsername})</span>
                </div>

                {/* Logout Button (Green) */}
                <button style={logoutButtonStyles} onClick={handleLogout}>
                    Logout
                </button>
            </div>
            
            <h1 style={headerStyles}>Admin Dashboard - Tournament Management</h1>
            
            <div style={buttonGroupStyles}>
                <button style={buttonStyles} onClick={() => setCurrentView('create-tournament')}>Create New Tournament</button>
                <button style={buttonStyles} onClick={() => setCurrentView('view')}>View All Tournaments</button>
                <button style={buttonStyles} onClick={() => setCurrentView('coordinators')}>Manage Coordinators</button>
            </div>

            <div className="content">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;