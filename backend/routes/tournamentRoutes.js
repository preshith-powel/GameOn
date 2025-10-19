// backend/routes/tournamentRoutes.js - FINAL CORRECTED CODE (Includes One-Team Rule & Structural Fixes)

const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User'); 
const Team = require('../models/Team');
const Player = require('../models/Player'); 
const auth = require('../middleware/auth'); 
const asyncHandler = require('../utils/asyncHandler'); 

// Use the clean shorthand from auth.js (Fix for consistency)
const ADMIN_MIDDLEWARE = auth.admin; 

// @route   POST /api/tournaments
// @access  Admin
router.post('/', ...ADMIN_MIDDLEWARE, asyncHandler(async (req, res) => {
    // Basic validation (Mongoose schema also validates, but this gives a cleaner error)
    if (!req.body.name || !req.body.sport || !req.body.maxParticipants) {
        res.status(400);
        throw new Error('Please provide name, sport, and max participants.');
    }

    const newTournament = new Tournament({
        ...req.body,
        adminId: req.user.id, // req.user.id is set by the auth.protect middleware
    });

    const tournament = await newTournament.save();
    res.status(201).json(tournament); // Use 201 for resource creation
}));

// @route   GET /api/tournaments
// @access  Admin (Used by Admin Dashboard list view)
router.get('/', ...ADMIN_MIDDLEWARE, asyncHandler(async (req, res) => {
    // Find tournaments created by the current Admin
    const tournaments = await Tournament.find({ adminId: req.user.id })
        .sort({ startDate: -1 })
        .populate({
            path: 'registeredParticipants', 
            select: 'name isReady', 
        });

    res.json(tournaments);
}));

// @route   PUT /api/tournaments/team/:teamId/ready
// @access  Manager/Admin
router.put('/team/:teamId/ready', auth.protect, asyncHandler(async (req, res) => {
    const { isReady } = req.body; 
    
    // 1. Find the team and populate necessary tournament details
    const team = await Team.findById(req.params.teamId).populate('tournaments.tournamentId');

    if (!team) { 
        res.status(404);
        throw new Error('Team not found.'); 
    }
    
    // 2. Authorization check
    const isManager = team.managerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isManager && !isAdmin) {
        res.status(403);
        throw new Error('Access denied: Only the team manager or an admin can change this status.');
    }

    const currentTournament = team.tournaments.length > 0 ? team.tournaments[0].tournamentId : null;
    
    // 3. Team Roster Size Validation
    if (isReady === true) {
        if (!currentTournament) { 
            res.status(400);
            throw new Error('Team is not registered for an active tournament. Cannot set to Ready.'); 
        }
        
        const requiredPlayers = currentTournament.playersPerTeam || 0;
        const currentRosterSize = team.roster.length;
        
        // This relies on the Admin setting playersPerTeam on the tournament
        if (currentRosterSize < requiredPlayers) {
            res.status(400);
            throw new Error(`Roster is incomplete (${currentRosterSize}/${requiredPlayers}). Cannot set status to Ready.`);
        }
    }
    
    // 4. Update and save
    team.isReady = isReady;
    await team.save();

    res.json({ msg: `Team ${team.name} status updated to ${isReady ? 'Ready' : 'Not Ready'}.`, isReady: team.isReady });
}));


// @route   POST /api/tournaments/:tournamentId/register-slots-dynamic
// @access  Admin
router.post('/:tournamentId/register-slots-dynamic', ...ADMIN_MIDDLEWARE, asyncHandler(async (req, res) => {
    const { participants } = req.body; 
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament || tournament.adminId.toString() !== req.user.id) {
        res.status(404);
        throw new Error('Tournament not found or unauthorized.');
    }

    if (!participants || participants.length !== tournament.maxParticipants) {
        res.status(400);
        throw new Error(`Invalid slot count. Must register exactly ${tournament.maxParticipants} slots.`);
    }
    
    let participantsToSave = [];
    const tournamentSport = tournament.sport; 

    if (tournament.participantsType === 'Team') {
        
        // Check all managers exist first
        const managerCheckPromises = participants.map(p => 
            User.findOne({ uniqueId: p.managerId, role: 'manager' })
        );
        const managerUsers = await Promise.all(managerCheckPromises);
        
        for (let i = 0; i < participants.length; i++) {
            const p = participants[i];
            const managerUser = managerUsers[i];
            
            if (!managerUser) {
                res.status(400);
                throw new Error(`Manager ID ${p.managerId} not found or is not a Manager.`);
            }
            
            // -----------------------------------------------------------
            // CRITICAL FIX: Enforce "One Team in One Ongoing Tournament" Rule
            // -----------------------------------------------------------
            const ongoingTeams = await Team.find({ managerId: managerUser._id })
                // Populate the tournament details for the team found
                .populate('tournaments.tournamentId', 'status'); 

            if (ongoingTeams.length > 0) {
                // Check if ANY of the manager's teams are linked to an 'ongoing' tournament
                const isManagerBusy = ongoingTeams.some(team => 
                    team.tournaments.some(t => 
                        t.tournamentId && t.tournamentId.status === 'ongoing'
                    )
                );
                
                if (isManagerBusy) {
                    res.status(400);
                    throw new Error(`Manager ${p.managerId} is currently managing a team in an ongoing tournament and cannot be assigned to another until it's completed.`);
                }
            }
            // -----------------------------------------------------------


            let team = await Team.findOne({ name: p.teamName });

            if (!team) {
                // FIX 2: NEW TEAM CREATION MUST INCLUDE sportType
                team = new Team({ 
                    name: p.teamName, 
                    managerId: managerUser._id, 
                    sportType: tournamentSport // CRITICAL FIX
                }); 
                await team.save(); 
            } else {
                // FIX 2: CHECK FOR OWNERSHIP AND SPORT CONSISTENCY ON EXISTING TEAM
                if (team.managerId.toString() !== managerUser._id.toString()) {
                    res.status(400);
                    throw new Error(`Team '${p.teamName}' is already managed by a different user. Please enter the correct manager ID.`);
                }
                if (team.sportType !== tournamentSport) {
                    res.status(400);
                    throw new Error(`Team '${p.teamName}' plays ${team.sportType}, but this is a ${tournamentSport} tournament. Register a new team or change tournament sport.`);
                }
            }
            
            // Link team to tournament if not already linked
            if (!team.tournaments.some(t => t.tournamentId.equals(tournament._id))) {
                team.tournaments.push({ tournamentId: tournament._id });
                await team.save();
            }

            participantsToSave.push(team._id);
        }

    } else { // 'Player'
        // Simpler logic for player registration
        participantsToSave = await Promise.all(participants.map(async (p) => {
            let player = await Player.findOne({ name: p.name });
            if (!player) {
                player = new Player({ name: p.name, contactInfo: p.contactInfo || '' });
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
}));

// @route   GET /api/tournaments/:id
// @access  Public (for Spectator view)
router.get('/:id', asyncHandler(async (req, res) => {
    const tournamentId = req.params.id;
    
    // First, check for existence and get participant type
    const baseTournament = await Tournament.findById(tournamentId);
    
    if (!baseTournament) {
        res.status(404);
        throw new Error('Tournament not found.');
    }

    const modelName = baseTournament.participantsType;
    
    // Deep population for the single view 
    let tournament = await Tournament.findById(tournamentId)
        .populate({
            path: 'registeredParticipants',
            model: modelName,
            select: 'name managerId roster isReady', 
            // Only populate nested data if participants are Teams
            populate: modelName === 'Team' ? [
                {
                    path: 'managerId',
                    model: 'User',
                    select: 'uniqueId' 
                },
                {
                    path: 'roster.playerId',
                    model: 'Player',
                    select: 'name stats' 
                }
            ] : []
        });
    
    // Redundant check, but good for safety
    if (!tournament) {
        res.status(404);
        throw new Error('Tournament not found after population attempt.');
    }

    res.json(tournament);
}));

// @route   PUT /api/tournaments/:id
// @access  Admin
router.put('/:id', ...ADMIN_MIDDLEWARE, asyncHandler(async (req, res) => {
    const tournament = await Tournament.findOne({ _id: req.params.id, adminId: req.user.id });
    
    if (!tournament) { 
        res.status(404);
        throw new Error('Tournament not found or unauthorized.'); 
    }
    
    // Use findByIdAndUpdate for quick updates. { new: true } returns the updated document.
    const updatedTournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTournament);
}));

// @route   DELETE /api/tournaments/:id
// @access  Admin
router.delete('/:id', ...ADMIN_MIDDLEWARE, asyncHandler(async (req, res) => {
    const tournament = await Tournament.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    
    if (!tournament) { 
        res.status(404);
        throw new Error('Tournament not found or unauthorized.'); 
    }
    
    res.json({ msg: 'Tournament removed successfully.' });
}));

module.exports = router;