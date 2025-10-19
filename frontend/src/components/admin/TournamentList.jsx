// frontend/src/components/admin/TournamentList.jsx - FINAL CORRECTED CODE

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

// --- STYLES (Copied from Dashboard) ---
const listContainerStyles = { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' };
const tournamentCardStyles = { 
    backgroundColor: '#2c2c2c', 
    padding: '15px', 
    borderRadius: '8px', 
    marginBottom: '10px', 
    borderLeft: '4px solid #00ffaa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center' 
};
const cardInfoStyles = { flexGrow: 1 };
const cardActionsStyles = { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' };
const buttonStyles = { padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#00ffaa', border: '1px solid #00ffaa', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const deleteButtonStyles = { padding: '8px 12px', backgroundColor: '#ff6b6b', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
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
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllTournaments = async () => {
        if (!token) { setError('Authentication required to view tournaments.'); setLoading(false); return; }
        setLoading(true);
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

    useEffect(() => {
        // NOTE: setView is now included in dependencies to properly trigger refresh
        fetchAllTournaments();
    }, [token, setView]); 

    const handleManageClick = (tournament) => {
        setSelectedTournament(tournament);
        setView('manage-participants');
    };
    
    const handleDeleteTournament = async (tournamentId, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete the tournament: ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/tournaments/${tournamentId}`, { 
                headers: { 'x-auth-token': token } 
            });
            alert(`Tournament '${name}' deleted successfully.`);
            fetchAllTournaments(); 
        } catch (err) {
            console.error('Delete failed:', err.response || err);
            alert(err.response?.data?.msg || 'Failed to delete tournament. Check console for details.');
        }
    };

    const calculateReadyStatus = (tournament) => {
        const totalParticipants = tournament.maxParticipants;
        
        if (tournament.participantsType === 'Player') {
            const count = tournament.registeredParticipants?.length || 0;
            return { readyCount: count, totalParticipants: totalParticipants, allReady: count === totalParticipants };
        }
        
        if (tournament.participantsType !== 'Team' || !tournament.playersPerTeam || tournament.playersPerTeam === 0) {
            const count = (tournament.registeredParticipants?.length || 0);
            return { readyCount: count, totalParticipants: totalParticipants, allReady: count === totalParticipants };
        }

        let readyCount = 0;
        tournament.registeredParticipants.forEach(team => {
            if (team && team.isReady) {
                readyCount++;
            }
        });
        return { readyCount, totalParticipants: totalParticipants, allReady: readyCount === totalParticipants };
    };

    if (loading) return <div style={listContainerStyles}>Loading tournaments...</div>;
    if (error) return <div style={listContainerStyles}><p style={errorStyles}>Error: {error}</p></div>;

    return (
        <div style={listContainerStyles}>
            <h2>View All Tournaments ({tournaments.length})</h2>
            
            {tournaments.length === 0 ? (
                <p>No tournaments have been created yet.</p>
            ) : (
                tournaments.map(t => {
                    const { readyCount, totalParticipants, allReady } = calculateReadyStatus(t);
                    const isTeamsTournament = t.participantsType === 'Team';
                    const isCompleted = t.status.toLowerCase() === 'completed'; 
                    const isViewable = t.status.toLowerCase() === 'ongoing' || isCompleted; 
                    const displayStatus = t.status.toUpperCase();

                    return (
                        <div key={t._id} style={tournamentCardStyles}>
                            
                            <div style={cardInfoStyles}>
                                <h3>{t.name} ({t.sport.toUpperCase()})</h3>
                                <p>Format: {t.format} | Participants: **{t.maxParticipants} {t.participantsType === 'Team' ? 'Teams' : 'Players'}**</p> 
                                
                                {isTeamsTournament && (
                                    <p>Players per Team: **{t.playersPerTeam}**</p>
                                )}
                                
                                <p style={{marginBottom: '10px'}}>
                                    Status: 
                                    <span style={{ color: getStatusColor(displayStatus), marginLeft: '5px', fontWeight: 'bold' }}>
                                        {displayStatus} 
                                        {/* FIX: Conditionally render checkmark */}
                                        {isCompleted && ' ✅'} 
                                    </span>
                                </p>
                                <p style={{fontSize: '0.9em'}}>Dates: {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'} - {t.endDate ? new Date(t.endDate).toLocaleDateString() : 'N/A'}</p>
                                
                                <p style={{fontSize: '0.9em', color: allReady ? '#00ffaa' : '#ff6b6b'}}>
                                    Readiness: {readyCount} / {totalParticipants} {isTeamsTournament ? 'Teams Ready' : 'Participants Registered'}
                                </p>
                            </div>
                            
                            <div style={cardActionsStyles}>
                                
                                <button 
                                    style={buttonStyles}
                                    onClick={() => handleManageClick(t)} 
                                >
                                    Manage Participants
                                </button>

                                {isViewable && (
                                    <button 
                                        style={{ ...buttonStyles, backgroundColor: '#39ff14', color: '#1a1a1a', border: 'none' }} 
                                        onClick={() => navigate(`/tournament/${t._id}`)} 
                                    >
                                        View Tournament
                                    </button>
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