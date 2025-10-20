// frontend/src/components/admin/TournamentList.jsx - FINAL CORRECTED CODE

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { useToast } from '../shared/ToastNotification';
import ProgressBar from '../shared/ProgressBar';

// --- STYLES (Copied from Dashboard) ---
const listContainerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const tournamentCardStyles = { 
    backgroundColor: '#2c2c2c', 
    padding: '8px 15px', // Further reduced vertical padding
    borderRadius: '8px', 
    marginBottom: '10px', 
    borderLeft: '4px solid #00ffaa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center' 
};
const cardInfoStyles = { flexGrow: 1 };
const cardActionsStyles = { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px', 
    alignItems: 'flex-end',
    width: '200px' // Fixed width for action buttons container
};
const buttonStyles = { 
    padding: '10px 20px', 
    backgroundColor: '#1a1a1a', 
    color: '#00ffaa', 
    border: '1px solid #00ffaa', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    transition: 'background-color 0.2s',
    width: '100%' // Make buttons fill the container width
};
const deleteButtonStyles = { 
    padding: '8px 12px', 
    backgroundColor: '#ff6b6b', 
    color: '#1a1a1a', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    transition: 'background-color 0.2s',
    width: '100%' // Make buttons fill the container width
};
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };

// Helper function to get the Admin's token
const getAdminToken = () => localStorage.getItem('token'); 

// Helper function to determine status color 
const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    if (s === 'pending') return '#ff6b6b'; 
    if (s === 'ongoing') return '#39ff14'; 
    if (s === 'completed') return '#a0a0a0'; 
    return '#a0a0a0'; 
};

// --- COMPONENT START ---
const TournamentList = ({ setView, setSelectedTournament }) => {
    const navigate = useNavigate(); 
    const token = getAdminToken();
    const showToast = useToast();

    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all'); // New state for active filter
    const [selectedCardId, setSelectedCardId] = useState(null); // New state for selected card highlight

    const handleStartTournament = async (tournamentId) => {
        setError('');
        // No success state needed here, as we navigate away immediately
        
        try {
            // API call to trigger schedule generation
            const res = await axios.post(`http://localhost:5000/api/matches/generate/${tournamentId}`, {}, {
                headers: { 'x-auth-token': token }
            });

            showToast(res.data.msg + " Navigating to view...");
            navigate(`/tournament/${tournamentId}`); // NAVIGATE TO THE NEW PAGE
            // No setView('view') here as we are navigating to a different page
            
        } catch (err) {
            console.error("Schedule Generation Error:", err.response || err);
            const errorMessage = err.response?.data?.msg || 'Failed to generate schedule. Check if all participants are ready.';
            showToast(errorMessage, 'error');
            setError(errorMessage);
        }
    };

    const fetchAllTournaments = async () => {
        if (!token) { setError('Authentication required to view tournaments.'); setLoading(false); return; }
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/tournaments', { headers: { 'x-auth-token': token } });
            // Sort tournaments by creation date, newest first
            const sortedTournaments = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTournaments(sortedTournaments);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch tournaments. Token may be invalid or expired.');
            setLoading(false);
            console.error(err);
        }
    };

    useEffect(() => {
        // NOTE: setView is now included in dependencies to properly trigger refresh
        fetchAllTournaments();
    }, [token, setView]); 

    const handleManageClick = (tournament) => {
        setSelectedTournament(tournament);
        setSelectedCardId(tournament._id); // Highlight this card when managing
        setView('manage-participants');
    };
    
    const getSportIcon = (sport) => {
        switch (sport.toLowerCase()) {
            case 'football': return '⚽';
            case 'cricket': return '🏏';
            case 'badminton': return '🏸';
            case 'volleyball': return '🏐';
            case 'kabaddi': return '🤼‍♂️'; // Kabaddi icon
            case 'multi-sport': return '🏅'; // Multi-sport icon
            default: return '🏅';
        }
    };

    const handleDeleteTournament = async (tournamentId, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete the tournament: ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/tournaments/${tournamentId}`, { 
                headers: { 'x-auth-token': token } 
            });
            showToast(`Tournament '${name}' deleted successfully.`, 'success');
            fetchAllTournaments(); 
        } catch (err) {
            console.error('Delete failed:', err.response || err);
            showToast(err.response?.data?.msg || 'Failed to delete tournament.', 'error');
        }
    };

    const calculateReadyStatus = (tournament) => {
        const totalParticipants = tournament.maxParticipants;
        
        if (tournament.participantsType === 'Player') {
            const count = tournament.registeredParticipants?.length || 0;
            return { readyCount: count, totalParticipants: totalParticipants, allReady: count === totalParticipants };
        }
        
        // Handle Multi-Sport tournaments specifically
        if (tournament.sport === 'multi-sport') {
            let fullyAssignedTeams = 0;
            tournament.registeredParticipants.forEach(team => {
                if (team && team.isMultiSportReady) {
                    fullyAssignedTeams++;
                }
            });
            // For multi-sport, total participants are the teams, ready count is fully assigned teams
            return { readyCount: fullyAssignedTeams, totalParticipants: totalParticipants, allReady: fullyAssignedTeams === totalParticipants };
        }
        
        // Default Team tournament logic (non-multi-sport)
        if (tournament.participantsType === 'Team') {
            let readyCount = 0;
            tournament.registeredParticipants.forEach(team => {
                if (team && team.isReady) {
                    readyCount++;
                }
            });
            return { readyCount, totalParticipants: totalParticipants, allReady: readyCount === totalParticipants };
        }
        
        // Fallback for any other unexpected scenario (should ideally not be hit)
        return { readyCount: 0, totalParticipants: totalParticipants, allReady: false };
    };

    if (loading) return <div style={listContainerStyles}>Loading tournaments...</div>;
    if (error) return <div style={listContainerStyles}><p style={errorStyles}>Error: {error}</p></div>;

    // Filter tournaments based on activeFilter
    const filteredTournaments = tournaments.filter(t => {
        if (activeFilter === 'all') return true;
        return t.status.toLowerCase() === activeFilter;
    });

    return (
        <div style={listContainerStyles}>
            <h2 style={{color: '#e0e0e0', marginBottom: '20px', textAlign: 'center', fontSize: '2.2em'}}>Tournament List</h2>
            
            {/* Filter Tabs */}
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                <button 
                    style={{...buttonStyles, backgroundColor: activeFilter === 'all' ? '#00ffaa' : '#1a1a1a', color: activeFilter === 'all' ? '#1a1a1a' : '#00ffaa'}}
                    onClick={() => setActiveFilter('all')}
                >All ({tournaments.length})</button>
                <button 
                    style={{...buttonStyles, backgroundColor: activeFilter === 'pending' ? '#00ffaa' : '#1a1a1a', color: activeFilter === 'pending' ? '#1a1a1a' : '#ff6b6b'}}
                    onClick={() => setActiveFilter('pending')}
                >Pending ({tournaments.filter(t => t.status.toLowerCase() === 'pending').length})</button>
                <button 
                    style={{...buttonStyles, backgroundColor: activeFilter === 'ongoing' ? '#00ffaa' : '#1a1a1a', color: activeFilter === 'ongoing' ? '#1a1a1a' : '#39ff14'}}
                    onClick={() => setActiveFilter('ongoing')}
                >Ongoing ({tournaments.filter(t => t.status.toLowerCase() === 'ongoing').length})</button>
                <button 
                    style={{...buttonStyles, backgroundColor: activeFilter === 'completed' ? '#00ffaa' : '#1a1a1a', color: activeFilter === 'completed' ? '#1a1a1a' : '#a0a0a0'}}
                    onClick={() => setActiveFilter('completed')}
                >Completed ({tournaments.filter(t => t.status.toLowerCase() === 'completed').length})</button>
            </div>

            {filteredTournaments.length === 0 ? (
                <p>No {activeFilter === 'all' ? '' : `${activeFilter} `}tournaments found.</p>
            ) : (
                filteredTournaments.map(t => {
                    const { readyCount, totalParticipants, allReady } = calculateReadyStatus(t);
                    const isTeamsTournament = t.participantsType === 'Team';
                    const isCompleted = t.status.toLowerCase() === 'completed'; 
                    const isViewable = t.status.toLowerCase() === 'ongoing' || isCompleted; 
                    const displayStatus = t.status.toUpperCase();

                    const isSelected = selectedCardId === t._id;

                    return (
                        <div 
                            key={t._id} 
                            style={{
                                ...tournamentCardStyles, 
                                borderLeftColor: getStatusColor(t.status),
                                transition: 'all 0.2s ease-in-out',
                                ...(isSelected && { boxShadow: '0 0 20px rgba(0, 255, 170, 0.6)', transform: 'translateY(-3px) scale(1.01)' })
                            }}
                            className="tournament-card-hover"
                            onClick={() => setSelectedCardId(t._id)} // Highlight on click
                        >
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', justifyContent: 'center' }}> {/* Reduced gap, centered vertically */}
                                <div style={{width: '100%', textAlign: 'center', marginBottom: '8px', marginTop: '15px'}}> {/* Increased top margin to bring it down */}
                                    <h3 style={{
                                        color: '#1a1a1a', 
                                        marginBottom: '2px', // Reduced margin
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '6px', // Reduced gap
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        backgroundColor: '#00ffaa',
                                        fontWeight: 'bold',
                                        fontSize: isSelected ? '1.8em' : '1.6em', // Increased font size
                                        transition: 'all 0.2s ease-in-out',
                                    }}>
                                        {t.name} 
                                    </h3>
                                    <span style={{
                                        fontSize: '1em', // Increased font size
                                        color: '#e0e0e0', // White color
                                        fontWeight: 'normal',
                                        display: 'block', 
                                        textAlign: 'center',
                                        marginTop: '0px',
                                        marginBottom: '0px', 
                                        transition: 'all 0.2s ease-in-out',
                                        textTransform: 'uppercase' // All caps
                                    }}>{t.sport} {getSportIcon(t.sport)}</span>
                                </div>
                                <p style={{fontSize: '0.9em', color: '#e0e0e0', margin: '0', textAlign: 'left'}}><span style={{textTransform: 'uppercase'}}>Format:</span> {t.format}</p> 
                                <p style={{fontSize: '0.9em', color: '#e0e0e0', margin: '0', textAlign: 'left'}}><span style={{textTransform: 'uppercase'}}>Participants:</span> <span style={{fontWeight: 'bold'}}>{t.maxParticipants} {t.participantsType === 'Team' ? 'Teams' : 'Players'}</span></p> 
                                
                                {isTeamsTournament && (
                                    <p style={{fontSize: '0.9em', color: '#e0e0e0', margin: '0', textAlign: 'left'}}><span style={{textTransform: 'uppercase'}}>Players per Team:</span> <span style={{fontWeight: 'bold'}}>{t.playersPerTeam}</span></p>
                                )}
                                
                                <p style={{marginBottom: '0px', display: 'flex', alignItems: 'center', fontSize: '0.9em'}}> {/* Removed bottom margin */}
                                    <span style={{textTransform: 'uppercase'}}>Status:</span> 
                                    <span style={{ color: getStatusColor(displayStatus), marginLeft: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {displayStatus} 
                                        {t.status.toLowerCase() === 'completed' && '✅'}
                                        {t.status.toLowerCase() === 'pending' && '🕒'}
                                        {t.status.toLowerCase() === 'ongoing' && '▶️'}
                                    </span>
                                </p>
                                
                                <ProgressBar
                                    label={isTeamsTournament ? 'Teams Ready' : 'Participants Registered'}
                                    value={readyCount}
                                    max={totalParticipants}
                                    color={allReady ? (t.status.toLowerCase() === 'pending' ? '#ffc107' : '#00ffaa') : '#ff6b6b'} // Yellow if all ready but pending, else green or red
                                />
                            </div>
                            
                            <div style={cardActionsStyles}>
                                
                                {t.format === 'multi-sport' && t.status.toLowerCase() === 'pending' && (
                                    <button 
                                        style={{ ...buttonStyles, backgroundColor: '#ff6b6b', color: '#fff' }}
                                        onClick={() => {
                                            setSelectedTournament(t);
                                            setView('multi-sport-setup');
                                        }}
                                    >
                                        Setup Multi-Sport
                                    </button>
                                )}

                                <button 
                                    style={buttonStyles}
                                    onClick={() => handleManageClick(t)} 
                                >
                                    Manage Participants
                                </button>
                                
                                {t.status.toLowerCase() === 'pending' && allReady ? (
                                    <button 
                                        style={{ ...buttonStyles, backgroundColor: '#007bff', color: '#fff', border: 'none' }} // Blue for Start Tournament
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card highlight
                                            handleStartTournament(t._id);
                                        }}
                                    >
                                        Start Tournament
                                    </button>
                                ) : (
                                    isViewable && (
                                        <button 
                                            style={{ ...buttonStyles, backgroundColor: '#39ff14', color: '#1a1a1a', border: 'none' }} 
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card highlight
                                                navigate(`/tournament/${t._id}`);
                                            }}
                                        >
                                            View Tournament
                                        </button>
                                    )
                                )}
                                
                                <button 
                                    style={deleteButtonStyles}
                                    onClick={() => handleDeleteTournament(t._id, t.name)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default TournamentList;