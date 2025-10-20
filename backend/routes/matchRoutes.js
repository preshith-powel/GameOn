// backend/routes/matchRoutes.js - FINAL CODE

const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const auth = require('../middleware/auth');

const ADMIN_COORDINATOR_MIDDLEWARE = [auth.protect, auth.checkRole(['admin', 'coordinator'])];

// @route   GET /api/matches/:tournamentId
// @access  Public (for Spectator view)
router.get('/:tournamentId', async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;
        
        const baseTournament = await Tournament.findById(tournamentId).select('participantsType');
        
        if (!baseTournament) { return res.status(404).json({ msg: 'Tournament not found.' }); }
        
        const participantModel = baseTournament.participantsType; 

        // Find matches and populate participants based on the determined model
        const matches = await Match.find({ tournamentId })
            .populate('coordinatorId', 'username uniqueId')
            .populate({
                path: 'teams',
                select: 'name scores winner' 
            }); 

        res.json(matches);
    } catch (err) {
        console.error("Match GET Error:", err.message);
        res.status(500).send('Server Error: Failed to retrieve matches.');
    }
});


// @route   POST /api/matches/generate/:tournamentId
// @access  Admin/Coordinator
router.post('/generate/:tournamentId', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const tournamentId = req.params.tournamentId;
    
    try {
        const tournament = await Tournament.findById(tournamentId);

        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found.' }); }
        
        const participantModel = tournament.participantsType;
        const fullTournament = await Tournament.findById(tournamentId)
            .populate({
                path: 'registeredParticipants',
                model: participantModel, 
                select: 'name isReady'
            }); 

        
        if (fullTournament.status !== 'pending') { return res.status(400).json({ msg: 'Cannot generate schedule. Tournament is not pending.' }); }
        
        const participants = fullTournament.registeredParticipants;
        const totalParticipants = participants.length;
        const maxParticipants = fullTournament.maxParticipants;
        
        if (totalParticipants < 2 || totalParticipants !== maxParticipants) {
            return res.status(400).json({ msg: `Cannot generate schedule. Required: ${maxParticipants}, Registered: ${totalParticipants}.` });
        }

        if (fullTournament.participantsType === 'Team') {
            const allReady = participants.every(p => p.isReady === true);
            if (!allReady) {
                return res.status(400).json({ msg: 'Cannot generate schedule. Not all registered teams have been marked as ready.' });
            }
        }
        
        // --- MATCH GENERATION LOGIC (Simplified: Round Robin & Single Elimination) ---
        const matches = [];
        const baseVenue = fullTournament.venues[0] || 'TBD Venue';
        const baseDateTime = new Date(); 

        let participantIDs = participants.map(p => p._id);
        let numParticipants = participantIDs.length;
        
        if (fullTournament.format === 'round robin') {
            let teams = participantIDs;
            if (numParticipants % 2 !== 0) { teams.push(null); numParticipants++; }
            
            const numRounds = numParticipants - 1; 
            const numMatchesPerRound = teams.length / 2;
            
            for (let round = 0; round < numRounds; round++) {
                for (let i = 0; i < numMatchesPerRound; i++) {
                    const teamA = teams[i];
                    const teamB = teams[teams.length - 1 - i]; 
                    
                    if (teamA !== null && teamB !== null) {
                        matches.push({
                            tournamentId: fullTournament._id,
                            participantsType: fullTournament.participantsType, 
                            teams: [teamA, teamB], 
                            status: 'scheduled',
                            scheduledTime: baseDateTime, 
                            venue: baseVenue
                        });
                    }
                }
                const fixedTeam = teams[0];
                const rotatingTeams = teams.slice(1);
                const lastRotatingTeam = rotatingTeams.pop(); 
                teams = [fixedTeam, lastRotatingTeam, ...rotatingTeams];
            }

        } else if (fullTournament.format === 'single elimination') {
            // Generate only the first round of knockout tournament
            const numTeams = participants.length;
            let bracketSize = 2;
            while (bracketSize < numTeams) { bracketSize *= 2; }

            const numByes = bracketSize - numTeams;
            const numFirstRoundMatches = numTeams - numByes;

            // Determine round name based on bracket size
            let roundName;
            if (bracketSize === 2) { roundName = 'Final'; } 
            else if (bracketSize === 4) { roundName = 'Semifinal'; } 
            else if (bracketSize === 8) { roundName = 'Quarterfinal'; } 
            else if (bracketSize === 16) { roundName = 'Round of 16'; } 
            else if (bracketSize === 32) { roundName = 'Round of 32'; }
            else { roundName = 'Round 1'; }
            
            const allParticipantIDs = participants.map(p => p._id); // Get all participant IDs
            const byeParticipants = allParticipantIDs.slice(0, numByes); // Top participants get BYE
            const scheduledParticipants = allParticipantIDs.slice(numByes); // Remaining participants play

            // Create BYE matches for participants who advance directly
            byeParticipants.forEach(byeParticipantId => {
                matches.push({
                    tournamentId: fullTournament._id,
                    participantsType: fullTournament.participantsType,
                    teams: [byeParticipantId], // Only one team in a BYE match
                    scores: [
                        { teamId: byeParticipantId, score: 0 }
                    ], // Dummy scores for BYE
                    winner: byeParticipantId, // The BYE participant is the winner
                    status: 'completed', // BYE matches are considered completed
                    round: roundName, // Assign to the first round
                    scheduledTime: baseDateTime,
                    venue: baseVenue,
                    isBye: true // Custom field to mark as BYE
                });
            });

            if (numTeams === 2) {
                // Direct final
                matches.push({
                    tournamentId: fullTournament._id,
                    participantsType: fullTournament.participantsType, 
                    teams: [participants[0]._id, participants[1]._id],
                    scores: [
                        { teamId: participants[0]._id, score: 0 },
                        { teamId: participants[1]._id, score: 0 }
                    ],
                    status: 'scheduled',
                    round: 'Final', 
                    scheduledTime: baseDateTime, 
                    venue: baseVenue
                });
            } else if (numFirstRoundMatches > 0) { 
                // Create first round matches with proper seeding
                for(let i = 0; i < scheduledParticipants.length; i += 2) { 
                    const teamA = scheduledParticipants[i];
                    const teamB = scheduledParticipants[i + 1]; 
                    
                    if (teamA && teamB) {
                        matches.push({
                            tournamentId: fullTournament._id,
                            participantsType: fullTournament.participantsType, 
                            teams: [teamA, teamB], 
                            scores: [
                                { teamId: teamA, score: 1 },
                                { teamId: teamB, score: 1 }
                            ],
                            status: 'scheduled',
                            round: roundName, 
                            scheduledTime: baseDateTime, 
                            venue: baseVenue
                        });
                    }
                }
            }
            
        } else if (fullTournament.format === 'group stage') {
            const { numGroups, teamsPerGroup, roundRobinMatchesPerGroup } = fullTournament;

            // Basic validation for group stage parameters
            if (numGroups * teamsPerGroup !== numParticipants) {
                return res.status(400).json({ msg: `For group stage, total participants (${numParticipants}) must match numGroups (${numGroups}) * teamsPerGroup (${teamsPerGroup}).` });
            }
            if (teamsPerGroup < 2) {
                return res.status(400).json({ msg: 'Teams per group must be at least 2 for group stage.' });
            }
            if (roundRobinMatchesPerGroup < 1 || roundRobinMatchesPerGroup > 2) {
                return res.status(400).json({ msg: 'Round robin matches per group must be 1 or 2.' });
            }

            // Shuffle participants to distribute them randomly into groups
            participantIDs.sort(() => Math.random() - 0.5);

            const groups = [];
            for (let i = 0; i < numGroups; i++) {
                groups.push(participantIDs.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup));
            }

            let overallMatchCount = 0;
            groups.forEach((groupTeams, groupIndex) => {
                const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`; // Group A, Group B, etc.

                // Implement Round Robin Scheduling (Circle Method)
                for (let rrm = 0; rrm < roundRobinMatchesPerGroup; rrm++) { // Outer loop for number of head-to-head round robins
                    let currentGroupTeams = [...groupTeams];
                    if (currentGroupTeams.length % 2 !== 0) {
                        currentGroupTeams.push(null); // Add a 'bye' or 'phantom' team for odd number of teams
                    }

                    const numTeamsInSchedule = currentGroupTeams.length;
                    const numRoundsInSchedule = numTeamsInSchedule - 1;

                    for (let roundNum = 0; roundNum < numRoundsInSchedule; roundNum++) {
                        const currentRoundName = `Round ${rrm * numRoundsInSchedule + roundNum + 1}`;
                        for (let i = 0; i < numTeamsInSchedule / 2; i++) {
                            const teamA = currentGroupTeams[i];
                            const teamB = currentGroupTeams[numTeamsInSchedule - 1 - i];

                            if (teamA !== null && teamB !== null) { // Skip matches with bye team
                                overallMatchCount++;
                                matches.push({
                                    tournamentId: fullTournament._id,
                                    participantsType: fullTournament.participantsType,
                                    teams: [teamA, teamB],
                                    scores: [
                                        { teamId: teamA, score: 0 },
                                        { teamId: teamB, score: 0 }
                                    ],
                                    status: 'scheduled',
                                    round: currentRoundName,
                                    group: groupName,
                                    scheduledTime: new Date(baseDateTime.getTime() + overallMatchCount * 60 * 60 * 1000), // Schedule matches an hour apart
                                    venue: baseVenue
                                });
                            }
                        }

                        // Rotate teams for the next round (Circle Method)
                        const fixedTeam = currentGroupTeams[0];
                        const rotatingTeams = currentGroupTeams.slice(1);
                        const lastRotatingTeam = rotatingTeams.pop();
                        currentGroupTeams = [fixedTeam, lastRotatingTeam, ...rotatingTeams];
                    }
                }
            });
        } else {
            return res.status(400).json({ msg: `Scheduling for format '${fullTournament.format}' is not yet implemented.` });
        }
        // --- END MATCH GENERATION LOGIC ---
        
        const savedMatches = matches.length > 0 ? await Match.insertMany(matches) : [];
        
        fullTournament.status = 'ongoing';
        await fullTournament.save();

        res.json({ 
            msg: `Schedule generated successfully. ${savedMatches.length} matches created.`,
            matches: savedMatches 
        });

    } catch (err) {
        console.error("Schedule Generation Error:", err);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/matches/generate-next-round/:tournamentId
// @access  Admin/Coordinator
router.post('/generate-next-round/:tournamentId', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const tournamentId = req.params.tournamentId;
    console.log("generate-next-round endpoint hit");
    try {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) { 
            return res.status(404).json({ msg: 'Tournament not found.' }); 
        }

        if (tournament.format !== 'single elimination') {
            return res.status(400).json({ msg: 'This endpoint is only for single elimination tournaments.' });
        }

        // Get all completed matches for this tournament
        const completedMatches = await Match.find({ 
            tournamentId: tournamentId, 
            status: 'completed' 
        }).populate('teams', 'name');

        if (completedMatches.length === 0) {
            return res.status(400).json({ msg: 'No completed matches found. Complete current round first.' });
        }

        // Group matches by round to find the current round
        const matchesByRound = {};
        completedMatches.forEach(match => {
            if (match.round) {
                if (!matchesByRound[match.round]) {
                    matchesByRound[match.round] = [];
                }
                matchesByRound[match.round].push(match);
            }
        });

        // Find the latest completed round by checking all matches (not just completed ones)
        const allMatches = await Match.find({ tournamentId: tournamentId });
        const allMatchesByRound = {};
        allMatches.forEach(match => {
            if (match.round) {
                if (!allMatchesByRound[match.round]) {
                    allMatchesByRound[match.round] = [];
                }
                allMatchesByRound[match.round].push(match);
            }
        });

        // Find the round where all matches are completed
        let latestRound = null;
        for (const [roundName, roundMatches] of Object.entries(allMatchesByRound)) {
            if (roundMatches.every(match => match.status === 'completed')) {
                latestRound = roundName;
            }
        }

        // Get all matches for the latest round (including scheduled ones)
        const allLatestRoundMatches = await Match.find({ 
            tournamentId: tournamentId, 
            round: latestRound 
        }).populate('teams', 'name');

        // Check if all matches in the current round are completed
        const allCompleted = allLatestRoundMatches.every(match => match.status === 'completed');
        if (!allCompleted) {
            return res.status(400).json({ msg: `Not all matches in ${latestRound} are completed yet.` });
        }

        // Determine winners and create next round
        const winners = [];
        
        allLatestRoundMatches.forEach(match => {
            // Prioritize explicitly selected winner for ties, otherwise use scores
            const scores = match.scores || [];
            if(scores[0].score > scores[1].score ){
                winners.push(match.teams[0]);
            }     
            else if(scores[1].score > scores[0].score ){
                winners.push(match.teams[1]);
            } 
            else{
                console.warn(`WARNING: Tie detected in match ${match._id} without a selected winner. Defaulting to ${match.teams[0]?.name || 'Team A'}.`);
                winners.push(match.teams[0]);
            }
            if (match.winner) {
                winners.push(match.winner);
            } else if (match.scores && match.scores.teamA !== undefined && match.scores.teamB !== undefined) {
                if (match.scores.teamA > match.scores.teamB) {
                    winners.push(match.teams[0]);
                } else if (match.scores.teamB > match.scores.teamA) {
                    winners.push(match.teams[1]);
                } else {
                    // Fallback for old tied matches without a selected winner, pick teamA
                    console.warn(`WARNING: Tie detected in match ${match._id} without a selected winner. Defaulting to ${match.teams[0]?.name || 'Team A'}.`);
                    winners.push(match.teams[0]);
                }
            }
        });

        if (winners.length === 1) {
            // Tournament is complete
            tournament.status = 'completed';
            
            // Ensure winner.name is safely accessed
            const championName = winners[0]?.name || 'Unknown Champion';
            tournament.winner = championName;

            await tournament.save();
            
            return res.json({ 
                msg: 'Tournament completed!', 
                winner: championName,
                isComplete: true 
            });
        }

        if (winners.length === 0) {
            return res.status(400).json({ msg: 'No valid winners found in completed matches.' });
        }

        // Determine next round name based on number of winners
        let nextRoundName;
        const numWinners = winners.length;
        
        if (numWinners === 2) {
            nextRoundName = 'Final';
        } else if (numWinners === 4) {
            nextRoundName = 'Semifinal';
        } else if (numWinners === 8) {
            nextRoundName = 'Quarterfinal';
        } else if (numWinners === 16) {
            nextRoundName = 'Round of 16';
        } else if (numWinners === 32) {
            nextRoundName = 'Round of 32';
        } else if (numWinners === 64) {
            nextRoundName = 'Round of 64';
        } else {
            // For other numbers, use a generic round name
            nextRoundName = `Round ${Math.ceil(Math.log2(numWinners))}`;
        }

        // Create matches for next round
        const newMatches = [];
        const baseVenue = tournament.venues[0] || 'TBD Venue';
        const baseDateTime = new Date();

        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                newMatches.push({
                    tournamentId: tournament._id,
                    participantsType: tournament.participantsType,
                    teams: [winners[i], winners[i + 1]],
                    status: 'scheduled',
                    round: nextRoundName,
                    scheduledTime: baseDateTime,
                    venue: baseVenue
                });
            }
        }

        const savedMatches = await Match.insertMany(newMatches);

        res.json({ 
            msg: `Next round (${nextRoundName}) generated successfully. ${savedMatches.length} matches created.`,
            matches: savedMatches,
            nextRound: nextRoundName,
            isComplete: false
        });

    } catch (err) {
        console.error("Next Round Generation Error:", err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/matches/generate-knockout-stage/:tournamentId
// @access  Admin/Coordinator
router.post('/generate-knockout-stage/:tournamentId', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const tournamentId = req.params.tournamentId;

    try {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ msg: 'Tournament not found.' });
        }

        if (tournament.format !== 'group stage') {
            return res.status(400).json({ msg: 'This endpoint is only for group stage tournaments to generate knockout stage.' });
        }

        // Fetch all matches for the group stage
        const groupStageMatches = await Match.find({
            tournamentId: tournamentId,
            group: { $exists: true }
        }).populate('teams', 'name');

        if (groupStageMatches.length === 0) {
            return res.status(400).json({ msg: 'No group stage matches found. Generate group stage schedule first.' });
        }

        // Check if all group stage matches are completed
        const allGroupMatchesCompleted = groupStageMatches.every(match => match.status === 'completed');
        if (!allGroupMatchesCompleted) {
            return res.status(400).json({ msg: 'Not all group stage matches are completed yet. Complete all matches to generate knockout stage.' });
        }

        // Calculate leaderboards for each group to determine winners
        const groupsData = {};
        groupStageMatches.forEach(match => {
            if (!groupsData[match.group]) {
                groupsData[match.group] = { matches: [], participants: new Set() };
            }
            groupsData[match.group].matches.push(match);
            match.teams.forEach(team => groupsData[match.group].participants.add(team._id.toString()));
        });

        const qualifiedTeams = [];

        for (const groupName in groupsData) {
            const groupMatches = groupsData[groupName].matches;
            const groupParticipants = Array.from(groupsData[groupName].participants);

            const statsMap = new Map();
            groupParticipants.forEach(pId => {
                statsMap.set(pId, {
                    name: groupMatches.find(m => m.teams.some(t => t._id.toString() === pId))?.teams.find(t => t._id.toString() === pId)?.name || 'Unknown',
                    p: 0, w: 0, l: 0, d: 0, goalsScored: 0, goalsConceded: 0, pts: 0,
                    id: pId
                });
            });

            groupMatches.filter(m => m.status === 'completed' && m.scores && m.teams?.length === 2).forEach(match => {
                const idA = match.teams[0]?._id.toString();
                const idB = match.teams[1]?._id.toString();

                if (!statsMap.has(idA) || !statsMap.has(idB)) return;

                const statA = statsMap.get(idA);
                const statB = statsMap.get(idB);

                const scoreA = match.scores.teamA || 0;
                const scoreB = match.scores.teamB || 0;

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

            let groupLeaderboardArray = Array.from(statsMap.values()).map(stat => ({
                ...stat,
                diff: stat.goalsScored - stat.goalsConceded,
            }));

            groupLeaderboardArray.sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                return b.diff - a.diff;
            });

            // Take top winnersPerGroup from each group
            const winnersFromGroup = groupLeaderboardArray.slice(0, tournament.winnersPerGroup).map(team => team.id);
            qualifiedTeams.push(...winnersFromGroup);
        }

        // Now generate knockout matches from qualifiedTeams
        const numQualifiedTeams = qualifiedTeams.length;
        if (numQualifiedTeams < 2) {
            return res.status(400).json({ msg: 'Not enough qualified teams to generate a knockout stage.' });
        }

        let bracketSize = 2;
        while (bracketSize < numQualifiedTeams) { bracketSize *= 2; }

        const numByes = bracketSize - numQualifiedTeams;
        const numFirstRoundMatches = numQualifiedTeams - numByes;

        let roundName;
        if (bracketSize === 2) { roundName = 'Final'; }
        else if (bracketSize === 4) { roundName = 'Semifinal'; }
        else if (bracketSize === 8) { roundName = 'Quarterfinal'; }
        else if (bracketSize === 16) { roundName = 'Round of 16'; }
        else if (bracketSize === 32) { roundName = 'Round of 32'; }
        else { roundName = 'Round 1 Knockout'; }

        const shuffledQualifiedTeams = qualifiedTeams.sort(() => Math.random() - 0.5); // Shuffle for initial knockout pairing
        const byeParticipants = shuffledQualifiedTeams.slice(0, numByes);
        const scheduledParticipants = shuffledQualifiedTeams.slice(numByes);

        const newKnockoutMatches = [];
        const baseVenue = tournament.venues[0] || 'TBD Venue';
        const baseDateTime = new Date();
        let knockoutMatchCount = 0;

        // Create BYE matches
        byeParticipants.forEach(byeParticipantId => {
            knockoutMatchCount++;
            newKnockoutMatches.push({
                tournamentId: tournament._id,
                participantsType: tournament.participantsType,
                teams: [byeParticipantId],
                scores: [
                    { teamId: byeParticipantId, score: 0 }
                ],
                winner: byeParticipantId,
                status: 'completed',
                round: roundName,
                scheduledTime: new Date(baseDateTime.getTime() + knockoutMatchCount * 60 * 60 * 1000),
                venue: baseVenue,
                isBye: true
            });
        });

        // Create first round knockout matches
        for (let i = 0; i < scheduledParticipants.length; i += 2) {
            const teamA = scheduledParticipants[i];
            const teamB = scheduledParticipants[i + 1];
            if (teamA && teamB) {
                knockoutMatchCount++;
                newKnockoutMatches.push({
                    tournamentId: tournament._id,
                    participantsType: tournament.participantsType,
                    teams: [teamA, teamB],
                    scores: [
                        { teamId: teamA, score: 0 },
                        { teamId: teamB, score: 0 }
                    ],
                    status: 'scheduled',
                    round: roundName,
                    scheduledTime: new Date(baseDateTime.getTime() + knockoutMatchCount * 60 * 60 * 1000),
                    venue: baseVenue
                });
            }
        }

        const savedKnockoutMatches = await Match.insertMany(newKnockoutMatches);

        tournament.status = 'ongoing'; // Or a new status like 'knockout-stage'
        tournament.currentStage = 'knockout'; // Add a field to track current stage
        await tournament.save();

        res.json({
            msg: `Knockout stage generated successfully. ${savedKnockoutMatches.length} matches created.`,
            matches: savedKnockoutMatches,
            nextRound: roundName,
            isComplete: false
        });

    } catch (err) {
        console.error("Generate Knockout Stage Error:", err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/matches/resolve-ties/:tournamentId
// @access  Admin/Coordinator
router.put('/resolve-ties/:tournamentId', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const { matchIds, winnerIds } = req.body;
    const tournamentId = req.params.tournamentId;

    try {
        if (!matchIds || !winnerIds || matchIds.length !== winnerIds.length) {
            return res.status(400).json({ msg: 'Invalid input for tie resolution.' });
        }

        const updates = matchIds.map((matchId, index) => ({ 
            updateOne: {
                filter: { _id: matchId, tournamentId: tournamentId },
                update: { $set: { winner: winnerIds[index], status: 'completed' } }
            }
        }));

        await Match.bulkWrite(updates);

        // After resolving ties, proceed to generate the next round
        // Re-use the existing logic for generate-next-round
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ msg: 'Tournament not found after tie resolution.' });
        }

        // Simulate a call to checkAndGenerateNextRound's logic
        // Get all completed matches for this tournament again
        const allMatches = await Match.find({ tournamentId: tournamentId });
        const allMatchesByRound = {};
        allMatches.forEach(match => {
            if (match.round) {
                if (!allMatchesByRound[match.round]) {
                    allMatchesByRound[match.round] = [];
                }
                allMatchesByRound[match.round].push(match);
            }
        });

        let latestRound = null;
        for (const [roundName, roundMatches] of Object.entries(allMatchesByRound)) {
            if (roundMatches.every(match => match.status === 'completed')) {
                latestRound = roundName;
            }
        }

        if (!latestRound) {
            return res.status(400).json({ msg: 'Could not determine latest completed round after tie resolution.' });
        }

        const allLatestRoundMatches = await Match.find({ 
            tournamentId: tournamentId, 
            round: latestRound 
        }).populate('teams', 'name');

        const allCompleted = allLatestRoundMatches.every(match => match.status === 'completed');
        if (!allCompleted) {
            return res.status(400).json({ msg: `Not all matches in ${latestRound} are completed yet even after tie resolution.` });
        }

        const winners = [];
        allLatestRoundMatches.forEach(match => {
            winners.push(match.winner);
        });

        if (winners.length === 1) {
            tournament.status = 'completed';
            const championName = winners[0]?.name || 'Unknown Champion';
            tournament.winner = championName;
            await tournament.save();
            return res.json({ 
                msg: 'Tournament completed after tie resolution!', 
                winner: championName,
                isComplete: true 
            });
        }

        const numWinners = winners.length;
        let nextRoundName;
        if (numWinners === 2) {
            nextRoundName = 'Final';
        } else if (numWinners === 4) {
            nextRoundName = 'Semifinal';
        } else if (numWinners === 8) {
            nextRoundName = 'Quarterfinal';
        } else if (numWinners === 16) {
            nextRoundName = 'Round of 16';
        } else if (numWinners === 32) {
            nextRoundName = 'Round of 32';
        } else if (numWinners === 64) {
            nextRoundName = 'Round of 64';
        } else {
            nextRoundName = `Round ${Math.ceil(Math.log2(numWinners))}`;
        }

        const newMatches = [];
        const baseVenue = tournament.venues[0] || 'TBD Venue';
        const baseDateTime = new Date();

        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                newMatches.push({
                    tournamentId: tournament._id,
                    participantsType: tournament.participantsType,
                    teams: [winners[i], winners[i + 1]],
                    status: 'scheduled',
                    round: nextRoundName,
                    scheduledTime: baseDateTime,
                    venue: baseVenue
                });
            }
        }

        const savedMatches = await Match.insertMany(newMatches);

        res.json({ 
            msg: `Ties resolved and next round (${nextRoundName}) generated successfully. ${savedMatches.length} matches created.`,
            matches: savedMatches,
            nextRound: nextRoundName,
            isComplete: false
        });

    } catch (err) {
        console.error("Tie Resolution Error:", err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/matches/:matchId/score
// @access  Admin/Coordinator
router.put('/:matchId/score', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    // Accepts: { scores: [{ teamId, score }, ...], status, winnerId }
    const { scores, status, winnerId } = req.body;
    
    try {
        const match = await Match.findById(req.params.matchId);
        if (!match) { return res.status(404).json({ msg: 'Match not found.' }); }

        // Fetch the associated tournament to check its status
        const tournament = await Tournament.findById(match.tournamentId);
        if (!tournament) { return res.status(404).json({ msg: 'Associated tournament not found.' }); }

        if (tournament.status === 'completed') {
            return res.status(403).json({ msg: 'Cannot update scores. Tournament is already completed.' });
        }

        // Validate scores array
        const isByeMatch = match.teams.length === 1;
        if (!Array.isArray(scores)) {
            return res.status(400).json({ msg: `Scores array is required for this match.\n`+JSON.stringify(req.body) });
        }
        else if(scores.length < (isByeMatch ? 1 : 2)) {
            return res.status(400).json({ msg: `Scores array must have at least ${isByeMatch ? 'one' : 'two'} entries.` });
        }
        for (const entry of scores) {
            if (!entry.teamId || typeof entry.score !== 'number') {
                return res.status(400).json({ msg: 'Each score entry must have teamId and score (number).' });
            }
        }
        match.scores = scores;

        // If a winnerId is provided (in case of a tie in knockout), store it
        if (winnerId) {
            match.winner = winnerId; // Assign the explicitly selected winner ID
        }

        match.status = status || 'completed';
        match.coordinatorId = req.user.id; 

        // Save the match
        await match.save(); 

        res.json({ msg: 'Score updated successfully.', match });

    } catch (err) {
        console.error("Score Update Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;