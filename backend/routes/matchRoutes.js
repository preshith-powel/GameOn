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
            const numTeams = participants.length;
            let bracketSize = 2;
            while (bracketSize < numTeams) { bracketSize *= 2; }

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
                const scheduledTeams = participants.map(p => p._id).slice(0, numFirstRoundMatches * 2); 
                
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


// @route   PUT /api/matches/:matchId/score
// @access  Admin/Coordinator
router.put('/:matchId/score', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const { teamAscore, teamBscore, status } = req.body; 
    
    try {
        const match = await Match.findById(req.params.matchId);
        if (!match) { return res.status(404).json({ msg: 'Match not found.' }); }
        
        // CRITICAL FIX: Ensure the scores object is updated before saving
        match.scores = { teamA: teamAscore, teamB: teamBscore }; 
        
        match.status = status || 'completed';
        match.coordinatorId = req.user.id; 

        // IMPORTANT: The match.save() must complete
        await match.save(); 
        
        res.json({ msg: 'Score updated successfully.', match });

    } catch (err) {
        console.error("Score Update Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;