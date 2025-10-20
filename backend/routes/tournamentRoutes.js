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
        const newTournament = new Tournament({
            name, sport, format, startDate, endDate, participantsType, maxParticipants, playersPerTeam, liveScoreEnabled, venueType, venues,
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
                select: 'name isReady', 
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

                let team = await Team.findOne({ name: p.teamName });

                if (!team) {
                    // Before creating a new team, ensure this manager does not already manage another team in this tournament
                    const existingManagedTeam = await Team.findOne({ managerId: managerUser._id, 'tournaments.tournamentId': tournament._id });
                    if (existingManagedTeam) {
                        return res.status(400).json({ msg: `Manager '${managerUser.uniqueId}' already manages team '${existingManagedTeam.name}' in this tournament. A manager can manage only one team per tournament.` });
                    }

                    team = new Team({ name: p.teamName, managerId: managerUser._id });
                    await team.save(); 
                } else {
                    if (team.managerId.toString() !== managerUser._id.toString()) {
                         return res.status(400).json({ msg: `Team '${p.teamName}' already exists and is managed by a different ID. Must reuse the existing manager ID.` });
                    }

                    // If the team exists, ensure the manager doesn't manage a different team in this tournament
                    const existingManagedTeam = await Team.findOne({ managerId: managerUser._id, 'tournaments.tournamentId': tournament._id });
                    if (existingManagedTeam && existingManagedTeam._id.toString() !== team._id.toString()) {
                        return res.status(400).json({ msg: `Manager '${managerUser.uniqueId}' already manages team '${existingManagedTeam.name}' in this tournament. A manager can manage only one team per tournament.` });
                    }
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
        const tournament = await Tournament.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        res.json({ msg: 'Tournament removed' });
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;