// backend/routes/managerRoutes.js - FULL UPDATED CODE (Final Working Version)

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Player = require('../models/Player');
const User = require('../models/User');

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

// @route   GET /api/manager/assignments
// @desc    Get all teams managed by the user, populated with tournament names AND player roster
// @access  Private (Manager only)
router.get('/assignments', auth.protect, auth.checkRole('manager'), async (req, res) => {
    try {
        const teams = await Team.find({ managerId: req.user.id })
            .populate('tournaments.tournamentId', 'name status playersPerTeam') 
            .populate({
                path: 'roster.playerId', 
                model: 'Player',
                select: 'name contactInfo' 
            });

        if (teams.length === 0) {
            return res.status(404).json({ msg: 'No teams are currently assigned to you.' });
        }
        res.json(teams); 
    } catch (err) {
        console.error("Manager GET /assignments Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/manager/players (Existing Route)
router.post('/players', auth.protect, auth.checkRole('manager'), async (req, res) => {
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

// @route   PUT /api/manager/players/:playerId
router.put('/players/:playerId', auth.protect, auth.checkRole('manager'), async (req, res) => {
    try {
        const { name, contactInfo } = req.body;
        const managerUserId = req.user.id; 

        const { error } = await Player.checkOwner(req.params.playerId, managerUserId);

        if (error) {
            return res.status(error.includes('Unauthorized') ? 403 : 404).json({ msg: error });
        }
        
        const updatedPlayer = await Player.findByIdAndUpdate(
            req.params.playerId,
            { name, contactInfo },
            { new: true, runValidators: true }
        );

        res.json(updatedPlayer);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/manager/players/:playerId
router.delete('/players/:playerId', auth.protect, auth.checkRole('manager'), async (req, res) => {
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