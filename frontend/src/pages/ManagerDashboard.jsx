// frontend/src/pages/ManagerDashboard.jsx - FULL UPDATED CODE (List Tournaments)

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

// NEW STYLE: For the list of tournament assignments
const assignmentCardStyles = {
    backgroundColor: '#2c2c2c',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};


// --- VIEW COMPONENTS (Simplified/Updated) ---

// Component for the player roster interface (old dashboard content)
const RosterManagementView = ({ team, fetchTeamData, maxPlayers }) => {
    // This view displays the single team's roster management tools
    const isRosterFull = team.roster.length >= maxPlayers;
    const currentRosterCount = team.roster.length;

    return (
        <div style={cardStyles}>
            <h2 style={{ color: '#00ffaa' }}>Team: {team.name}</h2>
            <h3 style={{ fontSize: '1.2em', marginBottom: '20px' }}>
                Roster Status: {currentRosterCount} / {maxPlayers} Players
            </h3>
            
            {/* Player Limit and Add Form */}
            <AddPlayerForm 
                fetchTeamData={fetchTeamData} 
                teamId={team._id} 
                isRosterFull={isRosterFull}
                maxPlayers={maxPlayers}
            />
            
            {/* Roster List */}
            <TeamRoster 
                roster={team.roster} 
                fetchTeamData={fetchTeamData}
                maxPlayersPerTeam={maxPlayers}
                teamId={team._id}
            />
        </div>
    );
};

// Component for the initial list of assignments
const AssignmentListView = ({ assignments, setView, setActiveTeam }) => {
    return (
        <div style={cardStyles}>
            <h2 style={{ marginBottom: '20px' }}>Your Assigned Tournaments ({assignments.length})</h2>

            {assignments.length === 0 ? (
                <p>You have no active team assignments yet.</p>
            ) : (
                assignments.map(team => 
                    team.tournaments.map(assignment => (
                        <div key={assignment.tournamentId._id} style={assignmentCardStyles}>
                            <div>
                                <strong>{assignment.tournamentId.name}</strong> 
                                <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#a0a0a0' }}>
                                    ({team.name})
                                </span>
                                <p style={{ fontSize: '0.8em', color: '#ff6b6b', margin: 0 }}>
                                    Status: {assignment.tournamentId.status.toUpperCase()}
                                </p>
                            </div>
                            
                            {/* MANAGE BUTTON */}
                            <button 
                                style={{...buttonStyles, width: 'auto'}}
                                onClick={() => {
                                    // Set the active team and switch view to management
                                    setActiveTeam(team); 
                                    setView('roster-management');
                                }}
                            >
                                Manage Roster
                            </button>
                        </div>
                    ))
                )
            )}
        </div>
    );
};


// --- RENDER COMPONENT FUNCTIONS (AddPlayerForm & TeamRoster are moved to bottom for cleanliness) ---

const AddPlayerForm = ({ fetchTeamData, teamId, isRosterFull, maxPlayers }) => {
    const [playerName, setPlayerName] = useState('');
    const [contact, setContact] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const token = getManagerToken();

        if (!playerName) { setError('Player name is required.'); return; }
        if (isRosterFull) { setError(`Roster for this team is full! Max ${maxPlayers} players.`); return; }
        if (!teamId) { setError('Team context missing.'); return; }

        try {
            await axios.post('http://localhost:5000/api/manager/players', {
                name: playerName,
                contactInfo: contact,
                teamId: teamId
            }, { headers: { 'x-auth-token': token, } });
            
            setSuccess(`Player ${playerName} added successfully!`);
            setPlayerName('');
            setContact('');
            fetchTeamData(); 
        } catch (err) {
            console.error('Add player failed:', err.response?.data || err);
            setError(err.response?.data?.msg || 'Failed to add player.');
        }
    };

    return (
        <div style={cardStyles}>
            <h3>Add New Player to Roster</h3>
            <form onSubmit={handleSubmit}>
                <input style={inputStyles} type="text" placeholder="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required disabled={isRosterFull || !teamId}/>
                <input style={inputStyles} type="text" placeholder="Contact Info (Optional)" value={contact} onChange={(e) => setContact(e.target.value)} disabled={isRosterFull || !teamId}/>
                <button type="submit" style={buttonStyles} disabled={isRosterFull || !teamId}>
                    {isRosterFull ? 'Roster is Full' : 'Add Player'}
                </button>
                {error && <p style={errorStyles}>Error: {error}</p>}
                {success && <p style={successStyles}>{success}</p>}
            </form>
        </div>
    );
};

const TeamRoster = ({ roster, fetchTeamData, maxPlayersPerTeam, teamId }) => {
    const [error, setError] = useState(null);

    const handleRemove = async (playerId, playerName) => {
        if (!window.confirm(`Are you sure you want to remove ${playerName}?`)) return;
        
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
                    <div key={item.playerId._id} style={rosterItemStyles}>
                        <span>{item.playerId.name} {item.isCaptain && '(Captain)'}</span>
                        <div>
                            <button 
                                style={{...rosterControlStyles, backgroundColor: '#ff6b6b'}} 
                                onClick={() => handleRemove(item.playerId._id, item.playerId.name)}
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


// --- MAIN DASHBOARD COMPONENT ---

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [managedTeams, setManagedTeams] = useState([]); // Array of teams and their assignments
    const [activeTeam, setActiveTeam] = useState(null); // The team currently selected for roster management
    const [currentView, setView] = useState('assignments'); // State for view switching
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const managerUsername = LOGGED_IN_USERNAME; 
    
    const MAX_PLAYERS = 7; // Hardcoded limit for demonstration

    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        const token = getManagerToken();

        if (!token) { setError("No active login found. Please log in."); setLoading(false); return; }

        try {
            // CRITICAL CHANGE: Fetch assignments from the new route
            const res = await axios.get('http://localhost:5000/api/manager/assignments', {
                headers: { 'x-auth-token': token, }
            });
            
            setManagedTeams(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err.response?.data || err);
            setError(err.response?.data?.msg || 'No team assignments found for you. Contact the Admin.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    // LOGOUT Functionality
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        navigate('/'); 
    };
    
    // Determine which view to render
    const renderContent = () => {
        if (loading) return <h1>Loading Manager Dashboard...</h1>;

        if (error) {
            return <h2 style={errorStyles}>Error: {error}</h2>;
        }

        switch (currentView) {
            case 'roster-management':
                return <RosterManagementView 
                            team={activeTeam} 
                            fetchTeamData={fetchAssignments} // Refreshes ALL assignments
                            maxPlayers={MAX_PLAYERS} 
                        />;
            case 'assignments':
            default:
                return <AssignmentListView 
                            assignments={managedTeams} 
                            setView={setView} 
                            setActiveTeam={setActiveTeam} 
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
            
            {/* Back button/View Switcher */}
            {currentView === 'roster-management' && (
                <button 
                    style={{...buttonStyles, marginBottom: '20px'}}
                    onClick={() => setView('assignments')}
                >
                    ← Back to Assignments
                </button>
            )}

            {renderContent()}
            
            
            {/* Future Manager Duties Hub */}
            <div style={{...cardStyles, marginTop: '30px', borderLeft: '4px solid #333'}}>
                <h3>Manager Duties Summary</h3>
                <p>You currently manage **{managedTeams.length}** team(s) across **{managedTeams.reduce((acc, team) => acc + team.tournaments.length, 0)}** tournament assignments.</p>
                <p style={{fontSize: '0.9em', color: '#a0a0a0'}}>Use the list above to manage your rosters.</p>
            </div>
            
        </div>
    );
};

export default ManagerDashboard;