// frontend/src/components/shared/VolleyballScorecard.jsx

import React from 'react';
import { updateButtonStyles } from './TournamentStyles';

const VolleyballScorecard = ({ participantA, participantB, isEditing, onSave }) => {
    // Volleyball often relies on total sets/points, using 'finalScore' as a point count placeholder
    const initialPointsA = participantA.scoreData?.finalScore ?? 0;
    const initialPointsB = participantB.scoreData?.finalScore ?? 0;
    
    const [pointsA, setPointsA] = React.useState(initialPointsA);
    const [pointsB, setPointsB] = React.useState(initialPointsB);

    const handleSave = () => {
        // Submits simple final point count/score
        const scorePayload = { 
            finalScoreA: Number(pointsA), 
            finalScoreB: Number(pointsB) 
        };
        onSave(scorePayload);
    };

    const scoreDisplay = (p) => p.scoreData?.finalScore ?? '0';

    return (
        <div style={{ padding: '10px 0' }}>
            <h4 style={{ color: '#00ffaa' }}>Volleyball Score (Point Count)</h4>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{participantA.entityId?.name || 'Team A'}</span>
                {isEditing ? (
                    <input type="number" min="0" value={pointsA} onChange={(e) => setPointsA(e.target.value)} style={{ width: '50px', backgroundColor: '#333', color: '#fff' }} />
                ) : (
                    <span>{scoreDisplay(participantA)}</span>
                )}
            </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{participantB.entityId?.name || 'Team B'}</span>
                {isEditing ? (
                    <input type="number" min="0" value={pointsB} onChange={(e) => setPointsB(e.target.value)} style={{ width: '50px', backgroundColor: '#333', color: '#fff' }} />
                ) : (
                    <span>{scoreDisplay(participantB)}</span>
                )}
            </div>
            {isEditing && (
                <button onClick={handleSave} style={{...updateButtonStyles, marginTop: '15px'}}>
                    Save Points
                </button>
            )}
        </div>
    );
};

export default VolleyballScorecard;