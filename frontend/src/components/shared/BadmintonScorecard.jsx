// frontend/src/components/shared/BadmintonScorecard.jsx

import React from 'react';
import { updateButtonStyles } from './TournamentStyles';

const BadmintonScorecard = ({ participantA, participantB, isEditing, onSave }) => {
    // For simplicity, we just track Sets Won/Lost in this component
    const initialSetsA = participantA.scoreData?.setsWon ?? 0;
    const initialSetsB = participantB.scoreData?.setsWon ?? 0;
    
    const [setsA, setSetsA] = React.useState(initialSetsA);
    const [setsB, setSetsB] = React.useState(initialSetsB);

    const handleSave = () => {
        // CRITICAL: Submits the necessary data (setsWon) for ScoringLogic.js
        const scorePayload = { 
            setsWonA: Number(setsA), 
            setsWonB: Number(setsB),
            // Example: setScoresA: [21, 18], setScoresB: [18, 21] - detailed scores would go here
        };
        onSave(scorePayload);
    };

    const winnerIndicator = (isWinner) => isWinner ? '🏆' : '';

    return (
        <div style={{ padding: '10px 0' }}>
            <h4 style={{ color: '#00ffaa' }}>Badminton Sets</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{winnerIndicator(participantA.isWinner)} {participantA.entityId?.name || 'Player A'}</span>
                    {isEditing ? (
                        <input type="number" min="0" value={setsA} onChange={(e) => setSetsA(e.target.value)} style={{ width: '40px', backgroundColor: '#333', color: '#fff' }} />
                    ) : (
                        <span>Sets Won: {participantA.scoreData?.setsWon ?? 0}</span>
                    )}
                </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{winnerIndicator(participantB.isWinner)} {participantB.entityId?.name || 'Player B'}</span>
                    {isEditing ? (
                        <input type="number" min="0" value={setsB} onChange={(e) => setSetsB(e.target.value)} style={{ width: '40px', backgroundColor: '#333', color: '#fff' }} />
                    ) : (
                        <span>Sets Won: {participantB.scoreData?.setsWon ?? 0}</span>
                    )}
                </div>
            </div>
            {isEditing && (
                <button onClick={handleSave} style={{...updateButtonStyles, marginTop: '15px'}}>
                    Save Sets Won
                </button>
            )}
        </div>
    );
};

export default BadmintonScorecard;