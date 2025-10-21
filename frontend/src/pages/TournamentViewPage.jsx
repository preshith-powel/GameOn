// frontend/src/pages/TournamentViewPage.jsx - FINAL CODE

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- IMPORT REFACTORED COMPONENTS ---
import Leaderboard from '../components/shared/Leaderboard';
import RoundRobinSchedule from '../components/shared/RoundRobinSchedule';
import { calculateLeaderboard } from '../components/shared/LeaderboardCalculations';
import { useToast } from '../components/shared/ToastNotification';
// Import new sport-specific scorecard components
import FootballScorecard from '../components/shared/FootballScorecard';
import BadmintonScorecard from '../components/shared/BadmintonScorecard';
import KabaddiScorecard from '../components/shared/KabaddiScorecard';
import VolleyballScorecard from '../components/shared/VolleyballScorecard';
import MultisportScorecard from '../components/shared/MultisportScorecard';
import GroupStageSchedule from '../components/shared/GroupStageSchedule';
import ChessScorecard from '../components/shared/ChessScorecard'; // Placeholder for Chess
import HockeyScorecard from '../components/shared/HockeyScorecard'; // Placeholder for Hockey
import CarromsScorecard from '../components/shared/CarromsScorecard'; // Placeholder for Carroms
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

    const showToast = useToast();
    
    const [unresolvedTies, setUnresolvedTies] = useState([]); // New state for managing unresolved tied matches
    const [selectedTieWinners, setSelectedTieWinners] = useState({}); // New state to hold selected winners for tied matches

    const fetchMatches = useCallback(async () => {
        try {
            console.log("Fetching matches for tournament ID:", id);
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
            console.log("Fetching tournament data for tournament ID:", id);
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
    const handleScoreUpdate = async (matchId, scoreData) => {
        if (!hasAdminRights) {
            setError("Unauthorized to update scores.");
            return;
        }
        
        // Prevent score editing if tournament is completed
        if (isCompleted) {
            setError("Cannot edit scores. Tournament is completed.");
            return;
        }
        
        try {
            await axios.put(`http://localhost:5000/api/matches/${matchId}/score`, 
                scoreData,
                { headers: { 'x-auth-token': token } }
            );
            console.log('Score update sent:', scoreData);
            showToast("Score saved successfully!", 'success');
            await fetchMatches();
            console.log('Matches re-fetched after score update.');
        } catch (err) {
            console.error(`Failed to update score: ${err.response?.data?.msg || 'Server Error'}`);
            setError(err.response?.data?.msg || 'Failed to update score.');
        }
    };

    // --- Check if current round is complete and generate next round ---
    const checkAndGenerateNextRound = async () => {
        // First, check for any completed knockout matches that are tied but don't have a winner yet
        const tiedKnockoutMatches = matches.filter(match => {
            if (tournamentData?.format !== 'single elimination' || match.status !== 'completed' || !Array.isArray(match.scores) || match.scores.length < 2) return false;
            const scoreA = match.scores[0]?.score ?? 0;
            const scoreB = match.scores[1]?.score ?? 0;
            return scoreA === scoreB && !match.winner;
        });

        if (tiedKnockoutMatches.length > 0) {
            setUnresolvedTies(tiedKnockoutMatches);
            setError('Scores are tied in some matches. Please select a winner for all tied matches to proceed.');
            return; // Stop here and wait for tie resolution
        }
        else{
            alert("Generating next round now.");
        }

        // Proceed with generation only if no unresolved ties
        try {
            // Call the API directly to generate next round
            const res = await axios.post(`http://localhost:5000/api/matches/generate-next-round/${id}`, {}, {
                headers: { 'x-auth-token': token }
            });
            //alert("Next round generated successfully."+res.data.msg);
            if (res.data.isComplete) {
                showToast(`🎉 Tournament Complete! Winner: ${res.data.winner}`, 'success');
                await fetchTournamentData();
            } else {
                showToast(`✅ ${res.data.msg}`, 'info');
                await fetchMatches();
                // Also refresh tournament data to get updated status
                await fetchTournamentData();
            }
        } catch (err) {
            console.error("Next round generation error:", err.response?.data?.msg || 'Server Error');
            setError(err.response?.data?.msg || 'Failed to generate next round.');
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

            showToast(res.data.msg, 'success');
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

    // --- Helper to determine if next round can be generated for knockout tournaments ---
    const canGenerateNextRound = () => {
        if (!matches.length || tournamentData?.format !== 'single elimination') return false;
        
        // Group matches by round
        const matchesByRound = {};
        matches.forEach(match => {
            if (match.round) {
                if (!matchesByRound[match.round]) {
                    matchesByRound[match.round] = [];
                }
                matchesByRound[match.round].push(match);
            }
        });

        // Find the current active round (has scheduled matches OR all completed matches)
        let currentRound = null;
        for (const [roundName, roundMatches] of Object.entries(matchesByRound)) {
            // Check if this round has scheduled matches (active round)
            if (roundMatches.some(match => match.status === 'scheduled')) {
                currentRound = roundName;
                break;
            }
        }

        // If no scheduled matches found, check if there's a round where all matches are completed
        if (!currentRound) {
            for (const [roundName, roundMatches] of Object.entries(matchesByRound)) {
                if (roundMatches.every(match => match.status === 'completed')) {
                    currentRound = roundName;
                    break;
                }
            }
        }

        if (!currentRound) return false;

        // Check if all matches in current round are completed
        const currentRoundMatches = matchesByRound[currentRound];
        return currentRoundMatches.every(match => match.status === 'completed');
    };

    // --- Helper to determine if Final round is complete for knockout tournaments ---
    const isFinalRoundComplete = () => {
        if (!matches.length || tournamentData?.format !== 'single elimination') return false;
        
        // Find Final round matches
        const finalMatches = matches.filter(match => match.round === 'Final');
        
        if (finalMatches.length === 0) return false;
        
        // Check if all Final matches are completed
        return finalMatches.every(match => match.status === 'completed');
    };
    
    // --- New handler to end the tournament ---
    const handleEndTournament = async () => {
        if (!userRole === 'admin' || !window.confirm("Are you sure you want to officially end this tournament? This action will set the status to 'completed'.")) {
            return;
        }
        
        try {
            let championName = 'Unknown';
            
            if (isSingleElimination) {
                // For knockout tournaments, find the winner from the Final match
                const finalMatches = matches.filter(match => match.round === 'Final' && match.status === 'completed');
                if (finalMatches.length > 0) {
                    const finalMatch = finalMatches[0];
                    if (Array.isArray(finalMatch.scores) && finalMatch.scores.length >= 2) {
                        const scoreA = finalMatch.scores[0]?.score ?? 0;
                        const scoreB = finalMatch.scores[1]?.score ?? 0;
                        if (scoreA > scoreB) {
                            championName = finalMatch.teams[0]?.name || 'Unknown';
                        } else if (scoreB > scoreA) {
                            championName = finalMatch.teams[1]?.name || 'Unknown';
                        }
                    }
                }
            } else {
                // For round robin tournaments, use leaderboard
                championName = calculateLeaderboard(tournamentData, matches)[0]?.name || 'Unknown';
            }
            
            await axios.put(`http://localhost:5000/api/tournaments/${id}`, 
                { status: 'completed', winner: championName }, 
                { headers: { 'x-auth-token': token } }
            );
            
            showToast(`🏆 Tournament Complete! ${championName} is the Champion! 🏆`, 'success');
            await fetchTournamentData(); 
            
        } catch (err) {
            console.error("End Tournament Error:", err.response || err);
            setError(err.response?.data?.msg || 'Failed to end tournament.');
        }
    };
    
    if (loading) return <div style={{ ...containerStyles, ...loadingStyles }}>Loading tournament details...</div>;
    if (error) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Error: {error}</div>;
    if (!tournamentData) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Tournament not found.</div>;

    const { name, sport, format, status, maxParticipants, venueType, venues } = tournamentData;
    const isScheduleGenerated = matches.length > 0; 
    
    const displayStatus = status.toLowerCase() === 'ongoing' ? 'Active' : status;
    const isCompleted = status.toLowerCase() === 'completed'; 
    const isSingleElimination = format === 'single elimination';
    const isRoundRobin = format === 'round robin'; 
    
    const showEndTournamentButton = hasAdminRights && (
        (isRoundRobin && isRoundRobinComplete() && !isCompleted) ||
        (isSingleElimination && isFinalRoundComplete() && !isCompleted)
    );

    // --- VENUE DISPLAY LOGIC ---
    let venueDisplay = null;
    if (venueType === 'single' && venues && venues.length > 0 && venues[0].name) {
        venueDisplay = venues[0].name;
    } else if (venueType === 'multi' && venues && venues.length > 0) {
        venueDisplay = venues.map(v => v.name).filter(Boolean).join(', ');
    }

    const renderFixtureView = () => {
        if (!isScheduleGenerated) {
            return <p>No matches scheduled yet. Use the 'Generate Schedule' button above to start.</p>;
        }

        // renderProps passes down all necessary state and handlers
        const renderProps = { matches, fetchMatches, token, isTournamentCompleted: isCompleted, onScoreUpdate: handleScoreUpdate, hasAdminRights: hasAdminRights && !isCompleted, tournamentData: tournamentData };

        // Conditionally render scorecard based on tournament sport
        switch (tournamentData.sport.toLowerCase()) {
            case 'football':
                return <RoundRobinSchedule {...renderProps} MatchCardComponent={FootballScorecard} />;
            case 'cricket':
                return <RoundRobinSchedule {...renderProps} MatchCardComponent={CricketScorecard} />;
            case 'badminton':
                return <RoundRobinSchedule {...renderProps} MatchCardComponent={BadmintonScorecard} />;
            case 'kabaddi':
                return <RoundRobinSchedule {...renderProps} MatchCardComponent={KabaddiScorecard} />;
            case 'volleyball':
                return <RoundRobinSchedule {...renderProps} MatchCardComponent={VolleyballScorecard} />;
            case 'multi-sport':
                // Multisport scorecard needs tournament data, not individual matches for score entry
                return <MultisportScorecard 
                            tournament={tournamentData} 
                            onScoreUpdate={handleScoreUpdate} // This needs to be adapted for event-based scoring
                            isTournamentCompleted={isCompleted} 
                            hasAdminRights={hasAdminRights && !isCompleted} 
                        />;
            case 'group stage':
                const GroupStageMatchCard = (() => {
                    switch (tournamentData.sport.toLowerCase()) {
                        case 'football': return FootballScorecard;
                        case 'badminton': return BadmintonScorecard;
                        case 'kabaddi': return KabaddiScorecard;
                        case 'chess': return ChessScorecard;
                        case 'hockey': return HockeyScorecard;
                        case 'volleyball': return VolleyballScorecard;
                        default: return null;
                    }
                })();
                if (!GroupStageMatchCard) {
                    return <p style={{color: '#ff6b6b'}}>No specific scorecard available for {tournamentData.sport} in Group Stage.</p>;
                }
                return <GroupStageSchedule {...renderProps} MatchCardComponent={GroupStageMatchCard} />;
            default:
                switch (tournamentData.sport.toLowerCase()) {
                    case 'carroms': return <RoundRobinSchedule {...renderProps} MatchCardComponent={CarromsScorecard} />;
                    case 'chess': return <RoundRobinSchedule {...renderProps} MatchCardComponent={ChessScorecard} />;
                    case 'hockey': return <RoundRobinSchedule {...renderProps} MatchCardComponent={HockeyScorecard} />;
                    case 'volleyball': return <RoundRobinSchedule {...renderProps} MatchCardComponent={VolleyballScorecard} />;
                    case 'kabaddi': return <RoundRobinSchedule {...renderProps} MatchCardComponent={KabaddiScorecard} />;
                    case 'badminton': return <RoundRobinSchedule {...renderProps} MatchCardComponent={BadmintonScorecard} />;
                    case 'football': return <RoundRobinSchedule {...renderProps} MatchCardComponent={FootballScorecard} />;
                    default: return <p style={{color: '#ff6b6b'}}>No specific scorecard available for {tournamentData.sport}.</p>;
                }
        }
    };

    const handleTieWinnerSelection = (matchId, winnerId) => {
        setSelectedTieWinners(prev => ({
            ...prev,
            [matchId]: winnerId
        }));
    };

    const handleTieResolution = async () => {
        if (!hasAdminRights) {
            setError("Unauthorized to resolve ties.");
            return;
        }

        if (Object.keys(selectedTieWinners).length !== unresolvedTies.length) {
            setError("Please select a winner for all tied matches.");
            return;
        }

        try {
            const matchIdsToUpdate = unresolvedTies.map(match => match._id);
            const winnerIds = matchIdsToUpdate.map(matchId => selectedTieWinners[matchId]);

            await axios.put(`http://localhost:5000/api/matches/resolve-ties/${id}`, {
                matchIds: matchIdsToUpdate,
                winnerIds: winnerIds
            }, { headers: { 'x-auth-token': token } });

            showToast("Ties resolved and next round generated!", 'success');
            await fetchTournamentData();
            setUnresolvedTies([]);
            setSelectedTieWinners({});

        } catch (err) {
            console.error("Tie Resolution Error:", err.response || err);
            setError(err.response?.data?.msg || 'Failed to resolve ties.');
        }
    };

    // --- Logout handler ---
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div style={containerStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button style={backButtonStyles} onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: 16 }}>
                    {venueDisplay && (
                        <div style={{
                            background: 'linear-gradient(90deg, #00ffaa 0%, #39ff14 100%)',
                            color: '#1a1a1a',
                            fontWeight: 700,
                            fontSize: '1.1em',
                            borderRadius: '8px',
                            padding: '8px 22px',
                            boxShadow: '0 2px 12px 0 rgba(0,255,170,0.10)',
                            letterSpacing: '0.5px',
                            border: '2px solid #00ffaa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '120px',
                            justifyContent: 'center',
                            textShadow: '0 1px 8px #00ffaa44'
                        }}>
                            <span role="img" aria-label="venue">📍</span> {venueDisplay}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{
                            background: '#00ffaa',
                            color: '#1a1a1a',
                            fontWeight: 700,
                            fontSize: '1em',
                            borderRadius: '8px',
                            padding: '8px 22px',
                            border: '2px solid #00ffaa',
                            cursor: 'pointer',
                            marginLeft: venueDisplay ? 16 : 0
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
            <h1 style={headerStyles}>
                {name.toUpperCase()} ({sport.toUpperCase()})
            </h1>
            
            {/* Champion Display for Completed Tournaments */}
            {isCompleted && tournamentData.winner && (
                <div style={{
                    background: 'linear-gradient(90deg, #00ffaa 0%, #39ff14 100%)',
                    border: '2.5px solid #00ffaa',
                    borderRadius: '16px',
                    padding: '32px 24px',
                    marginBottom: '28px',
                    textAlign: 'center',
                    boxShadow: '0 4px 32px 0 rgba(0,255,170,0.10)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'championFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1)'
                }}>
                    <div style={{ fontSize: '2.8em', marginBottom: '12px', color: '#FFD700', textShadow: '0 0 18px #FFD70099' }}>🏆</div>
                    <h2 style={{ color: '#1a1a1a', margin: '0 0 12px 0', fontWeight: 900, fontSize: '2.1em', letterSpacing: '1px', textShadow: '0 2px 8px #00ffaa44' }}>
                        Tournament Complete!
                    </h2>
                    <p style={{ color: '#222', fontSize: '1.5em', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
                        <span style={{ color: '#007b55', fontWeight: 900, fontSize: '1.2em', textShadow: '0 0 8px #00ffaa55' }}>{tournamentData.winner}</span> is the Champion! <span style={{fontSize: '1.2em'}}>🏆</span>
                    </p>
                    <style>{`
                        @keyframes championFadeIn {
                            0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
                            60% { opacity: 1; transform: translateY(8px) scale(1.04); }
                            100% { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                </div>
            )}
            
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
                    
                    {hasAdminRights && isScheduleGenerated && isSingleElimination && !isCompleted && (
                        <button 
                            style={{
                                ...generateButtonStyles,
                                backgroundColor: canGenerateNextRound() && !isFinalRoundComplete() ? '#00ffaa' : '#666',
                                cursor: canGenerateNextRound() && !isFinalRoundComplete() ? 'pointer' : 'not-allowed'
                            }} 
                            onClick={checkAndGenerateNextRound}
                            disabled={!canGenerateNextRound() || isFinalRoundComplete()}
                        >
                            Generate Next Round
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
                        : 'Current Standings'
                    }
                </h2>
                
                {/* Render the correct component based on the active view */}
                {activeView === 'list' && renderFixtureView()}
                
                {activeView === 'leaderboard' && (
                    <Leaderboard tournament={tournamentData} matches={matches} />
                )}

            </div>
            
            {error && <p style={{ color: '#ff6b6b', marginTop: '15px' }}>{error}</p>}

            {/* Tie Resolution UI */}
            {unresolvedTies.length > 0 && (
                <div style={{ 
                    backgroundColor: '#1a1a1a', 
                    padding: '25px', 
                    borderRadius: '10px', 
                    marginTop: '20px',
                    border: '2px solid #ff6b6b'
                }}>
                    <h3 style={{ color: '#ff6b6b', marginBottom: '15px' }}>Unresolved Tied Matches</h3>
                    <p style={{ color: '#e0e0e0', marginBottom: '20px' }}>Scores are tied in the following knockout matches. Please select a winner for each to proceed to the next round.</p>

                    {unresolvedTies.map(tiedMatch => (
                        <div key={tiedMatch._id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px' }}>
                            <p style={{ color: '#00ffaa', fontWeight: 'bold', marginBottom: '10px' }}>
                                Match: {tiedMatch.teams[0]?.name || 'Team 1'} vs {tiedMatch.teams[1]?.name || 'Team 2'} (Round: {tiedMatch.round})
                            </p>
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                <label style={{ color: '#e0e0e0', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedTieWinners[tiedMatch._id] === tiedMatch.teams[0]?._id}
                                        onChange={() => handleTieWinnerSelection(tiedMatch._id, tiedMatch.teams[0]?._id)}
                                        style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                    />
                                    {tiedMatch.teams[0]?.name || 'Team 1'}
                                </label>
                                <label style={{ color: '#e0e0e0', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedTieWinners[tiedMatch._id] === tiedMatch.teams[1]?._id}
                                        onChange={() => handleTieWinnerSelection(tiedMatch._id, tiedMatch.teams[1]?._id)}
                                        style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                    />
                                    {tiedMatch.teams[1]?.name || 'Team 2'}
                                </label>
                            </div>
                        </div>
                    ))}

                    <button 
                        style={{ 
                            ...updateButtonStyles, 
                            marginTop: '20px', 
                            width: 'auto', 
                            padding: '10px 30px',
                            backgroundColor: Object.keys(selectedTieWinners).length === unresolvedTies.length ? '#00ffaa' : '#666',
                            cursor: Object.keys(selectedTieWinners).length === unresolvedTies.length ? 'pointer' : 'not-allowed'
                        }}
                        onClick={handleTieResolution}
                        disabled={Object.keys(selectedTieWinners).length !== unresolvedTies.length}
                    >
                        Confirm Resolutions and Generate Next Round
                    </button>
                </div>
            )}

        </div>
    );
};

export default TournamentViewPage;