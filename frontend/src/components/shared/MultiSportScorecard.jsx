// frontend/src/components/shared/MultiSportScorecard.jsx

import React from 'react';
import { updateButtonStyles } from './TournamentStyles';

const MultiSportScorecard = ({ participantA, participantB, isEditing, onSave }) => {
    // Used for generic scoring or single-event tracking
    const initialScoreA = participantA.scoreData?.totalScore ?? 0;
    const initialScoreB = participantB.scoreData?.totalScore ?? 0;
    
    const [scoreA, setScoreA] = React.useState(initialScoreA);
    const [scoreB, setScoreB] = React.useState(initialScoreB);

    const handleSave = () => {
        // Submits simple total score/points for general tracking
        const scorePayload = { 
            totalScoreA: Number(scoreA), 
            totalScoreB: Number(scoreB) 
        };
        onSave(scorePayload);
    };

    const finalDisplay = (p) => p.scoreData?.totalScore ?? 'N/A';

    return (
        <div style={{ padding: '10px 0' }}>
            <h4 style={{ color: '#00ffaa' }}>Multi-Sport Score (Total Points/Events Won)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{participantA.entityId?.name || 'Participant A'}</span>
                {isEditing ? (
                    <input type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} style={{ width: '50px', backgroundColor: '#333', color: '#fff' }} />
                ) : (
                    <span>{finalDisplay(participantA)}</span>
                )}
            </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{participantB.entityId?.name || 'Participant B'}</span>
                {isEditing ? (
                    <input type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} style={{ width: '50px', backgroundColor: '#333', color: '#fff' }} />
                ) : (
                    <span>{finalDisplay(participantB)}</span>
                )}
            </div>
            {isEditing && (
                <button onClick={handleSave} style={{...updateButtonStyles, marginTop: '15px'}}>
                    Save Event Score
                </button>
            )}
        </div>
    );
};

export default MultiSportScorecard;