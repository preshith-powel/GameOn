// frontend/src/components/shared/Leaderboard.jsx - FINAL CORRECTED CODE

import React, { useState } from 'react';
import { calculateLeaderboard } from './LeaderboardCalculations';
// *** CRITICAL FIX: Import championMessageStyles from the Styles file ***
import { championMessageStyles, roundTabStyles } from './TournamentStyles'; 


const Leaderboard = ({ tournament, matches }) => {
    const isGroupStage = tournament.format === 'group stage';
    const leaderboards = calculateLeaderboard(tournament, matches);
    
    const [activeGroup, setActiveGroup] = useState(isGroupStage && Object.keys(leaderboards).length > 0 ? Object.keys(leaderboards)[0] : null);

    // Determine which leaderboard to display
    let leaderboardData = [];
    if (isGroupStage && activeGroup) {
        leaderboardData = leaderboards[activeGroup] || [];
    } else if (!isGroupStage) {
        leaderboardData = leaderboards; // For non-group stage, leaderboards is a direct array
    }

    const isTournamentCompleted = tournament.status.toLowerCase() === 'completed';
    const championName = isTournamentCompleted && !isGroupStage && leaderboardData.length > 0 ? leaderboardData[0].name : null;

    if (leaderboardData.length === 0 && !isGroupStage) {
        return <p style={{color: '#ff6b6b'}}>No participants registered or no matches completed yet to generate standings.</p>;
    }
    
    return (
        <>
            {isGroupStage && Object.keys(leaderboards).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                    {Object.keys(leaderboards).sort().map(groupName => (
                        <button 
                            key={groupName} 
                            style={roundTabStyles(activeGroup === groupName)} 
                            onClick={() => setActiveGroup(groupName)}
                        >
                            {groupName}
                        </button>
                    ))}
                </div>
            )}

            {isGroupStage && !activeGroup && Object.keys(leaderboards).length > 0 && (
                <p style={{color: '#e0e0e0'}}>Select a group to view its leaderboard.</p>
            )}

            {(leaderboardData.length > 0 || !isGroupStage) && (
                <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9em' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#2c2c2c' }}>
                            <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'left', width: '5%' }}>#</th>
                            <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'left', width: '40%' }}>Name</th>
                            <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '5%' }}>P</th>
                            <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '5%' }}>W</th>
                            <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '5%' }}>L</th>
                            <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', width: '5%' }}>D</th>
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
                                <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.w}</td>
                                <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.l}</td>
                                <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.d}</td>
                                <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{data.diff}</td>
                                <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center', color: '#39ff14' }}>{data.pts}</td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                    
                    {isTournamentCompleted && championName && (
                        <p style={championMessageStyles}>
                            {championName.toUpperCase()} IS THE CHAMPION! 🏆
                        </p>
                    )}
                </>
            )}
        </>
    );
};

export default Leaderboard;