// frontend/src/components/shared/MatchCard.jsx - FINAL CORRECTED CODE (Dynamic Multi-Sport Loader)

import React, { useState, useEffect } from 'react';
// FIX: Corrected the import path for the Cricket Scorecard.
import { 
    updateButtonStyles, disabledButtonStyles, editButtonStyles, rrUpdateBtnStyles, rrMatchCardStyles, rrTeamRowStyles, scoreFieldStyles 
} from './TournamentStyles'; 
import { SPORT_CONSTANTS } from '../../data/sportConstants';

// --- Import All Scorecard Components (FIX 2) ---
// You MUST create these files as placeholders!
import FootballScorecard from './FootballScorecard'; 
import CricketScorecard from './CricketScorecard'; // FIX 1: Removed duplicate '
import BadmintonScorecard from './BadmintonScorecard';
import VolleyballScorecard from './VolleyballScorecard';
import MultiSportScorecard from './MultiSportScorecard';

// --- Component Map ---
const ScorecardComponentMap = {
    FootballScorecard: FootballScorecard,
    CricketScorecard: CricketScorecard,
    BadmintonScorecard: BadmintonScorecard,
    VolleyballScorecard: VolleyballScorecard,
    MultiSportScorecard: MultiSportScorecard,
};

// Default MatchCard (simple TBD or error state)
const DefaultScorecard = () => (
    <div style={{ padding: '10px', color: '#ff6b6b' }}>Scorecard Not Found or Not Implemented.</div>
);


const MatchCard = ({ match, onScoreUpdate, isTournamentCompleted, isSingleElimination = false, hasAdminRights = false }) => {
    
    // --- FIX 2: Access data from the CORRECT flexible model ---
    if (!match.participants || match.participants.length < 2) { // CRITICAL FIX
        return <div style={{...rrMatchCardStyles, color: '#ff6b6b'}}>Error: Missing Participant Data for Match ID: {match._id}</div>;
    }

    const participantA = match.participants[0];
    const participantB = match.participants[1];
    
    // Get the sport type and determine the correct scorecard component name
    const sportType = match.sportType || 'other';
    const scorecardName = SPORT_CONSTANTS[sportType]?.scorecardComponent;
    const DynamicScorecard = ScorecardComponentMap[scorecardName] || DefaultScorecard;

    const isCompleted = match.status === 'completed'; 
    const isVisualization = isSingleElimination && !hasAdminRights; 
    const isEditable = !isVisualization && hasAdminRights;

    const [isEditing, setIsEditing] = useState(isEditable && !isCompleted && !isTournamentCompleted); 

    // Sync state when the match prop changes
    useEffect(() => {
        setIsEditing(isEditable && !isCompleted && !isTournamentCompleted);
    }, [match.status, isCompleted, isTournamentCompleted, isEditable]);
    
    // --- FIX 3: New handleSave that uses flexible scoreDataObject ---
    const handleSave = (scoreDataObject) => { // CRITICAL FIX: Expects scoreDataObject
        if (!isEditable || isTournamentCompleted) return;
        
        // This function passes the flexible scoreData object to the parent/API caller
        // The parent component should then call the backend: onScoreUpdate(match._id, { scoreData: scoreDataObject, status: 'completed' });
        onScoreUpdate(match._id, { scoreData: scoreDataObject, status: 'completed' }); // CRITICAL FIX: Pass object
        setIsEditing(false); // Close edit mode after saving
    };
    
    const handleEditClick = () => {
        if (!isEditable || isTournamentCompleted) return;
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
    };
    
    // Check if the current user is the winner based on the updated match model
    const isWinnerA = isCompleted && participantA.isWinner;
    const isWinnerB = isCompleted && participantB.isWinner;

    const matchCardStyle = isSingleElimination ? { ...rrMatchCardStyles, padding: '10px', marginBottom: '10px' } : rrMatchCardStyles;


    return (
        <div style={matchCardStyle}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                
                {/* --- Dynamic Scorecard Component --- */}
                <DynamicScorecard
                    participantA={participantA}
                    participantB={participantB}
                    isEditing={isEditing}
                    isCompleted={isCompleted}
                    isVisualization={isVisualization}
                    onSave={handleSave} // Pass the save handler down
                />

                {/* Action Row - Hidden for visualization mode */}
                {!isVisualization && (
                    <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '5px', gap: '10px'}}>
                        {isEditing && isEditable ? (
                            <>
                                <button style={{...editButtonStyles, backgroundColor: '#ff6b6b'}} onClick={handleCancelClick}>
                                    Cancel
                                </button>
                                {/* Removed the general Save Score button to force use of the specific scorecard's save button */}
                            </>
                        ) : (
                            isEditable && (
                                <button 
                                    style={isTournamentCompleted ? disabledButtonStyles : editButtonStyles} 
                                    onClick={handleEditClick} 
                                    disabled={isTournamentCompleted || isEditing}
                                >
                                    {isCompleted ? 'Edit Score' : 'Enter Score'}
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchCard;