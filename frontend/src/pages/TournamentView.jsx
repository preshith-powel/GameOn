// frontend/src/pages/TournamentView.jsx - FULL UPDATED CODE (Status Color and Active Logic)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0' };
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const sectionStyles = { backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', marginBottom: '30px' };
const titleStyles = { color: '#e0e0e0', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' };
const backButtonStyles = { padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const generateButtonStyles = { padding: '10px 20px', backgroundColor: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '20px' };
const updateButtonStyles = { padding: '8px 12px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const loadingStyles = { color: '#00ffaa', fontSize: '1.5em' };

// Helper function to determine status color
const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    if (s === 'pending') return '#ff6b6b'; // Red for Pending
    if (s === 'ongoing' || s === 'active') return '#39ff14'; // Green for Active/Ongoing
    return '#a0a0a0'; // Gray for completed or other
};

// --- Placeholder Components ---

const MatchScoreboard = ({ matches, teams, fetchMatches, token }) => {
    const [editMatch, setEditMatch] = useState(null);
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);

    const handleEditClick = (match) => {
        setEditMatch(match._id);
        setScoreA(match.scores.teamA || 0);
        setScoreB(match.scores.teamB || 0);
    };

    const handleScoreUpdate = async (matchId) => {
        try {
            const res = await axios.put(`http://localhost:5000/api/matches/${matchId}/score`, 
                { teamAscore: scoreA, teamBscore: scoreB, status: 'completed' },
                { headers: { 'x-auth-token': token } }
            );
            alert(`Score saved: ${res.data.msg}`);
            setEditMatch(null);
            fetchMatches(); // Refresh the matches list
        } catch (err) {
            alert(`Failed to update score: ${err.response?.data?.msg || 'Server Error'}`);
        }
    };

    if (!matches || matches.length === 0) return <p>No matches scheduled yet.</p>;

    return (
        <div>
            {matches.map(match => (
                <div key={match._id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #333', borderRadius: '5px' }}>
                    
                    <p style={{ fontWeight: 'bold' }}>
                        Match ID: {match._id.slice(-6)} | Status: 
                        <span style={{ color: getStatusColor(match.status), marginLeft: '5px' }}>
                            {match.status.toUpperCase()}
                        </span>
                    </p>
                    <p>Venue: {match.venue || 'TBD'} | Time: {match.time || 'TBD'}</p>

                    {editMatch === match._id ? (
                        // Edit Mode
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px' }}>
                            <span>{match.teams[0]?.name || 'Team A'}: </span>
                            <input type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} style={{ width: '60px', padding: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0' }} />
                            <span> vs </span>
                            <span>{match.teams[1]?.name || 'Team B'}: </span>
                            <input type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} style={{ width: '60px', padding: '5px', backgroundColor: '#2c2c2c', color: '#e0e0e0' }} />
                            <button style={updateButtonStyles} onClick={() => handleScoreUpdate(match._id)}>Save Score</button>
                        </div>
                    ) : (
                        // Display Mode
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                            <p style={{ fontSize: '1.2em' }}>
                                {match.teams[0]?.name || 'Team A'} **{match.scores?.teamA || 0}** vs 
                                {match.teams[1]?.name || 'Team B'} **{match.scores?.teamB || 0}**
                            </p>
                            {match.status !== 'completed' && (
                                <button style={updateButtonStyles} onClick={() => handleEditClick(match)}>Enter Score</button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const Leaderboard = ({ leaderboardData }) => {
    if (!leaderboardData || leaderboardData.length === 0) return <p>Leaderboard is empty or unavailable.</p>;
    
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ backgroundColor: '#2c2c2c' }}>
                    <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'left' }}>Rank</th>
                    <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'left' }}>Team</th>
                    <th style={{ padding: '10px', border: '1px solid #333' }}>Wins</th>
                    <th style={{ padding: '10px', border: '1px solid #333' }}>Losses</th>
                    <th style={{ padding: '10px', border: '1px solid #333' }}>Score</th>
                </tr>
            </thead>
            <tbody>
                {leaderboardData.map((data, index) => (
                    <tr key={data.teamId} style={{ backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#2c2c2c' }}>
                        <td style={{ padding: '10px', border: '1px solid #333' }}>{index + 1}</td>
                        <td style={{ padding: '10px', border: '1px solid #333' }}>{data.teamName}</td>
                        <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.wins}</td>
                        <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.losses}</td>
                        <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


// --- Main Component ---
const TournamentView = () => {
    const { id } = useParams(); // Get the tournament ID from the URL
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [tournamentData, setTournamentData] = useState(null);
    const [matches, setMatches] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Placeholder leaderboard data
    const [leaderboard, setLeaderboard] = useState([
        { teamId: 't1', teamName: 'GOODIES', wins: 0, losses: 0, score: 0 },
    ]);

    const fetchMatches = useCallback(async () => {
        try {
            const matchesRes = await axios.get(`http://localhost:5000/api/matches/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setMatches(matchesRes.data);
        } catch (err) {
             setError(err.response?.data?.msg || "Failed to load matches.");
        }
    }, [id, token]);


    const fetchTournamentData = useCallback(async () => {
        if (!token || !id) {
            setError("Missing authentication token or tournament ID.");
            setLoading(false);
            return;
        }
        
        try {
            const res = await axios.get(`http://localhost:5000/api/tournaments/${id}`, {
                headers: { 'x-auth-token': token }
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
    }, [fetchTournamentData]);


    // --- CRITICAL FIX: Update Status and Generate Schedule ---
    const handleGenerateSchedule = async () => {
        setError(null);
        if (matches && matches.length > 0) {
            alert('Schedule already generated. Status is active.');
            return;
        }

        try {
            // 1. Generate Schedule (This implicitly changes the status to 'ongoing'/'active' on the backend)
            const res = await axios.post(`http://localhost:5000/api/matches/generate/${id}`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            alert(res.data.msg);
            fetchTournamentData(); // Refresh all data to show new status and matches

        } catch (err) {
            setError(err.response?.data?.msg || "Failed to generate schedule.");
        }
    };
    // --------------------------------------------------------


    if (loading) return <div style={{ ...containerStyles, ...loadingStyles }}>Loading tournament details...</div>;
    if (error) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Error: {error}</div>;
    if (!tournamentData) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Tournament not found.</div>;

    const { name, sport, format, status } = tournamentData;
    const isScheduleGenerated = matches && matches.length > 0;
    
    // --- CRITICAL FIX: Display 'Active' if status is 'ongoing' and apply color ---
    const displayStatus = status.toLowerCase() === 'ongoing' ? 'Active' : status;

    return (
        <div style={containerStyles}>
            <button style={backButtonStyles} onClick={() => navigate('/admin-dashboard')}>
                ← Back to Dashboard
            </button>
            <h1 style={headerStyles}>
                {name.toUpperCase()} ({sport.toUpperCase()}) Management
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <p style={{ color: '#a0a0a0', margin: 0 }}>
                    Status: 
                    <span style={{ color: getStatusColor(displayStatus), marginLeft: '5px', fontWeight: 'bold' }}>
                        {displayStatus.toUpperCase()} {/* REMOVED ** ** */}
                    </span> | Format: {format}
                </p>
                
                {!isScheduleGenerated && displayStatus.toLowerCase() !== 'ongoing' && (
                    <button style={generateButtonStyles} onClick={handleGenerateSchedule}>
                        Generate Schedule
                    </button>
                )}
            </div>

            {/* --- 1. LIVE SCOREBOARD / MATCH LIST --- */}
            <div style={sectionStyles}>
                <h2 style={titleStyles}>Live Scoreboard & Matches ({matches?.length || 0})</h2>
                <MatchScoreboard 
                    matches={matches} 
                    teams={tournamentData.registeredParticipants} 
                    fetchMatches={fetchMatches}
                    token={token}
                />
            </div>

            {/* --- 2. LEADERBOARD --- */}
            <div style={sectionStyles}>
                <h2 style={titleStyles}>Leaderboard</h2>
                <Leaderboard leaderboardData={leaderboard} />
            </div>
            
            {error && <p style={{ color: '#ff6b6b', marginTop: '15px' }}>{error}</p>}

        </div>
    );
};

export default TournamentView;