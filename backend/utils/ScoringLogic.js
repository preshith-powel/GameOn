// backend/utils/ScoringLogic.js

/**
 * Determines the match result and updates the match object based on the sport's rules.
 * This is the CORE logic for determining the WinnerId and setting the 'isWinner' flags.
 * @param {object} match - The Mongoose Match document (already loaded).
 * @param {object} newScoreData - The raw score data received from the Coordinator (e.g., { scoreA: 2, scoreB: 1 } or { sets: [21, 18], winner: 0 }).
 * @returns {object} The updated Match document with result flags set.
 */
exports.updateMatchScore = (match, newScoreData) => {
    if (!match || !match.participants || match.participants.length !== 2) {
        throw new Error("Invalid match structure for scoring logic.");
    }

    const sport = match.sportType;
    const participantA = match.participants[0];
    const participantB = match.participants[1];

    let winnerId = null;

    // Default to the simple comparison based on a 'finalScore' field
    const simpleScoreA = newScoreData.finalScoreA || newScoreData.scoreA || 0;
    const simpleScoreB = newScoreData.finalScoreB || newScoreData.scoreB || 0;

    // --- 1. Sport-Specific Logic ---
    switch (sport) {
        case 'football':
        case 'volleyball':
        case 'multi':
        case 'other':
            // Simple Win/Loss based on final score
            if (simpleScoreA > simpleScoreB) {
                winnerId = participantA.entityId;
            } else if (simpleScoreB > simpleScoreA) {
                winnerId = participantB.entityId;
            } else {
                winnerId = null; // Draw
            }
            // Update score data for this sport (assumes the frontend sends a clean object)
            participantA.scoreData = { finalScore: simpleScoreA };
            participantB.scoreData = { finalScore: simpleScoreB };
            break;

        case 'cricket':
            // Cricket matches are usually defined by runs/wickets, but the simplest winner definition is often passed from the coordinator
            if (newScoreData.runsA > newScoreData.runsB) {
                 winnerId = participantA.entityId;
            } else if (newScoreData.runsB > newScoreData.runsA) {
                 winnerId = participantB.entityId;
            } else {
                 winnerId = null; // Draw/Tie
            }
            participantA.scoreData = { runs: newScoreData.runsA, wickets: newScoreData.wicketsA };
            participantB.scoreData = { runs: newScoreData.runsB, wickets: newScoreData.wicketsB };
            break;

        case 'badminton':
            // Badminton is typically best-of-3 sets. Assume the frontend calculates the number of sets won.
            const setsWonA = newScoreData.setsWonA || 0;
            const setsWonB = newScoreData.setsWonB || 0;
            
            if (setsWonA > setsWonB) {
                winnerId = participantA.entityId;
            } else if (setsWonB > setsWonA) {
                winnerId = participantB.entityId;
            } else {
                winnerId = null; // Tie (unlikely in single elimination)
            }
            // Store raw set scores for detailed display
            participantA.scoreData = { setsWon: setsWonA, setScores: newScoreData.setScoresA || [] };
            participantB.scoreData = { setsWon: setsWonB, setScores: newScoreData.setScoresB || [] };
            break;

        default:
            // Fallback for any unhandled sport type
            if (simpleScoreA > simpleScoreB) {
                winnerId = participantA.entityId;
            } else if (simpleScoreB > simpleScoreA) {
                winnerId = participantB.entityId;
            }
             participantA.scoreData = { score: simpleScoreA };
             participantB.scoreData = { score: simpleScoreB };
            break;
    }
    
    // --- 2. Apply Winner Flags to Match Model ---
    match.winnerId = winnerId;
    
    // Reset flags
    participantA.isWinner = false;
    participantB.isWinner = false;

    if (winnerId) {
        if (winnerId.toString() === participantA.entityId.toString()) {
            participantA.isWinner = true;
        } else if (winnerId.toString() === participantB.entityId.toString()) {
            participantB.isWinner = true;
        }
    }
    
    // Note: Mongoose should automatically detect changes to the subdocuments/arrays, but marking them modified is safer:
    match.markModified('participants'); 

    return match;
};