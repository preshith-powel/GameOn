import React, { useState, useEffect } from 'react';
import MatchCard from './MatchCard'; // Assuming MatchCard is a generic component to display match details

const MultisportScorecard = ({ tournament, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
    const [localEvents, setLocalEvents] = useState([]);

    useEffect(() => {
        if (tournament && tournament.events) {
            // Initialize localEvents with event data from the tournament
            // This structure will allow individual event scores to be managed if needed
            setLocalEvents(tournament.events.map(event => ({
                ...event,
                matches: [] // Matches for each event would be fetched or generated separately
            })));
        }
    }, [tournament]);

    if (!tournament || !tournament.events || tournament.events.length === 0) {
        return <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '20px' }}>No events defined for this multi-sport tournament.</div>;
    }

    return (
        <div style={multiSportScorecardStyles.container}>
            <h2 style={multiSportScorecardStyles.header}>Multi-Sport Overview</h2>
            <div style={multiSportScorecardStyles.eventList}>
                {localEvents.map((event, index) => (
                    <div key={event._id || index} style={multiSportScorecardStyles.eventCard}>
                        <h3 style={multiSportScorecardStyles.eventName}>{event.eventName}</h3>
                        <p style={multiSportScorecardStyles.eventDetail}>Venue: {event.eventVenue || 'N/A'}</p>
                        <p style={multiSportScorecardStyles.eventDetail}>Players per event: {event.playersPerEvent || 'N/A'}</p>
                        <p style={multiSportScorecardStyles.eventDetail}>Status: <span style={multiSportScorecardStyles.statusText}>{event.status.toUpperCase()}</span></p>
                        {/* Render individual matches for this event if available. For now, just a placeholder. */}
                        <div style={multiSportScorecardStyles.eventMatches}>
                            <p style={multiSportScorecardStyles.noMatches}>Matches for this event will appear here.</p>
                        </div>
                        {/* A button to view details or manage this specific event if needed */}
                        {/* <button style={multiSportScorecardStyles.eventButton}>View Event Details</button> */}
                    </div>
                ))}
            </div>

            <div style={multiSportScorecardStyles.overallStandings}>
                <h3 style={multiSportScorecardStyles.standingsHeader}>Overall Team Standings</h3>
                {tournament.teamPoints && tournament.teamPoints.length > 0 ? (
                    <ul style={multiSportScorecardStyles.standingsList}>
                        {[...tournament.teamPoints].sort((a, b) => b.totalPoints - a.totalPoints).map((teamPoint, index) => (
                            <li key={teamPoint.teamId._id || index} style={multiSportScorecardStyles.standingsItem}>
                                {teamPoint.teamId.name}: <span style={multiSportScorecardStyles.points}>{teamPoint.totalPoints} points</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={multiSportScorecardStyles.noStandings}>No team standings available yet.</p>
                )}
            </div>
        </div>
    );
};

const multiSportScorecardStyles = {
    container: {
        backgroundColor: '#2c2c2c',
        borderRadius: '10px',
        padding: '20px',
        margin: '20px 0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        color: '#e0e0e0',
    },
    header: {
        color: '#00ffaa',
        textAlign: 'center',
        marginBottom: '25px',
        fontSize: '2.2em',
        borderBottom: '2px solid #3a3a3a',
        paddingBottom: '15px',
    },
    eventList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
    },
    eventCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '18px',
        border: '1px solid #444',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
    eventName: {
        color: '#00cc88',
        fontSize: '1.5em',
        marginBottom: '10px',
        borderBottom: '1px solid #333',
        paddingBottom: '8px',
    },
    eventDetail: {
        fontSize: '0.95em',
        marginBottom: '5px',
        color: '#b0b0b0',
    },
    statusText: {
        fontWeight: 'bold',
        color: '#ffff00', // Example: yellow for pending/ongoing, green for completed
    },
    eventMatches: {
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid #333',
    },
    noMatches: {
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    overallStandings: {
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #444',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
    standingsHeader: {
        color: '#00ffaa',
        fontSize: '1.8em',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px',
    },
    standingsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    standingsItem: {
        fontSize: '1.1em',
        padding: '8px 0',
        borderBottom: '1px dashed #3a3a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    points: {
        fontWeight: 'bold',
        color: '#00ffaa',
        fontSize: '1.2em',
    },
    noStandings: {
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
    },
};

export default MultisportScorecard;

