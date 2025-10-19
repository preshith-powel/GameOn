// frontend/src/components/shared/RoundRobinSchedule.jsx - FINAL CORRECTED CODE

import React, { useState, useEffect } from 'react';
import MatchCard from './MatchCard'; 
// *** FINAL FIX: Import styles from the dedicated TournamentStyles file ***
import { 
    roundTabStyles 
} from './TournamentStyles'; 


const RoundRobinSchedule = ({ matches, fetchMatches, token, isTournamentCompleted, onScoreUpdate, hasAdminRights }) => {
    const [matchesByRound, setMatchesByRound] = useState({});
    const [roundNames, setRoundNames] = useState([]);
    const [activeRound, setActiveRound] = useState(null);

    // CRITICAL: Logic to group matches into rounds based on the formula
    const groupMatchesByRound = (allMatches) => {
        if (allMatches.length === 0) return {};
        
        const totalMatches = allMatches.length;
        
        // 1. Calculate Total Participants (N):
        const N = Math.ceil((1 + Math.sqrt(1 + 8 * totalMatches)) / 2);

        // 2. Calculate Matches Per Round (Round size is always N/2, rounded up for odd participants)
        const matchesPerRound = Math.ceil(N / 2);
        
        const rounds = {};
        let roundNumber = 1;
        let matchCountInCurrentRound = 0;
        
        for(let i = 0; i < allMatches.length; i++) {
            const roundName = `Round ${roundNumber}`;
            
            if (!rounds[roundName]) {
                rounds[roundName] = [];
            }
            rounds[roundName].push(allMatches[i]);
            matchCountInCurrentRound++;

            // If we have reached the calculated size for a round, start the next round
            if (matchCountInCurrentRound === matchesPerRound) {
                roundNumber++;
                matchCountInCurrentRound = 0; // Reset counter for the next round
            }
        }
        return rounds;
    };


    useEffect(() => {
        const groups = groupMatchesByRound(matches);
        const names = Object.keys(groups).sort();
        
        setMatchesByRound(groups);
        setRoundNames(names);
        
        // Set the active round to the first one if none is active
        if (!activeRound && names.length > 0) {
            setActiveRound(names[0]);
        }
    }, [matches]); // Re-run whenever the matches data updates


    const activeRoundMatches = activeRound ? matchesByRound[activeRound] || [] : [];
    
    // --- Handlers ---
    const handleRoundChange = (roundName) => {
        setActiveRound(roundName);
    };

    // This handler simply passes the update up to the parent TournamentViewPage
    const handleScoreUpdate = (matchId, teamAscore, teamBscore) => {
        onScoreUpdate(matchId, teamAscore, teamBscore);
    };


    if (matches.length === 0) {
        return <p>No matches scheduled yet for this tournament.</p>;
    }
    
    return (
        <div style={{ padding: '0px' }}>
            
            {/* Round Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                {roundNames.map(roundName => (
                    <button 
                        key={roundName} 
                        style={roundTabStyles(activeRound === roundName)} // Uses the correctly imported style
                        onClick={() => handleRoundChange(roundName)}
                    >
                        {roundName}
                    </button>
                ))}
            </div>

            {/* Matches for Active Round - Vertical Stacking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', width: '100%' }}>
                {activeRoundMatches.map(match => (
                    <MatchCard 
                        key={match._id} 
                        match={match} 
                        onScoreUpdate={handleScoreUpdate} // Pass local handler down
                        isTournamentCompleted={isTournamentCompleted}
                        hasAdminRights={hasAdminRights} // Pass down scoring rights
                    />
                ))}
            </div>
        </div>
    );
};

export default RoundRobinSchedule;