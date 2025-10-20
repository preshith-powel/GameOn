// backend/routes/tournamentRoutes.js - FINAL CODE (Public Access Enabled)

const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User'); 
const Team = require('../models/Team');
const Player = require('../models/Player'); 
const auth = require('../middleware/auth'); 

const ADMIN_MIDDLEWARE = [auth.protect, auth.checkRole('admin')];

// @route   POST /api/tournaments
// @access  Admin
router.post('/', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const { name, sport, format, startDate, endDate, participantsType, maxParticipants, playersPerTeam, liveScoreEnabled, venueType, venues } = req.body;
        console.log("[DEBUG - Backend] Incoming tournament creation request body:", req.body);

        let finalFormat = format;
        let finalParticipantsType = participantsType;
        let finalPlayersPerTeam = playersPerTeam;
        
        // Specific rules for Carroms
        if (sport === 'carroms') {
            finalFormat = 'single elimination';
            if (participantsType === 'Team') {
                finalPlayersPerTeam = 2; // Carroms team is always 2 players
            } else if (participantsType === 'Player') {
                finalPlayersPerTeam = 1; // Carroms individual is always 1 player
            }
        }
        
        // Specific rules for Hockey and Kabaddi
        if (sport === 'hockey' || sport === 'kabaddi') {
            finalParticipantsType = 'Team'; // Hockey and Kabaddi are always team-based
            // No change to format; can be single elimination or round robin
            // playersPerTeam should be set by frontend or left as default from request
        }

        const newTournament = new Tournament({
            name, sport, format: finalFormat, startDate, endDate, participantsType: finalParticipantsType, maxParticipants, playersPerTeam: finalPlayersPerTeam, liveScoreEnabled, venueType, venues,
            adminId: req.user.id,
            // Add group stage specific fields if present in req.body
            numGroups: req.body.numGroups,
            teamsPerGroup: req.body.teamsPerGroup,
            roundRobinMatchesPerGroup: req.body.roundRobinMatchesPerGroup,
            winnersPerGroup: req.body.winnersPerGroup,
            // Ensure numEvents is saved as a number if present
            numEvents: req.body.numEvents !== undefined ? Number(req.body.numEvents) : undefined,
        });

        console.log("[DEBUG - Backend] Tournament object before validation:", newTournament);

        // Validate the document first to return clear validation errors instead of a generic 500
        try {
            await newTournament.validate();
        } catch (validationErr) {
            console.error("Tournament validation failed:", validationErr.message);
            return res.status(400).json({ msg: validationErr.message });
        }

        const tournament = await newTournament.save();
        res.json(tournament);
    } catch (err) {
        console.error("Tournament Creation Error:", err);
        // Return the error message to frontend to aid debugging (keeps status 500 for unexpected errors)
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
});

// @route   GET /api/tournaments
// @access  Admin (Used by Admin Dashboard list view)
router.get('/', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        // Find tournaments created by the current Admin
        const tournaments = await Tournament.find({ adminId: req.user.id })
            .sort({ startDate: -1 })
            .populate({
                path: 'registeredParticipants',
                select: 'name isReady isMultiSportReady',
            });

        res.json(tournaments);
    } catch (err) {
        console.error("Tournament GET / Error:", err.message); 
        res.status(500).send('Server Error.');
    }
});

// @route   PUT /api/tournaments/team/:teamId/ready
// @access  Manager/Admin
router.put('/team/:teamId/ready', auth.protect, async (req, res) => {
    const { isReady } = req.body; 
    
    try {
        const team = await Team.findById(req.params.teamId).populate('tournaments.tournamentId');
        if (!team) { return res.status(404).json({ msg: 'Team not found.' }); }
        
        const isManager = team.managerId.toString() === req.user.id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isManager && !isAdmin) {
            return res.status(403).json({ msg: 'Access denied: Only the team manager or an admin can change this status.' });
        }

        const currentTournament = team.tournaments[0]?.tournamentId;
        if (!currentTournament) { return res.status(400).json({ msg: 'Team is not registered for an active tournament.' }); }

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

// @route   POST /api/tournaments/:tournamentId/register-slots-dynamic
// @access  Admin
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
            
            const managerCheckPromises = participants.map(p => 
                User.findOne({ uniqueId: p.managerId, role: 'manager' })
            );
            const managerUsers = await Promise.all(managerCheckPromises);

            // Ensure all manager IDs exist and collect their DB ids
            const managerIds = [];
            for (let i = 0; i < managerUsers.length; i++) {
                const managerUser = managerUsers[i];
                const p = participants[i];
                if (!managerUser) {
                    throw new Error(`Manager ID ${p.managerId} not found or is not a Manager.`);
                }
                managerIds.push(managerUser._id.toString());
            }

            // Reject if the same manager is assigned to more than one team in this registration batch
            const seen = new Set();
            for (const mid of managerIds) {
                if (seen.has(mid)) {
                    return res.status(400).json({ msg: 'A single manager cannot manage more than one team in the same tournament.' });
                }
                seen.add(mid);
            }

            for (let i = 0; i < participants.length; i++) {
                const p = participants[i];
                const managerUser = managerUsers[i];

                let team;
                if (p.teamId) {
                    // If teamId is provided, attempt to find and update the existing team
                    team = await Team.findById(p.teamId);
                    if (team) {
                        // Update team name if it changed
                        if (team.name !== p.teamName) {
                            team.name = p.teamName;
                            await team.save();
                        }
                        // Check if manager ID changed and update if necessary
                        if (team.managerId.toString() !== managerUser._id.toString()) {
                            // Prevent a manager from taking over a team already managed by another manager in this tournament
                            const existingManagedTeam = await Team.findOne({ managerId: managerUser._id, 'tournaments.tournamentId': tournament._id });
                            if (existingManagedTeam && existingManagedTeam._id.toString() !== team._id.toString()) {
                                throw new Error(`Manager '${managerUser.uniqueId}' already manages team '${existingManagedTeam.name}' in this tournament. A manager can manage only one team per tournament.`);
                            }
                            team.managerId = managerUser._id;
                            await team.save();
                        }
                    } else {
                        // If teamId was provided but team not found, treat as an error or new team (for now, error)
                        throw new Error(`Team with ID ${p.teamId} not found.`);
                    }
                } else {
                    // Before creating a new team, ensure this manager does not already manage another team in this tournament
                    const existingManagedTeam = await Team.findOne({ managerId: managerUser._id, 'tournaments.tournamentId': tournament._id });
                    if (existingManagedTeam) {
                        return res.status(400).json({ msg: `Manager '${managerUser.uniqueId}' already manages team '${existingManagedTeam.name}' in this tournament. A manager can manage only one team per tournament.` });
                    }

                    // Find team by name for a new creation check (if no teamId was provided)
                    team = await Team.findOne({ name: p.teamName });
                    if (team) {
                        throw new Error(`Team name '${p.teamName}' already exists. If this is an existing team, its ID should be provided.`);
                    }
                    team = new Team({ name: p.teamName, managerId: managerUser._id });
                    await team.save();
                }
                
                if (!team.tournaments.some(t => t.tournamentId.equals(tournament._id))) {
                    team.tournaments.push({ tournamentId: tournament._id });
                    await team.save();
                }

                participantsToSave.push(team._id);
            }

        } else { // 'Player'
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

    } catch (err) {
        console.error("DYNAMIC REGISTRATION ERROR:", err.message);
        return res.status(400).json({ msg: err.message || 'Registration failed due to a server error.' });
    }
});

// @route   GET /api/tournaments/public
// @access  Public
// Fetches all ongoing and completed tournaments, with optional sport filter.
router.get('/public', async (req, res) => {
    try {
        const { sport, status } = req.query;
        console.log(`[DEBUG] Received sport: ${sport}, status: ${status}`);
        let query = {}; // Start with an empty query
        
        if (sport) {
            query.sport = sport;
        }

        if (status && status !== 'all') { // If a specific status is provided and not 'all'
            query.status = status;
        } else { // If status is 'all' or not provided, fetch all statuses
            query.status = { $in: ['pending', 'ongoing', 'completed'] };
        }
        console.log('[DEBUG] Final Mongoose query:', query);
        
        const tournaments = await Tournament.find(query).sort({ createdAt: -1 });
        console.log(`[DEBUG] Tournaments found (before population): ${tournaments.length}`);
        
        // Manually populate registeredParticipants based on participantsType for each tournament
        for (let i = 0; i < tournaments.length; i++) {
            const tournament = tournaments[i];
            if (tournament.registeredParticipants && tournament.registeredParticipants.length > 0) {
                const participantModel = tournament.participantsType === 'Player' ? Player : Team;
                
                await tournament.populate({
                    path: 'registeredParticipants',
                    model: participantModel, // Dynamically set model using direct reference
                    select: 'name'
                });
            }
        }

        res.json(tournaments);
    } catch (err) {
        console.error("Public Tournament Fetch Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tournaments/:id
// @access  Public (for Spectator view)
router.get('/:id', async (req, res) => {
    try {
        const baseTournament = await Tournament.findById(req.params.id);
        
        if (!baseTournament) {
            return res.status(404).json({ msg: 'Tournament not found.' });
        }

        const modelName = baseTournament.participantsType;
        
        // Deep population for the single view 
        let tournament = await Tournament.findById(req.params.id)
            .populate({
                path: 'registeredParticipants',
                model: modelName,
                select: 'name managerId roster isReady', 
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
        
        if (!tournament) {
            return res.status(404).json({ msg: 'Tournament not found after population attempt.' });
        }

        res.json(tournament);
    } catch (err) {
        console.error("Tournament GET /:id Error:", err.message);
        res.status(500).send('Server Error during single tournament fetch.');
    }
});

// @route   PUT /api/tournaments/:id
// @access  Admin
router.put('/:id', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const tournament = await Tournament.findOne({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        const updatedTournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTournament);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE /api/tournaments/:id
// @access  Admin
router.delete('/:id', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        
        // Find the tournament to be deleted
        const tournamentToDelete = await Tournament.findOne({ _id: tournamentId, adminId: req.user.id });
        if (!tournamentToDelete) {
            return res.status(404).json({ msg: 'Tournament not found or unauthorized.' });
        }
        
        // Find all teams registered for this tournament
        const teamsToUpdate = await Team.find({ 'tournaments.tournamentId': tournamentId });
        
        for (const team of teamsToUpdate) {
            // Remove the reference to the deleted tournament from the team's tournaments array
            team.tournaments = team.tournaments.filter(t => t.tournamentId.toString() !== tournamentId);
            
            // If it's a multi-sport tournament, also remove related event assignments
            team.eventAssignments = team.eventAssignments.filter(ea => ea.tournamentId.toString() !== tournamentId);
            
            // If the team is no longer associated with any tournaments, delete the team and its players
            if (team.tournaments.length === 0) {
                // Delete all players belonging to this team
                if (team.roster && team.roster.length > 0) {
                    await Player.deleteMany({ _id: { $in: team.roster.map(p => p.playerId) } });
                }
                // Delete the team itself
                await Team.findByIdAndDelete(team._id);
            } else {
                // Otherwise, just save the updated team (with tournament reference removed)
                await team.save();
            }
        }
        
        // Finally, delete the tournament itself
        await Tournament.findByIdAndDelete(tournamentId);
        
        res.json({ msg: 'Tournament and associated roster entries removed' });
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;