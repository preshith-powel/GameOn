// frontend/src/pages/AdminDashboard.jsx - CLEANED AND REFACTORED

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

// --- IMPORT REFACTORED COMPONENTS ---
import CreateTournamentForm from '../components/admin/CreateTournamentForm';
import ManageParticipantsForm from '../components/admin/ManageParticipantsForm';
import TournamentList from '../components/admin/TournamentList';
import ManageCoordinators from '../components/admin/ManageCoordinators';
import MultiSportSetup from '../components/admin/MultiSportSetup';
// ------------------------------------

// --- Global Functions to get data from Local Storage ---
const getAdminToken = () => localStorage.getItem('token'); 
const LOGGED_IN_USERNAME = localStorage.getItem('username') || 'Admin'; 

// --- STYLES (Only essential ones remain) ---
const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0', position: 'relative' }; 
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const buttonGroupStyles = { display: 'flex', gap: '20px', marginBottom: '40px' };
const buttonStyles = { padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#00ffaa', border: '1px solid #00ffaa', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };
const errorStyles = { color: '#ff6b6b', marginTop: '10px' };
const welcomeMessageStyles = { fontSize: '3.5em', fontWeight: '900', color: '#e0e0e0', margin: 0 };
const usernameHighlightStyles = { color: '#00ffaa', marginLeft: '15px' };
const headerWrapperStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoutButtonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' };

// Re-import useToast for the new function
import { useToast } from '../components/shared/ToastNotification';

// --- MAIN ADMIN DASHBOARD COMPONENT ---

const AdminDashboard = () => {
    const navigate = useNavigate();
    const token = getAdminToken(); 
    const loggedInUsername = LOGGED_IN_USERNAME; 
    const showToast = useToast(); // Initialize useToast here
    
    const [currentView, setCurrentView] = useState('view'); // Default to view list
    const [selectedTournament, setSelectedTournament] = useState(null); 

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        navigate('/'); // Redirects to the login page
    };

    if (!token) {
        return (<div style={containerStyles}><h1 style={errorStyles}>Access Denied. Please log in as Admin.</h1></div>);
    }

    const renderContent = () => {
        switch (currentView) {
            case 'create-tournament': 
                return <CreateTournamentForm setView={setCurrentView} token={token} />;
            case 'view':
                return <TournamentList setView={setCurrentView} setSelectedTournament={setSelectedTournament} token={token} />; 
            case 'manage-participants': 
                // CRITICAL CHECK: Ensure we have a tournament before rendering management
                if (!selectedTournament) {
                    setCurrentView('view');
                    return <p style={errorStyles}>Please select a tournament.</p>
                }
                return <ManageParticipantsForm tournament={selectedTournament} token={token} setView={setCurrentView} />;
            case 'multi-sport-setup':
                if (!selectedTournament) {
                    setCurrentView('view');
                    return <p style={errorStyles}>Please select a tournament.</p>
                }
                return <MultiSportSetup tournament={selectedTournament} setView={setCurrentView} token={token} />;
            case 'coordinators':
                return <ManageCoordinators token={token} />;
            case 'home':
            default:
                // If we land on default, redirect to the main view
                setCurrentView('view');
                return null;
        }
    }

    return (
        <div style={containerStyles}>
            
            {currentView !== 'manage-participants' && currentView !== 'multi-sport-setup' && (
                <>
                    <div style={headerWrapperStyles}>
                        <div style={welcomeMessageStyles}>
                            Welcome, Admin 
                            <span style={usernameHighlightStyles}>({loggedInUsername})</span>
                        </div>

                        <button style={logoutButtonStyles} onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                    
                    <h1 style={headerStyles}>Admin Dashboard - Tournament Management</h1>
                    
                    <div style={buttonGroupStyles}>
                        <button style={buttonStyles} onClick={() => setCurrentView('create-tournament')}>Create New Tournament</button>
                        <button style={buttonStyles} onClick={() => setCurrentView('view')}>View All Tournaments</button>
                        <button style={buttonStyles} onClick={() => setCurrentView('coordinators')}>Manage Coordinators</button>
                    </div>
                </>
            )}

            <div className="content">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;