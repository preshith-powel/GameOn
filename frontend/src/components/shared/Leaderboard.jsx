// frontend/src/components/shared/Leaderboard.jsx - FINAL CORRECTED CODE

import React from 'react';
import { calculateLeaderboard } from './LeaderboardCalculations';
// *** CRITICAL FIX: Import championMessageStyles from the Styles file ***
import { championMessageStyles } from './TournamentStyles'; 


const Leaderboard = ({ tournament, matches }) => {
    const leaderboardData = calculateLeaderboard(tournament, matches);
    const isTournamentCompleted = tournament.status.toLowerCase() === 'completed';
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
            
            {isTournamentCompleted && championName && (
                <p style={championMessageStyles}>
                    {championName.toUpperCase()} IS THE CHAMPION! 🏆
                </p>
            )}
        </>
    );
};

export default Leaderboard;