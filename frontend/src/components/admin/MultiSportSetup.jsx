import React, { useState, useEffect } from 'react';

const MultiSportSetup = ({ tournamentData, onDataChange }) => {
    const [events, setEvents] = useState(tournamentData.events || []);
    const [numEvents, setNumEvents] = useState(tournamentData.numEvents || 1);

    useEffect(() => {
        // Ensure the number of events matches numEvents
        if (events.length < numEvents) {
            const newEvents = [...events];
            for (let i = events.length; i < numEvents; i++) {
                newEvents.push(defaultEvent(i));
            }
            setEvents(newEvents);
        } else if (events.length > numEvents) {
            setEvents(events.slice(0, numEvents));
        }
    }, [numEvents, events]);

    useEffect(() => {
        // Update parent component with events data whenever local events change
        onDataChange({ events, numEvents });
    }, [events, numEvents, onDataChange]);

    const defaultEvent = (index) => ({
        eventName: `Event ${index + 1}`,
        pointsFirst: 10,
        pointsSecond: 7,
        pointsThird: 5,
        playersPerEvent: 1, // Default to 1 player per event
        eventVenue: '',
        coordinatorId: '',
        status: 'pending' // Default status for new events
    });

    const handleNumEventsChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1) {
            setNumEvents(value);
        }
    };

    const handleEventChange = (index, field, value) => {
        const updatedEvents = events.map((event, i) => 
            i === index ? { ...event, [field]: value } : event
        );
        setEvents(updatedEvents);
    };

    const addEvent = () => {
        setNumEvents(prev => prev + 1);
    };

    const removeEvent = (index) => {
        if (events.length > 1) {
            const updatedEvents = events.filter((_, i) => i !== index);
            setEvents(updatedEvents);
            setNumEvents(prev => prev - 1);
        }
    };

    return (
        <div style={multiSportSetupStyles.container}>
            <h3 style={multiSportSetupStyles.header}>Multi-Sport Event Setup</h3>

            <div style={multiSportSetupStyles.formGroup}>
                <label style={multiSportSetupStyles.label}>Number of Events:</label>
                <input
                    type="number"
                    value={numEvents}
                    onChange={handleNumEventsChange}
                    min="1"
                    style={multiSportSetupStyles.input}
                />
            </div>

            {events.map((event, index) => (
                <div key={index} style={multiSportSetupStyles.eventCard}>
                    <h4 style={multiSportSetupStyles.eventCardHeader}>Event {index + 1}</h4>
                    <div style={multiSportSetupStyles.formGroup}>
                        <label style={multiSportSetupStyles.label}>Event Name:</label>
                        <input
                            type="text"
                            value={event.eventName}
                            onChange={(e) => handleEventChange(index, 'eventName', e.target.value)}
                            style={multiSportSetupStyles.input}
                        />
                    </div>
                    <div style={multiSportSetupStyles.formGroup}>
                        <label style={multiSportSetupStyles.label}>Players Per Event:</label>
                        <input
                            type="number"
                            value={event.playersPerEvent}
                            onChange={(e) => handleEventChange(index, 'playersPerEvent', parseInt(e.target.value, 10) || 0)}
                            min="0"
                            style={multiSportSetupStyles.input}
                        />
                    </div>
                    <div style={multiSportSetupStyles.formGroup}>
                        <label style={multiSportSetupStyles.label}>Venue:</label>
                        <input
                            type="text"
                            value={event.eventVenue}
                            onChange={(e) => handleEventChange(index, 'eventVenue', e.target.value)}
                            style={multiSportSetupStyles.input}
                        />
                    </div>
                    {tournamentData.venueType === 'multi' && (
                        <div style={multiSportSetupStyles.formGroup}>
                            <label style={multiSportSetupStyles.label}>Coordinator ID:</label>
                            <input
                                type="text"
                                value={event.coordinatorId}
                                onChange={(e) => handleEventChange(index, 'coordinatorId', e.target.value)}
                                style={multiSportSetupStyles.input}
                                required={tournamentData.venueType === 'multi'}
                            />
                        </div>
                    )}
                    <div style={multiSportSetupStyles.pointsGroup}>
                        <label style={multiSportSetupStyles.label}>Points for 1st:</label>
                        <input
                            type="number"
                            value={event.pointsFirst}
                            onChange={(e) => handleEventChange(index, 'pointsFirst', parseInt(e.target.value, 10) || 0)}
                            min="0"
                            style={multiSportSetupStyles.inputSmall}
                        />
                        <label style={multiSportSetupStyles.label}>2nd:</label>
                        <input
                            type="number"
                            value={event.pointsSecond}
                            onChange={(e) => handleEventChange(index, 'pointsSecond', parseInt(e.target.value, 10) || 0)}
                            min="0"
                            style={multiSportSetupStyles.inputSmall}
                        />
                        <label style={multiSportSetupStyles.label}>3rd:</label>
                        <input
                            type="number"
                            value={event.pointsThird}
                            onChange={(e) => handleEventChange(index, 'pointsThird', parseInt(e.target.value, 10) || 0)}
                            min="0"
                            style={multiSportSetupStyles.inputSmall}
                        />
                    </div>
                    {events.length > 1 && (
                        <button
                            type="button"
                            onClick={() => removeEvent(index)}
                            style={multiSportSetupStyles.removeButton}
                        >Remove Event</button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addEvent} style={multiSportSetupStyles.addButton}>+ Add Another Event</button>
        </div>
    );
};

const multiSportSetupStyles = {
    container: {
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        color: '#e0e0e0',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    header: {
        color: '#00ffaa',
        fontSize: '1.8em',
        marginBottom: '20px',
        textAlign: 'center',
        borderBottom: '1px solid #444',
        paddingBottom: '10px',
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#a0a0a0',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #555',
        backgroundColor: '#333',
        color: '#e0e0e0',
        fontSize: '1em',
        boxSizing: 'border-box',
    },
    eventCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        border: '1px solid #444',
    },
    eventCardHeader: {
        color: '#00cc88',
        fontSize: '1.3em',
        marginBottom: '10px',
        borderBottom: '1px solid #333',
        paddingBottom: '5px',
    },
    pointsGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
    },
    inputSmall: {
        width: '70px',
        padding: '8px',
        borderRadius: '5px',
        border: '1px solid #555',
        backgroundColor: '#333',
        color: '#e0e0e0',
        fontSize: '0.9em',
    },
    addButton: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1em',
        marginTop: '10px',
        transition: 'background-color 0.2s',
        '&:hover': { backgroundColor: '#0056b3' },
    },
    removeButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9em',
        marginTop: '10px',
        transition: 'background-color 0.2s',
        '&:hover': { backgroundColor: '#c82333' },
    },
};

export default MultiSportSetup;
