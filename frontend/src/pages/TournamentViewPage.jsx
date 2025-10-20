// frontend/src/pages/TournamentViewPage.jsx - FINAL CODE

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- IMPORT REFACTORED COMPONENTS ---
import Leaderboard from '../components/shared/Leaderboard';
import RoundRobinSchedule from '../components/shared/RoundRobinSchedule';
import KnockoutSchedule from '../components/shared/KnockoutSchedule';
import { calculateLeaderboard } from '../components/shared/LeaderboardCalculations';
// ------------------------------------

// --- IMPORT ALL STYLES FROM DEDICATED FILE ---
import { 
    containerStyles, headerStyles, sectionStyles, titleStyles, backButtonStyles, 
    generateButtonStyles, endTournamentButtonStyles, loadingStyles, championMessageStyles, 
    tabButtonStyles, roundTabStyles, tabContainerStyles, getStatusColor, updateButtonStyles, 
    disabledButtonStyles, editButtonStyles, rrUpdateBtnStyles, rrMatchCardStyles, 
    rrTeamRowStyles, rrScoreInputStyles, scoreFieldStyles 
} from '../components/shared/TournamentStyles'; 
// ---------------------------------------------


// --- Match Scoreboard Component (Fallback - kept locally) ---
const MatchScoreboard = ({ matches }) => {
    if (!matches.length) return <p>No matches scheduled yet.</p>;
    return (
        <div style={{padding: '10px'}}>
            <p style={{color: '#a0a0a0'}}>Standard Match Schedule List (Fallback)</p>
        </div>
    );
};


// --- Main Component ---
const TournamentViewPage = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole'); 
    
    const [tournamentData, setTournamentData] = useState(null);
    const [matches, setMatches] = useState([]); 
    const [activeView, setActiveView] = useState('list'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Check if the current user has permissions to edit scores or manage the tournament
    const hasAdminRights = userRole === 'admin' || userRole === 'coordinator';

    
    const fetchMatches = useCallback(async () => {
        try {
            const matchesRes = await axios.get(`http://localhost:5000/api/matches/${id}`, {
                 headers: token ? { 'x-auth-token': token } : {} 
            });
            setMatches(matchesRes.data || []); 
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to load matches.");
            setMatches([]); 
        }
    }, [id, token]);


    const fetchTournamentData = useCallback(async () => {
        if (!id) {
            setError("Missing tournament ID.");
            setLoading(false);
            return;
        }
        
        try {
            const res = await axios.get(`http://localhost:5000/api/tournaments/${id}`, {
                 headers: token ? { 'x-auth-token': token } : {} 
            });
            setTournamentData(res.data);
            
            await fetchMatches();

        } catch (err) {
            console.error("Tournament View Fetch Error:", err);
            setError(err.response?.data?.msg || "Failed to load tournament data.");
        } finally {
            setLoading(false);
        }
    }, [id, token, fetchMatches]);
    
    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData, id]);
    
    // --- Score Update Handler (Passed to children) ---
    const handleScoreUpdate = async (matchId, teamAscore, teamBscore) => {
        if (!hasAdminRights) {
            setError("Unauthorized to update scores.");
            return;
        }
        try {
            await axios.put(`http://localhost:5000/api/matches/${matchId}/score`, 
                { teamAscore, teamBscore, status: 'completed' },
                { headers: { 'x-auth-token': token } }
            );
            
            alert("Score saved successfully!");
            
            await fetchMatches(); 
            
        } catch (err) {
            console.error(`Failed to update score: ${err.response?.data?.msg || 'Server Error'}`);
            setError(err.response?.data?.msg || 'Failed to update score.');
        }
    };


    // --- Generate Schedule Handler ---
    const handleGenerateSchedule = async () => {
        if (!userRole === 'admin' || !window.confirm("WARNING: Are you sure you want to generate the schedule? This action starts the tournament.")) {
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const res = await axios.post(`http://localhost:5000/api/matches/generate/${id}`, {}, {
                headers: { 'x-auth-token': token }
            });

            alert(res.data.msg);
            fetchTournamentData(); 
        } catch (err) {
            console.error("Schedule Generation Error:", err.response || err);
            setError(err.response?.data?.msg || 'Failed to generate schedule. Check if all participants are ready.');
        } finally {
            setLoading(false);
        }
    };

    // --- Helper to determine if Round Robin is complete ---
    const isRoundRobinComplete = () => {
        if (!tournamentData || tournamentData.format !== 'round robin') return false;
        const totalParticipants = tournamentData.maxParticipants;
        const totalMatches = (totalParticipants * (totalParticipants - 1)) / 2; 
        const completedMatches = matches.filter(m => m.status === 'completed').length;
        
        return completedMatches === totalMatches && totalMatches > 0;
    };
    
    // --- New handler to end the tournament ---
    const handleEndTournament = async () => {
        if (!userRole === 'admin' || !window.confirm("Are you sure you want to officially end this tournament? This action will set the status to 'completed'.")) {
            return;
        }
        
        try {
            const championName = calculateLeaderboard(tournamentData, matches)[0]?.name || 'Unknown';
            
            await axios.put(`http://localhost:5000/api/tournaments/${id}`, 
                { status: 'completed', winner: championName }, 
                { headers: { 'x-auth-token': token } }
            );
            
            alert(`Tournament successfully set to COMPLETED. Champion: ${championName}`);
            fetchTournamentData(); 
            
        } catch (err) {
            console.error("End Tournament Error:", err.response || err);
            setError(err.response?.data?.msg || 'Failed to end tournament.');
        }
    };
    
    if (loading) return <div style={{ ...containerStyles, ...loadingStyles }}>Loading tournament details...</div>;
    if (error) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Error: {error}</div>;
    if (!tournamentData) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Tournament not found.</div>;

    const { name, sport, format, status, maxParticipants } = tournamentData;
    const isScheduleGenerated = matches.length > 0; 
    
    const displayStatus = status.toLowerCase() === 'ongoing' ? 'Active' : status;
    const isCompleted = status.toLowerCase() === 'completed'; 
    const isSingleElimination = format === 'single elimination';
    const isRoundRobin = format === 'round robin'; 
    
    const showEndTournamentButton = hasAdminRights && isRoundRobin && isRoundRobinComplete() && !isCompleted;

    const renderFixtureView = () => {
        if (!isScheduleGenerated) {
            return <p>No matches scheduled yet. Use the 'Generate Schedule' button above to start.</p>;
        }
        
        // renderProps passes down all necessary state and handlers
        const renderProps = { matches, fetchMatches, token, isTournamentCompleted: isCompleted, onScoreUpdate: handleScoreUpdate, hasAdminRights: hasAdminRights, tournamentData: tournamentData, isVisualization: activeView === 'visualization' };
        
        // Render Visualization map for Knockout, or List for scoring/Round Robin
        if (activeView === 'visualization' && isSingleElimination) {
             return <KnockoutSchedule 
                {...renderProps}
                maxParticipants={maxParticipants}
            />;
        }
        
        // This is the default (and score entry) view for both formats
        if (isSingleElimination || isRoundRobin) { 
            return <RoundRobinSchedule {...renderProps} />;
        }
        
        return <MatchScoreboard {...renderProps} />;
    };

    return (
        <div style={containerStyles}>
            {userRole === 'admin' && (
                <button style={backButtonStyles} onClick={() => navigate('/admin-dashboard')}>
                    ← Back to Dashboard
                </button>
            )}
            <h1 style={headerStyles}>
                {name.toUpperCase()} ({sport.toUpperCase()})
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p style={{ color: '#a0a0a0', margin: 0 }}>
                        Status: 
                        <span style={{ color: getStatusColor(displayStatus), marginLeft: '5px', fontWeight: 'bold' }}>
                            {displayStatus.toUpperCase()} 
                        </span> | Format: {format}
                    </p>
                    
                    {hasAdminRights && !isScheduleGenerated && displayStatus.toLowerCase() !== 'ongoing' && !isCompleted && (
                        <button style={generateButtonStyles} onClick={handleGenerateSchedule}>
                            Generate Schedule
                        </button>
                    )}
                </div>
                
                {showEndTournamentButton && (
                    <button style={endTournamentButtonStyles} onClick={handleEndTournament}>
                        End Tournament
                    </button>
                )}
            </div>

            {/* --- TAB BUTTONS --- */}
            <div style={tabContainerStyles}>
                <button 
                    style={tabButtonStyles(activeView === 'list')} 
                    onClick={() => setActiveView('list')}
                >
                    Fixtures (Score Entry)
                </button>
                
                {/* New Visualization Tab */}
                {isSingleElimination && (
                    <button 
                        style={tabButtonStyles(activeView === 'visualization')} 
                        onClick={() => setActiveView('visualization')}
                    >
                        Knockout Map (View)
                    </button>
                )}
                
                {!isSingleElimination && (
                    <button 
                        style={tabButtonStyles(activeView === 'leaderboard')} 
                        onClick={() => setActiveView('leaderboard')}
                    >
                        Leaderboard
                    </button>
                )}
            </div>

            {/* --- CONTENT SECTION (Conditional Rendering) --- */}
            <div style={sectionStyles}>
                <h2 style={titleStyles}>
                    {activeView === 'list' 
                        ? `${isSingleElimination ? 'Score Entry List' : 'Match Schedule'}` 
                        : activeView === 'visualization' 
                        ? 'Knockout Progress Map'
                        : 'Current Standings'
                    }
                </h2>
                
                {/* Render the correct component based on the active view */}
                {(activeView === 'list' || activeView === 'visualization') && renderFixtureView()}
                
                {activeView === 'leaderboard' && <Leaderboard tournament={tournamentData} matches={matches} />}

            </div>
            
            {error && <p style={{ color: '#ff6b6b', marginTop: '15px' }}>{error}</p>}

        </div>
    );
};

export default TournamentViewPage;