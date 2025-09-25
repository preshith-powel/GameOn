// backend/routes/tournamentRoutes.js - FULL UPDATED CODE

const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User'); 
const Team = require('../models/Team');
const Player = require('../models/Player'); 
const auth = require('../middleware/auth'); 

// --- ADMIN MANAGEMENT ROUTES ---

// @route   POST /api/tournaments
// @desc    Admin creates a new Tournament
// @access  Private (Admin only)
router.post('/', auth.admin, async (req, res) => {
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

// @route   GET /api/tournaments
// @desc    GET only the tournaments created by the logged-in Admin
// @access  Private (Admin only)
router.get('/', auth.admin, async (req, res) => {
    try {
        const tournaments = await Tournament.find({ adminId: req.user.id }).sort({ startDate: -1 });
        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tournaments/team
// @desc    Admin creates a new Team and links it to a Manager User (by uniqueId)
// @access  Private (Admin only)
router.post('/team', auth.admin, async (req, res) => {
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

// --- DYNAMIC REGISTRATION ROUTE (Fixes the 404 Error) ---

// @route   POST /api/tournaments/:tournamentId/register-slots-dynamic
// @desc    Admin registers all participants (creates teams/players and registers them to tournament)
// @access  Private (Admin only)
router.post('/:tournamentId/register-slots-dynamic', auth.admin, async (req, res) => {
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
            // SCENARIO 1: Create Teams and assign Managers
            participantsToSave = await Promise.all(participants.map(async (p) => {
                
                // 1. Find Manager User by Unique ID
                const managerUser = await User.findOne({ uniqueId: p.managerId, role: 'manager' });
                if (!managerUser) {
                    throw new Error(`Manager ID ${p.managerId} not found or is not a Manager.`);
                }

                // 2. Check if a team with this name already exists
                let team = await Team.findOne({ name: p.teamName });
                if (!team) {
                    // Create NEW Team if it doesn't exist
                    team = new Team({ name: p.teamName, managerId: managerUser._id });
                    await team.save();
                } else if (team.managerId.toString() !== managerUser._id.toString()) {
                    // If team exists but manager is different, reject.
                    throw new Error(`Team '${p.teamName}' already exists with a different manager.`);
                }
                
                // 3. Register team for this tournament 
                if (!team.tournaments.some(t => t.tournamentId.equals(tournament._id))) {
                    team.tournaments.push({ tournamentId: tournament._id });
                    await team.save();
                }

                return team._id;
            }));

        } else {
            // SCENARIO 2: Create Individual Players
             participantsToSave = await Promise.all(participants.map(async (p) => {
                const newPlayer = new Player({ 
                    name: p.name, 
                    contactInfo: p.contactInfo // Include contactInfo field here if needed later
                });
                await newPlayer.save();
                return newPlayer._id;
            }));
        }

        // 4. Update the Tournament's registeredParticipants array
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
// ---------------------------------------------------------------------------------

// @route   GET /api/tournaments/:id
// @desc    Get a single tournament by ID
// @access  Private (Admin only)
router.get('/:id', auth.admin, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament || tournament.adminId.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Tournament not found or unauthorized.' });
        }
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tournaments/:id
// @desc    Update a tournament
// @access  Private (Admin only)
router.put('/:id', auth.admin, async (req, res) => {
    try {
        const tournament = await Tournament.findOne({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        const updatedTournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTournament);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   DELETE /api/tournaments/:id
// @desc    Delete a tournament
// @access  Private (Admin only)
router.delete('/:id', auth.admin, async (req, res) => {
    try {
        const tournament = await Tournament.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
        if (!tournament) { return res.status(404).json({ msg: 'Tournament not found or unauthorized.' }); }
        res.json({ msg: 'Tournament removed' });
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;