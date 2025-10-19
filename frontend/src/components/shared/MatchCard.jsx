// frontend/src/components/shared/MatchCard.jsx - FINAL CODE (Green Highlight & Hide Scores)

import React, { useState, useEffect } from 'react';
// Import all styles from the dedicated style file
import { 
    updateButtonStyles, disabledButtonStyles, editButtonStyles, rrUpdateBtnStyles, rrMatchCardStyles, rrTeamRowStyles, rrScoreInputStyles, scoreFieldStyles 
} from './TournamentStyles'; 

const MatchCard = ({ match, onScoreUpdate, isTournamentCompleted, isSingleElimination = false, hasAdminRights = false }) => {
    
    // isVisualization is TRUE if single elimination is active AND we don't have scoring rights (read-only map)
    const isVisualization = isSingleElimination && !hasAdminRights; 
    
    if (!match.teams || match.teams.length < 2) {
        return <div style={{...rrMatchCardStyles, color: '#ff6b6b'}}>Error: Missing Participant Data for Match ID: {match._id}</div>;
    }
    
    const isCompleted = match.status === 'completed'; 
    const [scoreA, setScoreA] = useState(match.scores?.teamA ?? '');
    const [scoreB, setScoreB] = useState(match.scores?.teamB ?? '');
    
    const isEditable = !isVisualization && hasAdminRights;

    const [isEditing, setIsEditing] = useState(isEditable && !isCompleted && !isTournamentCompleted); 
    
    // EFFECT: Reset local state when the match prop changes (i.e., when data is refetched)
    useEffect(() => {
        setScoreA(match.scores?.teamA ?? '');
        setScoreB(match.scores?.teamB ?? '');
        setIsEditing(isEditable && !isCompleted && !isTournamentCompleted);
    }, [match.scores, isCompleted, isTournamentCompleted, isEditable]);
    
    
    const handleSave = () => {
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

        onScoreUpdate(match._id, a, b); 
    };
    
    const handleEditClick = () => {
        if (!isEditable || isTournamentCompleted) return;
        setScoreA(match.scores?.teamA ?? 0);
        setScoreB(match.scores?.teamB ?? 0);
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setScoreA(match.scores?.teamA ?? '');
        setScoreB(match.scores?.teamB ?? '');
        setIsEditing(false);
    };
    
    const finalScoreDisplayA = match.scores?.teamA ?? 0;
    const finalScoreDisplayB = match.scores?.teamB ?? 0;

    const isWinnerA = isCompleted && finalScoreDisplayA > finalScoreDisplayB;
    const isWinnerB = isCompleted && finalScoreDisplayB > finalScoreDisplayA;

    const matchCardStyle = isSingleElimination ? { ...rrMatchCardStyles, padding: '10px', marginBottom: '10px' } : rrMatchCardStyles;


    return (
        <div style={matchCardStyle}>
            {/* Player 1 Row / Score Display */}
            <div style={rrTeamRowStyles(isWinnerA)}>
                <span style={{fontWeight: isWinnerA ? 'bold' : '500', marginRight: '20px'}}>{match.teams[0]?.name || 'Player 1'}</span>
                
                {/* --- SCORE DISPLAY AREA --- */}
                <div style={rrScoreInputStyles}>
                    {isVisualization ? (
                        // Visualization Mode: Hide scores completely
                        <span style={{width: '60px', textAlign: 'center'}}></span>
                    ) : isEditing && isEditable ? (
                        // Score Entry Mode (Editing): Show Input Fields
                        <>
                            <input type="number" min="0" style={scoreFieldStyles} value={scoreA} onChange={(e) => setScoreA(e.target.value)} disabled={isTournamentCompleted} />
                            <span style={{ color: '#a0a0a0' }}>-</span>
                            <input type="number" min="0" style={scoreFieldStyles} value={scoreB} onChange={(e) => setScoreB(e.target.value)} disabled={isTournamentCompleted} />
                        </>
                    ) : (
                         // Score Entry Mode (Read-Only): Show Scores
                        <>
                            <span style={{...scoreFieldStyles, backgroundColor: 'transparent', border: 'none', color: isWinnerA ? '#39ff14' : '#e0e0e0' }}>{finalScoreDisplayA}</span>
                            <span style={{ color: '#a0a0a0' }}>-</span>
                            <span style={{...scoreFieldStyles, backgroundColor: 'transparent', border: 'none', color: isWinnerB ? '#39ff14' : '#e0e0e0' }}>{finalScoreDisplayB}</span>
                        </>
                    )}
                </div>
                
                <span style={{fontWeight: isWinnerB ? 'bold' : '500', marginLeft: '20px'}}>{match.teams[1]?.name || 'Player 2'}</span>
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
        </div>
    );
};

export default MatchCard;