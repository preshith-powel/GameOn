// frontend/src/components/shared/MatchCard.jsx - FINAL CODE (Green Highlight & Hide Scores)

import React, { useState, useEffect } from 'react';
// Import all styles from the dedicated style file
import { 
    updateButtonStyles, disabledButtonStyles, editButtonStyles, rrUpdateBtnStyles, rrMatchCardStyles, rrTeamRowStyles, rrScoreInputStyles, scoreFieldStyles, teamNameBoxStyles 
} from './TournamentStyles'; 

const MatchCard = ({ match, onScoreUpdate, isTournamentCompleted, isSingleElimination = false, hasAdminRights = false }) => {
    
    // isVisualization is TRUE if single elimination is active AND we don't have scoring rights (read-only map)
    const isVisualization = isSingleElimination && !hasAdminRights; 
    
    if (!match.teams || match.teams.length < 2) {
        return <div style={{...rrMatchCardStyles, color: '#ff6b6b'}}>Error: Missing Participant Data for Match ID: {match._id}</div>;
    }
    
    const isCompleted = match.status === 'completed'; 
    // Find scores for each team from the scores array
    const getScoreForTeam = (team) => {
        // Support both populated team objects and plain ObjectId strings
        const teamId = team?._id || team;
        const entry = Array.isArray(match.scores)
            ? match.scores.find(s => String(s.teamId) === String(teamId) || String(s.teamId?._id) === String(teamId))
            : null;
        return entry ? entry.score : 0;
    };

    // Always use the latest stored scores for display and editing
    const [scoreA, setScoreA] = useState('');
    const [scoreB, setScoreB] = useState('');

    const [isEditing, setIsEditing] = useState(false);

    // Always update input fields to show latest saved scores when entering edit mode
    useEffect(() => {
        if (isEditing) {
            setScoreA(getScoreForTeam(match.teams[0]).toString());
            setScoreB(getScoreForTeam(match.teams[1]).toString());
            //alert("Editing scores for match:scores are " +getScoreForTeam(match.teams[0]) +"," +getScoreForTeam(match.teams[1]) );
        }
    }, [isEditing, match.scores, match.teams]);

    // State for tie-breaker modal
    const [showTieBreaker, setShowTieBreaker] = useState(false);
    const [selectedWinner, setSelectedWinner] = useState(null);

    const isEditable = !isVisualization && hasAdminRights;

    const parsedScoreA = parseInt(scoreA);
    const parsedScoreB = parseInt(scoreB);
    
    // Check if it's a BYE match
    const isByeMatch = match.isBye && match.teams.length === 1;

    // EFFECT: Only reset local score state when match._id changes (prevents unwanted 0-0 reset)
    useEffect(() => {
        // Only reset scores if we are not currently editing, or if a new match is loaded
        if (!isEditing) {
            setScoreA(getScoreForTeam(match.teams[0]));
            setScoreB(getScoreForTeam(match.teams[1]));
        }
        setIsEditing(isEditable && !isCompleted && !isTournamentCompleted);
    }, [match._id, isEditable, isCompleted, isTournamentCompleted]);
    
    
    const handleSave = async () => {
        if (!isEditable || isTournamentCompleted) return;
        if (scoreA === '' || scoreB === '' || scoreA === null || scoreB === null) {
            console.error("Please enter a score in both fields before saving.");
            return;
        }
        const a = parseInt(scoreA);
        const b = parseInt(scoreB);
        if (isNaN(a) || isNaN(b)) {
            console.error("Please enter valid numbers for both scores.");
            return;
        }
        // Handle tie in single elimination tournaments
        if (isSingleElimination && a === b) {
            setShowTieBreaker(true);
            return;
        }
        // Prepare scores array for backend
        const scores = [
            { teamId: match.teams[0]?._id || match.teams[0], score: a },
            { teamId: match.teams[1]?._id || match.teams[1], score: b }
        ];
        await onScoreUpdate(match._id, { scores });
        setIsEditing(false);
    };
    
    const handleEditClick = () => {
        if (!isEditable || isTournamentCompleted) return;
        setScoreA(getScoreForTeam(match.teams[0]));
        setScoreB(getScoreForTeam(match.teams[1]));
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setScoreA(getScoreForTeam(match.teams[0]));
        setScoreB(getScoreForTeam(match.teams[1]));
        setIsEditing(false);
    };
    
    // Always show the stored scores in the UI
    const finalScoreDisplayA = getScoreForTeam(match.teams[0]);
    const finalScoreDisplayB = getScoreForTeam(match.teams[1]);

    const isWinnerA = isCompleted && finalScoreDisplayA > finalScoreDisplayB;
    const isWinnerB = isCompleted && finalScoreDisplayB > finalScoreDisplayA;

    const matchCardStyle = isSingleElimination ? { ...rrMatchCardStyles, padding: '10px', marginBottom: '10px' } : rrMatchCardStyles;


    return (
        <div style={matchCardStyle}>
            {isByeMatch ? (
                <div style={{...rrTeamRowStyles(true), justifyContent: 'center', gap: '20px', backgroundColor: '#333'}}> 
                    <span style={{...teamNameBoxStyles, marginRight: '0px', backgroundColor: '#00ffaa', color: '#1a1a1a'}}>{match.teams[0]?.name || 'BYE Participant'}</span>
                    <span style={{color: '#00ffaa', fontWeight: 'bold', fontSize: '1.2em'}}> (BYE)</span>
                </div>
            ) : (
                <>
                    {/* Player 1 Row / Score Display */}
                    <div style={{...rrTeamRowStyles(isWinnerA), justifyContent: 'center', gap: '20px'}}> {/* Centered and added gap */}
                        <span style={{...teamNameBoxStyles, marginRight: '0px', backgroundColor: '#00ffaa', color: '#1a1a1a'}}>{match.teams[0]?.name || 'Player 1'}</span>
                        
                        {/* --- SCORE DISPLAY AREA --- */}
                        <div style={rrScoreInputStyles}>
                            {isVisualization ? (
                                // Visualization Mode: Hide scores completely
                                <span style={{width: '60px', textAlign: 'center'}}></span>
                            ) : isEditing && isEditable ? (
                                // Score Entry Mode (Editing): Show Input Fields with stored values
                                <>
                                    <input type="number" min="0" style={scoreFieldStyles} value={scoreA} onChange={(e) => setScoreA(e.target.value)} disabled={isTournamentCompleted} />
                                    <span style={{ color: '#a0a0a0' }}>-</span>
                                    <input type="number" min="0" style={scoreFieldStyles} value={scoreB} onChange={(e) => setScoreB(e.target.value)} disabled={isTournamentCompleted} />
                                </>
                            ) : (
                                // Always show the stored scores in read-only mode
                                <>
                                    <span style={{...scoreFieldStyles, backgroundColor: 'transparent', border: 'none', color: isWinnerA ? '#39ff14' : '#e0e0e0' }}>{finalScoreDisplayA}</span>
                                    <span style={{ color: '#a0a0a0' }}>-</span>
                                    <span style={{...scoreFieldStyles, backgroundColor: 'transparent', border: 'none', color: isWinnerB ? '#39ff14' : '#e0e0e0' }}>{finalScoreDisplayB}</span>
                                </>
                            )}
                        </div>
                        
                        <span style={{...teamNameBoxStyles, marginLeft: '0px', backgroundColor: '#00ffaa', color: '#1a1a1a'}}>{match.teams[1]?.name || 'Player 2'}</span>
                    </div>
                    
                    {/* Action Row - Hidden for visualization mode */}
                    {!isVisualization && (
                        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '5px', gap: '10px'}}>
                            {isEditing && isEditable ? (
                                <>
                                    <button style={{...editButtonStyles, backgroundColor: '#ff6b6b'}} onClick={handleCancelClick}>
                                        Cancel
                                    </button>
                                    <button style={isTournamentCompleted ? disabledButtonStyles : rrUpdateBtnStyles} onClick={handleSave} disabled={isTournamentCompleted}>
                                        Save Score
                                    </button>
                                </>
                            ) : (
                                isCompleted ? (
                                    <button style={isTournamentCompleted ? disabledButtonStyles : editButtonStyles} onClick={handleEditClick} disabled={isTournamentCompleted}>
                                        Edit Score
                                    </button>
                                ) : (
                                    <button style={isTournamentCompleted ? disabledButtonStyles : rrUpdateBtnStyles} onClick={handleEditClick} disabled={isTournamentCompleted}>
                                        Enter Score
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Tie-breaker Modal - Only show if not a BYE match */}
            {showTieBreaker && !isByeMatch && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.7)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ 
                        backgroundColor: '#2a2a2a', 
                        padding: '30px', 
                        borderRadius: '10px', 
                        textAlign: 'center', 
                        boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{color: '#00ffaa', marginBottom: '20px'}}>Points are tied!</h3>
                        <p style={{color: '#e0e0e0', marginBottom: '25px'}}>Please select the team that won the match (e.g., by sudden death or rules decision).</p>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px'}}>
                            <label style={{color: '#e0e0e0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                                <input 
                                    type="radio" 
                                    name="tieWinner" 
                                    value={match.teams[0]?._id}
                                    checked={selectedWinner === match.teams[0]?._id}
                                    onChange={() => setSelectedWinner(match.teams[0]?._id)}
                                    style={{transform: 'scale(1.2)'}}
                                />
                                <span style={{fontWeight: 'bold'}}>{match.teams[0]?.name || 'Player 1'}</span>
                            </label>
                            <label style={{color: '#e0e0e0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                                <input 
                                    type="radio" 
                                    name="tieWinner" 
                                    value={match.teams[1]?._id}
                                    checked={selectedWinner === match.teams[1]?._id}
                                    onChange={() => setSelectedWinner(match.teams[1]?._id)}
                                    style={{transform: 'scale(1.2)'}}
                                />
                                <span style={{fontWeight: 'bold'}}>{match.teams[1]?.name || 'Player 2'}</span>
                            </label>
                        </div>
                        
                        <button 
                            style={{...updateButtonStyles, width: 'auto', padding: '10px 30px'}}
                            onClick={async () => {
                                if (selectedWinner) {
                                    console.log("MatchCard: Confirming winner with scores", parsedScoreA, parsedScoreB, "and winner ID", selectedWinner);
                                    // Await the score update when resolving tie
                                    await onScoreUpdate(match._id, {
                                        scores: [
                                            { teamId: match.teams[0]?._id || match.teams[0], score: parsedScoreA },
                                            { teamId: match.teams[1]?._id || match.teams[1], score: parsedScoreB }
                                        ],
                                        winnerId: selectedWinner
                                    });
                                    setShowTieBreaker(false);
                                    setSelectedWinner(null);
                                    setIsEditing(false); // Exit editing mode after successful tie resolution
                                } else {
                                    alert("Please select a winner to proceed.");
                                }
                            }}
                        >
                            Confirm Winner
                        </button>
                        <button 
                            style={{...editButtonStyles, backgroundColor: '#ff6b6b', marginLeft: '10px', width: 'auto', padding: '10px 30px'}}
                            onClick={() => {
                                setShowTieBreaker(false);
                                setSelectedWinner(null);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchCard;