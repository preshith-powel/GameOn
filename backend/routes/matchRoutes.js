// backend/routes/matchRoutes.js

const express = require('express');
const router = express.Router();
const Match = require('../models/match.model');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const auth = require('../middleware/auth');

const ADMIN_COORDINATOR_MIDDLEWARE = [auth.protect, auth.checkRole(['admin', 'coordinator'])];

// Helper to find a team and populate its name
const getTeamData = async (teamId) => {
    return await Team.findById(teamId).select('name');
};

// @route   GET /api/matches/:tournamentId
// @desc    Get all matches for a specific tournament
// @access  Public (Any user can view the schedule and scores)
router.get('/:tournamentId', async (req, res) => {
    try {
        const matches = await Match.find({ tournamentId: req.params.tournamentId })
            .populate('coordinatorId', 'username uniqueId')
            .populate('teams', 'name'); // Populate team names

        res.json(matches);
    } catch (err) {
        console.error("Match GET Error:", err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/matches/generate/:tournamentId
// @desc    Admin/Coordinator generates the initial match schedule
// @access  Private (Admin/Coordinator)
router.post('/generate/:tournamentId', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const tournamentId = req.params.tournamentId;
    
    try {
        const tournament = await Tournament.findById(tournamentId).populate('registeredParticipants', 'name');
        
        if (!tournament) {
            return res.status(404).json({ msg: 'Tournament not found.' });
        }
        
        // 1. Basic Validation: Must be ready and have participants
        if (tournament.status !== 'pending' || tournament.registeredParticipants.length < 2) {
             return res.status(400).json({ msg: 'Cannot generate schedule. Tournament is not pending or has insufficient participants.' });
        }

        const participants = tournament.registeredParticipants;
        const matches = [];

        // 2. Simple Round Robin Schedule Generation (for demonstration)
        if (tournament.format === 'round robin') {
            for (let i = 0; i < participants.length; i++) {
                for (let j = i + 1; j < participants.length; j++) {
                    matches.push({
                        tournamentId: tournament._id,
                        teams: [participants[i]._id, participants[j]._id],
                        status: 'scheduled',
                        date: new Date(), // Placeholder date
                        time: '12:00 PM', // Placeholder time
                        venue: tournament.venues[0] || 'TBD Venue'
                    });
                }
            }
        } else {
             // For single elimination or others, a placeholder is created
             matches.push({
                tournamentId: tournament._id,
                teams: [participants[0]._id, participants[1]._id],
                status: 'scheduled',
                date: new Date(),
                time: '1:00 PM',
                venue: tournament.venues[0] || 'TBD Venue'
            });
        }

        const savedMatches = await Match.insertMany(matches);
        
        // 3. Update Tournament Status (Crucial Step)
        tournament.status = 'ongoing';
        await tournament.save();

        res.json({ 
            msg: `Schedule generated successfully. ${savedMatches.length} matches created.`,
            matches: savedMatches 
        });

    } catch (err) {
        console.error("Schedule Generation Error:", err);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/matches/:matchId/score
// @desc    Admin/Coordinator updates the score of a match
// @access  Private (Admin/Coordinator)
router.put('/:matchId/score', ...ADMIN_COORDINATOR_MIDDLEWARE, async (req, res) => {
    const { teamAscore, teamBscore, status } = req.body;
    
    try {
        const match = await Match.findById(req.params.matchId);
        if (!match) {
            return res.status(404).json({ msg: 'Match not found.' });
        }
        
        match.scores = {
            teamA: teamAscore,
            teamB: teamBscore
        };
        match.status = status || 'completed'; // Default to completed
        match.coordinatorId = req.user.id; // Record who updated the score

        await match.save();
        
        res.json({ msg: 'Score updated successfully.', match });

    } catch (err) {
        console.error("Score Update Error:", err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;