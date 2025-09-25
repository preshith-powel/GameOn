// backend/routes/managerRoutes.js - FULL UPDATED CODE

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Player = require('../models/Player');
const User = require('../models/User');

const checkManager = (req, res, next) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ msg: 'Access denied: Only managers can use this route.' });
    }
    next();
};

// @route   GET /api/manager/coordinators (Existing Route - Admin access)
router.get('/coordinators', auth.admin, async (req, res) => {
    try {
        const coordinators = await User.find({ role: 'coordinator' }).select('-password');
        res.json(coordinators);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET /api/manager/allteams (Existing Route)
router.get('/allteams', auth.protect, async (req, res) => {
    try {
        const teams = await Team.find().populate('managerId', 'username uniqueId'); 
        res.json(teams);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// --- CRITICAL CHANGE: GET ALL TEAM-TO-TOURNAMENT ASSIGNMENTS ---

// @route   GET /api/manager/assignments
// @desc    Get all teams managed by the user, populated with tournament names
// @access  Private (Manager only)
router.get('/assignments', auth.protect, checkManager, async (req, res) => {
    try {
        // Find all teams managed by the user, and populate their tournament details.
        const teams = await Team.find({ managerId: req.user.id })
                                 .populate('tournaments.tournamentId', 'name status'); // Populate Tournament name and status

        if (teams.length === 0) {
            return res.status(404).json({ msg: 'No teams are currently assigned to you.' });
        }
        // Returns an array of teams, each containing an array of tournament assignments
        res.json(teams); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// ---------------------------------------------------------------------------------

// NOTE: You must update server.js to point to this new route name!
// CHANGE in server.js: app.use('/api/manager', managerRoutes); // This line is already correct.

// @route   POST /api/manager/players (Existing Route)
router.post('/players', auth.protect, checkManager, async (req, res) => {
    const { name, contactInfo, teamId } = req.body; 
    try {
        const team = await Team.findOne({ _id: teamId, managerId: req.user.id }); 
        if (!team) { return res.status(404).json({ msg: 'Team not found or you are not the manager of this team.' }); }
        const newPlayer = new Player({ name, contactInfo, teamId: team._id });
        const player = await newPlayer.save();
        team.roster.push({ playerId: player._id });
        await team.save();
        res.json(player);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE /api/manager/players/:playerId (Existing Route)
router.delete('/players/:playerId', auth.protect, checkManager, async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerId);
        if (!player) { return res.status(404).json({ msg: 'Player not found.' }); }

        const team = await Team.findOne({ _id: player.teamId, managerId: req.user.id });
        if (!team) { return res.status(403).json({ msg: 'Unauthorized: You do not manage this player or team.' }); }
        
        team.roster = team.roster.filter(item => item.playerId.toString() !== req.params.playerId);
        await team.save();
        await Player.findByIdAndDelete(req.params.playerId);
        res.json({ msg: 'Player removed successfully.' });
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;