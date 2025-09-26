// frontend/src/pages/ManagerDashboard.jsx - FULL UPDATED CODE (Manager Ready Button)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Global Functions to get data from Local Storage ---
const getManagerToken = () => localStorage.getItem('token'); 
const LOGGED_IN_USERNAME = localStorage.getItem('username') || 'Manager'; 

// --- STYLES (Simplified) ---
const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0', position: 'relative' };
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' };
const rosterItemStyles = { padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inputStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box', marginBottom: '10px' };
const buttonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };

const welcomeMessageStyles = { fontSize: '3em', fontWeight: '900', color: '#e0e0e0', margin: 0 };
const usernameHighlightStyles = { color: '#00ffaa', marginLeft: '15px' };
const headerWrapperStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoutButtonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const rosterControlStyles = { padding: '5px 10px', marginLeft: '10px', backgroundColor: '#ff6b6b', color: '#1a1a1a', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' };
const selectStyles = { width: '100%', padding: '10px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0', boxSizing: 'border-box', marginBottom: '10px' };

const assignmentCardStyles = { 
    backgroundColor: '#2c2c2c',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const breadcrumbStyles = { marginBottom: '15px', fontSize: '0.9em', color: '#a0a0a0' };
const readyMessageStyles = { 
    marginLeft: '20px', 
    color: '#39ff14', 
    fontWeight: 'bold', 
    fontSize: '0.8em',
    padding: '3px 8px',
    border: '1px solid #39ff14',
    borderRadius: '4px'
};

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


// --- RENDER COMPONENT FUNCTIONS ---

const AddPlayerForm = ({ fetchTeamData, activeTeam, maxPlayers }) => {
    const [playerName, setPlayerName] = useState('');
    const [contact, setContact] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const MAX_PLAYERS = maxPlayers; 
    const isRosterFull = activeTeam && activeTeam.roster.length >= MAX_PLAYERS;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const token = getManagerToken();

        if (!playerName) { setError('Player name is required.'); return; }
        if (isRosterFull) { setError(`Roster for this team is full! Max ${MAX_PLAYERS} players.`); return; }
        if (!activeTeam) { setError('Team context missing.'); return; }

        try {
            await axios.post('http://localhost:5000/api/manager/players', {
                name: playerName,
                contactInfo: contact,
                teamId: activeTeam._id
            }, { headers: { 'x-auth-token': token, } });
            
            setPlayerName('');
            setContact('');

            await fetchTeamData(); 
            setSuccess(`Player added successfully! Roster updated.`);
            
        } catch (err) {
            console.error('Add player failed:', err.response?.data || err);
            setError(err.response?.data?.msg || 'Failed to add player. Check backend console for details.');
        }
    };

    return (
        <div style={cardStyles}>
            <h3>Add New Player to Roster</h3>
            <form onSubmit={handleSubmit}>
                <input style={inputStyles} type="text" placeholder="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required disabled={isRosterFull || !activeTeam}/>
                <input style={inputStyles} type="text" placeholder="Contact Info (Optional)" value={contact} onChange={(e) => setContact(e.target.value)} disabled={isRosterFull || !activeTeam}/>
                <button type="submit" style={buttonStyles} disabled={isRosterFull || !activeTeam}>
                    {isRosterFull ? `Roster is Full (${MAX_PLAYERS}/${MAX_PLAYERS})` : 'Add Player'}
                </button>
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>{success}</p>}
            </form>
        </div>
    );
};

const TeamRoster = ({ roster, fetchTeamData, maxPlayersPerTeam, teamId, team }) => {
    const [error, setError] = useState(null);
    const [editPlayerId, setEditPlayerId] = useState(null);
    const [editPlayerName, setEditPlayerName] = useState('');

    const handleSaveEdit = async (playerId) => {
        if (!editPlayerName) {
            setError('Player name cannot be empty.');
            return;
        }
        
        setError(null);
        const token = getManagerToken();
        
        try {
            await axios.put(`http://localhost:5000/api/manager/players/${playerId}`, { 
                name: editPlayerName, 
            }, {
                headers: { 'x-auth-token': token }
            });

            setEditPlayerId(null);
            fetchTeamData();
            
        } catch (err) {
             console.error('Edit player failed:', err.response?.data || err);
             setError(err.response?.data?.msg || 'Failed to save changes. Ensure backend PUT route is configured.');
        }
    };

    const handleRemove = async (playerId, playerName) => {
        const isRosterAtLimit = roster.length === maxPlayersPerTeam;

        if (isRosterAtLimit) {
            if (!window.confirm(`WARNING: Removing ${playerName} will make your roster incomplete (${maxPlayersPerTeam - 1}/${maxPlayersPerTeam}). Continue?`)) return;
        } else {
            if (!window.confirm(`Are you sure you want to remove ${playerName}?`)) return;
        }
        
        setError(null);
        const token = getManagerToken();

        try {
            await axios.delete(`http://localhost:5000/api/manager/players/${playerId}`, {
                headers: { 'x-auth-token': token }
            });
            
            alert(`${playerName} removed.`);
            fetchTeamData();
            
        } catch (err) {
            console.error('Remove player failed:', err.response?.data || err);
            setError(err.response?.data?.msg || 'Failed to remove player.');
        }
    };

    return (
        <div style={cardStyles}>
            <h3>Current Roster ({roster.length} / {maxPlayersPerTeam})</h3>
            {error && <p style={errorStyles}>Error: {error}</p>}
            
            {roster.length === 0 ? (
                <p>No players on the roster. Add players using the form above.</p>
            ) : (
                roster.map(item => (
                    <div key={item.playerId?._id || item.id} style={rosterItemStyles}>
                        {editPlayerId === item.playerId?._id ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    value={editPlayerName} 
                                    onChange={(e) => setEditPlayerName(e.target.value)} 
                                    style={{...inputStyles, width: '200px', marginBottom: 0}}
                                />
                                <button 
                                    style={{...rosterControlStyles, backgroundColor: '#00ffaa', color: '#1a1a1a'}} 
                                    onClick={() => handleSaveEdit(item.playerId._id)}
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <span>{item.playerId?.name || 'Player Name Missing'} {item.isCaptain && '(Captain)'}</span>
                        )}

                        <div>
                            {editPlayerId !== item.playerId?._id && (
                                <button 
                                    style={{...rosterControlStyles, backgroundColor: '#00ffaa', color: '#1a1a1a'}} 
                                    onClick={() => {
                                        setEditPlayerId(item.playerId._id);
                                        setEditPlayerName(item.playerId?.name || '');
                                    }}
                                >
                                    Edit
                                </button>
                            )}
                            
                            <button 
                                style={{...rosterControlStyles, backgroundColor: '#ff6b6b'}} 
                                onClick={() => handleRemove(item.playerId._id, item.playerId?.name || 'Player')}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};


// --- View for Roster Management (UPDATED FOR READY BUTTON) ---
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
                    
                    {/* --- NEW READY BUTTON --- */}
                    <button 
                        style={teamStatusButtonStyles(isReady)}
                        onClick={handleToggleReady}
                        // Disable if trying to set to READY but roster is incomplete
                        disabled={!isRosterComplete && !isReady} 
                    >
                        {isReady ? 'UNSET READY' : 'SET READY'}
                    </button>
                    {/* ------------------------ */}
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
                    teamId={team._id}
                    team={team}
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

// Component for the initial list of assignments (Unchanged)
const AssignmentListView = ({ assignments, setView, setActiveTeam }) => {
    
    // Flatten the list to show Tournament Name and Team Name side-by-side
    const flattenedAssignments = assignments.flatMap(team => 
        team.tournaments.map(assignment => {
            const rosterCount = team.roster.length;
            const maxPlayers = assignment.tournamentId?.playersPerTeam || 5;
            // CRITICAL FIX: Check the isReady status from the team object
            const isReady = team.isReady; 

            return {
                teamName: team.name,
                teamId: team._id,
                rosterCount: rosterCount, 
                tournamentName: assignment.tournamentId?.name || 'Tournament Details Missing',
                tournamentStatus: (assignment.tournamentId?.status || 'N/A').toUpperCase(),
                fullTeamObject: team, 
                maxPlayersPerTeam: maxPlayers,
                isReady: isReady // Use the database-set isReady flag
            };
        })
    );

    return (
        <div style={cardStyles}>
            <h2 style={{ marginBottom: '20px' }}>Your Tournament Assignments ({flattenedAssignments.length})</h2>

            {flattenedAssignments.length === 0 ? (
                <p>You have no active team assignments yet.</p>
            ) : (
                flattenedAssignments.map(assignment => (
                    <div key={`${assignment.teamId}-${assignment.tournamentName}`} style={assignmentCardStyles}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div>
                                <strong>Tournament: {assignment.tournamentName}</strong> 
                                <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#a0a0a0' }}>
                                    (Team: {assignment.teamName})
                                </span>
                                <p style={{ fontSize: '0.8em', color: '#ff6b6b', margin: 0 }}>
                                    Status: {assignment.tournamentStatus} | Roster: {assignment.rosterCount}/{assignment.maxPlayersPerTeam}
                                </p>
                            </div>
                            
                            {/* TEAM READY MESSAGE */}
                            {assignment.isReady && (
                                <span style={readyMessageStyles}>
                                    TEAM READY FOR TOURNAMENT!
                                </span>
                            )}
                        </div>
                        
                        {/* MANAGE BUTTON */}
                        <button 
                            style={{...buttonStyles, width: 'auto'}}
                            onClick={() => {
                                setActiveTeam(assignment.fullTeamObject); 
                                setView('roster-management'); 
                            }}
                        >
                            Manage Roster
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};


// --- MAIN DASHBOARD COMPONENT (Unchanged) ---

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [managedTeams, setManagedTeams] = useState([]); 
    const [activeTeam, setActiveTeam] = useState(null); 
    const [currentView, setView] = useState('assignments'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const managerUsername = LOGGED_IN_USERNAME; 
    
    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        const token = getManagerToken();

        if (!token) { setError("No active login found. Please log in."); setLoading(false); return; }

        try {
            const res = await axios.get('http://localhost:5000/api/manager/assignments', {
                headers: { 'x-auth-token': token, }
            });
            
            setManagedTeams(res.data);

            if (currentView === 'roster-management' && activeTeam) {
                const freshTeam = res.data.find(team => team._id === activeTeam._id);
                if (freshTeam) setActiveTeam(freshTeam);
            }
            
            setLoading(false);
        } catch (err) {
            console.error(err.response?.data || err);
            if (err.response && err.response.status === 404) {
                 setManagedTeams([]);
                 setError(null);
            } else {
                 setError(err.response?.data?.msg || 'Failed to load team data.');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []); 

    useEffect(() => {
        fetchAssignments();
    }, [currentView]); 


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        navigate('/'); 
    };
    
    const handleManageRoster = (team) => {
        setActiveTeam(team);
        setView('roster-management');
    };
    
    const renderContent = () => {
        if (loading) return <h1>Loading Manager Dashboard...</h1>;

        if (error && managedTeams.length === 0) {
            return <h2 style={errorStyles}>Error: {error}</h2>;
        }
        
        const dynamicMaxPlayers = activeTeam?.tournaments[0]?.tournamentId?.playersPerTeam || 5;


        switch (currentView) {
            case 'roster-management':
                if (!activeTeam) {
                    setView('assignments');
                    return null;
                }
                return <RosterManagementView 
                             team={activeTeam} 
                             fetchAssignments={fetchAssignments}
                             maxPlayers={dynamicMaxPlayers} 
                             setView={setView} 
                         />;
            case 'assignments':
            default:
                return <AssignmentListView 
                             assignments={managedTeams} 
                             setView={setView} 
                             setActiveTeam={handleManageRoster}
                         />;
        }
    };
    
    return (
        <div style={containerStyles}>
            <div style={headerWrapperStyles}>
                <div style={welcomeMessageStyles}>
                    Welcome, Manager 
                    <span style={usernameHighlightStyles}>({managerUsername})</span>
                </div>
                <button style={logoutButtonStyles} onClick={handleLogout}>
                    Logout
                </button>
            </div>
            
            <h1 style={headerStyles}>Team Management Hub</h1>
            
            {renderContent()}
            
            
            <div style={{...cardStyles, marginTop: '30px', borderLeft: '4px solid #333'}}>
                <h3>Manager Duties Summary</h3>
                <p>You currently manage **{managedTeams.length}** team(s) across **{managedTeams.reduce((acc, team) => acc + team.tournaments.length, 0)}** tournament assignments.</p>
                <p style={{fontSize: '0.9em', color: '#a0a0a0'}}>Use the list above to manage your rosters.</p>
            </div>
            
        </div>
    );
};

export default ManagerDashboard;