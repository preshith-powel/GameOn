// backend/routes/managerRoutes.js - FULL CODE (Cleaned with asyncHandler and Logical Fixes)

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const Team = require('../models/Team');
const Player = require('../models/Player'); 
const User = require('../models/User');
const Tournament = require('../models/Tournament'); 

// We'll use this array for routes requiring admin access
const ADMIN_MIDDLEWARE = [auth.protect, auth.checkRole('admin')]; 
const MANAGER_MIDDLEWARE = [auth.protect, auth.checkRole('manager')];


// @route   GET /api/manager/coordinators (Existing Route - Admin access)
router.get('/coordinators', ...ADMIN_MIDDLEWARE, asyncHandler(async (req, res) => {
    const coordinators = await User.find({ role: 'coordinator' }).select('-password');
    res.json(coordinators);
}));

// @route   GET /api/manager/allteams (Existing Route)
router.get('/allteams', auth.protect, asyncHandler(async (req, res) => {
    const teams = await Team.find().populate('managerId', 'username uniqueId'); 
    res.json(teams);
}));

// @route   GET /api/manager/assignments
// @desc    Get all teams managed by the user, populated with tournament names AND player roster
// @access  Private (Manager only)
router.get('/assignments', ...MANAGER_MIDDLEWARE, asyncHandler(async (req, res) => {
    const teams = await Team.find({ managerId: req.user.id })
        .populate('tournaments.tournamentId', 'name status playersPerTeam') 
        .populate({
            path: 'roster.playerId', 
            model: 'Player',
            select: 'name contactInfo' 
        });

    if (teams.length === 0) {
        res.status(404);
        throw new Error('No teams are currently assigned to you.');
    }
    res.json(teams); 
}));

// @route   POST /api/manager/players (Add a player to a team's roster)
router.post('/players', ...MANAGER_MIDDLEWARE, asyncHandler(async (req, res) => {
    const { name, contactInfo, teamId } = req.body; 
    
    // Basic validation
    if (!name || !teamId) {
        res.status(400);
        throw new Error('Player name and team ID are required.');
    }

    const team = await Team.findOne({ _id: teamId, managerId: req.user.id }); 
    
    if (!team) { 
        res.status(404);
        throw new Error('Team not found or you are not the manager of this team.'); 
    }
    
    // --- FIX 2: IMPROVED ROSTER LIMIT CHECK ---
    if (team.tournaments.length > 0) {
        const tournamentIds = team.tournaments.map(t => t.tournamentId);

        // Find all relevant tournaments and pull their max player limits
        const tournaments = await Tournament.find({ _id: { $in: tournamentIds } }).select('playersPerTeam');
        
        // Find the single highest player limit across all tournaments
        let maxPlayers = 0;
        if (tournaments.length > 0) {
            // Math.max finds the highest limit
            maxPlayers = Math.max(...tournaments.map(t => t.playersPerTeam || 0));
        }
        
        // Check if the current roster size is at or above the limit
        if (maxPlayers > 0 && team.roster.length >= maxPlayers) {
            res.status(400);
            throw new Error(`Roster is full. Max players allowed across your registered tournaments is ${maxPlayers}.`);
        }
    }
    // --- END ROSTER LIMIT CHECK ---

    const newPlayer = new Player({ name, contactInfo, teamId: team._id });
    const player = await newPlayer.save();
    
    team.roster.push({ playerId: player._id });
    await team.save();
    
    res.status(201).json(player); // 201 Created
}));

// @route   PUT /api/manager/players/:playerId
router.put('/players/:playerId', ...MANAGER_MIDDLEWARE, asyncHandler(async (req, res) => {
    const { name, contactInfo } = req.body;
    const managerUserId = req.user.id; 

    // Use the custom static method to check ownership
    const { error, player } = await Player.checkOwner(req.params.playerId, managerUserId);

    if (error) {
        // Status code based on the error message
        res.status(error.includes('Unauthorized') ? 403 : 404);
        throw new Error(error);
    }
    
    const updatedPlayer = await Player.findByIdAndUpdate(
        req.params.playerId,
        { name, contactInfo },
        { new: true, runValidators: true }
    );

    res.json(updatedPlayer);
}));

// @route   DELETE /api/manager/players/:playerId
router.delete('/players/:playerId', ...MANAGER_MIDDLEWARE, asyncHandler(async (req, res) => {
    const playerId = req.params.playerId;

    const player = await Player.findById(playerId);
    if (!player) { 
        res.status(404);
        throw new Error('Player not found.'); 
    }

    // Need to check ownership before deleting
    const team = await Team.findOne({ _id: player.teamId, managerId: req.user.id });
    if (!team) { 
        res.status(403);
        throw new Error('Unauthorized: You do not manage this player or team.'); 
    }
    
    // Remove player from the team's roster
    team.roster = team.roster.filter(item => item.playerId.toString() !== playerId);
    await team.save();
    
    // Delete the player document itself
    await Player.findByIdAndDelete(playerId);
    
    res.json({ msg: 'Player removed successfully.' });
}));

module.exports = router;