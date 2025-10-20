// frontend/src/components/admin/ManageCoordinators.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
const deleteButtonStyles = { padding: '8px 12px', backgroundColor: '#ff6b6b', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const successStyles = { color: '#00ffaa', marginTop: '10px' };

// --- COMPONENT START ---
const ManageCoordinators = ({ token }) => {
    const [coordinators, setCoordinators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    const fetchCoordinators = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('http://localhost:5000/api/users/coordinators', { 
                headers: { 'x-auth-token': token } 
            });
            
            setCoordinators(res.data); 
            setLoading(false);

        } catch (err) {
            console.error('Coordinator fetch error:', err.response || err);
            setError('Failed to fetch coordinators. Check backend console.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchCoordinators();
        }
    }, [token]);

    const handleRemoveCoordinator = async (uniqueId, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name} (${uniqueId}) as a Coordinator? This will change their role to 'spectator'.`)) {
            return;
        }

        try {
            await axios.put(`http://localhost:5000/api/users/demote/${uniqueId}`, 
                { newRole: 'spectator' }, 
                { headers: { 'x-auth-token': token } }
            );
            
            setSuccess(`${name} demoted successfully. Role changed to Spectator.`);
            
            setCoordinators(coordinators.filter(c => c.uniqueId !== uniqueId));
            
            setTimeout(() => setSuccess(''), 2000); 

        } catch (err) {
            console.error('Demotion failed:', err.response || err);
            setError(err.response?.data?.msg || 'Failed to remove coordinator. Check if they are currently assigned to a match.');
            setTimeout(() => setError(null), 3000);
        }
    };
    
    if (!token) {
        return <div style={{...listContainerStyles, ...errorStyles}}>Authorization Token Missing.</div>;
    }

    if (loading) return <div style={listContainerStyles}>Loading coordinator list...</div>;
    if (error) return <div style={listContainerStyles}><p style={errorStyles}>Error: {error}</p></div>;

    return (
        <div style={listContainerStyles}>
            <h2>Manage Coordinators ({coordinators.length})</h2>
            <p style={{marginBottom: '20px', color: '#a0a0a0'}}>
                **Note:** Coordinator registration happens on the main login page (C#### IDs). This panel allows you to view and remove their Coordinator status.
            </p>

            {success && <p style={successStyles}>{success}</p>}
            
            {coordinators.length === 0 ? (
                <p>No active coordinators found.</p>
            ) : (
                coordinators.map(c => (
                    <div key={c._id} style={tournamentCardStyles}>
                        <div style={cardInfoStyles}>
                            <h3>{c.username || 'N/A'} (ID: {c.uniqueId})</h3> 
                            <p>Status: 
                                <span style={{ color: c.isActive ? '#39ff14' : '#ff6b6b', fontWeight: 'bold' }}>
                                    {c.isActive ? 'ACTIVE (Assigned)' : 'INACTIVE'} 
                                </span>
                            </p>
                        </div>
                        
                        <div style={cardActionsStyles}>
                            <button 
                                style={deleteButtonStyles}
                                onClick={() => handleRemoveCoordinator(c.uniqueId, c.username)}
                            >
                                Remove Role
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ManageCoordinators;