// frontend/src/components/shared/CricketScorecard.jsx

import React from 'react';
import { updateButtonStyles } from './TournamentStyles';

const CricketScorecard = ({ participantA, participantB, isEditing, onSave }) => {
    // Access runs/wickets safely
    const initialRunsA = participantA.scoreData?.runs ?? '0';
    const initialWicketsA = participantA.scoreData?.wickets ?? '0';
    
    const [runsA, setRunsA] = React.useState(initialRunsA);
    const [wicketsA, setWicketsA] = React.useState(initialWicketsA);
    const [runsB, setRunsB] = React.useState(participantB.scoreData?.runs ?? '0');
    const [wicketsB, setWicketsB] = React.useState(participantB.scoreData?.wickets ?? '0');


    const handleSave = () => {
        // CRITICAL: Submits the flexible scoreData object needed by ScoringLogic.js
        const scorePayload = { 
            runsA: Number(runsA), 
            wicketsA: Number(wicketsA),
            runsB: Number(runsB), 
            wicketsB: Number(wicketsB),
        };
        onSave(scorePayload);
    };

    const WinnerLabel = ({ isWinner }) => (
        <span style={{ color: isWinner ? '#39ff14' : '#a0a0a0', fontWeight: 'bold', marginLeft: '10px' }}>
            {isWinner ? 'Winner' : 'Loser'}
        </span>
    );
    
    const renderScores = (p, isA) => (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ width: '50px', textAlign: 'right' }}>Runs:</span>
            {isEditing ? (
                <input 
                    type="number" 
                    min="0" 
                    value={isA ? runsA : runsB} 
                    onChange={(e) => (isA ? setRunsA(e.target.value) : setRunsB(e.target.value))} 
                    style={{ width: '40px', backgroundColor: '#333', color: '#fff' }}
                />
            ) : (
                <span>{p.scoreData?.runs ?? '0'}</span>
            )}
             <span style={{ width: '50px', textAlign: 'right' }}>Wkts:</span>
            {isEditing ? (
                <input 
                    type="number" 
                    min="0" 
                    max="10"
                    value={isA ? wicketsA : wicketsB} 
                    onChange={(e) => (isA ? setWicketsA(e.target.value) : setWicketsB(e.target.value))} 
                    style={{ width: '40px', backgroundColor: '#333', color: '#fff' }}
                />
            ) : (
                <span>{p.scoreData?.wickets ?? '0'}</span>
            )}
        </div>
    );


    return (
        <div style={{ padding: '10px 0', border: '1px solid #333', borderRadius: '5px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{participantA.entityId?.name || 'Team A'}</span>
                {renderScores(participantA, true)}
                {participantA.isWinner !== undefined && <WinnerLabel isWinner={participantA.isWinner} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{participantB.entityId?.name || 'Team B'}</span>
                {renderScores(participantB, false)}
                {participantB.isWinner !== undefined && <WinnerLabel isWinner={participantB.isWinner} />}
            </div>
            
            {isEditing && (
                <button 
                    onClick={handleSave} 
                    style={{...updateButtonStyles, marginTop: '15px'}}
                >
                    Finalize Cricket Score
                </button>
            )}
        </div>
    );
};

export default CricketScorecard;