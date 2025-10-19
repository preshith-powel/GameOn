// frontend/src/components/shared/LeaderboardCalculations.js - FINAL MULTI-SPORT FIX

import { SPORT_CONSTANTS } from '../../data/sportConstants'; // FIX 1: Import constants

/**
 * Calculates the leaderboard standings based on tournament sport rules.
 * @param {object} tournament - The tournament object (includes the sport type).
 * @param {array} matches - All completed matches for the tournament.
 * @returns {object} An object containing { standings, displayColumns }
 */
export const calculateLeaderboard = (tournament, matches) => {
    const sportType = tournament.sport || 'other';
    const rules = SPORT_CONSTANTS[sportType] || SPORT_CONSTANTS['other'];
    
    // Define the column structure expected by Leaderboard.jsx
    const defaultColumns = [
        { header: 'P', key: 'p', width: '5%' },
        { header: 'W-L-D', key: 'wld', width: '20%' },
        { header: '+/-', key: 'diff', width: '10%' },
        { header: 'Pts', key: 'pts', width: '10%', isPoints: true },
    ];

    // --- 1. Initialize stats for all registered participants ---
    const statsMap = new Map();
    const participants = tournament.registeredParticipants || [];
    
    participants.forEach(p => {
        // Reworked initial stats for flexibility
        statsMap.set(p._id, {
            name: p.name || 'Unknown',
            p: 0, w: 0, l: 0, d: 0, 
            pts: 0,
            // Custom stats will be added here based on sport
            customStats: { diff: 0, scored: 0, conceded: 0 }, 
            id: p._id
        });
    });

    // --- 2. Process completed matches based on sport ---
    matches.filter(m => m.status === 'completed' && m.participants?.length === 2).forEach(match => {
        const pA = match.participants[0];
        const pB = match.participants[1];
        
        const idA = pA.entityId; 
        const idB = pB.entityId; 

        // FIX 2: Check model consistency
        if (!statsMap.has(idA) || !statsMap.has(idB)) return;

        const statA = statsMap.get(idA);
        const statB = statsMap.get(idB);
        
        let resultA = 0; // -1 for loss, 0 for draw, 1 for win
        let pointsA = 0;
        let pointsB = 0;

        // --- FIX 1: Sport-specific logic ---
        switch (sportType) {
            case 'football':
            case 'volleyball':
            case 'multi':
            case 'other':
                // Simple score comparison (assuming scoreData contains 'finalScore' or similar)
                const scoreA = pA.scoreData.finalScore || pA.scoreData.totalScore || 0;
                const scoreB = pB.scoreData.finalScore || pB.scoreData.totalScore || 0;

                if (scoreA > scoreB) {
                    resultA = 1;
                    pointsA = 3; pointsB = 0;
                } else if (scoreB > scoreA) {
                    resultA = -1;
                    pointsA = 0; pointsB = 3;
                } else {
                    resultA = 0;
                    pointsA = 1; pointsB = 1;
                }

                // Update custom stats (Goal/Point Difference)
                statA.customStats.scored += scoreA;
                statA.customStats.conceded += scoreB;
                statB.customStats.scored += scoreB;
                statB.customStats.conceded += scoreA;
                break;
            
            case 'cricket':
            case 'badminton':
                // This logic needs detailed score data (e.g., setsWon, wickets) from scoreData, 
                // but for this calculation, we rely on the backend pre-calculating the winner.
                // Since our Match model stores `isWinner` as a boolean, we simplify the points lookup.
                
                if (pA.isWinner) {
                    resultA = 1;
                    pointsA = 2; pointsB = 0; // Cricket/Badminton often use 2 points for a win
                } else if (pB.isWinner) {
                    resultA = -1;
                    pointsA = 0; pointsB = 2;
                } else {
                    resultA = 0;
                    pointsA = 1; pointsB = 1; // Unlikely, but handles technical draw
                }
                
                // Detailed stats calculation (e.g., runs scored) would go here, 
                // but we skip for the min project scope, relying only on W-L.
                break;

            default:
                // Fallback to simple W/L based on winnerId lookup
                if (match.winnerId?.toString() === idA.toString()) {
                    resultA = 1; pointsA = 3; pointsB = 0;
                } else if (match.winnerId?.toString() === idB.toString()) {
                    resultA = -1; pointsA = 0; pointsB = 3;
                } else {
                    resultA = 0; pointsA = 1; pointsB = 1;
                }
        }

        // Apply shared updates (P, W/L/D, Pts)
        statA.p += 1;
        statB.p += 1;
        statA.pts += pointsA;
        statB.pts += pointsB;

        if (resultA === 1) {
            statA.w += 1;
            statB.l += 1;
        } else if (resultA === -1) {
            statB.w += 1;
            statA.l += 1;
        } else {
            statA.d += 1;
            statB.d += 1;
        }
    });

    // --- 3. Convert map to array and format data ---
    let leaderboardArray = Array.from(statsMap.values()).map(stat => {
        let diffValue = stat.customStats.scored - stat.customStats.conceded;

        return {
            ...stat,
            // 'wld' is used by the Leaderboard component
            wld: `${stat.w}-${stat.l}-${stat.d}`,
            // 'diff' is used for sorting tie-breakers
            diff: diffValue,
            // This is the data key used in the dynamic column display
            pointDiff: diffValue, 
            gamesPlayed: stat.p,
        };
    });

    // --- 4. Sort the leaderboard (Primary: Points, Secondary: Tie-breaker) ---
    leaderboardArray.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        // Tie-breaker: Use the difference metric
        return b.diff - a.diff; 
    });
    
    // 5. Assign rank
    leaderboardArray = leaderboardArray.map((stat, index) => ({
        ...stat,
        rank: index + 1
    }));

    // 6. Only show participants who have played or are registered
    leaderboardArray = leaderboardArray.filter(stat => stat.p > 0 || participants.some(p => p._id === stat.id));

    // --- 7. Define Dynamic Columns to return to Leaderboard.jsx ---
    let displayColumns;
    if (sportType === 'badminton' || sportType === 'cricket') {
        // Use simpler W-L-D for sports where simple difference is not the primary tie-breaker
        displayColumns = [
            { header: 'P', key: 'p', width: '10%' },
            { header: 'W-L-D', key: 'wld', width: '20%' },
            { header: 'Pts', key: 'pts', width: '10%', isPoints: true },
        ];
    } else {
        // Use the full W-L-D and Difference for sports like Football/Volleyball
        displayColumns = [
            { header: 'P', key: 'p', width: '5%' },
            { header: 'W-L-D', key: 'wld', width: '20%' },
            { header: 'Diff', key: 'pointDiff', width: '10%' }, // Key matches the mapped name
            { header: 'Pts', key: 'pts', width: '10%', isPoints: true },
        ];
    }

    // --- Final Return ---
    return {
        standings: leaderboardArray,
        displayColumns: displayColumns
    };
};