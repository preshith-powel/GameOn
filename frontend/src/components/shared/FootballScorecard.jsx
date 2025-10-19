// frontend/src/components/shared/FootballScorecard.jsx

import React from 'react';
import { updateButtonStyles } from './TournamentStyles';

const FootballScorecard = ({ participantA, participantB, isEditing, onSave }) => {
    // Access final scores safely, assuming 'finalScore' is set by ScoringLogic.js
    const scoreA = participantA.scoreData?.finalScore ?? '0';
    const scoreB = participantB.scoreData?.finalScore ?? '0';
    
    // Placeholder state for editing (should be pulled from participant data if editing)
    const [tempScoreA, setTempScoreA] = React.useState(scoreA);
    const [tempScoreB, setTempScoreB] = React.useState(scoreB);

    const handleSave = () => {
        // CRITICAL: Submits the flexible scoreData object needed by matchRoutes.js
        const scorePayload = { 
            finalScoreA: Number(tempScoreA), 
            finalScoreB: Number(tempScoreB) 
        };
        onSave(scorePayload);
    };
    
    // Simplified style placeholder
    const winnerColor = (isWinner) => isWinner ? '#39ff14' : '#e0e0e0';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: winnerColor(participantA.isWinner) }}>{participantA.entityId?.name || 'Team A'}</span>
                {isEditing ? (
                    <input 
                        type="number" 
                        min="0" 
                        value={tempScoreA} 
                        onChange={(e) => setTempScoreA(e.target.value)} 
                        style={{ width: '50px', textAlign: 'center', backgroundColor: '#333', color: '#fff' }}
                    />
                ) : (
                    <span style={{ color: winnerColor(participantA.isWinner) }}>{scoreA}</span>
                )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: winnerColor(participantB.isWinner) }}>{participantB.entityId?.name || 'Team B'}</span>
                 {isEditing ? (
                    <input 
                        type="number" 
                        min="0" 
                        value={tempScoreB} 
                        onChange={(e) => setTempScoreB(e.target.value)} 
                        style={{ width: '50px', textAlign: 'center', backgroundColor: '#333', color: '#fff' }}
                    />
                ) : (
                    <span style={{ color: winnerColor(participantB.isWinner) }}>{scoreB}</span>
                )}
            </div>
            
            {isEditing && (
                <button 
                    onClick={handleSave} 
                    style={{...updateButtonStyles, marginTop: '10px'}}
                >
                    Save Goals
                </button>
            )}
        </div>
    );
};

export default FootballScorecard;