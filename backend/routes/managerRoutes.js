// backend/routes/managerRoutes.js - FULL UPDATED CODE (Add Roster Limit Check)

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Player = require('./../models/Player'); // Changed path from '../models/Player' to '../models/Player'
const User = require('../models/User');
const Tournament = require('../models/Tournament'); // *** NEW IMPORT ADDED ***

// @route   GET /api/manager/coordinators (Existing Route - Admin access)
router.get('/coordinators', auth.admin, async (req, res) => {
    try {
        const coordinators = await User.find({ role: 'coordinator' }).select('-password');
        res.json(coordinators);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET /api/manager/allteams (Existing Route)
router.get('/allteams', auth.protect, async (req, res) => {
    try {
        const teams = await Team.find().populate('managerId', 'username uniqueId'); 
        res.json(teams);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET /api/manager/assignments
// @desc    Get all teams managed by the user, populated with tournament names AND player roster
// @access  Private (Manager only)
router.get('/assignments', auth.protect, auth.checkRole('manager'), async (req, res) => {
    try {
        const teams = await Team.find({ managerId: req.user.id })
            .populate('tournaments.tournamentId', 'name status playersPerTeam createdAt') 
            .populate({
                path: 'roster.playerId', 
                model: 'Player',
                select: 'name contactInfo' 
            });

        // If the tournament is multi-sport, also populate its events and the team's eventAssignments
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            const currentTournament = team.tournaments[0]?.tournamentId;
            if (currentTournament && currentTournament.sport === 'multi-sport') {
                // Re-populate the team to include tournament events and the team's eventAssignments
                teams[i] = await Team.findById(team._id)
                    .populate({
                        path: 'tournaments.tournamentId',
                        populate: {
                            path: 'events',
                            model: 'Tournament.events'
                        }
                    })
                    .populate({
                        path: 'roster.playerId',
                        model: 'Player'
                    });
            }
        }

        // Sort teams by the creation date of their primary tournament in descending order
        teams.sort((a, b) => {
            const dateA = a.tournaments[0]?.tournamentId?.createdAt ? new Date(a.tournaments[0].tournamentId.createdAt) : new Date(0);
            const dateB = b.tournaments[0]?.tournamentId?.createdAt ? new Date(b.tournaments[0].tournamentId.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
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

// @route   POST /api/manager/players (Existing Route)
router.post('/players', auth.protect, auth.checkRole('manager'), async (req, res) => {
    const { name, contactInfo, teamId } = req.body; 
    try {
        const team = await Team.findOne({ _id: teamId, managerId: req.user.id }); 
        if (!team) { return res.status(404).json({ msg: 'Team not found or you are not the manager of this team.' }); }
        
        // *** NEW LOGIC ADDED: Roster Limit Check (Fixes Error 3) ***
        if (team.tournaments.length > 0) {
            // Check the limit of the first (current) tournament the team is registered for
            const tournamentId = team.tournaments[0].tournamentId;
            const tournament = await Tournament.findById(tournamentId).select('playersPerTeam');
            
            const maxPlayers = tournament?.playersPerTeam || 0;
            
            // Check if the current roster size is at or above the limit
            if (maxPlayers > 0 && team.roster.length >= maxPlayers) {
                return res.status(400).json({ msg: `Roster is full. Max players allowed is ${maxPlayers}.` });
            }
        }
        // *** END NEW LOGIC ***

        const newPlayer = new Player({ name, contactInfo, teamId: team._id });
        const player = await newPlayer.save();
        
        team.roster.push({ playerId: player._id });
        await team.save();
        
        res.json(player);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   PUT /api/manager/players/:playerId
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

// @route   DELETE /api/manager/players/:playerId
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