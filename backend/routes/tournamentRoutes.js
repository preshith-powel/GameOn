// backend/routes/tournamentRoutes.js - FULL UPDATED CODE (Leaderboard Prep)

const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User'); 
const Team = require('../models/Team');
const Player = require('../models/Player'); 
const auth = require('../middleware/auth'); 

// Set of roles allowed to create tournaments
const ADMIN_MIDDLEWARE = [auth.protect, auth.checkRole('admin')];

// @route   POST /api/tournaments (Unchanged)
router.post('/', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const { name, sport, format, startDate, endDate, participantsType, maxParticipants, playersPerTeam, liveScoreEnabled, venueType, venues } = req.body;

        const newTournament = new Tournament({
            name, sport, format, startDate, endDate, participantsType, maxParticipants, playersPerTeam, liveScoreEnabled, venueType, venues,
            adminId: req.user.id
        });

        const tournament = await newTournament.save();
        res.json(tournament);
    } catch (err) {
        console.error("Tournament Creation Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tournaments (Unchanged)
router.get('/', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        // FIX: Simplify population to prevent deep reference errors on list view
        const tournaments = await Tournament.find({ adminId: req.user.id })
            .sort({ startDate: -1 })
            .populate({
                path: 'registeredParticipants', 
                // Only retrieve 'isReady' and 'name' for the dashboard status check.
                select: 'name isReady', 
                // Removed deep populate of manager/roster to prevent crashing
            });

        res.json(tournaments);
    } catch (err) {
        console.error("Tournament GET / Error (CRASH):", err.message); 
        res.status(500).send('Server Error (Population Failure).');
    }
});

// @route   POST /api/tournaments/team (Unchanged)
router.post('/team', ...ADMIN_MIDDLEWARE, async (req, res) => {
    const { teamName, managerId } = req.body;
    try {
        const managerUser = await User.findOne({ uniqueId: managerId, role: 'manager' });
        
        if (!managerUser) { return res.status(404).json({ msg: 'Manager ID not found or user is not a Manager.' }); }
        
        const existingTeam = await Team.findOne({ managerId: managerUser._id });
        if (existingTeam) { return res.status(400).json({ msg: `This Manager ID is already assigned to team: ${existingTeam.name}.` }); }

        const newTeam = new Team({ name: teamName, managerId: managerUser._id });
        
        const team = await newTeam.save();
        res.json({ msg: 'Team created and assigned successfully.', teamId: team._id });
        
    } catch (err) {
        console.error("Create Team Error:", err.message);
        if (err.code === 11000) { 
            return res.status(400).json({ msg: 'A manager with this ID is already assigned to a team.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tournaments/team/:teamId/ready (Unchanged)
router.put('/team/:teamId/ready', auth.protect, async (req, res) => {
    const { isReady } = req.body; 
    
    try {
        const team = await Team.findById(req.params.teamId).populate('tournaments.tournamentId');
        if (!team) {
            return res.status(404).json({ msg: 'Team not found.' });
        }
        
        const isManager = team.managerId.toString() === req.user.id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isManager && !isAdmin) {
            return res.status(403).json({ msg: 'Access denied: Only the team manager or an admin can change this status.' });
        }

        // Logic to determine the required player count from the first assigned tournament
        const currentTournament = team.tournaments[0]?.tournamentId;
        if (!currentTournament) {
            return res.status(400).json({ msg: 'Team is not registered for an active tournament.' });
        }

        const requiredPlayers = currentTournament.playersPerTeam || 0;
        const currentRosterSize = team.roster.length;
        
        if (isReady === true && currentRosterSize < requiredPlayers) {
            return res.status(400).json({ msg: `Roster is incomplete (${currentRosterSize}/${requiredPlayers}). Cannot set status to Ready.` });
        }

        team.isReady = isReady;
        await team.save();

        res.json({ msg: `Team ${team.name} status updated to ${isReady ? 'Ready' : 'Not Ready'}.`, isReady: team.isReady });

    } catch (err) {
        console.error("Toggle Ready Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tournaments/:tournamentId/register-slots-dynamic (Unchanged)
router.post('/:tournamentId/register-slots-dynamic', ...ADMIN_MIDDLEWARE, async (req, res) => {
    const { participants } = req.body; 
    const { tournamentId } = req.params;

    try {
        const tournament = await Tournament.findById(tournamentId);

        if (!tournament || tournament.adminId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Tournament not found or unauthorized.' });
        }

        if (participants.length !== tournament.maxParticipants) {
            return res.status(400).json({ msg: `Invalid slot count. Must register exactly ${tournament.maxParticipants} slots.` });
        }
        
        let participantsToSave = [];

        if (tournament.participantsType === 'Team') {
            participantsToSave = await Promise.all(participants.map(async (p) => {
                
                const managerUser = await User.findOne({ uniqueId: p.managerId, role: 'manager' });
                if (!managerUser) {
                    throw new Error(`Manager ID ${p.managerId} not found or is not a Manager.`);
                }

                let team = await Team.findOne({ name: p.teamName });
                if (!team) {
                    team = new Team({ name: p.teamName, managerId: managerUser._id });
                    await team.save(); 
                } else if (team.managerId.toString() !== managerUser._id.toString()) {
                    throw new Error(`Team '${p.teamName}' already exists with a different manager.`);
                }
                
                if (!team.tournaments.some(t => t.tournamentId.equals(tournament._id))) {
                    team.tournaments.push({ tournamentId: tournament._id });
                    await team.save();
                }

                return team._id;
            }));

        } else { // 'Player'
             participantsToSave = await Promise.all(participants.map(async (p) => {
                // For individual players, check by name
                let player = await Player.findOne({ name: p.name });
                if (player) {
                    // If player exists, do nothing, just return ID
                } else {
                    // If player does not exist, create a new one
                    player = new Player({ 
                        name: p.name, 
                        contactInfo: p.contactInfo || '' 
                    });
                    await player.save();
                }
                return player._id;
            }));
        }

        tournament.registeredParticipants = participantsToSave;
        await tournament.save();
        
        res.json({ 
            msg: `All ${participants.length} ${tournament.participantsType} successfully registered and created.`,
            count: participants.length
        });

    } catch (err) {
        console.error("DYNAMIC REGISTRATION ERROR:", err.message);
        return res.status(400).json({ msg: err.message || 'Registration failed due to a server error.' });
    }
});

// @route   GET /api/tournaments/:id
// @desc    Get single tournament with deep population of participants
// @access  Private (All authenticated users need this for TournamentView)
router.get('/:id', auth.protect, async (req, res) => {
    try {
        // First, get the basic tournament object to determine participant type
        const baseTournament = await Tournament.findById(req.params.id);
        
        if (!baseTournament) {
            return res.status(404).json({ msg: 'Tournament not found.' });
        }

        // Note: participantsType will be 'Team' or 'Player' due to previous fix
        const modelName = baseTournament.participantsType;
        
        // Deep population for the single view is required
        let tournament = await Tournament.findById(req.params.id)
            .populate({
                path: 'registeredParticipants',
                model: modelName,
                // *** FIX 1: Ensure name is selected for the Leaderboard calculation ***
                select: 'name managerId roster isReady uniqueId',
                populate: modelName === 'Team' ? [
                    {
                        path: 'managerId',
                        model: 'User',
                        select: 'uniqueId' 
                    },
                    {
                        path: 'roster.playerId',
                        model: 'Player',
                        select: 'name' 
                    }
                ] : []
            });
        
        if (!tournament) {
            return res.status(404).json({ msg: 'Tournament not found after population attempt.' });
        }

        res.json(tournament);
    } catch (err) {
        console.error("Tournament GET /:id Error:", err.message);
        // Log the specific error and return a generic 500
        res.status(500).send('Server Error during single tournament fetch.');
    }
});

// @route   PUT /api/tournaments/:id (Unchanged)
router.put('/:id', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const tournament = await Tournament.findOne({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        const updatedTournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTournament);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE /api/tournaments/:id (Unchanged)
router.delete('/:id', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const tournament = await Tournament.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        res.json({ msg: 'Tournament removed' });
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;