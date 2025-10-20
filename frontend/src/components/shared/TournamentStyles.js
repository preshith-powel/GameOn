// frontend/src/components/shared/TournamentStyles.js

// --- STYLES & HELPERS (ALL EXPORTED) ---
export const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0' };
export const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
export const sectionStyles = { backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', marginBottom: '30px' };
export const titleStyles = { color: '#e0e0e0', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' };
export const backButtonStyles = { 
    padding: '10px 20px', 
    backgroundColor: '#333', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': { backgroundColor: '#555' },
    '&:active': { backgroundColor: '#222' },
};
export const generateButtonStyles = { 
    padding: '10px 20px', 
    backgroundColor: '#ff6b6b', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    marginLeft: '20px',
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': { backgroundColor: '#ff8f8f' },
    '&:active': { backgroundColor: '#e05a5a' },
    fontSize: '0.9em',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginLeft: '15px',
    color: 'black', // Ensure black text for generate buttons
};
export const endTournamentButtonStyles = { 
    padding: '12px 30px', 
    backgroundColor: '#00ffaa', 
    color: '#1a1a1a', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    marginTop: '20px',
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': { backgroundColor: '#00cc88' },
    '&:active': { backgroundColor: '#009966' },
};
export const loadingStyles = { color: '#00ffaa', fontSize: '1.5em' };
export const championMessageStyles = { 
    fontSize: '2.5em', 
    fontWeight: '900', 
    color: '#39ff14', 
    marginTop: '30px', 
    textAlign: 'center',
    textShadow: '0 0 10px rgba(57, 255, 20, 0.7)'
};
export const tabButtonStyles = (isActive) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#00ffaa' : '#1a1a1a',
    color: isActive ? '#1a1a1a' : '#00ffaa',
    border: isActive ? '1px solid #00ffaa' : '1px solid #333',
    borderRadius: '5px 5px 0 0',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    marginRight: '5px',
    marginBottom: '-1px', 
    '&:hover': { 
        backgroundColor: isActive ? '#00cc88' : '#2a2a2a', 
        color: isActive ? '#1a1a1a' : '#00cc88',
    },
    '&:active': { 
        backgroundColor: isActive ? '#009966' : '#333', 
        color: isActive ? '#1a1a1a' : '#009966',
    },
});
export const roundTabStyles = (isActive) => ({
    padding: '8px 12px',
    backgroundColor: isActive ? '#00ffaa' : '#2c2c2c',
    color: isActive ? '#1a1a1a' : '#e0e0e0',
    border: isActive ? 'none' : '1px solid #333',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '8px',
    transition: 'all 0.2s',
    '&:hover': { 
        backgroundColor: isActive ? '#00cc88' : '#3a3a3a', 
        color: isActive ? '#1a1a1a' : '#00cc88',
        borderColor: isActive ? 'none' : '#555'
    },
    '&:active': { 
        backgroundColor: isActive ? '#009966' : '#4a4a4a', 
        color: isActive ? '#1a1a1a' : '#009966',
        borderColor: isActive ? 'none' : '#666'
    },
});
export const tabContainerStyles = { display: 'flex', marginBottom: '0' };
export const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    if (s === 'pending') return '#ff6b6b'; 
    if (s === 'ongoing' || s === 'active') return '#39ff14'; 
    return '#a0a0a0'; 
};
// Styles needed for MatchCard component (exported for common component use)
export const updateButtonStyles = { 
    padding: '8px 12px', 
    backgroundColor: '#00ffaa', 
    color: '#1a1a1a', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': { backgroundColor: '#00cc88' },
    '&:active': { backgroundColor: '#009966' },
};
export const disabledButtonStyles = { ...updateButtonStyles, backgroundColor: '#333', color: '#a0a0a0', cursor: 'not-allowed', border: '1px solid #555' };
export const editButtonStyles = { 
    padding: '5px 10px', 
    backgroundColor: '#1a1a1a', 
    color: '#00ffaa', 
    border: '1px solid #00ffaa', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
    '&:hover': { backgroundColor: '#001a1a', borderColor: '#00cc88' },
    '&:active': { backgroundColor: '#000a0a', borderColor: '#009966' },
};
export const rrUpdateBtnStyles = { ...updateButtonStyles, padding: '5px 10px', marginLeft: '10px' };

export const rrMatchCardStyles = { backgroundColor: '#2c2c2c', borderRadius: '8px', width: '100%', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' };
export const rrTeamRowStyles = (isWinner) => ({ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '5px 0', 
    color: isWinner ? '#39ff14' : '#e0e0e0', 
    fontWeight: '500' 
});
export const rrScoreInputStyles = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#1a1a1a', borderRadius: '5px', padding: '5px', justifyContent: 'center' };
export const scoreFieldStyles = { width: '40px', padding: '5px', textAlign: 'center', border: '1px solid #444', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#00ffaa', fontWeight: 'bold' };

export const teamNameBoxStyles = { 
    backgroundColor: '#00ffaa', 
    color: '#1a1a1a', 
    padding: '5px 10px', 
    borderRadius: '5px', 
    fontWeight: 'bold', 
    textAlign: 'center',
    minWidth: '120px', // Ensure consistent width for team name boxes
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center'
};