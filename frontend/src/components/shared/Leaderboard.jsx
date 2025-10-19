// frontend/src/components/shared/Leaderboard.jsx - UPDATED CODE (Dynamic Columns)

import React from 'react';
// FIX 1: Assume calculateLeaderboard returns both data and the column headers
import { calculateLeaderboard } from './LeaderboardCalculations'; 
import { championMessageStyles } from './TournamentStyles'; 


// Placeholder style objects for functionality (MUST be replaced by CSS classes in final project)
const tableStyles = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9em' };
const headerRowStyles = { backgroundColor: '#2c2c2c' };
const cellStyles = { padding: '10px', border: '1px solid #333', textAlign: 'left' };
const centerCellStyles = { padding: '10px', border: '1px solid #333', textAlign: 'center' };
const pointsCellStyles = { ...centerCellStyles, color: '#39ff14', fontWeight: 'bold' };

const Leaderboard = ({ tournament, matches }) => {
    // FIX 1: Destructure to get the standings data AND the column headers
    const { standings: leaderboardData, displayColumns } = calculateLeaderboard(tournament, matches);

    const isTournamentCompleted = tournament.status.toLowerCase() === 'completed';
    const championName = leaderboardData.length > 0 ? leaderboardData[0].name : null;
    
    if (leaderboardData.length === 0) {
        return <p style={{color: '#ff6b6b'}}>No participants registered or no matches completed yet to generate standings.</p>;
    }
    
    return (
        <>
            <table style={tableStyles}>
                <thead>
                    <tr style={headerRowStyles}>
                        <th style={{ ...cellStyles, width: '5%' }}>#</th>
                        <th style={{ ...cellStyles, width: '30%' }}>Name</th>
                        {/* FIX 1: Dynamically generate the remaining columns based on the calculation result */}
                        {displayColumns.map((col, index) => (
                            <th 
                                key={index} 
                                style={{ ...centerCellStyles, width: col.width || '10%' }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.map((data, index) => (
                        <tr key={data.id} style={{ backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#2c2c2c' }}>
                            <td style={cellStyles}>{data.rank}</td>
                            <td style={{ ...cellStyles, fontWeight: 'bold' }}>{data.name}</td>
                            
                            {/* FIX 1: Dynamically render the cell data based on the column keys */}
                            {displayColumns.map((col, colIndex) => (
                                <td 
                                    key={colIndex} 
                                    style={col.isPoints ? pointsCellStyles : centerCellStyles}
                                >
                                    {data[col.key]}
                                </td>
                            ))}
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