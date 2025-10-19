// frontend/src/pages/ManagerDashboard.jsx - CLEANED AND REFACTORED

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- IMPORT REFACTORED COMPONENTS ---
import AssignmentList from '../components/manager/AssignmentList';
import RosterManagementView from '../components/manager/RosterManagementView';
// ------------------------------------

// --- Global Functions to get data from Local Storage ---
const getManagerToken = () => localStorage.getItem('token'); 
const LOGGED_IN_USERNAME = localStorage.getItem('username') || 'Manager'; 

// --- STYLES (Only essential ones remain) ---
const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0', position: 'relative' };
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' };
const welcomeMessageStyles = { fontSize: '3em', fontWeight: '900', color: '#e0e0e0', margin: 0 };
const usernameHighlightStyles = { color: '#00ffaa', marginLeft: '15px' };
const headerWrapperStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoutButtonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };


// --- MAIN DASHBOARD COMPONENT ---

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
    }, [currentView]); // Re-fetch when view changes (e.g. returning from management)

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
        
        switch (currentView) {
            case 'roster-management':
                if (!activeTeam) {
                    setView('assignments');
                    return null;
                }
                return <RosterManagementView 
                             team={activeTeam} 
                             fetchAssignments={fetchAssignments}
                             setView={setView} 
                       />;
            case 'assignments':
            default:
                return <AssignmentList 
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