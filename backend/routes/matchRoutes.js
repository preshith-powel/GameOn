// backend/routes/matchRoutes.js - FULL UPDATED CODE (Fix Score Saving)

const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const auth = require('../middleware/auth');

const ADMIN_COORDINATOR_MIDDLEWARE = [auth.protect, auth.checkRole(['admin', 'coordinator'])];

// @route   GET /api/matches/:tournamentId
router.get('/:tournamentId', async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;
        
        const baseTournament = await Tournament.findById(tournamentId).select('participantsType');
        
        if (!baseTournament) {
            return res.status(404).json({ msg: 'Tournament not found.' });
        }
        
        // Dynamically determine model based on the stored value ('Team' or 'Player')
        const participantModel = baseTournament.participantsType; 

        // Find matches and populate participants based on the determined model
        const matches = await Match.find({ tournamentId })
            .populate('coordinatorId', 'username uniqueId')
            .populate({
                path: 'teams',
                model: participantModel,
                select: 'name' 
            }); 

        res.json(matches);
    } catch (err) {
        console.error("Match GET Error:", err.message);
        res.status(500).send('Server Error: Failed to retrieve matches.');
    }
});


// @route   POST /api/matches/generate/:tournamentId
router.post('/generate/:tournamentId', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const tournamentId = req.params.tournamentId;
    
    try {
        const tournament = await Tournament.findById(tournamentId);

        if (!tournament) {
            return res.status(404).json({ msg: 'Tournament not found.' });
        }
        
        const participantModel = tournament.participantsType;
        const fullTournament = await Tournament.findById(tournamentId)
            .populate({
                path: 'registeredParticipants',
                model: participantModel, 
                select: 'name isReady'
            }); 

        
        if (fullTournament.status !== 'pending') {
             return res.status(400).json({ msg: 'Cannot generate schedule. Tournament is not pending.' });
        }
        
        const participants = fullTournament.registeredParticipants;
        const totalParticipants = participants.length;
        const maxParticipants = fullTournament.maxParticipants;
        
        if (totalParticipants < 2) {
            return res.status(400).json({ msg: 'Cannot generate schedule. Insufficient participants.' });
        }

        if (totalParticipants !== maxParticipants) {
            return res.status(400).json({ msg: `Cannot generate schedule. Only ${totalParticipants}/${maxParticipants} participants registered.` });
        }

        if (fullTournament.participantsType === 'Team') {
            const allReady = participants.every(p => p.isReady === true);
            if (!allReady) {
                return res.status(400).json({ msg: 'Cannot generate schedule. Not all registered teams have been marked as ready.' });
            }
        }
        
        const matches = [];
        const baseVenue = fullTournament.venues[0] || 'TBD Venue';
        const baseDateTime = new Date(); 

        let participantIDs = participants.map(p => p._id);
        let numParticipants = participantIDs.length;
        
        if (fullTournament.format === 'round robin') {
            
            let teams = participantIDs;
            if (numParticipants % 2 !== 0) {
                teams.push(null);
                numParticipants++;
            }
            
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
            
            const numTeams = participants.length;
            
            let bracketSize = 2;
            while (bracketSize < numTeams) {
                bracketSize *= 2;
            }

            const numByes = bracketSize - numTeams;
            const numFirstRoundMatches = numTeams - numByes;

            let roundName;
            if (numTeams === 2) { roundName = 'Final'; } 
            else if (bracketSize === 4) { roundName = 'Semifinal'; } 
            else if (bracketSize === 8) { roundName = 'Quarterfinal'; } 
            else if (bracketSize === 16) { roundName = 'Round of 16'; } 
            else { roundName = 'Round 1'; }
            
            
            if (numTeams === 2) {
                matches.push({
                    tournamentId: fullTournament._id,
                    participantsType: fullTournament.participantsType, 
                    teams: [participants[0]._id, participants[1]._id],
                    status: 'scheduled',
                    round: 'Final', 
                    scheduledTime: baseDateTime, 
                    venue: baseVenue
                });
            } else if (numFirstRoundMatches > 0) { 
                
                const scheduledTeams = participants.map(p => p._id).slice(0, numFirstRoundMatches);
                
                for(let i = 0; i < scheduledTeams.length; i += 2) { 
                    const teamA = scheduledTeams[i];
                    const teamB = scheduledTeams[i + 1]; 
                    
                    if (teamA && teamB) {
                        matches.push({
                            tournamentId: fullTournament._id,
                            participantsType: fullTournament.participantsType, 
                            teams: [teamA, teamB], 
                            status: 'scheduled',
                            round: roundName, 
                            scheduledTime: baseDateTime, 
                            venue: baseVenue
                        });
                    }
                }
            }
            
        } else {
            return res.status(400).json({ msg: `Scheduling for format '${fullTournament.format}' is not yet implemented.` });
        }

        if (matches.length === 0 && totalParticipants > 1 && fullTournament.format !== 'round robin') { 
             return res.status(400).json({ msg: `Schedule generation failed unexpectedly for ${totalParticipants} participants.` });
        }
        
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


// @route   PUT /api/matches/:matchId/score (Unchanged)
router.put('/:matchId/score', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const { teamAscore, teamBscore, status } = req.body; 
    
    // Console warning to remind you of the model structure difference
    console.warn("Match Score PUT Route uses simple scoring structure, which conflicts with Match Model's scoreUpdates concept.");
    
    try {
        const match = await Match.findById(req.params.matchId);
        if (!match) {
            return res.status(404).json({ msg: 'Match not found.' });
        }
        
        // *** FIX APPLIED HERE ***
        // 1. Write the scores to the correct path in the Mongoose document.
        match.scores = { teamA: teamAscore, teamB: teamBscore }; 
        
        // 2. Remove the invalid update attempt.
        // NOTE: The previous code block was deleted here as it referenced a non-existent field.
        // ************************
        
        match.status = status || 'completed';
        match.coordinatorId = req.user.id; 

        await match.save(); // This now saves the scores correctly.
        
        res.json({ msg: 'Score updated successfully.', match });

    } catch (err) {
        console.error("Score Update Error:", err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;