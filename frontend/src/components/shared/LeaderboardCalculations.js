// frontend/src/components/common/LeaderboardCalculations.js

/**
 * Calculates the leaderboard standings for Round Robin or Group Stage formats.
 * Uses simplified football/soccer scoring rules (Win=3, Draw=1, Loss=0).
 * @param {object} tournament - The tournament object.
 * @param {array} matches - All matches for the tournament.
 * @returns {array|object} Sorted array of participant statistics (for round robin/single elimination) or an object of leaderboards keyed by group name (for group stage).
 */
export const calculateLeaderboard = (tournament, matches) => {
    // Handle Group Stage separately
    if (tournament.format === 'group stage') {
        const groupLeaderboards = {};
        const uniqueGroups = [...new Set(matches.map(m => m.group))].filter(Boolean).sort();

        uniqueGroups.forEach(groupName => {
            const matchesInGroup = matches.filter(m => m.group === groupName);
            const participantsInGroup = tournament.registeredParticipants.filter(p => 
                matchesInGroup.some(m => m.teams.some(teamId => teamId.toString() === p._id.toString()))
            );
            
            if (participantsInGroup.length === 0) return; 

            const groupStatsMap = new Map();
            participantsInGroup.forEach(p => {
                groupStatsMap.set(p._id.toString(), {
                    name: p.name || 'Unknown',
                    p: 0, w: 0, l: 0, d: 0, goalsScored: 0, goalsConceded: 0, pts: 0,
                    id: p._id.toString()
                });
            });

            matchesInGroup.filter(m => m.status === 'completed' && m.scores && m.teams?.length === 2).forEach(match => {
                const idA = match.teams[0]?._id?.toString?.() || match.teams[0]?.toString();
                const idB = match.teams[1]?._id?.toString?.() || match.teams[1]?.toString();

                if (!groupStatsMap.has(idA) || !groupStatsMap.has(idB)) return;

                const statA = groupStatsMap.get(idA);
                const statB = groupStatsMap.get(idB);

                // Extract scores from array
                let scoreA = 0, scoreB = 0;
                if (Array.isArray(match.scores)) {
                    for (const entry of match.scores) {
                        if (entry.teamId?.toString() === idA) scoreA = entry.score;
                        if (entry.teamId?.toString() === idB) scoreB = entry.score;
                    }
                }

                statA.p += 1;
                statB.p += 1;
                statA.goalsScored += scoreA;
                statA.goalsConceded += scoreB;
                statB.goalsScored += scoreB;
                statB.goalsConceded += scoreA;

                if (scoreA > scoreB) {
                    statA.w += 1;
                    statB.l += 1;
                    statA.pts += 3;
                } else if (scoreB > scoreA) {
                    statB.w += 1;
                    statA.l += 1;
                    statB.pts += 3;
                } else {
                    statA.d += 1;
                    statB.d += 1;
                    statA.pts += 1;
                }
            });

            let groupLeaderboardArray = Array.from(groupStatsMap.values()).map(stat => ({
                ...stat,
                diff: stat.goalsScored - stat.goalsConceded,
                wld: `${stat.w}-${stat.l}-${stat.d}`
            }));

            groupLeaderboardArray.sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                return b.diff - a.diff;
            });

            groupLeaderboardArray = groupLeaderboardArray.map((stat, index) => ({
                ...stat,
                rank: index + 1
            }));

            groupLeaderboards[groupName] = groupLeaderboardArray.filter(stat => stat.p > 0 || participantsInGroup.some(p => p._id.toString() === stat.id));
        });

        return groupLeaderboards;
    }

    // 1. Initialize stats for all registered participants
    const statsMap = new Map();
    const participants = tournament.registeredParticipants || [];
    
    participants.forEach(p => {
        statsMap.set(p._id, {
            name: p.name || 'Unknown',
            p: 0, w: 0, l: 0, d: 0, goalsScored: 0, goalsConceded: 0, pts: 0,
            id: p._id
        });
    });

    // 2. Process completed matches
    matches.filter(m => m.status === 'completed' && m.scores && m.teams?.length === 2).forEach(match => {
        const idA = match.teams[0]?._id?.toString?.() || match.teams[0]?.toString();
        const idB = match.teams[1]?._id?.toString?.() || match.teams[1]?.toString();

        // Extract scores from array
        let scoreA = 0, scoreB = 0;
        if (Array.isArray(match.scores)) {
            for (const entry of match.scores) {
                if (entry.teamId?.toString() === idA) scoreA = entry.score;
                if (entry.teamId?.toString() === idB) scoreB = entry.score;
            }
        }

        // Ensure both participants are still registered and in our map
        if (!statsMap.has(idA) || !statsMap.has(idB)) return;

        const statA = statsMap.get(idA);
        const statB = statsMap.get(idB);

        // Update matches played (P) and goals
        statA.p += 1;
        statB.p += 1;
        statA.goalsScored += scoreA;
        statA.goalsConceded += scoreB;
        statB.goalsScored += scoreB;
        statB.goalsConceded += scoreA;

        // Determine result and points
        if (scoreA > scoreB) {
            statA.w += 1;
            statB.l += 1;
            statA.pts += 3;
        } else if (scoreB > scoreA) {
            statB.w += 1;
            statA.l += 1;
            statB.pts += 3;
        } else {
            statA.d += 1;
            statB.d += 1;
            statA.pts += 1;
        }
    });

    // 3. Convert map to array and calculate Goal Difference
    let leaderboardArray = Array.from(statsMap.values()).map(stat => ({
        ...stat,
        diff: stat.goalsScored - stat.goalsConceded, // Corrected to GS - GC
        wld: `${stat.w}-${stat.l}-${stat.d}`
    }));

    // 4. Sort the leaderboard (Primary: Points, Secondary: Goal Difference)
    leaderboardArray.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        return b.diff - a.diff;
    });
    
    // 5. Assign rank
    leaderboardArray = leaderboardArray.map((stat, index) => ({
        ...stat,
        rank: index + 1
    }));

    // 6. Only show participants who have played or are registered
    return leaderboardArray.filter(stat => stat.p > 0 || participants.some(p => p._id === stat.id));
};