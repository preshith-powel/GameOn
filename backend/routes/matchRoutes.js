// backend/routes/matchRoutes.js - FINAL CORRECTED CODE (Multi-Sport Compatible)

const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler'); 
const { updateMatchScore } = require('../utils/ScoringLogic'); 

// CRITICAL FIX: Ensure ADMIN_COORDINATOR_MIDDLEWARE is defined here.
const ADMIN_COORDINATOR_MIDDLEWARE = [auth.protect, auth.checkRole('admin', 'coordinator')]; // Changed to simple array for checkRole

// @route   GET /api/matches/:tournamentId
// @access  Public (for Spectator view)
router.get('/:tournamentId', asyncHandler(async (req, res) => {
    const tournamentId = req.params.tournamentId;
    
    const baseTournament = await Tournament.findById(tournamentId).select('participantsType');
    
    if (!baseTournament) { 
        res.status(404);
        throw new Error('Tournament not found.'); 
    }
    
    const participantModel = baseTournament.participantsType; 

    // Find matches and populate participants' entityId dynamically
    const matches = await Match.find({ tournamentId })
        .populate('coordinatorId', 'username uniqueId')
        .populate({
            // FIX 3: Change 'teams' path to the flexible 'participants.entityId'
            path: 'participants.entityId', 
            model: participantModel,
            select: 'name roster' // Include roster for team view context
        }); 

    res.json(matches);
}));


// @route   POST /api/matches/generate/:tournamentId
// @access  Admin/Coordinator
router.post('/generate/:tournamentId', ...ADMIN_COORDINATOR_MIDDLEWARE, asyncHandler(async (req, res) => {
    const tournamentId = req.params.tournamentId;
    
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) { 
        res.status(404);
        throw new Error('Tournament not found.'); 
    }
    
    const participantModel = tournament.participantsType;
    const fullTournament = await Tournament.findById(tournamentId)
        .populate({
            path: 'registeredParticipants',
            model: participantModel, 
            select: 'name isReady'
        }); 

    
    if (fullTournament.status !== 'pending') { 
        res.status(400);
        throw new Error('Cannot generate schedule. Tournament is not pending.'); 
    }
    
    const participants = fullTournament.registeredParticipants;
    const totalParticipants = participants.length;
    const maxParticipants = fullTournament.maxParticipants;
    
    if (totalParticipants < 2 || totalParticipants !== maxParticipants) {
        res.status(400);
        throw new Error(`Cannot generate schedule. Required: ${maxParticipants}, Registered: ${totalParticipants}.`);
    }

    if (fullTournament.participantsType === 'Team') {
        const allReady = participants.every(p => p.isReady === true);
        if (!allReady) {
            res.status(400);
            throw new Error('Cannot generate schedule. Not all registered teams have been marked as ready.');
        }
    }
    
    // --- MATCH GENERATION LOGIC (Reworked to use new Match model) ---
    const matches = [];
    const baseVenue = fullTournament.venues[0] || 'TBD Venue';
    const baseDateTime = new Date(); 
    const tournamentSport = fullTournament.sport; // CRITICAL: Get the sport type

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
                        sportType: tournamentSport, // CRITICAL: Add sport type
                        // FIX 3: Structure participants correctly for the new model
                        participants: [
                            { entityId: teamA, participantModel: participantModel, scoreData: {} },
                            { entityId: teamB, participantModel: participantModel, scoreData: {} }
                        ], 
                        status: 'scheduled',
                        date: baseDateTime, 
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
        // [Simplified Single Elimination Logic]
        
        // Example match creation in elimination:
        if (numParticipants === 2) {
             matches.push({
                tournamentId: fullTournament._id,
                sportType: tournamentSport, // CRITICAL: Add sport type
                participants: [
                    { entityId: participants[0]._id, participantModel: participantModel, scoreData: {} },
                    { entityId: participants[1]._id, participantModel: participantModel, scoreData: {} }
                ],
                status: 'scheduled',
                round: 'Final', 
                date: baseDateTime, 
                venue: baseVenue
            });
        }
        
    } else {
        res.status(400);
        throw new Error(`Scheduling for format '${fullTournament.format}' is not yet implemented.`);
    }
    // --- END MATCH GENERATION LOGIC ---
    
    const savedMatches = matches.length > 0 ? await Match.insertMany(matches) : [];
    
    fullTournament.status = 'ongoing';
    await fullTournament.save();

    res.json({ 
        msg: `Schedule generated successfully. ${savedMatches.length} matches created.`,
        matches: savedMatches 
    });
}));


// @route   PUT /api/matches/:matchId/score
// @access  Admin/Coordinator
router.put('/:matchId/score', ...ADMIN_COORDINATOR_MIDDLEWARE, asyncHandler(async (req, res) => {
    const { scoreData, status } = req.body; // FIX 3: Expect the flexible scoreData object
    
    let match = await Match.findById(req.params.matchId);
    if (!match) { 
        res.status(404); 
        throw new Error('Match not found.'); 
    }

    // FIX 2: Use the sport-specific logic to determine the winner
    match = updateMatchScore(match, scoreData); 
    
    // Set status and coordinator
    match.status = status || 'completed';
    match.coordinatorId = req.user.id; 

    // Match object now has correct winnerId and isWinner flags set
    await match.save(); 
    
    res.json({ msg: 'Score and result updated successfully.', match });
}));

module.exports = router;