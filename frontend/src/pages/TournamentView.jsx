import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// import io from 'socket.io-client'; 

const containerStyles = { padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e0e0e0' };
const headerStyles = { color: '#00ffaa', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' };
const sectionStyles = { backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', marginBottom: '30px' };
const titleStyles = { color: '#e0e0e0', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' };
const backButtonStyles = { padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const generateButtonStyles = { padding: '10px 20px', backgroundColor: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '20px' };
const updateButtonStyles = { padding: '8px 12px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const editButtonStyles = { padding: '5px 10px', backgroundColor: '#1a1a1a', color: '#00ffaa', border: '1px solid #00ffaa', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }; // Style for Edit/Cancel
const loadingStyles = { color: '#00ffaa', fontSize: '1.5em' };
const championMessageStyles = { 
    fontSize: '2.5em', 
    fontWeight: '900', 
    color: '#39ff14', 
    marginTop: '30px', 
    textAlign: 'center',
    textShadow: '0 0 10px rgba(57, 255, 20, 0.7)'
};
const endTournamentButtonStyles = { 
    padding: '12px 30px', 
    backgroundColor: '#00ffaa', 
    color: '#1a1a1a', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    marginTop: '20px'
};
const disabledButtonStyles = { 
    ...updateButtonStyles, 
    backgroundColor: '#333', 
    color: '#a0a0a0', 
    cursor: 'not-allowed',
    border: '1px solid #555' 
};

// --- TAB STYLES (Unchanged) ---
const tabButtonStyles = (isActive) => ({
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
});
const roundTabStyles = (isActive) => ({
    padding: '8px 12px',
    backgroundColor: isActive ? '#00ffaa' : '#2c2c2c',
    color: isActive ? '#1a1a1a' : '#e0e0e0',
    border: isActive ? 'none' : '1px solid #333',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '8px',
});
const tabContainerStyles = { display: 'flex', marginBottom: '0' };
// ------------------


// --- Match Card Styles for Round Robin (Unchanged) ---
const matchCardContainerStyles = { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px', 
    marginTop: '20px',
    width: '100%', 
};
const rrMatchCardStyles = {
    backgroundColor: '#2c2c2c',
    borderRadius: '8px',
    width: '100%', 
    padding: '15px',
    display: 'flex',
    flexDirection: 'column', 
    gap: '10px',
};
const rrTeamRowStyles = (isWinner) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    color: isWinner ? '#00ffaa' : '#e0e0e0',
    fontWeight: '500',
});
const rrScoreInputStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#1a1a1a',
    borderRadius: '5px',
    padding: '5px',
};
const scoreFieldStyles = {
    width: '40px',
    padding: '5px',
    textAlign: 'center',
    border: '1px solid #444',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a',
    color: '#00ffaa',
    fontWeight: 'bold',
};
const rrUpdateBtnStyles = {
    ...updateButtonStyles,
    padding: '5px 10px',
    marginLeft: '10px',
};
// -------------------------------------


// Helper function to determine status color (Unchanged)
const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : 'pending';
    if (s === 'pending') return '#ff6b6b'; 
    if (s === 'ongoing' || s === 'active') return '#39ff14'; 
    return '#a0a0a0'; 
};

// --- LEADERBOARD CALCULATION LOGIC (Unchanged) ---

const calculateLeaderboard = (tournament, matches) => {
    // 1. Initialize stats for all registered participants
    const statsMap = new Map();
    const participants = tournament.registeredParticipants || [];
    
    participants.forEach(p => {
        // Use participant ID as key for accurate tracking
        statsMap.set(p._id, {
            name: p.name || 'Unknown',
            p: 0, w: 0, l: 0, d: 0, goalsScored: 0, goalsConceded: 0, pts: 0,
            id: p._id
        });
    });

    // 2. Process completed matches
    matches.filter(m => m.status === 'completed' && m.scores && m.teams?.length === 2).forEach(match => {
        const idA = match.teams[0]?._id;
        const idB = match.teams[1]?._id;
        
        const scoreA = match.scores.teamA || 0;
        const scoreB = match.scores.teamB || 0;
        
        // Ensure both participants are still registered and in our map
        if (!statsMap.has(idA) || !statsMap.has(idB)) return;

        const statA = statsMap.get(idA);
        const statB = statsMap.get(idB);

        // Update matches played (P) and goals
        statA.p += 1;
        statB.p += 1;
        statA.goalsScored += scoreA;
        statA.goalsConceded += scoreB;
        statB.goalsScored += scoreB;
        statB.goalsConceded += scoreA;

        // Determine result and points (Football/Soccer rules: Win=3, Draw=1, Loss=0)
        if (scoreA > scoreB) {
            statA.w += 1;
            statB.l += 1;
            statA.pts += 3;
        } else if (scoreB > scoreA) {
            statB.w += 1;
            statA.l += 1;
            statB.pts += 3;
        } else {
            statA.d += 1;
            statB.d += 1;
            statA.pts += 1;
            statB.pts += 1;
        }
    });

    // 3. Convert map to array and calculate Goal Difference
    let leaderboardArray = Array.from(statsMap.values()).map(stat => ({
        ...stat,
        diff: stat.goalsScored - stat.goalsConceded,
        // Calculate Win-Loss-Draw string
        wld: `${stat.w}-${stat.l}-${stat.d}`
    }));

    // 4. Sort the leaderboard (Primary: Points, Secondary: Goal Difference)
    leaderboardArray.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts; // Primary: Points (Higher first)
        return b.diff - a.diff; // Secondary: Goal Difference (Higher first)
    });
    
    // 5. Assign rank
    leaderboardArray = leaderboardArray.map((stat, index) => ({
        ...stat,
        rank: index + 1
    }));

    // 6. Only show participants who have played or are registered
    return leaderboardArray.filter(stat => stat.p > 0 || participants.some(p => p._id === stat.id));
};

// -------------------------------------


// --- TOURNAMENT BRACKET COMPONENT (Fixed: Passes isTournamentCompleted status) ---
const TournamentBracket = ({ matches, fetchMatches, token, maxParticipants, isTournamentCompleted }) => { 
    // ... (Component code remains the same as previous step, omitted for brevity)
    const bracketWrapperStyles = { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' };
    const roundStyles = { minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '15px' };
    const teamRowStyles = (isWinner) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 0',
        color: isWinner ? '#00ffaa' : '#e0e0e0',
        fontWeight: '500',
    });
    const matchCardStyles = {
        backgroundColor: '#2c2c2c',
        padding: '10px',
        borderRadius: '8px',
        width: '100%',
        marginBottom: '10px'
    };


    const groupMatchesIntoRounds = (allMatches) => {
        if (!allMatches || allMatches.length === 0) return [];

        const roundsMap = allMatches.reduce((acc, match) => {
            const roundName = match.round || 'Unknown Round'; 
            if (!acc[roundName]) {
                acc[roundName] = [];
            }
            acc[roundName].push(match);
            return acc;
        }, {});

        const order = ['Round 1', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];
        
        return order.map(name => ({
            name,
            matches: roundsMap[name] || []
        })).filter(round => round.matches.length > 0);
    };
    
    const getWinner = (match) => {
        if (match.status !== 'completed' || !match.scores?.teamA || match.teams?.length < 2) return { winnerIndex: -1, teamId: null }; 
        
        const scoreA = match.scores.teamA || 0;
        const scoreB = match.scores.teamB || 0;
        
        if (scoreA > scoreB) return { winnerIndex: 0, teamId: match.teams[0]?._id };
        if (scoreB > scoreA) return { winnerIndex: 1, teamId: match.teams[1]?._id };
        return { winnerIndex: -1, teamId: null };
    };


    const rounds = groupMatchesIntoRounds(matches); 
    
    const generatedRoundsCount = rounds.length; 
    
    let bracketSize = 2;
    while (bracketSize < maxParticipants) {
        bracketSize *= 2;
    }
    const maxRounds = Math.log2(bracketSize);

    const possibleRounds = ['Round 1', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];
    const currentRoundName = rounds[generatedRoundsCount - 1]?.name;
    const lastGeneratedRoundIndex = possibleRounds.indexOf(currentRoundName);
    
    let remainingRounds = [];
    if (lastGeneratedRoundIndex !== -1) {
        remainingRounds = possibleRounds.slice(lastGeneratedRoundIndex + 1);
    }
    
    const finalRoundsToShow = remainingRounds.slice(0, maxRounds - generatedRoundsCount);
    
    
    if (generatedRoundsCount === 0) {
        return <p>No initial matches found for the bracket. Schedule generation may have failed or only byes were given.</p>
    }


    return (
        <div style={bracketWrapperStyles}>
            {/* Display Generated Rounds */}
            {rounds.map((round, roundIndex) => (
                <div key={round.name} style={roundStyles}>
                    <h3 style={titleStyles}>{round.name}</h3>
                    {round.matches.map(match => {
                        const { winnerIndex } = getWinner(match);
                        
                        return (
                            <div key={match._id} style={matchCardStyles}>
                                <div style={teamRowStyles(winnerIndex === 0)}>
                                    <span style={{fontWeight: winnerIndex === 0 ? 'bold' : '500', marginRight: '20px'}}>{match.teams[0]?.name || 'TBD'}</span>
                                    <span>{match.scores?.teamA || 0}</span> 
                                </div>
                                <div style={teamRowStyles(winnerIndex === 1)}>
                                    <span style={{fontWeight: winnerIndex === 1 ? 'bold' : '500', marginRight: '20px'}}>{match.teams[1]?.name || 'TBD'}</span>
                                    <span>{match.scores?.teamB || 0}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
            
            {/* Display Placeholder Rounds */}
            {finalRoundsToShow.map((roundName, index) => {
                let cardHeight = '100px'; 
                let numPlaceholderMatches = 1;
                
                if (roundName === 'Final') cardHeight = '230px'; 
                else if (roundName === 'Semifinal') numPlaceholderMatches = 2;
                else if (roundName === 'Quarterfinal') numPlaceholderMatches = 4;
                
                return (
                    <div key={roundName} style={roundStyles}>
                        <h3 style={titleStyles}>{roundName}</h3>
                        {Array.from({ length: numPlaceholderMatches }).map((_, matchIndex) => (
                            <div key={matchIndex} style={{...matchCardStyles, height: cardHeight}}>TBD Match {matchIndex + 1}</div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};


// --- ROUND ROBIN SCHEDULE COMPONENT (Fixed: Passes isTournamentCompleted status) ---
const RoundRobinSchedule = ({ matches, fetchMatches, token, isTournamentCompleted }) => {
    // Logic to group matches into rounds based on the backend's scheduling algorithm
    const groupMatchesByRound = (allMatches) => {
        if (allMatches.length === 0) return {};
        
        // This calculates matches per round for a standard RR formula
        // Assuming the matches array is ordered by round for this calculation
        const totalMatches = allMatches.length;
        
        // Inverse formula for N(N-1)/2 = TotalMatches: N^2 - N - 2*TotalMatches = 0
        // N = (1 + sqrt(1 + 8 * TotalMatches)) / 2
        const totalParticipants = Math.ceil((1 + Math.sqrt(1 + 8 * totalMatches)) / 2);

        // Matches per round (N/2, rounded up for odd participants due to bye)
        const matchesPerRound = Math.ceil(totalParticipants / 2);
        
        const rounds = {};
        let roundNumber = 1;
        
        for(let i = 0; i < allMatches.length; i++) {
            const roundName = `Round ${roundNumber}`;
            if (!rounds[roundName]) {
                rounds[roundName] = [];
            }
            rounds[roundName].push(allMatches[i]);

            if (rounds[roundName].length === matchesPerRound) {
                roundNumber++;
            }
        }
        return rounds;
    };

    const rounds = groupMatchesByRound(matches);
    const roundNames = Object.keys(rounds);
    const [activeRound, setActiveRound] = useState(roundNames[0] || 'Round 1');

    useEffect(() => {
        if (roundNames.length > 0 && !rounds[activeRound]) {
            setActiveRound(roundNames[0]);
        }
    }, [roundNames, activeRound, rounds]);
    
    const activeRoundMatches = rounds[activeRound] || [];

    // Score Update Handlers (Inline Edit/Save)
    const handleScoreUpdate = async (matchId, teamAscore, teamBscore) => {
        try {
            // NOTE: Using the simple score structure (teamAscore/teamBscore)
            const res = await axios.put(`http://localhost:5000/api/matches/${matchId}/score`, 
                { teamAscore, teamBscore, status: 'completed' },
                { headers: { 'x-auth-token': token } }
            );
            console.log(`Score saved: ${res.data.msg}`);
            fetchMatches(); 
        } catch (err) {
            console.error(`Failed to update score: ${err.response?.data?.msg || 'Server Error'}`);
        }
    };
    
    return (
        <div>
            {/* Round Tabs */}
            <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '10px' }}>
                {roundNames.map(roundName => (
                    <button
                        key={roundName}
                        style={roundTabStyles(activeRound === roundName)}
                        onClick={() => setActiveRound(roundName)}
                    >
                        {roundName}
                    </button>
                ))}
            </div>

            {/* Matches for Active Round - Vertical Stacking */}
            <div style={matchCardContainerStyles}>
                {activeRoundMatches.map(match => (
                    // FIX: Pass isTournamentCompleted status to the MatchCard
                    <MatchCard 
                        key={match._id} 
                        match={match} 
                        onScoreUpdate={handleScoreUpdate} 
                        isTournamentCompleted={isTournamentCompleted}
                    />
                ))}
            </div>
        </div>
    );
};

// --- Single Match Card Component (FIXED: Edit permission disabled after completion) ---

const MatchCard = ({ match, onScoreUpdate, isTournamentCompleted }) => {
    // FIX 6: Add early return check for data integrity
    if (!match.teams || match.teams.length < 2) {
        return <div style={{...rrMatchCardStyles, color: '#ff6b6b'}}>Error: Missing Participant Data for Match ID: {match._id}</div>;
    }
    
    // Check if THIS MATCH is officially completed.
    const isCompleted = match.status === 'completed'; 
    
    // FIX 1: isEditing state now relies ONLY on match status AND tournament status
    const [scoreA, setScoreA] = useState(match.scores?.teamA || '');
    const [scoreB, setScoreB] = useState(match.scores?.teamB || '');
    // Edit status is true if match is NOT completed AND tournament is NOT completed
    const [isEditing, setIsEditing] = useState(!isCompleted && !isTournamentCompleted); 
    
    
    const handleSave = () => {
        // BLOCK SAVE IF TOURNAMENT IS COMPLETED
        if (isTournamentCompleted) return;
        
        // CRITICAL VALIDATION: Check if both score fields are empty strings or null
        if (scoreA === '' || scoreB === '' || scoreA === null || scoreB === null) {
            console.error("Please enter a score in both fields before saving.");
            return;
        }

        // Check if both scores are entered as valid numbers (or 0)
        const a = parseInt(scoreA);
        const b = parseInt(scoreB);
        
        if (isNaN(a) || isNaN(b)) {
            console.error("Please enter valid numbers for both scores.");
            return;
        }

        onScoreUpdate(match._id, a, b);
        setIsEditing(false); // Switch to display mode after saving
    };
    
    // The edit button should only open the form if the tournament is NOT completed.
    const handleEditClick = () => {
        // BLOCK EDIT IF TOURNAMENT IS COMPLETED
        if (isTournamentCompleted) return;
        
        // When editing, load the *saved* scores back into the input fields
        setScoreA(match.scores?.teamA || 0);
        setScoreB(match.scores?.teamB || 0);
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        // When canceling, revert to the *saved* scores
        setScoreA(match.scores?.teamA || '');
        setScoreB(match.scores?.teamB || '');
        setIsEditing(false);
    };
    
    // Determine winner for highlight
    const scoreA_display = isCompleted ? (match.scores?.teamA !== undefined && match.scores?.teamA !== null ? match.scores.teamA : 0) : (scoreA === '' ? '-' : scoreA); // Show dash if current input is empty
    const scoreB_display = isCompleted ? (match.scores?.teamB !== undefined && match.scores?.teamB !== null ? match.scores.teamB : 0) : (scoreB === '' ? '-' : scoreB); // Show dash if current input is empty

    const scoreA_num = parseInt(scoreA_display) || 0;
    const scoreB_num = parseInt(scoreB_display) || 0;
    const isWinnerA = isCompleted && scoreA_num > scoreB_num;
    const isWinnerB = isCompleted && scoreB_num > scoreA_num;

    // Determine the score text shown when NOT editing and completed
    const finalScoreDisplayA = match.scores?.teamA !== undefined && match.scores?.teamA !== null ? match.scores.teamA : 0;
    const finalScoreDisplayB = match.scores?.teamB !== undefined && match.scores?.teamB !== null ? match.scores.teamB : 0;


    return (
        <div style={rrMatchCardStyles}>
            {/* Player 1 Row / Score Display - COMBINED ROW (LAYOUT FIX APPLIED) */}
            <div style={rrTeamRowStyles(isWinnerA)}>
                
                {/* Team 1 Name: Removed flex stretching property */}
                <span style={{fontWeight: isWinnerA ? 'bold' : '500', marginRight: '20px'}}>{match.teams[0]?.name || 'Player 1'}</span>
                
                <div style={rrScoreInputStyles}>
                    {isEditing ? (
                        <>
                            {/* Input A - Inputs should be disabled if tournament is complete */}
                            <input
                                type="number"
                                min="0" 
                                style={scoreFieldStyles}
                                value={scoreA}
                                onChange={(e) => setScoreA(e.target.value)}
                                disabled={isTournamentCompleted} // FIX: Disable input
                            />
                            <span style={{ color: '#a0a0a0' }}>-</span>
                            {/* Input B - Inputs should be disabled if tournament is complete */}
                            <input
                                type="number"
                                min="0" 
                                style={scoreFieldStyles}
                                value={scoreB}
                                onChange={(e) => setScoreB(e.target.value)}
                                disabled={isTournamentCompleted} // FIX: Disable input
                            />
                        </>
                    ) : (
                        // Display scores when not editing
                        <>
                            <span style={{...scoreFieldStyles, backgroundColor: 'transparent', border: 'none'}}>{finalScoreDisplayA}</span>
                            <span style={{ color: '#a0a0a0' }}>-</span>
                            <span style={{...scoreFieldStyles, backgroundColor: 'transparent', border: 'none'}}>{finalScoreDisplayB}</span>
                        </>
                    )}
                </div>
                
                {/* Team 2 Name: Removed flex stretching property */}
                <span style={{fontWeight: isWinnerB ? 'bold' : '500', marginLeft: '20px'}}>{match.teams[1]?.name || 'Player 2'}</span>
            </div>
            
            {/* Action Row */}
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '5px', gap: '10px'}}>
                {isEditing ? (
                    <>
                        {/* Cancel button can always be clicked */}
                        <button 
                            style={{...editButtonStyles, backgroundColor: '#ff6b6b'}} 
                            onClick={handleCancelClick}
                        >
                            Cancel
                        </button>
                        {/* Save button uses disabled style if tournament is complete */}
                        <button 
                            style={isTournamentCompleted ? disabledButtonStyles : rrUpdateBtnStyles} 
                            onClick={handleSave}
                            disabled={isTournamentCompleted} // FIX: Disable save button
                        >
                            Save Score
                        </button>
                    </>
                ) : (
                    // Display: Show Edit button if completed, or Enter Score button if pending
                    // FIX: Use disabled button style if tournament is complete
                    isCompleted ? (
                        <button 
                            style={isTournamentCompleted ? disabledButtonStyles : editButtonStyles} 
                            onClick={handleEditClick}
                            disabled={isTournamentCompleted} // FIX: Disable edit button
                        >
                            Edit Score
                        </button>
                    ) : (
                        <button 
                            style={isTournamentCompleted ? disabledButtonStyles : rrUpdateBtnStyles} 
                            onClick={handleEditClick}
                            disabled={isTournamentCompleted} // FIX: Disable enter score button
                        >
                            Enter Score
                        </button>
                    )
                )}
            </div>
        </div>
    );
};


// --- MATCH SCOREBOARD COMPONENT (Unchanged) ---
const MatchScoreboard = ({ matches, fetchMatches, token, isTournamentCompleted }) => {
    // ... (This component is simplified for non-RR use) ...
    if (!matches.length) return <p>No matches scheduled yet.</p>;

    return (
        <div style={{padding: '10px'}}>
            <p style={{color: '#a0a0a0'}}>Standard Match Schedule List (Fallback)</p>
        </div>
    );
};


// --- LEADERBOARD COMPONENT (Unchanged) ---

const Leaderboard = ({ tournament, matches }) => {
    const leaderboardData = calculateLeaderboard(tournament, matches);
    
    // Check the official status from the database
    const isTournamentCompleted = tournament.status.toLowerCase() === 'completed';
    
    // Get champion (top ranked player)
    const championName = leaderboardData.length > 0 ? leaderboardData[0].name : null;
    
    if (leaderboardData.length === 0) {
        return <p style={{color: '#ff6b6b'}}>No participants registered or no matches completed yet to generate standings.</p>;
    }
    
    return (
        <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9em' }}>
                <thead>
                    <tr style={{ backgroundColor: '#2c2c2c' }}>
                        <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'left', width: '5%' }}>#</th>
                        <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'left', width: '40%' }}>Name</th>
                        <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '5%' }}>P</th>
                        <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '20%' }}>W-L-D</th>
                        <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '10%' }}>+/-</th>
                        <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '10%' }}>Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.map((data, index) => (
                        <tr key={data.id} style={{ backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#2c2c2c' }}>
                            <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'left' }}>{data.rank}</td>
                            <td style={{ padding: '10px', border: '1px solid #333', fontWeight: 'bold' }}>{data.name}</td>
                            <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.p}</td>
                            <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.wld}</td>
                            <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.diff}</td>
                            <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', color: '#39ff14' }}>{data.pts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Display Champion Message only if status is COMPLETED */}
            {isTournamentCompleted && championName && (
                <p style={championMessageStyles}>
                    {championName.toUpperCase()} IS THE CHAMPION! 🏆
                </p>
            )}
        </>
    );
};
// -------------------------------------


// --- Main Component ---
const TournamentView = () => {
    return <TournamentViewWrapper />;
}

const TournamentViewWrapper = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [tournamentData, setTournamentData] = useState(null);
    const [matches, setMatches] = useState([]); 
    const [activeView, setActiveView] = useState('fixtures'); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    
    const fetchMatches = useCallback(async () => {
        try {
            const matchesRes = await axios.get(`http://localhost:5000/api/matches/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setMatches(matchesRes.data || []); 
        } catch (err) {
             setError(err.response?.data?.msg || "Failed to load matches.");
             setMatches([]); 
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
    }, [fetchTournamentData, id]);


    // --- Helper to determine if Round Robin is complete ---
    const isRoundRobinComplete = () => {
        if (!tournamentData || tournamentData.format !== 'round robin') return false;
        const totalParticipants = tournamentData.maxParticipants;
        // Formula for total matches in Round Robin: N * (N - 1) / 2
        const totalMatches = (totalParticipants * (totalParticipants - 1)) / 2; 
        const completedMatches = matches.filter(m => m.status === 'completed').length;
        
        return completedMatches === totalMatches && totalMatches > 0;
    };
    
    // --- New handler to end the tournament ---
    const handleEndTournament = async () => {
        if (!window.confirm("Are you sure you want to officially end this tournament? This action will set the status to 'completed'.")) {
            return;
        }
        
        try {
            // Get the champion's name based on current standings
            const championName = calculateLeaderboard(tournamentData, matches)[0]?.name || 'Unknown';
            
            // API call to update the tournament status to 'completed'
            const res = await axios.put(`http://localhost:5000/api/tournaments/${id}`, 
                { status: 'completed', winner: championName }, 
                { headers: { 'x-auth-token': token } }
            );
            
            console.log(`Tournament ended. Champion: ${championName}`);
            alert(`Tournament successfully set to COMPLETED. Champion: ${championName}`);
            fetchTournamentData(); // Refresh to show completed status and champion text
            
        } catch (err) {
            console.error("End Tournament Error:", err.response || err);
            setError(err.response?.data?.msg || 'Failed to end tournament.');
        }
    };
    // --------------------------------------------------------


    if (loading) return <div style={{ ...containerStyles, ...loadingStyles }}>Loading tournament details...</div>;
    if (error) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Error: {error}</div>;
    if (!tournamentData) return <div style={{ ...containerStyles, color: '#ff6b6b' }}>Tournament not found.</div>;

    const { name, sport, format, status, maxParticipants } = tournamentData;
    const isScheduleGenerated = matches.length > 0; 
    
    const displayStatus = status.toLowerCase() === 'ongoing' ? 'Active' : status;
    const isCompleted = status.toLowerCase() === 'completed'; // Check the official status
    const isSingleElimination = format === 'single elimination';
    const isRoundRobin = format === 'round robin'; 
    
    // Only show the button if it's Round Robin, all matches are complete, AND it's not already completed.
    const showEndTournamentButton = isRoundRobin && isRoundRobinComplete() && !isCompleted;

    const renderFixtureView = () => {
        if (!isScheduleGenerated) {
            return <p>No matches scheduled yet.</p>;
        }
        
        // Pass the completion status down to the rendering components
        const renderProps = { matches, fetchMatches, token, isTournamentCompleted: isCompleted };
        
        if (isSingleElimination) {
            // KNOCKOUT BRACKET VIEW
            return <TournamentBracket 
                {...renderProps}
                maxParticipants={maxParticipants}
            />;
        }
        
        if (isRoundRobin) {
            // ROUND ROBIN MATCH TABS VIEW
            return <RoundRobinSchedule 
                {...renderProps}
            />;
        }
        
        // DEFAULT SCOREBOARD LIST VIEW (for unhandled formats like Group Stage)
        return <MatchScoreboard 
            {...renderProps}
        />;
    };

    return (
        <div style={containerStyles}>
            <button style={backButtonStyles} onClick={() => navigate('/admin-dashboard')}>
                ← Back to Dashboard
            </button>
            <h1 style={headerStyles}>
                {name.toUpperCase()} ({sport.toUpperCase()}) Management
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p style={{ color: '#a0a0a0', margin: 0 }}>
                        Status: 
                        <span style={{ color: getStatusColor(displayStatus), marginLeft: '5px', fontWeight: 'bold' }}>
                            {displayStatus.toUpperCase()} 
                        </span> | Format: {format}
                    </p>
                    
                    {!isScheduleGenerated && displayStatus.toLowerCase() !== 'ongoing' && !isCompleted && (
                        <button style={generateButtonStyles} onClick={handleGenerateSchedule}>
                            Generate Schedule
                        </button>
                    )}
                </div>
                
                {/* END TOURNAMENT BUTTON */}
                {showEndTournamentButton && (
                    <button style={endTournamentButtonStyles} onClick={handleEndTournament}>
                        End Tournament
                    </button>
                )}
            </div>

            {/* --- TAB BUTTONS --- */}
            <div style={tabContainerStyles}>
                <button 
                    style={tabButtonStyles(activeView === 'fixtures')} 
                    onClick={() => setActiveView('fixtures')}
                >
                    Fixtures
                </button>
                
                {/* Hide Leaderboard button for Single Elimination */}
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
                    {/* Title Cleanup */}
                    {activeView === 'fixtures' 
                        ? `${isSingleElimination ? 'Knockout Bracket' : 'Match Schedule'}` 
                        : 'Current Standings'
                    }
                </h2>
                
                {activeView === 'fixtures' && renderFixtureView()}
                
                {/* PASS TOURNAMENT DATA AND MATCHES TO LEADERBOARD */}
                {activeView === 'leaderboard' && <Leaderboard tournament={tournamentData} matches={matches} />}

            </div>
            
            {error && <p style={{ color: '#ff6b6b', marginTop: '15px' }}>{error}</p>}

        </div>
    );
};

export default TournamentView;