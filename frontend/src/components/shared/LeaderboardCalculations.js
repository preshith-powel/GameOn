// frontend/src/components/common/LeaderboardCalculations.js

/**
 * Calculates the leaderboard standings for Round Robin or Group Stage formats.
 * Uses simplified football/soccer scoring rules (Win=3, Draw=1, Loss=0).
 * @param {object} tournament - The tournament object.
 * @param {array} matches - All matches for the tournament.
 * @returns {array|object} Sorted array of participant statistics (for round robin/single elimination) or an object of leaderboards keyed by group name (for group stage).
 */
export const calculateLeaderboard = (tournament, matches) => {
    // Kabaddi and Badminton custom points logic
    const sport = tournament.sport && tournament.sport.toLowerCase();
    const isKabaddi = sport === 'kabaddi';
    const isBadminton = sport === 'badminton';
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

                if (isKabaddi) {
                // Badminton: Win=2, Draw=1, Loss=0
                } else if (isBadminton) {
                    if (scoreA > scoreB) {
                        statA.w += 1;
                        statB.l += 1;
                        statA.pts += 2;
                    } else if (scoreB > scoreA) {
                        statB.w += 1;
                        statA.l += 1;
                        statB.pts += 2;
                    } else {
                        // Draw (including 0-0)
                        statA.d += 1;
                        statB.d += 1;
                        statA.pts += 1;
                        statB.pts += 1;
                    }
        // Badminton: Win=2, Draw=1, Loss=0
        } else if (isBadminton) {
            if (scoreA > scoreB) {
                statA.w += 1;
                statB.l += 1;
                statA.pts += 2;
            } else if (scoreB > scoreA) {
                statB.w += 1;
                statA.l += 1;
                statB.pts += 2;
            } else {
                // Draw (including 0-0)
                statA.d += 1;
                statB.d += 1;
                statA.pts += 1;
                statB.pts += 1;
            }
                    // Kabaddi: Win=5, Loss=1, Tie=1 for both
                    if (scoreA > scoreB) {
                        statA.w += 1;
                        statB.l += 1;
                        statA.pts += 5;
                        statB.pts += 1;
                    } else if (scoreB > scoreA) {
                        statB.w += 1;
                        statA.l += 1;
                        statB.pts += 5;
                        statA.pts += 1;
                    } else {
                        // Tie
                        statA.d += 1;
                        statB.d += 1;
                        statA.pts += 1;
                        statB.pts += 1;
                    }
                } else {
                    // Default: Win=3, Draw=1, Loss=0
                    if (scoreA > scoreB) {
                        statA.w += 1;
                        statB.l += 1;
                        statA.pts += 3;
                    } else if (scoreB > scoreA) {
                        statB.w += 1;
                        statA.l += 1;
                        statB.pts += 3;
                    } else {
                        // Draw (including 0-0)
                        statA.d += 1;
                        statB.d += 1;
                        statA.pts += 1;
                        statB.pts += 1;
                    }
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

        if (isKabaddi) {
            // Kabaddi: Win=5, Loss=1, Tie=1 for both
            if (scoreA > scoreB) {
                statA.w += 1;
                statB.l += 1;
                statA.pts += 5;
                statB.pts += 1;
            } else if (scoreB > scoreA) {
                statB.w += 1;
                statA.l += 1;
                statB.pts += 5;
                statA.pts += 1;
            } else {
                // Tie
                statA.d += 1;
                statB.d += 1;
                statA.pts += 1;
                statB.pts += 1;
            }
        } else if (isBadminton) {
            // Badminton: Win=2, Draw=1, Loss=0
            if (scoreA > scoreB) {
                statA.w += 1;
                statB.l += 1;
                statA.pts += 2;
            } else if (scoreB > scoreA) {
                statB.w += 1;
                statA.l += 1;
                statB.pts += 2;
            } else {
                // Draw (including 0-0)
                statA.d += 1;
                statB.d += 1;
                statA.pts += 1;
                statB.pts += 1;
            }
        } else {
            // Default: Win=3, Draw=1, Loss=0
            if (scoreA > scoreB) {
                statA.w += 1;
                statB.l += 1;
                statA.pts += 3;
            } else if (scoreB > scoreA) {
                statB.w += 1;
                statA.l += 1;
                statB.pts += 3;
            } else {
                // Draw (including 0-0)
                statA.d += 1;
                statB.d += 1;
                statA.pts += 1;
                statB.pts += 1;
            }
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