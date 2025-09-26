// backend/routes/tournamentRoutes.js - FULL UPDATED CODE (Final Working Version)

const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User'); 
const Team = require('../models/Team');
const Player = require('../models/Player'); 
const auth = require('../middleware/auth'); 

const ADMIN_MIDDLEWARE = [auth.protect, auth.checkRole('admin')];

// @route   POST /api/tournaments
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tournaments (Final List Population Fix)
router.get('/', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const tournaments = await Tournament.find({ adminId: req.user.id })
            .sort({ startDate: -1 })
            .populate({
                path: 'registeredParticipants', 
                model: 'Team', 
                select: 'roster isReady playersPerTeam', // CRITICAL: isReady selected
                populate: {
                    path: 'roster.playerId',
                    model: 'Player',
                    select: '_id' 
                }
            })
            .populate({
                path: 'registeredParticipants', 
                model: 'Player', 
                select: 'name' 
            });

        res.json(tournaments);
    } catch (err) {
        console.error("Tournament GET / Error (CRASHED):", err.message); 
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tournaments/team
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
        console.error(err.message);
        if (err.code === 11000) { 
            return res.status(400).json({ msg: 'A manager with this ID is already assigned to a team.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tournaments/team/:teamId/ready (Manager Set Ready Route)
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
        console.error("TEAM READY TOGGLE ERROR:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tournaments/:tournamentId/register-slots-dynamic
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

        if (tournament.participantsType === 'teams') {
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

        } else {
             participantsToSave = await Promise.all(participants.map(async (p) => {
                let player = await Player.findOne({ name: p.name });
                if (player) {
                } else {
                    player = new Player({ 
                        name: p.name, 
                        contactInfo: p.contactInfo 
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

// @route   GET /api/tournaments/:id
router.get('/:id', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const getModelName = (participantsType) => {
            if (participantsType === 'teams') return 'Team';
            if (participantsType === 'players') return 'Player';
            return null; 
        };
        
        const baseTournament = await Tournament.findById(req.params.id);
        if (!baseTournament || baseTournament.adminId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Tournament not found or unauthorized.' });
        }
        
        const modelName = getModelName(baseTournament.participantsType);
        
        let tournament;

        if (modelName === 'Team') {
            tournament = await Tournament.findById(req.params.id)
                .populate({
                    path: 'registeredParticipants',
                    model: 'Team',
                    select: 'name managerId roster isReady',
                    populate: [
                        {
                            path: 'managerId',
                            model: 'User',
                            select: 'uniqueId' 
                        },
                        {
                            path: 'roster.playerId',
                            model: 'Player',
                            select: '_id' 
                        }
                    ]
                });
        } else if (modelName === 'Player') {
            tournament = await Tournament.findById(req.params.id)
                .populate({
                    path: 'registeredParticipants',
                    model: 'Player',
                    select: 'name' 
                });
        } else {
             tournament = baseTournament;
        }
        
        if (!tournament) {
             return res.status(404).json({ msg: 'Tournament not found or unauthorized.' });
        }

        res.json(tournament);
    } catch (err) {
        console.error("Tournament GET /:id Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tournaments/:id
router.put('/:id', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const tournament = await Tournament.findOne({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        const updatedTournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTournament);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE /api/tournaments/:id
router.delete('/:id', ...ADMIN_MIDDLEWARE, async (req, res) => {
    try {
        const tournament = await Tournament.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        res.json({ msg: 'Tournament removed' });
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;