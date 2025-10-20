import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CoordinatorDashboard = () => {
    const [assignedTournaments, setAssignedTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAssignedTournaments = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication token not found. Please log in.');
                    setLoading(false);
                    return;
                }

                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    }
                };

                const res = await axios.get('http://localhost:5000/api/tournaments/coordinator-assignments', config);
                setAssignedTournaments(res.data);
            } catch (err) {
                console.error("Error fetching coordinator assignments:", err);
                setError(err.response?.data?.msg || 'Failed to fetch assigned tournaments.');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignedTournaments();
    }, []);

    const dashboardStyles = {
        container: {
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#1a1a1a',
            color: '#e0e0e0',
            minHeight: '100vh',
            padding: '20px',
            boxSizing: 'border-box',
        },
        header: {
            color: '#00ffaa',
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '2.5em',
            fontWeight: 'bold',
        },
        subHeader: {
            color: '#00cc88',
            marginBottom: '20px',
            borderBottom: '1px solid #3a3a3a',
            paddingBottom: '10px',
        },
        tournamentCard: {
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            border: '1px solid #333',
        },
        cardTitle: {
            color: '#00ffaa',
            fontSize: '1.5em',
            marginBottom: '10px',
        },
        cardDetail: {
            fontSize: '1em',
            marginBottom: '5px',
            color: '#a0a0a0',
        },
        eventList: {
            marginTop: '15px',
            borderTop: '1px dashed #3a3a3a',
            paddingTop: '15px',
        },
        eventItem: {
            backgroundColor: '#1a1a1a',
            borderRadius: '5px',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #444',
        },
        eventName: {
            color: '#00cc88',
            fontSize: '1.2em',
            marginBottom: '5px',
        },
        button: {
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1em',
            marginTop: '10px',
            marginRight: '10px',
            transition: 'background-color 0.2s',
            '&:hover': { backgroundColor: '#0056b3' },
        },
        backButton: {
            backgroundColor: '#1a1a1a',
            color: '#00ffaa',
            border: '1px solid #00ffaa',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            marginBottom: '20px',
        },
    };

    if (loading) return <div style={{ ...dashboardStyles.container, textAlign: 'center' }}>Loading assignments...</div>;
    if (error) return <div style={{ ...dashboardStyles.container, textAlign: 'center', color: '#ff6b6b' }}>Error: {error}</div>;

    return (
        <div style={dashboardStyles.container}>
            <button onClick={() => navigate(-1)} style={dashboardStyles.backButton}>← Back</button>
            <h1 style={dashboardStyles.header}>Coordinator Dashboard</h1>
            <h2 style={dashboardStyles.subHeader}>Your Assigned Tournaments & Events</h2>

            {assignedTournaments.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#a0a0a0' }}>No tournaments or events currently assigned to you.</p>
            ) : (
                assignedTournaments.map(tournament => (
                    <div key={tournament._id} style={dashboardStyles.tournamentCard}>
                        <h3 style={dashboardStyles.cardTitle}>{tournament.name} ({tournament.sport})</h3>
                        <p style={dashboardStyles.cardDetail}>Format: {tournament.format}</p>
                        <p style={dashboardStyles.cardDetail}>Participants Type: {tournament.participantsType}</p>
                        <p style={dashboardStyles.cardDetail}>Venue Type: {tournament.venueType}</p>
                        
                        {tournament.venues && tournament.venues.length > 0 && (
                            <div>
                                <h4 style={{ color: '#00cc88', marginTop: '15px', marginBottom: '10px' }}>Assigned Venues:</h4>
                                {tournament.venues.map((venue, index) => (
                                    <p key={index} style={dashboardStyles.cardDetail}>- {venue.name} (Coordinator: {venue.coordinatorId?.uniqueId || 'N/A'})</p>
                                ))}
                            </div>
                        )}

                        {tournament.events && tournament.events.length > 0 && (
                            <div style={dashboardStyles.eventList}>
                                <h4 style={{ color: '#00cc88', marginBottom: '10px' }}>Events:</h4>
                                {tournament.events.map((event, index) => (
                                    <div key={event._id || index} style={dashboardStyles.eventItem}>
                                        <p style={dashboardStyles.eventName}>Event Name: {event.eventName}</p>
                                        <p style={dashboardStyles.cardDetail}>Players Per Event: {event.playersPerEvent}</p>
                                        <p style={dashboardStyles.cardDetail}>Event Venue: {event.eventVenue}</p>
                                        <p style={dashboardStyles.cardDetail}>Status: {event.status}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                         <button 
                            onClick={() => navigate(`/tournament/${tournament._id}`)}
                            style={dashboardStyles.button}
                        >View Details</button>
                    </div>
                ))
            )}
        </div>
    );
};

export default CoordinatorDashboard;

