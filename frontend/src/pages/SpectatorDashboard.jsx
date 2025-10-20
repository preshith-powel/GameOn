import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const containerStyles = {
    fontFamily: 'Arial, sans-serif',
    color: '#e0e0e0',
    backgroundColor: '#1a1a1a',
    minHeight: '100vh',
    padding: '0',
    boxSizing: 'border-box',
};

const headerStyles = {
    color: '#00ffaa',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2.5em',
    fontWeight: 'bold',
};

const welcomeMessageStyles = { fontSize: '3.5em', fontWeight: '900', color: '#e0e0e0', margin: 0 };
const usernameHighlightStyles = { color: '#00ffaa', marginLeft: '15px' };
const backButtonStyles = { padding: '10px 15px', backgroundColor: '#1a1a1a', color: '#00ffaa', border: '1px solid #00ffaa', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };

const filterContainerStyles = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
};

const selectStyles = {
    padding: '10px 15px',
    borderRadius: '5px',
    border: '1px solid #333',
    backgroundColor: '#2c2c2c',
    color: '#e0e0e0',
    fontSize: '1em',
    cursor: 'pointer',
    minWidth: '200px',
    appearance: 'none',
};

const tournamentListStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    padding: '0 20px',
};

const tournamentCardStyles = {
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #333',
};

const cardTitleStyles = {
    color: '#00ffaa',
    fontSize: '1.4em',
    marginBottom: '10px',
};

const cardDetailStyles = {
    color: '#a0a0a0',
    fontSize: '0.9em',
    marginBottom: '5px',
};

const statusOngoingStyles = { color: '#ffff00', fontWeight: 'bold' }; // Yellow
const statusCompletedStyles = { color: '#00ffaa', fontWeight: 'bold' }; // Green

const noTournamentsStyles = {
    textAlign: 'center',
    color: '#a0a0a0',
    fontSize: '1.2em',
    marginTop: '50px',
};

const SpectatorDashboard = () => {
    const [tournaments, setTournaments] = useState([]);
    const [selectedSport, setSelectedSport] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [selectedStatus, setSelectedStatus] = useState('all');

    const spectatorUsername = localStorage.getItem('username');

    const fetchTournaments = async (sportFilter, statusFilter) => {
        setLoading(true);
        setError(null);
        try {
            let url = 'http://localhost:5000/api/tournaments/public';
            const params = new URLSearchParams();

            if (sportFilter !== 'all') {
                params.append('sport', sportFilter);
            }
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const res = await axios.get(url);
            setTournaments(res.data);
        } catch (err) {
            console.error('Failed to fetch public tournaments:', err);
            setError('Failed to load tournaments. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments(selectedSport, selectedStatus);
    }, [selectedSport, selectedStatus]);

    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
    };

    const handleSportChange = (e) => {
        setSelectedSport(e.target.value);
    };

    const allSports = ['football', 'badminton', 'volleyball', 'kabaddi', 'multi-sport', 'chess', 'hockey', 'carroms']; // Get this from backend if possible

    const getStatusStyle = (status) => {
        if (status.toLowerCase() === 'ongoing') {
            return statusOngoingStyles;
        } else if (status.toLowerCase() === 'completed') {
            return statusCompletedStyles;
        }
        return {};
    };

    if (loading) return <div style={{ ...containerStyles, textAlign: 'center', paddingTop: '50px' }}>Loading tournaments...</div>;
    if (error) return <div style={{ ...containerStyles, textAlign: 'center', paddingTop: '50px', color: '#ff6b6b' }}>Error: {error}</div>;

    return (
        <div style={containerStyles}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={backButtonStyles}
                    >← Back to Login</button>
                    <h1 style={{ ...welcomeMessageStyles, flex: 1, textAlign: 'center' }}>
                        Welcome, 
                        <span style={usernameHighlightStyles}>
                            {spectatorUsername ? spectatorUsername : 'Guest'}
                        </span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select style={selectStyles} onChange={handleSportChange} value={selectedSport}>
                            <option value="all">All Sports</option>
                            {allSports.map(sport => (
                                <option key={sport} value={sport}>
                                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                                </option>
                            ))}
                        </select>
                        <select style={selectStyles} onChange={handleStatusChange} value={selectedStatus}>
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h2 style={{ color: '#00ffaa', textAlign: 'center' }}>Public Tournaments ({selectedSport !== 'all' ? selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1) : 'All'} / {selectedStatus !== 'all' ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) : 'All'})</h2>
                </div>

                {tournaments.length === 0 ? (
                    <p style={noTournamentsStyles}>No tournaments to display {selectedSport !== 'all' ? ` for ${selectedSport}` : ''}{selectedStatus !== 'all' ? ` with status ${selectedStatus}.` : '.'}</p>
                ) : (
                    <div style={tournamentListStyles}>
                        {tournaments.map(tournament => (
                            <div key={tournament._id} style={tournamentCardStyles}>
                                <div>
                                    <h3 style={cardTitleStyles}>{tournament.name}</h3>
                                    <p style={cardDetailStyles}>Sport: {tournament.sport}</p>
                                    <p style={cardDetailStyles}>Format: {tournament.format}</p>
                                    <p style={cardDetailStyles}>
                                        Status: <span style={getStatusStyle(tournament.status)}>{tournament.status.toUpperCase()}</span>
                                    </p>
                                    {tournament.winner && <p style={cardDetailStyles}>Winner: {tournament.winner}</p>}
                                    <p style={cardDetailStyles}>Participants: {tournament.registeredParticipants.length}/{tournament.maxParticipants}</p>
                                </div>
                                {/* Add a button to view tournament details, if needed, but keep it read-only */}
                                <button 
                                    onClick={() => navigate(`/tournament/${tournament._id}`)}
                                    style={{
                                        padding: '8px 15px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        marginTop: '10px',
                                        alignSelf: 'flex-start',
                                        fontWeight: 'bold',
                                        transition: 'background-color 0.2s',
                                        '&:hover': { backgroundColor: '#0056b3' }
                                    }}
                                >View Details</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpectatorDashboard;
