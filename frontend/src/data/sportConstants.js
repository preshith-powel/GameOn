// frontend/src/data/sportConstants.js

/**
 * Defines the core rules, roster limits, and scoring structure for each sport.
 * This is used across the frontend for validation, display, and calculation.
 */
export const SPORT_CONSTANTS = {
    football: {
        name: 'Football (Soccer)',
        limits: { min: 7, max: 11 }, // Example limits
        scoringFields: ['Goals', 'Assists', 'Yellow Cards', 'Red Cards'],
        defaultScore: { goals: 0 }, // Simple score tracking
        scorecardComponent: 'FootballScorecard', // Links to the component name
        matchRounds: 2, // e.g., Halves
    },
    cricket: {
        name: 'Cricket',
        limits: { min: 9, max: 11 }, // Example limits
        scoringFields: ['Runs', 'Wickets', 'Overs Bowled'],
        defaultScore: { runs: 0, wickets: 0, overs: 0 }, // Detailed tracking
        scorecardComponent: 'CricketScorecard',
        matchRounds: 2, // e.g., Innings
    },
    badminton: {
        name: 'Badminton',
        limits: { min: 1, max: 2 }, // Singles/Doubles
        scoringFields: ['Sets Won', 'Points For', 'Points Against'],
        defaultScore: { setsWon: 0, setScores: [] }, // Tracks set wins and individual set scores
        scorecardComponent: 'BadmintonScorecard',
        matchRounds: 3, // e.g., Best of 3 sets
    },
    volleyball: {
        name: 'Volleyball',
        limits: { min: 6, max: 12 }, // Example limits
        scoringFields: ['Sets Won', 'Points Scored'],
        defaultScore: { setsWon: 0, setScores: [] },
        scorecardComponent: 'VolleyballScorecard',
        matchRounds: 5, // e.g., Best of 5 sets
    },
    multi: {
        name: 'Multi-Sport Event',
        limits: { min: 1, max: 99 }, // Very flexible limits
        scoringFields: ['Event Wins', 'Total Points'], // Tracks overall performance in events
        defaultScore: { totalScore: 0 },
        scorecardComponent: 'MultiSportScorecard',
        matchRounds: 1, // Simple event result
    },
    other: {
        name: 'Other Sport',
        limits: { min: 1, max: 50 }, 
        scoringFields: ['Points'],
        defaultScore: { points: 0 },
        scorecardComponent: 'MultiSportScorecard',
        matchRounds: 1,
    }
};

// A separate export for the list of sports (useful for dropdown menus)
export const SPORT_LIST = Object.keys(SPORT_CONSTANTS);

// Example export for the Participant Type (Player vs Team) mapping
export const PARTICIPANT_TYPE_MAPPING = {
    Player: 'Individual',
    Team: 'Team',
};